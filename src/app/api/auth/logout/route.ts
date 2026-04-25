// src/app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req);

    if (token) {
      await prisma.session.updateMany({
        where: { token },
        data: { isActive: false },
      });
    }

    const response = NextResponse.json({ message: "Logged out successfully" });

    // Clear cookie
    response.cookies.set("auth_token", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[LOGOUT ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}