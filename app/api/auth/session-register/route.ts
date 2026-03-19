import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../lib/database'
import { User } from '../../../../models/User'

/**
 * Register a device as the active session for a user.
 * Called when a logged-in user loads a page but doesn't have a deviceId yet.
 * Only sets deviceId if no activeSession.deviceId exists (won't overwrite login-set deviceId).
 */
export async function POST(req: NextRequest) {
    try {
        const { email, deviceId } = await req.json()

        if (!email || !deviceId) {
            return NextResponse.json({ success: false, message: 'Missing fields' })
        }

        await connectDB()

        // Only update if activeSession.deviceId is null/empty — atomic
        const result = await User.findOneAndUpdate(
            {
                email: email.toLowerCase(),
                $or: [
                    { 'activeSession.deviceId': null },
                    { 'activeSession.deviceId': { $exists: false } },
                    { activeSession: { $exists: false } }
                ]
            },
            {
                $set: {
                    'activeSession.deviceId': deviceId,
                    'activeSession.lastActive': new Date()
                }
            },
            { new: true }
        )

        return NextResponse.json({
            success: true,
            registered: !!result
        })
    } catch (err) {
        console.error('Session register error:', err)
        return NextResponse.json({ success: false })
    }
}
