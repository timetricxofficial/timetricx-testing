import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/models/User'
import { createSuccessResponse, createErrorResponse } from '@/utils/response'
import { sendCheckoutReminderMail } from '@/utils/sendEmailCheckout'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    /* ---------- Validation ---------- */

    if (!email) {
      return NextResponse.json(
        createErrorResponse('Email is required'),
        { status: 400 }
      )
    }

    /* ---------- DB ---------- */

    await connectDB()

    /* ---------- Find User ---------- */

    const user = await User.findOne({
      email: email.toLowerCase()
    })

    if (!user) {
      return NextResponse.json(
        createErrorResponse('User not found'),
        { status: 404 }
      )
    }

    /* ---------- Send Checkout Reminder Mail ---------- */

    await sendCheckoutReminderMail(user.email)

    return NextResponse.json(
      createSuccessResponse(
        null,
        'Checkout reminder email sent successfully'
      ),
      { status: 200 }
    )

  } catch (error) {
    console.error('Checkout request error:', error)

    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}


/* Block other methods */

export async function GET() {
  return NextResponse.json(
    createErrorResponse('Method not allowed'),
    { status: 405 }
  )
}
