// src/app/api/exam/start/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await validateSession(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { examId } = await req.json();

    if (!examId) {
      return NextResponse.json({ error: "examId is required" }, { status: 400 });
    }

    // ── Check exam exists and is active ──────────────────
    const exam = await prisma.exam.findUnique({
      where: { id: examId, isActive: true },
      include: {
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            text: true,
            options: true,
            order: true,
            // NOTE: answer is NOT returned to frontend
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found or inactive" }, { status: 404 });
    }

    // ── Check for existing attempt ───────────────────────
    const existing = await prisma.attempt.findUnique({
      where: {
        userId_examId: {
          userId: auth.payload.userId,
          examId,
        },
      },
    });

    if (existing?.status === "SUBMITTED") {
      return NextResponse.json(
        { error: "You have already submitted this exam" },
        { status: 409 }
      );
    }

    if (existing?.status === "TERMINATED") {
      return NextResponse.json(
        { error: "Your attempt was terminated due to violations" },
        { status: 403 }
      );
    }

    // ── Resume existing IN_PROGRESS attempt ──────────────
    if (existing?.status === "IN_PROGRESS") {
      const elapsed = Math.floor(
        (Date.now() - new Date(existing.startedAt).getTime()) / 1000
      );
      const totalSeconds = exam.durationMins * 60;
      const timeRemainingS = Math.max(0, totalSeconds - elapsed);

      // Auto submit if time ran out
      if (timeRemainingS <= 0) {
        await prisma.attempt.update({
          where: { id: existing.id },
          data: { status: "SUBMITTED", submittedAt: new Date() },
        });
        return NextResponse.json({ error: "Exam time has expired" }, { status: 410 });
      }

      return NextResponse.json({
        attempt: { ...existing, timeRemainingS },
        questions: exam.questions,
        exam: { title: exam.title, durationMins: exam.durationMins },
        resumed: true,
      });
    }

    // ── Create new attempt ───────────────────────────────
    const attempt = await prisma.attempt.create({
      data: {
        userId: auth.payload.userId,
        examId,
        status: "IN_PROGRESS",
        answers: {},
        violationCount: 0,
      },
    });

    // Shuffle questions for randomization
    const shuffled = [...exam.questions].sort(() => Math.random() - 0.5);

    return NextResponse.json({
      attempt: {
        ...attempt,
        timeRemainingS: exam.durationMins * 60,
      },
      questions: shuffled,
      exam: { title: exam.title, durationMins: exam.durationMins },
      resumed: false,
    });
  } catch (error) {
    console.error("[EXAM START ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}