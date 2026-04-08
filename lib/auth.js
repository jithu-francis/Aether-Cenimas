import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "aether-cinema-default-secret-key-32"
);

export const COOKIE_NAME = "aether-session";

/**
 * Signs a new JWT for the user name
 */
export async function signToken(name) {
  return await new SignJWT({ name: name.trim() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}

/**
 * Verifies a JWT token
 */
export async function verifyToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Helper to get cookie options for standardization
 */
export function getCookieOptions(isLogout = false) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: isLogout ? 0 : 60 * 60 * 24, // 24h or 0
    path: "/",
  };
}
