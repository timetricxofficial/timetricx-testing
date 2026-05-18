import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { User } from '@/models/User'
import { Project } from '@/models/Project'
import { ProjectLiveLink } from '@/models/ProjectsLiveLinks'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    

    const { email, projectName, liveUrl } = await req.json()
    
    

    if (!email || !projectName || !liveUrl) {
      return NextResponse.json(
        { success: false, message: 'Required fields missing' },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    

    const project = await Project.findOne({
      name: projectName,
      teamEmails: { $in: [user.email] }
    })

    

    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if submission already exists for this email and project
    const existingSubmission = await ProjectLiveLink.findOne({
      submittedByEmail: user.email,
      projectId: project._id
    })

    let submission
    if (existingSubmission) {
      // Update existing submission
      existingSubmission.liveUrl = liveUrl
      existingSubmission.status = 'pending'
      submission = await existingSubmission.save()
      
    } else {
      // Create new submission
      submission = await ProjectLiveLink.create({
        projectId: project._id,
        projectName: project.name,
        submittedBy: user._id,
        submittedByEmail: user.email,
        liveUrl,
        status: 'pending'
      })
      
    }

    return NextResponse.json({
      success: true,
      data: submission
    })

  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { success: false },
      { status: 500 }
    )
  }
}
