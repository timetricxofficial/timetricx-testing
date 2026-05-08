import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/database';
import { Project } from '../../../../../models/Project';

export async function POST(req: Request) {
  try {
    await connectDB();

    const { email } = await req.json();
    

    /* =====================
       BASIC VALIDATION
    ===================== */
    if (!email) {
      
      return NextResponse.json(
        { success: false, message: 'Email required' },
        { status: 400 }
      );
    }

    /* =====================
       FETCH PROJECTS
    ===================== */
    
    const projects = await Project.find(
      {
        teamEmails: email,               // user is part of team
        $expr: { $gt: [{ $size: '$teamEmails' }, 1] }, // team size > 1
      },
      {
        name: 1,
        teamEmails: 1,
      }
    )
      .limit(3)
      .lean();

    
    

    /* =====================
       FORMAT RESPONSE
    ===================== */
    const formattedProjects = projects.map(project => ({
      projectName: project.name,
      teamEmails: project.teamEmails,
    }));

    

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
    });
  } catch (error) {
    console.error('TRACK TEAM ERROR:', error);

    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
