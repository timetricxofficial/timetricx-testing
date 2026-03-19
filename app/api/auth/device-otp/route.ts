import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../lib/database'
import { User } from '../../../../models/User'
import { sendOtpMail } from '../../../../utils/sendEmail'

// Generate 6-digit OTP
function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

/* ============ SEND DEVICE OTP ============ */
export async function POST(req: NextRequest) {
    try {
        const { email, action } = await req.json()

        if (!email) {
            return NextResponse.json(
                { success: false, message: 'Email required' },
                { status: 400 }
            )
        }

        await connectDB()
        const user = await User.findOne({ email: email.toLowerCase() })

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            )
        }

        /* ---- VERIFY OTP ---- */
        if (action === 'verify') {
            const { otp, deviceId } = await req.json().catch(() => ({ otp: undefined, deviceId: undefined }))

            // Re-parse body (already consumed above, so use params from first parse)
            return NextResponse.json(
                { success: false, message: 'Use PUT method for verification' },
                { status: 400 }
            )
        }

        // Save OTP to user record — atomic
        const otp = generateOtp()
        await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            {
                $set: {
                    'activeSession.deviceOtp': otp,
                    'activeSession.deviceOtpExpiry': new Date(Date.now() + 5 * 60 * 1000)
                }
            }
        )

        // Send OTP to Google connected email (or fallback to primary email)
        const targetEmail = user.authProviders?.google?.email || user.email
        await sendOtpMail(targetEmail, otp)

        return NextResponse.json({
            success: true,
            message: `OTP sent to ${targetEmail.replace(/(.{3})(.*)(@.*)/, '$1***$3')}`,
            sentTo: targetEmail.replace(/(.{3})(.*)(@.*)/, '$1***$3')
        })
    } catch (err) {
        console.error('Device OTP send error:', err)
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        )
    }
}

/* ============ VERIFY DEVICE OTP ============ */
export async function PUT(req: NextRequest) {
    try {
        const { email, otp, deviceId } = await req.json()

        if (!email || !otp || !deviceId) {
            return NextResponse.json(
                { success: false, message: 'Email, OTP and deviceId required' },
                { status: 400 }
            )
        }

        await connectDB()
        const user = await User.findOne({ email: email.toLowerCase() })

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            )
        }

        // Check OTP validity
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

        // OTP verified — switch to new device atomically
        await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            {
                $set: {
                    'activeSession.deviceId': deviceId,
                    'activeSession.lastActive': new Date(),
                    'activeSession.checkedIn': false,
                    'activeSession.deviceOtp': null,
                    'activeSession.deviceOtpExpiry': null
                }
            }
        )

        return NextResponse.json({
            success: true,
            message: 'Device verified successfully'
        })
    } catch (err) {
        console.error('Device OTP verify error:', err)
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        )
    }
}
