import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/models/User'
import { HelpTicket } from '@/models/Help'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const email = req.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    /* ---------- FIND USER ---------- */

    const user = await User.findOne({
      email: email.toLowerCase()
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    /* ---------- FETCH TICKETS ---------- */

    const tickets = await HelpTicket.find({
      userEmail: email.toLowerCase()
    })
      .sort({ createdAt: -1 }) // Latest first
      .lean()

    return NextResponse.json({
      success: true,
      data: tickets
    })

  } catch (error) {
    console.error('Get Help Tickets Error:', error)

    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

/* BLOCK OTHER METHODS */

export async function POST() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed' },
    { status: 405 }
  )
}
