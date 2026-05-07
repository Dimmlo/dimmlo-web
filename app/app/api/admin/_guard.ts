import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

// Helper for admin API routes — returns either null (authorised) or a 401 response.
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdmin()) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
