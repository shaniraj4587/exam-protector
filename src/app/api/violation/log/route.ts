// src/app/api/violation/log/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import {
  getEscalationAction,
  VIOLATION_WEIGHTS,
  EscalationAction,
} from "@/lib/violations";
import { ViolationEvent } from "@/types";

export async function POST(req: NextRequest) {
  const auth = await validateSession(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const {
      attemptId,
      type,
      metadata = {},
    }: {
      attemptId: string;
      type: ViolationEvent;
      metadata?: Record<string, unknown>;
    } = await req.json();

    if (!attemptId || !type) {
      return NextResponse.json(
        { error: "attemptId and type are required" },
        { status: 400 }
      );
    }

    // ── Verify attempt belongs to user and is active ─────
    const attempt = await prisma.attempt.findFirst({
      where: {
        id: attemptId,
        userId: auth.payload.userId,
        status: "IN_PROGRESS",
      },
      include: {
        exam: {
          select: { maxViolations: true },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Active attempt not found" },
        { status: 404 }
      );
    }

    // ── Write violation log ──────────────────────────────
    await prisma.log.create({
      data: {
        attemptId,
        type,
        metadata: {
          ...metadata,
          userAgent: req.headers.get("user-agent"),
          ip: req.headers.get("x-forwarded-for") || "unknown",
        },
      },
    });

    // ── Increment violation count by weight ───────────────
    const weight = VIOLATION_WEIGHTS[type] ?? 1;
    const newCount = attempt.violationCount + weight;
    const maxViolations = attempt.exam.maxViolations;

    // ── Determine escalation ─────────────────────────────
    const action: EscalationAction = getEscalationAction(newCount);
    let newStatus = attempt.status;
    let sessionTerminated = false;

    if (action === "TERMINATE") {
      // Update attempt to TERMINATED
      await prisma.attempt.update({
        where: { id: attemptId },
        data: {
          violationCount: newCount,
          status: "TERMINATED",
          terminatedAt: new Date(),
        },
      });

      // Invalidate session
      await prisma.session.updateMany({
        where: {
          userId: auth.payload.userId,
          isActive: true,
        },
        data: { isActive: false },
      });

      newStatus = "TERMINATED";
      sessionTerminated = true;

    } else if (action === "AUTO_SUBMIT") {
      // Auto-submit the exam
      const savedAnswers = attempt.answers as Record<string, string>;

      // Calculate score
      const questions = await prisma.question.findMany({
        where: { examId: attempt.examId },
        select: { id: true, answer: true },
      });

      let correct = 0;
      for (const q of questions) {
        if (savedAnswers[q.id] === q.answer) correct++;
      }
      const score = questions.length > 0
        ? Math.round((correct / questions.length) * 100)
        : 0;

      await prisma.attempt.update({
        where: { id: attemptId },
        data: {
          violationCount: newCount,
          status: "SUBMITTED",
          submittedAt: new Date(),
          score,
        },
      });

      newStatus = "SUBMITTED";

    } else {
      // Just update the count
      await prisma.attempt.update({
        where: { id: attemptId },
        data: { violationCount: newCount },
      });
    }

    return NextResponse.json({
      logged: true,
      violationCount: newCount,
      maxViolations,
      action,
      newStatus,
      sessionTerminated,
    });

  } catch (error) {
    console.error("[VIOLATION LOG ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}