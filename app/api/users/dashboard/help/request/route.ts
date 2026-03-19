import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/models/User'
import { HelpTicket } from '@/models/Help'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const { email, subject, category, priority, message } = body

    /* ================= VALIDATION ================= */

    if (!email || !subject || !message) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email, subject and message are required'
        },
        { status: 400 }
      )
    }

    /* ================= FIND USER ================= */

    const user = await User.findOne({
      email: email.toLowerCase()
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      )
    }

    /* ================= CREATE TICKET ================= */

    const ticket = await HelpTicket.create({
      userId: user._id,
      userEmail: user.email,
      subject: subject.trim(),
      category: category || 'technical',
      priority: priority || 'medium',
      message: message.trim(),
      status: 'open'
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Help ticket submitted successfully',
        data: ticket
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Help request error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

/* ============== BLOCK OTHER METHODS ============== */
