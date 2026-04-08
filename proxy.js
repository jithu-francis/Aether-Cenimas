import { NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Protect /cinema routes
  if (pathname.startsWith("/cinema")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const payload = await verifyToken(token);

    if (!payload) {
      // Invalid/missing/expired token
      const response = NextResponse.redirect(new URL("/", request.url));
      if (token) {
        // Clear cookies if token is invalid
        response.cookies.delete(COOKIE_NAME);
      }
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cinema/:path*"],
};
