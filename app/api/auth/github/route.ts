import { NextRequest, NextResponse } from "next/server";
import { getGitHubAuthUrl } from "../../../../lib/github-oauth";

export async function GET(request: NextRequest) {
    try {
        const stateParam = request.nextUrl.searchParams.get("state");

        if (!stateParam) {
            return NextResponse.json(
                { error: "Missing OAuth state" },
                { status: 400 }
            );
        }

        // 🔒 Validate state (basic)
        let parsedState;
        try {
            parsedState = JSON.parse(stateParam);
        } catch {
            return NextResponse.json(
                { error: "Invalid OAuth state" },
                { status: 400 }
            );
        }

        // 🔐 Validate mode
        if (parsedState.mode !== "connect" && parsedState.mode !== "login") {
            return NextResponse.json(
                { error: "Invalid OAuth mode" },
                { status: 400 }
            );
        }

        const authUrl = getGitHubAuthUrl(request, stateParam);

        return NextResponse.redirect(authUrl, { status: 302 });
    } catch (error) {
        console.error("Failed to start GitHub OAuth:", error);
        return NextResponse.json(
            { error: "GitHub OAuth not configured" },
            { status: 500 }
        );
    }
}
