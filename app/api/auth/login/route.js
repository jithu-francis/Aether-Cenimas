import { NextResponse } from "next/server";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "aether-cinema-default-secret-key-32"
);

export async function POST(request) {
  try {
    const { name, accessCode } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!accessCode) {
      return NextResponse.json(
        { error: "Access code is required" },
        { status: 400 }
      );
    }

    const validCode = process.env.STREAM_PASSWORD || "aether2024";
    if (accessCode !== validCode) {
      return NextResponse.json(
        { error: "Invalid access code" },
        { status: 401 }
      );
    }

    // Sign JWT
    const token = await new SignJWT({ name: name.trim() })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(SECRET);

    // Set httpOnly cookie
    const response = NextResponse.json({
      success: true,
      name: name.trim(),
    });

    response.cookies.set("aether-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24h
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
