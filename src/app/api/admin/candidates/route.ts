// src/app/api/admin/candidates/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await validateSession(req);
  if (!auth.valid) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.payload.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const status = searchParams.get("status");

    const attempts = await prisma.attempt.findMany({
      where: {
        ...(examId ? { examId } : {}),
        ...(status  ? { status: status as never } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        exam: { select: { id: true, title: true, maxViolations: true } },
        _count: { select: { logs: true } },
      },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({ attempts });
  } catch (error) {
    console.error("[ADMIN CANDIDATES]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}