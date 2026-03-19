import { NextResponse } from "next/server";
import connectDB from "../../../../lib/database";
import { HolidayWorkRequest } from "../../../../models/HolidayWorkRequest";
import { User } from "../../../../models/User";
import { CompanyHoliday } from "../../../../models/CompanyHoliday";
import { sendHolidayWorkRequestMail } from "../../../../utils/sendHolidayWorkRequestMail";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { email, holidayId, holidayDate, reason } = await req.json();

        if (!email || !holidayId || !holidayDate || !reason) {
            return NextResponse.json({
                success: false,
                message: "Missing required fields",
            }, { status: 400 });
        }

        await connectDB();

        // Normalize holidayDate to YYYY-MM-DD
        const normalizedDate = holidayDate.substring(0, 10);

        // Check if request already exists (match both YYYY-MM-DD and full ISO)
        const existing = await (HolidayWorkRequest as any).findOne({
            userEmail: email,
            holidayDate: { $regex: `^${normalizedDate}` }
        });
        if (existing) {
            if (existing.status === 'rejected') {
                // Check if max attempts reached (2 attempts allowed)
                const currentCount = existing.requestCount ?? 1;
                if (currentCount >= 2) {
                    return NextResponse.json({
                        success: false,
                        message: "Maximum request attempts reached (2). You cannot request again.",
                    }, { status: 400 });
                }

                // Allow re-applying
                existing.status = 'pending';
                existing.reason = reason;
                existing.appliedAt = new Date();
                existing.requestCount = currentCount + 1;
                existing.markModified('requestCount');
                await existing.save();

                // 📩 Send Email to Admin
                const user = await User.findOne({ email }).lean();
                const holiday = await CompanyHoliday.findById(holidayId).lean();
                const adminEmail = process.env.ADMIN_EMAIL || "teamcybershoora@gmail.com";

                if (user && holiday) {
                    await sendHolidayWorkRequestMail(
                        adminEmail,
                        email,
                        (user as any).name || email,
                        (holiday as any).title,
                        normalizedDate,
                        reason,
                        existing._id.toString()
                    );
                }

                return NextResponse.json({
                    success: true,
                    message: "Request re-submitted successfully",
                    data: existing,
                });
            }

            return NextResponse.json({
                success: true,
                message: "Request already submitted",
                data: existing,
            });
        }

        const newRequest = await HolidayWorkRequest.create({
            userEmail: email,
            holidayId,
            holidayDate: normalizedDate,
            reason,
            status: 'pending'
        });

        // 📩 Send Email to Admin
        const user = await User.findOne({ email }).lean();
        const holiday = await CompanyHoliday.findById(holidayId).lean();
        const adminEmail = process.env.ADMIN_EMAIL || "teamcybershoora@gmail.com";

        if (user && holiday) {
            await sendHolidayWorkRequestMail(
                adminEmail,
                email,
                (user as any).name || email,
                (holiday as any).title,
                normalizedDate,
                reason,
                newRequest._id.toString()
            );
        }

        return NextResponse.json({
            success: true,
            message: "Request submitted successfully",
            data: newRequest,
        });
    } catch (err) {
        console.error("HOLIDAY REQUEST POST ERROR:", err);
        return NextResponse.json({
            success: false,
            message: "Server error",
        }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const date = searchParams.get("date"); // YYYY-MM-DD

        if (!email) {
            return NextResponse.json({
                success: false,
                message: "Email required",
            }, { status: 400 });
        }

        await connectDB();

        if (date) {
            const normalizedDate = date.substring(0, 10);
            const request = await (HolidayWorkRequest as any).findOne({ userEmail: email, holidayDate: { $regex: `^${normalizedDate}` } }).lean();
            // Ensure requestCount has a default
            if (request && !request.requestCount) {
                request.requestCount = 1;
            }
            return NextResponse.json({
                success: true,
                data: request,
            });
        } else {
            const requests = await (HolidayWorkRequest as any).find({ userEmail: email }).lean();
            return NextResponse.json({
                success: true,
                data: requests,
            });
        }
    } catch (err) {
        console.error("HOLIDAY REQUEST GET ERROR:", err);
        return NextResponse.json({
            success: false,
            message: "Server error",
        }, { status: 500 });
    }
}
