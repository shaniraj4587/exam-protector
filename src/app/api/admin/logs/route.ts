// src/app/api/admin/logs/route.ts

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
    const attemptId = searchParams.get("attemptId");
    const page      = Number(searchParams.get("page")  || 1);
    const limit     = Number(searchParams.get("limit") || 50);

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where: attemptId ? { attemptId } : {},
        include: {
          attempt: {
            select: {
              id: true,
              user: { select: { name: true, email: true } },
              exam: { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip:  (page - 1) * limit,
        take:  limit,
      }),
      prisma.log.count({ where: attemptId ? { attemptId } : {} }),
    ]);

    return NextResponse.json({ logs, total, page, limit });
  } catch (error) {
    console.error("[ADMIN LOGS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}