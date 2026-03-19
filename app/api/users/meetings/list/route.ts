import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/database"
import { User } from "@/models/User"
import { Meeting } from "@/models/Meeting"

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const email = req.nextUrl.searchParams.get("email")

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      )
    }

    /* ---------- FIND USER BY LOGIN EMAIL ---------- */
    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    /* ---------- GET GOOGLE EMAIL ---------- */
    const googleEmail = user.authProviders?.google?.email

    if (!googleEmail) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    /* ---------- FIND MEETINGS WHERE USER IS PARTICIPANT ---------- */
    const meetings = await Meeting.find({
      participants: googleEmail.toLowerCase()
    })
    .select(
      "projectName meetingLink startTime endTime status readBy participants"
    )
    .sort({ startTime: 1 })

    return NextResponse.json({
      success: true,
      data: meetings
    })

  } catch (err) {
    console.error("Meeting list error:", err)
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    )
  }
}
