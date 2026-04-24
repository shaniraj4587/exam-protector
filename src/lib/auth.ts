// src/lib/auth.ts

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { JWTPayload } from "@/types";

// ── Extract token from request ───────────────────────────
export function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = req.cookies.get("auth_token");
  return cookie?.value ?? null;
}

// ── Validate token + session in DB ───────────────────────
export async function validateSession(
  req: NextRequest
): Promise<{ valid: false; error: string } | { valid: true; payload: JWTPayload }> {
  const token = extractToken(req);

  if (!token) {
    return { valid: false, error: "No token provided" };
  }

  // 1. Verify JWT signature + expiry
  let payload: JWTPayload;
  try {
    payload = verifyToken(token);
  } catch {
    return { valid: false, error: "Invalid or expired token" };
  }

  // 2. Check session exists and is active in DB
  const session = await prisma.session.findUnique({
    where: { token },
  });

  if (!session) {
    return { valid: false, error: "Session not found" };
  }

  if (!session.isActive) {
    return { valid: false, error: "Session has been terminated" };
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.update({
      where: { id: session.id },
      data: { isActive: false },
    });
    return { valid: false, error: "Session expired" };
  }

  return { valid: true, payload };
}

// ── Invalidate all sessions for a user ───────────────────
export async function invalidateAllSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });
}

// ── Get client IP ────────────────────────────────────────
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}