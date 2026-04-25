// src/app/api/admin/exams/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

// ── GET: List all exams ──────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await validateSession(req);
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.payload.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const exams = await prisma.exam.findMany({
      include: {
        _count: {
          select: { questions: true, attempts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ exams });
  } catch (error) {
    console.error("[ADMIN EXAMS GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST: Create exam ────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await validateSession(req);
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.payload.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { title, description, durationMins, maxViolations, questions } =
      await req.json();

    if (!title || !durationMins || !questions?.length) {
      return NextResponse.json(
        { error: "title, durationMins and questions are required" },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        durationMins: Number(durationMins),
        maxViolations: Number(maxViolations) || 5,
        isActive: false,
        createdBy: auth.payload.userId,
        questions: {
          create: questions.map(
            (
              q: { text: string; options: string[]; answer: string },
              i: number
            ) => ({
              text: q.text,
              options: q.options,
              answer: q.answer,
              order: i + 1,
            })
          ),
        },
      },
      include: { _count: { select: { questions: true } } },
    });

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN EXAM CREATE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH: Toggle exam active state ──────────────────────
export async function PATCH(req: NextRequest) {
  const auth = await validateSession(req);
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.payload.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { examId, isActive } = await req.json();
    const exam = await prisma.exam.update({
      where: { id: examId },
      data: { isActive },
    });
    return NextResponse.json({ exam });
  } catch (error) {
    console.error("[ADMIN EXAM PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}