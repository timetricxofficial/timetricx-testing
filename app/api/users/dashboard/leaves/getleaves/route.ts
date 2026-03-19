import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/models/User'
import { Leave } from '@/models/TakeLeave'

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

    const user = await User.findOne({
      email: email.toLowerCase()
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const leaves = await Leave.find({
      userEmail: email.toLowerCase()
    })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: leaves
    })

  } catch (error) {
    console.error('Get leaves error:', error)

    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}
