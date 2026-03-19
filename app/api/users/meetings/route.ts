import { NextRequest, NextResponse } from "next/server"

// Redirect to the list endpoint
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")
  return NextResponse.redirect(new URL(`/api/users/meetings/list?email=${email}`, req.url))
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
