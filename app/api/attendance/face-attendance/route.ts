import { NextResponse } from "next/server";
import connectDB from "../../../../lib/database";
import { User } from "../../../../models/User";
import { FaceAttendance } from "../../../../models/FaceAttendance";
import { WeekendRequest } from "../../../../models/WeekendRequest";

export async function POST(req: Request) {
  try {
    const { email, verified, deviceId } = await req.json();

    // 🔐 Basic validation
    if (!email || verified !== true) {
      return NextResponse.json({
        success: false,
        message: "Face not verified",
      });
    }

    await connectDB();

    // 🔹 Check user exists
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found",
      });
    }

    // 🇮🇳 FORCE INDIAN TIME (IST)

    // 📱 Track device session on check-in — atomic DB update
    if (deviceId) {
      await User.findOneAndUpdate(
        { email },
        {
          $set: {
            'activeSession.deviceId': deviceId,
            'activeSession.checkedIn': true,
            'activeSession.lastActive': new Date()
          }
        }
      );
    }

    const now = new Date();

    // YYYY-MM-DD (Indian date)
    const today = now.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    // Indian Time (HH:MM:SS AM/PM)
    const time = now.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // Month Name (Indian time based)
    const monthName = now.toLocaleDateString("en-US", {
      timeZone: "Asia/Kolkata",
      month: "long",
      year: "numeric",
    });

    // 🔥 Detect if today is Saturday or Sunday (IST)
    const dayOfWeek = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    ).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayName = dayOfWeek === 0 ? "Sunday" : dayOfWeek === 6 ? "Saturday" : "";

    // 🔎 Check if attendance document exists
    let doc = await FaceAttendance.findOne({ userEmail: email });

    // 🆕 First ever attendance
    if (!doc) {
      doc = new FaceAttendance({
        userEmail: email,
        months: [
          {
            monthName,
            records: [
              {
                date: today,
                entryTime: time,
                verified: true,
              },
            ],
          },
        ],
        method: "face",
      });

      await doc.save();

      // 📅 If weekend → create approval request for admin
      if (isWeekend) {
        await WeekendRequest.findOneAndUpdate(
          { userEmail: email, date: today },
          {
            userEmail: email,
            userName: user.name || email,
            date: today,
            dayName,
            entryTime: time,
            status: "pending",
          },
          { upsert: true, new: true }
        );
      }

      return NextResponse.json({
        success: true,
        message: isWeekend
          ? "Attendance marked (Weekend — pending admin approval)"
          : "Attendance marked (first entry)",
        data: { monthName, date: today, time, isWeekend },
      });
    }

    // 🔎 Find current month block
    let monthBlock = doc.months.find(
      (m: any) => m.monthName === monthName
    );

    // 🆕 If month not exist, create new month block
    if (!monthBlock) {
      monthBlock = { monthName, records: [] };
      doc.months.push(monthBlock);
    }

    // ⛔ Already marked today?
    if (monthBlock.records.find((r: any) => r.date === today)) {
      return NextResponse.json({
        success: false,
        message: "Attendance already marked",
      });
    }

    // ✅ Mark attendance
    monthBlock.records.push({
      date: today,
      entryTime: time,
      verified: true,
    });

    doc.markModified("months");
    await doc.save();

    // 📅 If weekend → create approval request for admin
    if (isWeekend) {
      await WeekendRequest.findOneAndUpdate(
        { userEmail: email, date: today },
        {
          userEmail: email,
          userName: user.name || email,
          date: today,
          dayName,
          entryTime: time,
          status: "pending",
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: isWeekend
        ? "Attendance marked (Weekend — pending admin approval)"
        : "Attendance marked",
      data: { monthName, date: today, time, isWeekend },
    });

  } catch (err) {
    console.error("FACE ATTENDANCE ERROR:", err);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}

