import { Buffer } from 'buffer'
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../../lib/database'
import { User } from '../../../../../models/User'
import cloudinary from '../../../../../lib/cloudinary'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* ---------------- HELPER ---------------- */
const getPublicIdFromUrl = (url: string) => {
  try {
    if (!url || !url.includes('cloudinary.com')) return null;

    // Robust extraction: get everything after '/upload/' skipping version if present
    const uploadMatch = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
    if (uploadMatch && uploadMatch[1]) {
      return uploadMatch[1];
    }

    // Fallback
    const parts = url.split('/')
    const folderIndex = parts.indexOf('timetricx')
    if (folderIndex !== -1) {
      return parts.slice(folderIndex).join('/').split('.')[0]
    }
    return null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    /* ---------- ENV CHECK ---------- */
    const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET } = process.env
    if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_API_SECRET) {
      return NextResponse.json(
        { success: false, message: 'Cloudinary environment variables are missing' },
        { status: 500 }
      )
    }

    /* ---------- FORM DATA ---------- */
    const data = await request.formData()
    const email = data.get('email') as string
    const file = data.get('image') as File | null

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email required' },
        { status: 400 }
      )
    }

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, message: 'Image required' },
        { status: 400 }
      )
    }

    /* ---------- DB ---------- */
    await connectDB()
    const user = await User.findOne({ email })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    /* ---------- DELETE OLD IMAGE ---------- */
    if (user.profilePicture) {
      const oldPublicId = getPublicIdFromUrl(user.profilePicture)

      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId)
        } catch (err) {
          console.warn('Old image delete failed:', err)
          // ❗ intentionally not failing upload
        }
      }
    }

    /* ---------- UPLOAD NEW IMAGE ---------- */
    let uploadedImage = ''

    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadRes = await cloudinary.uploader.upload(
        `data:${file.type};base64,${buffer.toString('base64')}`,
        {
          folder: 'timetricx/users',
          resource_type: 'auto',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' }
          ]
        }
      )

      uploadedImage = uploadRes.secure_url
      user.profilePicture = uploadedImage

    } catch (err) {
      console.error('Cloudinary upload error:', err)
      return NextResponse.json(
        { success: false, message: 'Image upload failed' },
        { status: 500 }
      )
    }

    /* ---------- SAVE ---------- */
    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Profile image updated',
      data: {
        profilePicture: uploadedImage
      }
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

/* BLOCK OTHER METHODS */
export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed' },
    { status: 405 }
  )
}
