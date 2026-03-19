import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../lib/database'
import { User } from '../../../../models/User'
import bcrypt from 'bcryptjs'
import { generateToken } from '../../../../utils/generateToken'
import { createSuccessResponse, createErrorResponse } from '../../../../utils/response'
import { sendOtpMail } from '../../../../utils/sendEmail'

// Generate 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier, password, deviceId, otp, skipOtp } = body

    /* ---------- Validation ---------- */

    if (!identifier || !password) {
      return NextResponse.json(
        createErrorResponse('Email and password are required'),
        { status: 400 }
      )
    }

    await connectDB()

    /* ---------- Find user ---------- */

    // Search by Primary Email OR Google Email OR GitHub Email
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { 'authProviders.google.email': identifier.toLowerCase() },
        { 'authProviders.github.email': identifier.toLowerCase() }
      ]
    }).select('+password email authProviders role activeSession')

    if (!user) {
      return NextResponse.json(
        createErrorResponse('User not found'),
        { status: 404 }
      )
    }

    /* ---------- PASSWORD CHECK ---------- */

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return NextResponse.json(
        createErrorResponse('Invalid credentials'),
        { status: 401 }
      )
    }

    /* ---------- AUTH PROVIDER CHECK ---------- */

    const hasGithub = !!user.authProviders?.github?.id
    const hasGoogle = !!user.authProviders?.google?.id

    if (!hasGithub) {
      return NextResponse.json(
        { success: false, message: 'Account exists. Please continue with GitHub', action: 'github' },
        { status: 409 }
      )
    }

    if (!hasGoogle) {
      return NextResponse.json(
        { success: false, message: 'Account exists. Please continue with Google', action: 'google' },
        { status: 409 }
      )
    }

    /* ---------- 🔒 OTP VERIFICATION (EVERY LOGIN) ---------- */

    // If OTP is provided → verify it
    if (otp) {
      const savedOtp = user.activeSession?.deviceOtp
      const otpExpiry = user.activeSession?.deviceOtpExpiry

      if (!savedOtp || !otpExpiry) {
        return NextResponse.json(
          { success: false, message: 'No OTP found. Please request a new one.' },
          { status: 400 }
        )
      }

      if (new Date() > new Date(otpExpiry)) {
        return NextResponse.json(
          { success: false, message: 'OTP expired. Please request a new one.' },
          { status: 400 }
        )
      }

      if (savedOtp !== otp) {
        return NextResponse.json(
          { success: false, message: 'Invalid OTP' },
          { status: 401 }
        )
      }

      // ✅ OTP verified — update device session + clear OTP
      await User.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            'activeSession.deviceId': deviceId || null,
            'activeSession.lastActive': new Date(),
            'activeSession.checkedIn': false,
            'activeSession.deviceOtp': null,
            'activeSession.deviceOtpExpiry': null
          }
        }
      )

      // Generate token
      const token = generateToken({
        userId: user._id,
        email: user.email,
        role: user.role
      })

      const userResponse = await User.findOne({ email: identifier.toLowerCase() })
        .select('+email +mobileNumber +designation +skills +profilePicture')

      return NextResponse.json(
        createSuccessResponse(
          { user: userResponse, token, deviceId },
          'Login successful'
        ),
        { status: 200 }
      )
    }

    /* ---------- NO OTP PROVIDED → SEND OTP ---------- */

    const newOtp = generateOtp()

    // Save OTP atomically
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          'activeSession.deviceOtp': newOtp,
          'activeSession.deviceOtpExpiry': new Date(Date.now() + 5 * 60 * 1000) // 5 min
        }
      }
    )

    // 📧 Collect all unique emails (Primary, Google, GitHub)
    const emailSet = new Set<string>();

    if (user.email) emailSet.add(user.email.toLowerCase());
    if (user.authProviders?.google?.email) emailSet.add(user.authProviders.google.email.toLowerCase());
    if (user.authProviders?.github?.email) emailSet.add(user.authProviders.github.email.toLowerCase());

    const emails = Array.from(emailSet);

    console.log('--- 🔑 OTP SENDING DEBUG ---');
    console.log('Primary Account Email:', user.email);
    console.log('Google Linked Email:', user.authProviders?.google?.email);
    console.log('GitHub Linked Email:', user.authProviders?.github?.email);
    console.log('Final Target Emails:', emails);
    console.log('----------------------------');

    const maskedEmails = emails.map(e => e.replace(/(.{3})(.*)(@.*)/, '$1***$3')).join(' & ')

    try {
      // Send same OTP to all emails simultaneously
      await Promise.all(emails.map(email => sendOtpMail(email, newOtp)))
    } catch (emailErr) {
      console.error('Failed to send OTP email:', emailErr)
      return NextResponse.json(
        { success: false, message: 'Failed to send OTP. Try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: false,
      message: 'OTP sent successfully to both of your emails',
      action: 'login_otp_required',
      maskedEmail: maskedEmails
    }, { status: 200 })

  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    createErrorResponse('Method not allowed'),
    { status: 405 }
  )
}
