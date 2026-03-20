import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, docType } = await req.json();

    if (!email || !docType) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    // Map docType to folder
    let folder = 'timetricx';
    if (docType === 'signedOfferLetter') folder = 'timetricx/signedofferletter';
    else if (docType === 'noc') folder = 'timetricx/noc';

    const publicId = `${email.split('@')[0]}_${docType}_${Date.now()}`;

    // Generate signed params for direct upload
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        public_id: publicId,
        resource_type: 'auto',
      },
      process.env.CLOUD_API_SECRET!
    );

    return NextResponse.json({
      success: true,
      signature,
      timestamp,
      folder,
      publicId: `${folder}/${publicId}`,
      apiKey: process.env.CLOUD_API_KEY,
      cloudName: process.env.CLOUD_NAME,
    });

  } catch (err: any) {
    console.error('SIGNATURE GENERATION ERROR:', err);
    return NextResponse.json({ success: false, message: err.message || 'Failed to generate signature' }, { status: 500 });
  }
}
