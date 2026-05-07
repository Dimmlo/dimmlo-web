import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "dimmlo_admin";

// Returns the admin password configured in env, or null if unset / placeholder.
function adminPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw === "placeholder") return null;
  return pw;
}

export function checkAdminPasswordValue(input: string): boolean {
  const expected = adminPassword();
  if (!expected) {
    // Fall back to "admin" if no real password configured, so local dev works.
    return input === "admin";
  }
  return input === expected;
}

// Get the cookie value that should be set when login succeeds.
// We just store the password value itself (this is local dev only).
export function adminCookieValue(): string {
  return adminPassword() ?? "admin";
}

// Server component / route handler: read the cookie and verify it.
export async function isAdmin(): Promise<boolean> {
  const c = cookies();
  const v = c.get(COOKIE_NAME)?.value;
  if (!v) return false;
  return v === adminCookieValue();
}

// Middleware-friendly version that takes the request directly.
export function isAdminFromRequest(req: NextRequest): boolean {
  const v = req.cookies.get(COOKIE_NAME)?.value;
  if (!v) return false;
  return v === adminCookieValue();
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
