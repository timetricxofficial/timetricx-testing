import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../lib/database'
import { User } from '../../../../models/User'
import jwt, { JsonWebTokenError } from 'jsonwebtoken'
import cloudinary from '../../../../lib/cloudinary'
import { createSuccessResponse, createErrorResponse } from '../../../../utils/response'

export async function POST(request: NextRequest) {
  try {

    /* ---------- OPTIONAL TOKEN ---------- */

    const authHeader = request.headers.get('authorization')
    let decoded: any = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')

      try {
        decoded = jwt.verify(
          token,
          process.env.JWT_SECRET!
        )
      } catch (err) {
        return NextResponse.json(
          createErrorResponse('Invalid token'),
          { status: 401 }
        )
      }
    }

    /* ---------- BODY (JSON OR FORM-DATA) ---------- */

    const contentType = request.headers.get('content-type') || ''

    let email: string | undefined
    let fullName: string | undefined
    let githubId: string | undefined
    let shift: string | undefined
    let profilePictureFile: File | null = null

    if (contentType.includes('application/json')) {
      const body = await request.json()
      email = body?.email
      fullName = body?.fullName || body?.name
      githubId = body?.githubId
      shift = body?.shift
    } else {
      const data = await request.formData()
      email = (data.get('email') as string) || undefined
      fullName = (data.get('fullName') as string) || (data.get('name') as string) || undefined
      githubId = (data.get('githubId') as string) || undefined
      shift = (data.get('shift') as string) || undefined
      profilePictureFile = (data.get('profilePicture') as File) || null
    }

    if (!email) {
      return NextResponse.json(
        createErrorResponse('Email is required'),
        { status: 400 }
      )
    }

    /* ---------- DB ---------- */

    await connectDB()

    const user = await User.findOne({ email })

    if (!user) {
      return NextResponse.json(
        createErrorResponse('User not found'),
        { status: 404 }
      )
    }

    /* ---------- CLOUDINARY UPLOAD ---------- */

    if (profilePictureFile && profilePictureFile.size > 0) {

      try {
        const bytes = await profilePictureFile.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uploadRes = await cloudinary.uploader.upload(
          `data:${profilePictureFile.type};base64,${buffer.toString('base64')}`,
          {
            folder: 'timetricx/users',
            resource_type: 'auto',
            transformation: [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' }
            ]
          }
        )

        // 🔥 DELETE OLD PICTURE IF EXISTS
        if (user.profilePicture && user.profilePicture.includes('cloudinary.com')) {
          try {
            // Robust extraction: get everything after '/upload/'
            const uploadMatch = user.profilePicture.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
            if (uploadMatch && uploadMatch[1]) {
              const publicId = uploadMatch[1];
              await cloudinary.uploader.destroy(publicId);
              console.log("OLD IMAGE DELETED:", publicId);
            } else {
              // Fallback for cases where regex might fail but it is a cloudinary URL
              const parts = user.profilePicture.split('/');
              const folderIndex = parts.indexOf('timetricx');
              if (folderIndex !== -1) {
                const publicId = parts.slice(folderIndex).join('/').split('.')[0];
                await cloudinary.uploader.destroy(publicId);
              }
            }
          } catch (deleteErr) {
            console.error("OLD IMAGE DELETE FAILED:", deleteErr);
          }
        }

        user.profilePicture = uploadRes.secure_url

      } catch (error) {
        console.error("CLOUDINARY ERROR:", error)
        return NextResponse.json(
          createErrorResponse('Image upload failed'),
          { status: 500 }
        )
      }
    }

    /* ---------- UPDATE FIELDS ---------- */

    if (fullName) {
      user.name = fullName.trim()
    }

    if (shift) {
      user.shift = shift.trim()
    }

    if (githubId) {
      if (!user.authProviders) user.authProviders = {}

      const cleanGithubUsername = githubId.trim()
      const githubProfileUrl = cleanGithubUsername.startsWith('http')
        ? cleanGithubUsername
        : `https://github.com/${cleanGithubUsername}`

      user.authProviders.github = {
        id: githubProfileUrl,
        username: cleanGithubUsername,
        email: user.email
      }
    }

    await user.save()

    /* ---------- RESPONSE ---------- */

    const userResponse = user.toObject()
    delete userResponse.password

    return NextResponse.json(
      createSuccessResponse(
        { user: userResponse },
        'Profile updated successfully'
      ),
      { status: 200 }
    )

  } catch (error: any) {

    console.error('Update profile error:', error)

    if (error instanceof JsonWebTokenError) {
      return NextResponse.json(
        createErrorResponse('Invalid token'),
        { status: 401 }
      )
    }

    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(', ')
      return NextResponse.json(
        createErrorResponse(message),
        { status: 400 }
      )
    }

    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

/* BLOCK METHODS */

export async function GET() {
  return NextResponse.json(
    createErrorResponse('Method not allowed'),
    { status: 405 }
  )
}
