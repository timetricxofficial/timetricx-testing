import { NextResponse } from "next/server";
import connectDB from "../../../../lib/database";
import { FaceAttendance } from "../../../../models/FaceAttendance";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({
        success: false,
        message: "Email required",
      });
    }

    await connectDB();

    const doc = await FaceAttendance.findOne({ userEmail: email });

    if (!doc) {
      return NextResponse.json({
        success: true,
        data: { records: [] },
      });
    }

    const allRecords = doc.months.reduce(
      (acc: any[], m: any) => acc.concat(m.records),
      []
    );

    return NextResponse.json({
      success: true,
      data: {
        records: allRecords,
      },
    });
  } catch (err) {
    console.log("CALENDAR API ERROR:", err);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}
