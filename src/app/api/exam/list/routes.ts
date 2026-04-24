// src/app/api/exam/list/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await validateSession(req);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const exams = await prisma.exam.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        durationMins: true,
        _count: { select: { questions: true } },
        attempts: {
          where: { userId: auth.payload.userId },
          select: { id: true, status: true, score: true, startedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Shape data for frontend
    const shaped = exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      durationMins: exam.durationMins,
      questionCount: exam._count.questions,
      attempt: exam.attempts[0] ?? null,
    }));

    return NextResponse.json({ exams: shaped });
  } catch (error) {
    console.error("[EXAM LIST ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}