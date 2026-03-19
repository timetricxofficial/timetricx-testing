import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/models/User'
import { Leave } from '@/models/TakeLeave'
import { sendLeaveRequestMail } from '@/utils/sendLeaveMail'

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const body = await req.json()
    const { email, startDate, endDate, reason } = body

    if (!email || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      )
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const from = new Date(startDate)
    const to = new Date(endDate)

    if (from > to) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Calculate total days (including both start & end)
    const diffTime = to.getTime() - from.getTime()
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

    // 🔥 PREVENT OVERLAPPING LEAVE REQUESTS
    const overlappingLeave = await Leave.findOne({
      userEmail: user.email,
      status: { $ne: 'rejected' },
      fromDate: { $lte: to },
      toDate: { $gte: from }
    })

    if (overlappingLeave) {
      return NextResponse.json(
        { success: false, message: 'You already have a leave request (pending or approved) overlapping with these dates.' },
        { status: 400 }
      )
    }

    const leave = await Leave.create({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,

      fromDate: from,
      toDate: to,
      totalDays,

      reason,
      status: 'pending'
    })

    // 🔥 Send email via Admin Alert Email Address (Assuming process.env.ADMIN_EMAIL points to admin)
    // To handle multiple admins, you could fetch Admin users from DB here instead
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cybershoora.in'

    sendLeaveRequestMail(
      adminEmail,
      user.email,
      user.name,
      from.toISOString(),
      to.toISOString(),
      totalDays,
      reason,
      leave._id.toString()
    )

    return NextResponse.json({
      success: true,
      data: leave
    })

  } catch (error) {
    console.error('Leave request error:', error)

    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}
