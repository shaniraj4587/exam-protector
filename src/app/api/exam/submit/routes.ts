// src/app/api/exam/submit/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await validateSession(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { attemptId, answers, reason = "MANUAL" } = await req.json();

    if (!attemptId) {
      return NextResponse.json({ error: "attemptId is required" }, { status: 400 });
    }

    // ── Get attempt with exam questions ──────────────────
    const attempt = await prisma.attempt.findFirst({
      where: {
        id: attemptId,
        userId: auth.payload.userId,
        status: "IN_PROGRESS",
      },
      include: {
        exam: {
          include: {
            questions: {
              select: { id: true, answer: true },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found or already closed" },
        { status: 404 }
      );
    }

    // ── Calculate score ──────────────────────────────────
    const finalAnswers = answers ?? attempt.answers as Record<string, string>;
    let correct = 0;

    for (const question of attempt.exam.questions) {
      if (finalAnswers[question.id] === question.answer) {
        correct++;
      }
    }

    const total = attempt.exam.questions.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    // ── Update attempt ───────────────────────────────────
    const updated = await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        answers: finalAnswers,
        score,
        submittedAt: new Date(),
        timeRemainingS: 0,
      },
    });

    return NextResponse.json({
      message: "Exam submitted successfully",
      score,
      correct,
      total,
      reason,
    });
  } catch (error) {
    console.error("[EXAM SUBMIT ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}