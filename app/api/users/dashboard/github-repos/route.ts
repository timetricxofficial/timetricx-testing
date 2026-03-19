import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/database";
import { User } from "../../../../../models/User";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ success: false, message: "Email required" }, { status: 400 });
        }

        await connectDB();
        const user = await User.findOne({ email });

        const accessToken = user?.authProviders?.github?.accessToken;
        const username = user?.authProviders?.github?.username || user?.authProviders?.github?.id;

        if (!accessToken && !username) {
            return NextResponse.json({ success: false, message: "GitHub not connected" });
        }

        let repos: any[] = [];

        if (accessToken) {
            // Try authenticated API first
            const ghRes = await fetch("https://api.github.com/user/repos?sort=updated&per_page=50&type=owner", {
                headers: {
                    Authorization: `token ${accessToken}`,
                    Accept: "application/json"
                },
                cache: 'no-store'
            });

            if (ghRes.ok) {
                repos = await ghRes.json();
            } else {
                console.warn("GitHub token might be expired, falling back to public API");
            }
        }

        // Fallback: use public API with username
        if (repos.length === 0 && username) {
            const ghRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=50`, {
                headers: { Accept: "application/json" },
                cache: 'no-store'
            });

            if (ghRes.ok) {
                repos = await ghRes.json();
            } else {
                const error = await ghRes.json();
                console.error("GitHub public API error:", error);
                return NextResponse.json({ success: false, message: "Could not fetch repos" });
            }
        }

        // Sort by updated
        const sortedRepos = repos
            .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .slice(0, 50);

        return NextResponse.json({
            success: true,
            repos: sortedRepos
        });

    } catch (err) {
        console.error("github-repos error:", err);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
