import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl, getGoogleOAuthClient } from "../../../../../lib/google-oauth";
import connectDB from "../../../../../lib/database";
import { User } from "../../../../../models/User";
import { generateToken } from "../../../../../utils/generateToken";

/* ---------------- REDIRECT HELPERS ---------------- */

const errorRedirect = (
  message: string,
  request: NextRequest,
  redirectPath = "/landing/auth/login"
) => {
  const base = getAppBaseUrl(request);
  const url = new URL(`${base}${redirectPath}`);
  url.searchParams.set("auth_error", message);
  return url.toString();
};

/* ---------------- MAIN HANDLER ---------------- */

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const code = search.get("code");
  const stateParam = search.get("state");

  if (!code) {
    return NextResponse.redirect(
      errorRedirect("missing_code", request)
    );
  }

  /* ---------- STATE PARSE ---------- */

  let redirectPath: string | undefined;
  let connectEmail: string | null = null;
  let mode: "connect" | "login" = "login";

  try {
    if (stateParam) {
      const state = JSON.parse(stateParam);
      mode = state.mode || "login";

      if (typeof state.redirect === "string") {
        redirectPath = state.redirect;
      }

      if (state.mode === "connect" && typeof state.email === "string") {
        connectEmail = state.email.toLowerCase();
      }
    }
  } catch {
    return NextResponse.redirect(
      errorRedirect("invalid_state", request)
    );
  }

  try {
    /* ---------- GOOGLE TOKEN ---------- */

    const client = getGoogleOAuthClient(request);
    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
      return NextResponse.redirect(
        errorRedirect("missing_id_token", request, redirectPath)
      );
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.sub) {
      return NextResponse.redirect(
        errorRedirect("invalid_google_payload", request, redirectPath)
      );
    }

    /* ---------- DB ---------- */

    await connectDB();

    let user;

    if (mode === "connect" && connectEmail) {
      user = await User.findOne({ email: connectEmail });

      if (!user) {
        return NextResponse.redirect(
          errorRedirect("user_not_found", request, redirectPath)
        );
      }

      user.authProviders = user.authProviders || {};
      user.authProviders.google = {
        id: payload.sub,
        email: payload.email.toLowerCase(),
      };
      user.isEmailVerified = true;
      await user.save();
    } else {
      user = await User.findOne({ "authProviders.google.id": payload.sub });

      if (!user) {
        user = await User.findOne({ email: payload.email.toLowerCase() });

        if (user) {
          user.authProviders = user.authProviders || {};
          user.authProviders.google = {
            id: payload.sub,
            email: payload.email.toLowerCase(),
          };
          user.isEmailVerified = true;
          await user.save();
        }
      }
    }

    if (!user) {
      return NextResponse.redirect(
        errorRedirect("account_not_exists", request, "/landing/auth/signup")
      );
    }

    /* ---------- LOGIN SUCCESS & UPDATE SESSION ---------- */

    // Extract deviceId from state
    let deviceId: string | null = null;
    try {
      if (stateParam) {
        const parsed = JSON.parse(stateParam);
        deviceId = parsed.deviceId || null;
      }
    } catch { }

    // Update active session atomically
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          "activeSession.deviceId": deviceId,
          "activeSession.lastActive": new Date(),
          "activeSession.checkedIn": false,
          "activeSession.deviceOtp": null,
          "activeSession.deviceOtpExpiry": null
        }
      }
    );

    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role
    });

    const userObj = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture
    };

    const response = NextResponse.redirect(new URL(getAppBaseUrl(request) + (redirectPath || "/users")));

    // Set cookies directly in the redirect response
    response.cookies.set("token", token, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      path: "/",
      sameSite: "lax",
    });

    response.cookies.set("user", JSON.stringify(userObj), {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      path: "/",
      sameSite: "lax",
    });

    return response;

  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    return NextResponse.redirect(
      errorRedirect("oauth_failed", request, redirectPath)
    );
  }
}
