import { NextResponse } from "next/server";
import connectDB from "../../../../lib/database";
import { WeekendRequest } from "../../../../models/WeekendRequest";

// GET — Fetch weekend requests for a specific user
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

        const requests = await WeekendRequest.find({ userEmail: email })
            .sort({ date: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            data: requests,
        });
    } catch (err) {
        console.error("USER WEEKEND REQUESTS ERROR:", err);
        return NextResponse.json({
            success: false,
            message: "Server error",
        });
    }
}
