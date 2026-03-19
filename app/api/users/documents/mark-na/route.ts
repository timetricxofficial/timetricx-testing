import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/database';
import InternDocument from '../../../../../models/InternDocument';

export async function POST(req: Request) {
    try {
        await connectDB();

        const { email, docType, value } = await req.json();

        if (!email || !docType || !value) {
            return NextResponse.json(
                { success: false, message: 'Missing fields' },
                { status: 400 }
            );
        }

        // 🔐 UPDATE DB with 'NOT_AVAILABLE'
        await InternDocument.findOneAndUpdate(
            { internEmail: email },
            { $set: { [docType]: value } },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            success: true,
            message: `Document ${docType} marked as ${value}`,
        });
    } catch (err) {
        console.error('MARK NA ERROR:', err);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}
