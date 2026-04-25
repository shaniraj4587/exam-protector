// src/app/api/admin/terminate/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await validateSession(req);
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.payload.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { attemptId } = await req.json();

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      select: { userId: true, status: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Attempt is not in progress" },
        { status: 409 }
      );
    }

    // Terminate attempt
    await prisma.attempt.update({
      where: { id: attemptId },
      data: { status: "TERMINATED", terminatedAt: new Date() },
    });

    // Kill user session
    await prisma.session.updateMany({
      where: { userId: attempt.userId, isActive: true },
      data: { isActive: false },
    });

    // Log admin action
    await prisma.log.create({
      data: {
        attemptId,
        type: "TAB_SWITCH", // reuse closest type; extend enum if needed
        metadata: {
          action:      "ADMIN_TERMINATE",
          adminId:     auth.payload.userId,
          terminatedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN TERMINATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}