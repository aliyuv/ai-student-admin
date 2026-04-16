"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { evaluateStudent } from "@/lib/ai-evaluation"

async function requireTeacherOrAdmin() {
  const session = await auth()
  if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    throw new Error("无权限操作")
  }
  return session
}

export async function updateEvaluationStatus(id: string, status: "APPROVED" | "REJECTED") {
  await requireTeacherOrAdmin()
  await prisma.evaluation.update({ where: { id }, data: { status } })
  revalidatePath("/teacher/review")
}

export async function triggerEvaluation(formData: FormData) {
  await requireTeacherOrAdmin()
  const studentId = formData.get("studentId") as string
  const semester = formData.get("semester") as string

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

  if (!student) throw new Error("Student not found")

  const result = await evaluateStudent({
    name: student.user.name,
    scores: student.scores,
    activities: student.activities,
    awards: student.awards,
    attendances: student.attendances,
  })

  await prisma.evaluation.create({
    data: {
      studentId,
      semester,
      aiScore: result.aiScore,
      aiReport: JSON.stringify(result.aiReport),
      status: "PENDING",
    },
  })

  revalidatePath("/teacher/review")
}
