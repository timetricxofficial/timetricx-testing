import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/database';
import InternDocument from '../../../../../models/InternDocument';

/* =========================
   GET: FETCH UPLOADED DOCS
========================= */
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email required' },
        { status: 400 }
      );
    }

    const docs = await InternDocument.findOne(
      { internEmail: email },
      {
        _id: 0,
        resume: 1,
        aadhar: 1,
        collegeId: 1,
        offerLetter: 1,
        signedOfferLetter: 1,
        noc: 1,
        marksheet10: 1,
        marksheet12: 1,
      }
    ).lean();

    return NextResponse.json({
      success: true,
      documents: {
        resume: (docs as any)?.resume || null,
        aadhar: (docs as any)?.aadhar || null,
        collegeId: (docs as any)?.collegeId || null,
        offerLetter: (docs as any)?.offerLetter || null,
        signedOfferLetter: (docs as any)?.signedOfferLetter || null,
        noc: (docs as any)?.noc || null,
        marksheet10: (docs as any)?.marksheet10 || null,
        marksheet12: (docs as any)?.marksheet12 || null,
      },
    });
  } catch (error) {
    console.error('FETCH INTERN DOCS ERROR:', error);

    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
