import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasPermission, RoutePermissions, Role } from "./lib/rbac";

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const isAuth = !!token;
    const path = req.nextUrl.pathname;
    const userRole = (token?.role as Role) || null;

    // Check against RBAC Matrix
    const routeConfig = RoutePermissions.find(route => path.startsWith(route.pathPrefix));

    if (routeConfig) {
        if (!isAuth) {
            const redirectUrl = new URL("/auth/signin", req.url);
            redirectUrl.searchParams.set("callbackUrl", path);
            return NextResponse.redirect(redirectUrl);
        }

        // Evaluate Permission
        const isPermitted = hasPermission(userRole, routeConfig.minimumRole);
        
        if (!isPermitted) {
            // Unauthorized access:
            // If they are trying to access /admin normally, kick to /auth/admin
            if (path.startsWith("/admin")) {
                const redirectUrl = new URL("/auth/admin", req.url);
                redirectUrl.searchParams.set("callbackUrl", path);
                return NextResponse.redirect(redirectUrl);
            }
            // Otherwise kick to standard unauthorized or dashboard
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/coach/:path*",
        "/reception/:path*",
        "/dashboard/:path*",
        "/bookings/:path*",
    ],
};
