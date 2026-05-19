
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { HelpTicket } from '@/models/Help'

export async function POST(request: NextRequest) {

  try {

    await connectDB()

    const body = await request.json()

    const {
      ticketId,
      sender,
      text
    } = body

    if (!ticketId || !sender || !text) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing fields'
        },
        { status: 400 }
      )
    }

    const ticket = await HelpTicket.findById(ticketId)

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: 'Ticket not found'
        },
        { status: 404 }
      )
    }

    ticket.messages.push({
      sender,
      text,
      createdAt: new Date()
    })

    ticket.lastMessage = text

    ticket.lastMessageAt = new Date()

    if (ticket.status === 'open') {
      ticket.status = 'in_progress'
    }

    await ticket.save()

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

