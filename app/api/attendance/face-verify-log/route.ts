import { NextResponse } from "next/server";
import connectDB from "../../../../lib/database";
import { User } from "../../../../models/User";
import { FaceVerificationLog } from "../../../../models/FaceVerificationLog";

const RETRY_DELAY_MINUTES = 2;
const MISSED_THRESHOLD_MINUTES = 10;
const MAX_ATTEMPTS = 3;

// Helper to get Indian Date (YYYY-MM-DD)
function getIndianDate() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

// Helper to get Indian Time as formatted string (like "08:32:12 PM")
function toIndianTimeString(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

// Helper to get full Indian DateTime string
function toIndianDateTimeString(date: Date): string {
  const dateStr = date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const timeStr = toIndianTimeString(date);
  return `${dateStr} ${timeStr}`;
}

// 🔄 GET: Sync/Recovery - Handle Refresh, Tab Reopen, and Missed Sessions
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, message: "Email required" }, { status: 400 });
    }

    await connectDB();
    const today = getIndianDate();
    const now = new Date();

    const log = await FaceVerificationLog.findOne({ userEmail: email, date: today });
    if (!log) {
      return NextResponse.json({ success: true, pendingSession: null });
    }

    let modified = false;
    let activePendingSession = null;

    for (const session of log.sessions) {
      if (session.finalStatus === "pending") {
        // Since scheduledAt and nextRetryAt are now strings, we need to parse them for calculation
        const nextRetryAtDate = session.nextRetryAt ? new Date(session.nextRetryAt) : new Date(session.scheduledAt);
        const diffMs = now.getTime() - nextRetryAtDate.getTime();
        const diffMins = diffMs / (1000 * 60);

        // ❌ Missed: Beyond threshold
        if (diffMins > MISSED_THRESHOLD_MINUTES) {
          session.finalStatus = "missed";
          session.interruptedReason = "session_interrupted";
          modified = true;
        } 
        // ⏳ Still valid pending session
        else {
          activePendingSession = session;
        }
      }
    }

    if (modified) {
      await log.save();
    }

    return NextResponse.json({ 
      success: true, 
      pendingSession: activePendingSession 
    });

  } catch (error: any) {
    console.error("FACE LOG SYNC ERROR:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// 📝 POST: Log Attempt - Record a new verification attempt
export async function POST(req: Request) {
  try {
    const { email, scheduledAt, status, confidence, attemptNo } = await req.json();

    if (!email || !scheduledAt) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    await connectDB();
    const today = getIndianDate();
    const now = new Date();
    const istTimeStr = toIndianTimeString(now);

    let log = await FaceVerificationLog.findOne({ userEmail: email, date: today });
    if (!log) {
      const user = await User.findOne({ email });
      if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
      
      log = new FaceVerificationLog({
        userId: user._id,
        userEmail: email,
        date: today,
        sessions: []
      });
    }

    // scheduledAt is coming from client (ISO string), keep it as is for comparison
    // or store as IST string if needed. Let's keep it as received to match client state.
    
    let session = log.sessions.find((s: any) => s.scheduledAt === scheduledAt);

    // Initial creation of session if it doesn't exist (first attempt)
    if (!session) {
      session = {
        scheduledAt: scheduledAt,
        attempts: [],
        finalStatus: "pending"
      };
      log.sessions.push(session);
      // Re-find to get reference
      session = log.sessions[log.sessions.length - 1];
    }

    // Add new attempt with IST Time string
    session.attempts.push({
      attemptNo: attemptNo || (session.attempts.length + 1),
      time: istTimeStr,
      status: status, // "success" | "partial" | "fail"
      confidence: confidence
    });

    const currentAttemptNo = session.attempts.length;

    // Count positive votes (success + partial) vs negative votes (fail)
    const positiveVotes = session.attempts.filter((a: any) => a.status === "success" || a.status === "partial").length;
    const negativeVotes = session.attempts.filter((a: any) => a.status === "fail").length;

    // Determine final status based on voting logic
    if (positiveVotes > negativeVotes) {
      // More success/partial than fails = overall success
      session.finalStatus = "success";
      session.nextRetryAt = undefined;
    } else if (currentAttemptNo >= MAX_ATTEMPTS) {
      // Max attempts reached and not enough positive votes
      session.finalStatus = "suspicious";
      session.nextRetryAt = undefined;
    } else {
      // Still have attempts left, continue retry
      session.finalStatus = "pending";
      // Store nextRetryAt as ISO for easier client calculation, or IST? 
      // Let's use ISO for nextRetryAt to maintain calculation logic in GET
      session.nextRetryAt = new Date(now.getTime() + RETRY_DELAY_MINUTES * 60000).toISOString();
    }

    await log.save();

    return NextResponse.json({ 
      success: true, 
      sessionStatus: session.finalStatus,
      nextRetryAt: session.nextRetryAt 
    });

  } catch (error: any) {
    console.error("FACE LOG POST ERROR:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
