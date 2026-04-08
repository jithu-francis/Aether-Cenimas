import { NextResponse } from "next/server";
import { signToken, COOKIE_NAME, getCookieOptions } from "@/lib/auth";

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
    const token = await signToken(name);

    // Set auth cookie
    const response = NextResponse.json({
      success: true,
      name: name.trim(),
    });

    response.cookies.set(COOKIE_NAME, token, getCookieOptions());

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
