// prisma/seed.ts

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
});

async function main() {
  console.log("🌱 Seeding database...");

  // ── Super Admin ──────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@exam.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@exam.com",
      passwordHash: await bcrypt.hash("Admin@123", 10),
      role: "SUPER_ADMIN",
    },
  });

  // ── Admin ────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@exam.com" },
    update: {},
    create: {
      name: "Exam Admin",
      email: "admin@exam.com",
      passwordHash: await bcrypt.hash("Admin@123", 10),
      role: "ADMIN",
    },
  });

  // ── Student ──────────────────────────────
  const student = await prisma.user.upsert({
    where: { email: "student@exam.com" },
    update: {},
    create: {
      name: "Test Student",
      email: "student@exam.com",
      passwordHash: await bcrypt.hash("Student@123", 10),
      role: "STUDENT",
    },
  });

  // ── Sample Exam ──────────────────────────
  const exam = await prisma.exam.upsert({
    where: { id: "sample-exam-001" },
    update: {},
    create: {
      id: "sample-exam-001",
      title: "General Knowledge Test",
      description: "A sample exam to test the system",
      durationMins: 30,
      maxViolations: 5,
      isActive: true,
      createdBy: admin.id,
    },
  });

  // ── Sample Questions ─────────────────────
  const questions = [
    {
      text: "What is the capital of France?",
      options: ["Berlin", "Madrid", "Paris", "Rome"],
      answer: "Paris",
      order: 1,
    },
    {
      text: "Which planet is known as the Red Planet?",
      options: ["Earth", "Mars", "Jupiter", "Venus"],
      answer: "Mars",
      order: 2,
    },
    {
      text: "What is 15 × 8?",
      options: ["100", "110", "120", "130"],
      answer: "120",
      order: 3,
    },
    {
      text: "Who wrote 'Romeo and Juliet'?",
      options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
      answer: "William Shakespeare",
      order: 4,
    },
    {
      text: "What is the chemical symbol for water?",
      options: ["O2", "CO2", "H2O", "NaCl"],
      answer: "H2O",
      order: 5,
    },
  ];

  for (const q of questions) {
    await prisma.question.create({
      data: {
        examId: exam.id,
        text: q.text,
        options: q.options,
        answer: q.answer,
        order: q.order,
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log(`   SuperAdmin → superadmin@exam.com / Admin@123`);
  console.log(`   Admin      → admin@exam.com / Admin@123`);
  console.log(`   Student    → student@exam.com / Student@123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });