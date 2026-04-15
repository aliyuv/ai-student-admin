import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { evaluateStudent } from "@/lib/ai-evaluation"

export async function POST(req: NextRequest) {
  const { studentId, semester } = await req.json()

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      scores: { where: { semester } },
      activities: true,
      awards: true,
      attendances: true,
    },
  })

  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

  const result = await evaluateStudent({
    name: student.user.name,
    scores: student.scores,
    activities: student.activities,
    awards: student.awards,
    attendances: student.attendances,
  })

  const evaluation = await prisma.evaluation.create({
    data: {
      studentId,
      semester,
      aiScore: result.aiScore,
      aiReport: JSON.stringify(result.aiReport),
      status: "PENDING",
    },
  })

  return NextResponse.json(evaluation)
}
