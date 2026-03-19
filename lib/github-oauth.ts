import { NextRequest } from "next/server";

export function getAppBaseUrl(request: NextRequest) {
    const protocol =
        request.headers.get("x-forwarded-proto") || "http";
    const host =
        request.headers.get("x-forwarded-host") ||
        request.headers.get("host");

    return `${protocol}://${host}`;
}

export function getGitHubAuthUrl(request: NextRequest, state: string) {
    const baseUrl = getAppBaseUrl(request);
    const redirectUri = `${baseUrl}/api/auth/github/callback`;
    const clientId = process.env.GITHUB_CLIENT_ID;

    if (!clientId) {
        throw new Error("GITHUB_CLIENT_ID not configured");
    }

    let url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user,user:email,repo&state=${encodeURIComponent(state)}`;

    // Force account re-selection when switching accounts
    try {
        const parsed = JSON.parse(state);
        if (parsed.mode === 'connect') {
            url += '&login=&prompt=select_account';
        }
    } catch { }

    return url;
}
