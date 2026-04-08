import { NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export async function GET(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    name: payload.name,
  });
}
