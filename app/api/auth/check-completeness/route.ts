import { NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User } from '@/models/User';

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select(
      'mobileNumber workingRole skills profile.bio profile.gender profile.location socialLinks'
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        mobileNumber: user.mobileNumber,
        workingRole: user.workingRole,
        skills: user.skills,
        bio: user.profile?.bio,
        gender: user.profile?.gender,
        location: user.profile?.location,
        socialLinks: user.socialLinks
      }
    });
  } catch (error) {
    console.error('CHECK COMPLETENESS ERROR:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
