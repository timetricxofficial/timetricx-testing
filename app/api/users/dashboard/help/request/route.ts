import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/models/User'
import { HelpTicket } from '@/models/Help'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()

    const {
      email,
      subject,
      category,
      priority,
      message
    } = body

    if (!email || !subject || !message) {
      return NextResponse.json(
        {
          success: false,
          message: 'Required fields missing'
        },
        { status: 400 }
      )
    }

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

    const ticketId = `TKT-${Date.now()}`

    const ticket = await HelpTicket.create({
      ticketId,

      userId: user._id,

      userEmail: user.email,

      userName: user.name,

      subject: subject.trim(),

      category: category || 'technical',

      priority: priority || 'medium',

      status: 'open',

      messages: [
        {
          sender: 'user',

          text: message.trim(),
        }
      ],

      lastMessage: message.trim(),

      lastMessageAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      data: ticket
    })

  } catch (error) {

    console.error(error)

    return NextResponse.json(
      {
        success: false,
        message: 'Server error'
      },
      { status: 500 }
    )
  }
}