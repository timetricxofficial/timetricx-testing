import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/database";
import { User } from "@/models/User";
import { Meeting } from "@/models/Meeting";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const loginEmail = email.toLowerCase();

    /* ---------- FIND USER ---------- */
    const user = await User.findOne({ email: loginEmail });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    /* ---------- GET GOOGLE EMAIL (FOR PARTICIPANT MATCH) ---------- */
    const googleEmail = user.authProviders?.google?.email;

    if (!googleEmail) {
      return NextResponse.json(
        { success: false, message: "Google account not linked" },
        { status: 400 }
      );
    }

    /* ---------- UPDATE MEETINGS ---------- */
    const result = await Meeting.updateMany(
      {
        participants: googleEmail.toLowerCase(),
        readBy: { $ne: loginEmail }
      },
      {
        $addToSet: { readBy: loginEmail }
      }
    );

    return NextResponse.json({
      success: true,
      message: "Meetings marked as read",
      modifiedCount: result.modifiedCount
    });

  } catch (err) {
    console.error("Mark read error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
