import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const isAuth = !!token;
    const path = req.nextUrl.pathname;

    // Admin Routing Logic (Enforce distinct authentication)
    if (path.startsWith("/admin")) {
        // If not authenticated, or authenticated but NOT an admin, redirect to Admin Portal wrapper.
        // This ensures the distinct authentication page requested by user.
        if (!isAuth || token?.role !== "ADMIN") {
            const redirectUrl = new URL("/auth/admin", req.url);
            redirectUrl.searchParams.set("callbackUrl", path);
            return NextResponse.redirect(redirectUrl);
        }
    }
    
    // Default login for regular member portals
    if (path.startsWith("/dashboard") || path.startsWith("/bookings")) {
        if (!isAuth) {
            const redirectUrl = new URL("/auth/signin", req.url);
            redirectUrl.searchParams.set("callbackUrl", path);
            return NextResponse.redirect(redirectUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/bookings/:path*",
        "/admin/:path*",
    ],
};
