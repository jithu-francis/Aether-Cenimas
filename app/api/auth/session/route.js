import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "aether-cinema-default-secret-key-32"
);

export async function GET(request) {
  try {
    const token = request.cookies.get("aether-session")?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, SECRET);

    return NextResponse.json({
      authenticated: true,
      name: payload.name,
    });
  } catch (error) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
