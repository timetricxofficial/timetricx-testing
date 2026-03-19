import { NextResponse } from "next/server";
import connectDB from "../../../../lib/database";
import { User } from "../../../../models/User";
import { FaceAttendance } from "../../../../models/FaceAttendance";
import { WeekendRequest } from "../../../../models/WeekendRequest";

function normalizeBase64Image(img: string) {
  if (img.startsWith("data:image")) return img;
  return `data:image/jpeg;base64,${img}`;
}

export async function POST(req: Request) {
  try {
    const { email, verified } = await req.json();
    await connectDB();

    if (!email) {
      return NextResponse.json({
        success: false,
        message: "Email is required",
      });
    }

    if (!verified) {
      return NextResponse.json({
        success: false,
        message: "Face verification required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found",
      });
    }

    // 🇮🇳 FORCE INDIAN TIME (IST)
    const now = new Date();

    // YYYY-MM-DD (Indian Date)
    const today = now.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    // Indian Exit Time
    const exitTime = now.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // Indian Month
    const monthName = now.toLocaleDateString("en-US", {
      timeZone: "Asia/Kolkata",
      month: "long",
      year: "numeric",
    });

    const doc = await FaceAttendance.findOne({ userEmail: email });
    if (!doc) {
      return NextResponse.json({
        success: false,
        message: "No attendance found",
      });
    }

    const monthBlock = doc.months.find(
      (m: any) => m.monthName === monthName
    );

    if (!monthBlock) {
      return NextResponse.json({
        success: false,
        message: "No attendance for this month",
      });
    }

    const todayRecord = monthBlock.records.find(
      (r: any) => r.date === today
    );

    if (!todayRecord) {
      return NextResponse.json({
        success: false,
        message: "Entry not found",
      });
    }

    if (todayRecord.exitTime) {
      return NextResponse.json({
        success: false,
        message: "Already checked out",
      });
    }

    // ✅ Calculate working hours
    // Parse entryTime (format: "10:05:30 AM")
    const entryParts = todayRecord.entryTime.match(/(\d+):(\d+):?(\d*)\s*(AM|PM)/i);
    let workedHours = 0;

    if (entryParts) {
      let entryH = parseInt(entryParts[1]);
      const entryM = parseInt(entryParts[2]);
      const entryMeridian = entryParts[4].toUpperCase();

      if (entryMeridian === 'PM' && entryH !== 12) entryH += 12;
      if (entryMeridian === 'AM' && entryH === 12) entryH = 0;

      // Parse exitTime
      const exitParts = exitTime.match(/(\d+):(\d+):?(\d*)\s*(AM|PM)/i);
      if (exitParts) {
        let exitH = parseInt(exitParts[1]);
        const exitM = parseInt(exitParts[2]);
        const exitMeridian = exitParts[4].toUpperCase();

        if (exitMeridian === 'PM' && exitH !== 12) exitH += 12;
        if (exitMeridian === 'AM' && exitH === 12) exitH = 0;

        const entryMinutes = entryH * 60 + entryM;
        let exitMinutes = exitH * 60 + exitM;

        // Handle overnight (e.g., check-in 11 PM, check-out 5 AM)
        if (exitMinutes < entryMinutes) exitMinutes += 24 * 60;

        workedHours = parseFloat(((exitMinutes - entryMinutes) / 60).toFixed(2));
      }
    }

    const completed = workedHours >= 6;

    // ✅ Save exit time + working hours
    todayRecord.exitTime = exitTime;
    todayRecord.workedHours = workedHours;
    todayRecord.completed = completed;

    doc.markModified("months");
    await doc.save();

    // 📱 Clear checkedIn flag on checkout — atomic DB update
    await User.findOneAndUpdate(
      { email },
      { $set: { 'activeSession.checkedIn': false } }
    );

    // 📅 If weekend → update the WeekendRequest with exit info
    const dayOfWeek = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    ).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      await WeekendRequest.findOneAndUpdate(
        { userEmail: email, date: today },
        {
          exitTime,
          workedHours,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: completed
        ? `Checked out! ${workedHours.toFixed(1)} hrs worked — Day Counted ✅`
        : `Checked out! ${workedHours.toFixed(1)} hrs worked — Less than 6 hrs, day NOT counted ❌`,
      data: { date: today, exitTime, workedHours, completed },
    });

  } catch (err) {
    console.error("FACE CHECKOUT ERROR:", err);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}
