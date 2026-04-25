// src/app/api/exam/save/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await validateSession(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { attemptId, answers, timeRemainingS } = await req.json();

    if (!attemptId) {
      return NextResponse.json({ error: "attemptId is required" }, { status: 400 });
    }

    // ── Verify attempt belongs to user ───────────────────
    const attempt = await prisma.attempt.findFirst({
      where: {
        id: attemptId,
        userId: auth.payload.userId,
        status: "IN_PROGRESS",
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found or already closed" },
        { status: 404 }
      );
    }

    // ── Save answers + time ──────────────────────────────
    await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        answers: answers ?? attempt.answers,
        timeRemainingS: timeRemainingS ?? attempt.timeRemainingS,
      },
    });

    return NextResponse.json({ message: "Saved" });
  } catch (error) {
    console.error("[EXAM SAVE ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}