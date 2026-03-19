import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../lib/database'
import { User } from '../../../../models/User'

/**
 * Check if the current device is still the active session.
 * Dashboard polls this every 10 seconds.
 * If deviceId doesn't match, the user has been replaced by another device.
 */
export async function POST(req: NextRequest) {
    try {
        const { email, deviceId } = await req.json()

        if (!email || !deviceId) {
            return NextResponse.json({ valid: true }) // don't block if no data
        }

        await connectDB()
        const user = await User.findOne(
            { email: email.toLowerCase() },
            { activeSession: 1 }
        ).lean()

        if (!user) {
            return NextResponse.json({ valid: false, reason: 'user_not_found' })
        }

        const activeDeviceId = user.activeSession?.deviceId

        // If another device is now active, this one is invalid
        if (activeDeviceId && activeDeviceId !== deviceId) {
            return NextResponse.json({
                valid: false,
                reason: 'logged_in_other_device'
            })
        }

        return NextResponse.json({ valid: true })

    } catch (err) {
        console.error('Session check error:', err)
        return NextResponse.json({ valid: true }) // don't block on error
    }
}
