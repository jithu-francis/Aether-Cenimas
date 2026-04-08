import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CinemaClient from "@/components/CinemaClient";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export const metadata = {
  title: "Aether Cinema — Now Showing",
  description: "Private screening room with synchronized playback",
};

export default async function CinemaPage() {
  // Server-side auth check
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  console.log(`[CinemaPage] Token found: ${!!token}`);
  
  const payload = await verifyToken(token);
  console.log(`[CinemaPage] Payload verified: ${!!payload}`);

  if (!payload) {
    console.log("[CinemaPage] Redirecting to Home due to invalid payload");
    redirect("/");
  }

  return <CinemaClient userName={payload.name} />;
}
