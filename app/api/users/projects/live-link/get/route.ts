import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database'
import { ProjectLiveLink } from '@/models/ProjectsLiveLinks'

export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const email = req.nextUrl.searchParams.get('email')
    const projectName = req.nextUrl.searchParams.get('projectName')

    if (!email || !projectName) {
      return NextResponse.json(
        { success: false },
        { status: 400 }
      )
    }

    const submission = await ProjectLiveLink.findOne({
      submittedByEmail: email.toLowerCase(),
      projectName
    }).sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      data: submission || null
    })

  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { success: false },
      { status: 500 }
    )
  }
}
