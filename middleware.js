import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "aether-cinema-default-secret-key-32"
);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only protect /cinema routes
  if (pathname.startsWith("/cinema")) {
    const token = request.cookies.get("aether-session")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    try {
      await jwtVerify(token, SECRET);
      return NextResponse.next();
    } catch {
      // Invalid/expired token
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.set("aether-session", "", { maxAge: 0, path: "/" });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cinema/:path*"],
};
