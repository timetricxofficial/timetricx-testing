import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/database';
import cloudinary from '../../../../../lib/cloudinary';
import InternDocument from '../../../../../models/InternDocument';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    await connectDB();

    const { email, docType, url } = await req.json();

    if (!email || !docType || !url) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    /* =========================
       CLEANUP OLD VERSION
    ========================= */
    const existingDoc = await InternDocument.findOne({ internEmail: email.toLowerCase() });
    const urlsToDelete: string[] = [];

    if (existingDoc && (existingDoc as any)[docType]) {
      urlsToDelete.push((existingDoc as any)[docType]);
    }
    // Also delete legacy offerLetter when replacing with signedOfferLetter
    if (docType === 'signedOfferLetter' && existingDoc?.offerLetter) {
      urlsToDelete.push(existingDoc.offerLetter);
    }

    for (const oldUrl of urlsToDelete) {
      if (oldUrl?.includes('cloudinary.com')) {
        try {
          const match = oldUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/i);
          if (match?.[1]) {
            const publicId = match[1].replace(/\.[^/.]+$/, '');
            await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => { });
            await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(() => { });
            console.log(`[CLEANUP] Deleted: ${publicId}`);
          }
        } catch (e) {
          console.warn('[CLEANUP] ERR:', e);
        }
      }
    }

    /* =========================
       SAVE TO MONGODB
    ========================= */
    const saved = await InternDocument.findOneAndUpdate(
      { internEmail: email.toLowerCase() },
      { $set: { [docType]: url } },
      { upsert: true, new: true }
    );

    console.log(`[DB SAVE] ✅ docType=${docType} | url=${url} | _id=${saved?._id}`);

    return NextResponse.json({
      success: true,
      url: url,
    });

  } catch (err: any) {
    console.error('SERVER SAVE URL ERROR:', err);
    return NextResponse.json({ success: false, message: err.message || 'Failed to save document URL' }, { status: 500 });
  }
}
