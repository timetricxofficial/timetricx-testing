import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "../../../../../lib/github-oauth";
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
            let rawState = stateParam;
            try { rawState = decodeURIComponent(stateParam); } catch { }
            const state = JSON.parse(rawState);
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
        /* ---------- GITHUB TOKEN EXCHANGE ---------- */

        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            }),
        });

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            console.error("GitHub token exchange failed:", tokenData);
            return NextResponse.redirect(
                errorRedirect("github_token_failed", request, redirectPath)
            );
        }

        /* ---------- FETCH GITHUB USER ---------- */

        const userRes = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `token ${accessToken}`,
                Accept: "application/json"
            },
        });

        if (!userRes.ok) {
            throw new Error("Failed to fetch GitHub user");
        }

        const githubUser = await userRes.json();

        /* ---------- FETCH GITHUB EMAIL ---------- */
        let email = githubUser.email;
        if (!email) {
            const emailsRes = await fetch("https://api.github.com/user/emails", {
                headers: {
                    Authorization: `token ${accessToken}`,
                    Accept: "application/json"
                },
            });
            if (emailsRes.ok) {
                const emails = await emailsRes.json();
                const primaryEmail = emails.find((e: any) => e.primary && e.verified);
                email = primaryEmail ? primaryEmail.email : (emails[0]?.email || null);
            }
        }

        /* ---------- DB UPDATE ---------- */

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
            user.authProviders.github = {
                id: githubUser.id.toString(),
                username: githubUser.login,
                email: email?.toLowerCase() || "",
                accessToken: accessToken
            };
            await user.save();
        } else {
            // Login flow - search by ID or username
            user = await User.findOne({ "authProviders.github.id": githubUser.id.toString() });

            // If not found by ID, try searching by username
            if (!user) {
                user = await User.findOne({ "authProviders.github.username": githubUser.login });
            }

            if (!user && email) {
                user = await User.findOne({ email: email.toLowerCase() });

                if (user) {
                    user.authProviders = user.authProviders || {};
                    user.authProviders.github = {
                        id: githubUser.id.toString(),
                        username: githubUser.login,
                        email: email.toLowerCase(),
                        accessToken: accessToken
                    };
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
                let rawState = stateParam;
                try { rawState = decodeURIComponent(stateParam); } catch { }
                const parsed = JSON.parse(rawState);
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

        const response = NextResponse.redirect(new URL(getAppBaseUrl(request) + (redirectPath || "/users/dashboard")));

        response.cookies.set("token", token, {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            path: "/",
            sameSite: "lax",
        });

        response.cookies.set("user", JSON.stringify(userObj), {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            path: "/",
            sameSite: "lax",
        });

        return response;

    } catch (error) {
        console.error("GitHub OAuth callback failed:", error);
        return NextResponse.redirect(
            errorRedirect("oauth_failed", request, redirectPath)
        );
    }
}
