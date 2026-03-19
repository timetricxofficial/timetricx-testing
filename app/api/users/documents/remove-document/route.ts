import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/database';
import cloudinary from '../../../../../lib/cloudinary';
import InternDocument from '../../../../../models/InternDocument';

export async function POST(req: Request) {
    try {
        await connectDB();

        const { email, docType } = await req.json();

        if (!email || !docType) {
            return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
        }

        // 🔎 Find document to get Cloudinary URL
        const doc = await InternDocument.findOne({ internEmail: email });
        const url = doc ? doc[docType] : null;

        if (url && url.includes('cloudinary.com')) {
            try {
                const uploadMatch = url.match(/\/upload\/(?:v\d+\/)?(.+)$/i);
                if (uploadMatch && uploadMatch[1]) {
                    const publicIdWithExt = uploadMatch[1];
                    const publicId = publicIdWithExt.split('.')[0];

                    // Try deleting as both image and raw to be safe
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
                    await cloudinary.uploader.destroy(publicIdWithExt, { resource_type: 'raw' });
                }
            } catch (err) {
                console.warn("Cloudinary delete failed during removal:", err);
            }
        }

        // 🗑️ Remove from Database
        await InternDocument.findOneAndUpdate(
            { internEmail: email },
            { $unset: { [docType]: "" } }
        );

        return NextResponse.json({
            success: true,
            message: 'Document removed successfully',
        });
    } catch (err) {
        console.error('REMOVE DOC ERROR:', err);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
