import { NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { CompanyHoliday } from '@/models/CompanyHoliday'

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB()
        const holidays = await (CompanyHoliday as any).find({})
        return NextResponse.json({ success: true, data: holidays })
    } catch (error) {
        console.error('Fetch Company Holidays Error:', error)
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
    }
}
