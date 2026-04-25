// src/app/api/exam/attempt/[attemptId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  const auth = await validateSession(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const attempt = await prisma.attempt.findFirst({
      where: {
        id: params.attemptId,
        userId: auth.payload.userId,
      },
      include: {
        exam: {
          include: {
            questions: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                text: true,
                options: true,
                order: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }

    // Calculate time remaining
    const elapsed = Math.floor(
      (Date.now() - new Date(attempt.startedAt).getTime()) / 1000
    );
    const totalSeconds    = attempt.exam.durationMins * 60;
    const timeRemainingS  = Math.max(0, totalSeconds - elapsed);

    return NextResponse.json({
      attempt: {
        id:             attempt.id,
        examId:         attempt.examId,
        status:         attempt.status,
        answers:        attempt.answers,
        violationCount: attempt.violationCount,
        startedAt:      attempt.startedAt,
        timeRemainingS,
      },
      questions: attempt.exam.questions,
      exam: {
        title:        attempt.exam.title,
        durationMins: attempt.exam.durationMins,
      },
    });
  } catch (error) {
    console.error("[ATTEMPT FETCH ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}