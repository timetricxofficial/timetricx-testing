import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/database';
import { Announcement } from '../../../../models/Announcement';
import { User } from '../../../../models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const now = new Date();

    // Get user email from query params
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');

    let userWorkingRole: string | null = null;

    // If email provided, fetch user's workingRole
    if (userEmail) {
      const user = await User.findOne({ email: userEmail }).select('workingRole').lean();
      if (user) {
        userWorkingRole = user.workingRole || null;
      }
    }

    // Base query: active and within date range
    const baseQuery = {
      isActive: true,
      startAt: { $lte: now },
      endAt: { $gte: now }
    };

    // Build audience filter based on targetAudienceType
    let audienceFilter = {};

    if (userEmail) {
      audienceFilter = {
        $or: [
          // Type 'all' - show to everyone
          { targetAudienceType: 'all' },
          // Type 'selected' - show if user's email is in targetAudienceData
          {
            targetAudienceType: 'selected',
            targetAudienceData: { $in: [userEmail] }
          },
          // Type 'workingRole' - show if user's workingRole matches
          {
            targetAudienceType: 'workingRole',
            targetAudienceData: { $in: userWorkingRole ? [userWorkingRole] : [] }
          }
        ]
      };
    } else {
      // No email provided - only show 'all' type announcements
      audienceFilter = { targetAudienceType: 'all' };
    }

    const announcements = await Announcement.find({
      ...baseQuery,
      ...audienceFilter
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: announcements
    });
  } catch (error) {
    console.error('Error fetching active announcements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}
