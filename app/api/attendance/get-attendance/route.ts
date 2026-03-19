import { NextResponse } from "next/server";
import connectDB from "../../../../lib/database";
import { FaceAttendance } from "../../../../models/FaceAttendance";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({
        success: false,
        message: "Email required"
      });
    }

    await connectDB();

    const doc = await FaceAttendance.findOne({ userEmail: email });

    if (!doc) {
      return NextResponse.json({
        success: true,
        data: {
          percentage: 0,
          todayEntry: false,
          records: []
        }
      });
    }

    const now = new Date();
    // 🇮🇳 FORCE INDIAN TIME (IST) — must match how attendance is stored
    const today = now.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    }); // "2026-03-01"

    const currentMonthName = now.toLocaleDateString("en-US", {
      timeZone: "Asia/Kolkata",
      month: "long",
      year: "numeric"
    }); // "March 2026"

    // 🔥 Find current month block
    const currentMonth = doc.months.find(
      m => m.monthName === currentMonthName
    );

    const records = currentMonth?.records || [];

    // --- percentage + todayEntry ---
    // 🔥 Get total days in current month
    const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    // Sum all worked hours → every hour counts proportionally
    // 6 hrs = 1 full day, 3 hrs = 0.5 day, etc.
    const totalWorkedHours = records.reduce((sum, r) => sum + (r.workedHours || 0), 0);
    const equivalentDays = totalWorkedHours / 6; // proportional days

    let todayEntry = records.some(
      r => r.date === today && r.entryTime && !r.exitTime
    );

    const percentage =
      totalDaysInMonth > 0
        ? Math.round((equivalentDays / totalDaysInMonth) * 100)
        : 0;

    // 🔥 DEBUG
    console.log("DEBUG - Total worked hours:", totalWorkedHours);
    console.log("DEBUG - Equivalent days:", equivalentDays.toFixed(2));

    return NextResponse.json({
      success: true,
      data: {
        percentage,
        todayEntry,
        totalWorkedHours: parseFloat(totalWorkedHours.toFixed(1)),
        equivalentDays: parseFloat(equivalentDays.toFixed(2)),
        records // 👈 ONLY CURRENT MONTH
      }
    });

  } catch (err) {
    console.log("GET ATTENDANCE ERROR:", err);
    return NextResponse.json({
      success: false,
      message: "Server error"
    });
  }
}
