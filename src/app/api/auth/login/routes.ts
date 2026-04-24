// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { invalidateAllSessions, getClientIp } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // ── Validation ───────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // ── Find user ────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ── Verify password ──────────────────────────────────
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ── Enforce single session: kill all existing ────────
    await invalidateAllSessions(user.id);

    // ── Create JWT ───────────────────────────────────────
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: "", // will update below
    });

    // ── Store session in DB ──────────────────────────────
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token,
        ip: getClientIp(req),
        userAgent: req.headers.get("user-agent") || "unknown",
        isActive: true,
        expiresAt,
      },
    });

    // ── Build response with cookie ───────────────────────
    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}