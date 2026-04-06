import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import CinemaClient from "@/components/CinemaClient";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "aether-cinema-default-secret-key-32"
);

export const metadata = {
  title: "Aether Cinema — Now Showing",
  description: "Private screening room with synchronized playback",
};

export default async function CinemaPage() {
  // Server-side auth check
  const cookieStore = cookies();
  const token = cookieStore.get("aether-session")?.value;

  if (!token) {
    redirect("/");
  }

  let userName = "Guest";
  try {
    const { payload } = await jwtVerify(token, SECRET);
    userName = payload.name;
  } catch {
    redirect("/");
  }

  return <CinemaClient userName={userName} />;
}
