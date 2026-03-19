import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/database';
import cloudinary from '../../../../../lib/cloudinary';
import InternDocument from '../../../../../models/InternDocument';

// ✅ STANDARD NODE.JS RUNTIME
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    await connectDB();

    const formData = await req.formData();
    const email = (formData.get('email') as string)?.toLowerCase();
    const docType = formData.get('docType') as string;
    const file = formData.get('file') as File;

    console.log(`[UPLOAD] email=${email}, docType=${docType}, filename=${file?.name}`);

    if (!email || !docType || !file) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 📁 Folder Structure
    let folderPath = 'timetricx';
    if (docType === 'aadhar') folderPath = 'timetricx/aadharcard';
    else if (docType === 'collegeId') folderPath = 'timetricx/collegeidcard';
    else if (docType === 'noc') folderPath = 'timetricx/noc';
    else if (docType === 'resume') folderPath = 'timetricx/resumes';
    else if (docType === 'offerLetter') folderPath = 'timetricx/offerletters';
    else if (docType === 'signedOfferLetter') folderPath = 'timetricx/signedofferletter';
    else folderPath = `timetricx/${docType}`;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    console.log(`[UPLOAD] docType=${docType} | folder=${folderPath} | isPdf=${isPdf} | mime=${file.type}`);

    /* =========================
       CLOUDINARY UPLOAD
    ========================= */
    const uploadResult: any = await new Promise((resolve, reject) => {
      const publicId = `${email.split('@')[0]}_${docType}_${Date.now()}`;

      cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          resource_type: 'auto',
          public_id: publicId,
        },
        (err, result) => {
          if (err) {
            console.error('[UPLOAD] Cloudinary error:', err);
            return reject(err); // ← early return: ensures resolve() is NOT called on error
          }
          console.log(`[UPLOAD] Cloudinary OK: ${result?.secure_url}`);
          resolve(result);
        }
      ).end(buffer);
    });

    // Guard: ensure we got a valid URL back
    if (!uploadResult?.secure_url) {
      console.error('[UPLOAD] No secure_url returned:', uploadResult);
      return NextResponse.json({ success: false, message: 'Upload failed: no URL returned' }, { status: 500 });
    }

    /* =========================
       CLEANUP OLD VERSION
    ========================= */
    const existingDoc = await InternDocument.findOne({ internEmail: email });
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
      { internEmail: email },
      { $set: { [docType]: uploadResult.secure_url } },
      { upsert: true, new: true }
    );

    console.log(`[DB SAVE] ✅ docType=${docType} | url=${uploadResult.secure_url} | _id=${saved?._id}`);

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      isPdf,
    });

  } catch (err: any) {
    console.error('SERVER UPLOAD ERROR:', err);
    return NextResponse.json({ success: false, message: err.message || 'Upload failed' }, { status: 500 });
  }
}
