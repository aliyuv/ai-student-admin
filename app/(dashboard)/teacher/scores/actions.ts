"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

async function requireTeacherOrAdmin() {
  const session = await auth()
  if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    throw new Error("无权限操作")
  }
  return session
}

export async function addScore(formData: FormData) {
  await requireTeacherOrAdmin()
  await prisma.score.create({
    data: {
      studentId: formData.get("studentId") as string,
      subject: formData.get("subject") as string,
      score: parseFloat(formData.get("score") as string),
      semester: formData.get("semester") as string,
    },
  })
  revalidatePath("/teacher/scores")
}

export async function updateScore(
  scoreId: string,
  data: { subject: string; score: number; semester: string }
) {
  await requireTeacherOrAdmin()
  await prisma.score.update({
    where: { id: scoreId },
    data: {
      subject: data.subject,
      score: data.score,
      semester: data.semester,
    },
  })
  revalidatePath("/teacher/scores")
}

export async function deleteScore(scoreId: string) {
  await requireTeacherOrAdmin()
  await prisma.score.delete({
    where: { id: scoreId },
  })
  revalidatePath("/teacher/scores")
}

interface ImportScoreRow {
  studentNo: string
  subject: string
  score: number
  semester: string
}

interface ImportResult {
  success: number
  failed: { row: number; studentNo: string; reason: string }[]
}

export async function batchImportScores(
  rows: ImportScoreRow[]
): Promise<ImportResult> {
  await requireTeacherOrAdmin()
  const result: ImportResult = { success: 0, failed: [] }

  // 一次性查询所有学号对应的学生，避免 N+1
  const studentNos = [...new Set(rows.map(r => String(r.studentNo)).filter(Boolean))]
  const students = await prisma.student.findMany({
    where: { studentNo: { in: studentNos } },
    select: { id: true, studentNo: true },
  })
  const studentMap = Object.fromEntries(students.map(s => [s.studentNo, s.id]))

  const toCreate: { studentId: string; subject: string; score: number; semester: string }[] = []

  // 查询已有成绩记录，用于去重（studentId + subject + semester）
  const studentIds = Object.values(studentMap)
  const existingScores = studentIds.length > 0
    ? await prisma.score.findMany({
        where: { studentId: { in: studentIds } },
        select: { studentId: true, subject: true, semester: true },
      })
    : []
  const existingSet = new Set(
    existingScores.map(s => `${s.studentId}|${s.subject}|${s.semester}`)
  )

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    if (!row.studentNo || !row.subject || !row.semester) {
      result.failed.push({ row: i + 1, studentNo: row.studentNo || "", reason: "学号、科目或学期为空" })
      continue
    }

    if (isNaN(row.score) || row.score < 0 || row.score > 100) {
      result.failed.push({ row: i + 1, studentNo: row.studentNo, reason: `成绩无效（${row.score}），必须在 0-100 之间` })
      continue
    }

    const studentId = studentMap[String(row.studentNo)]
    if (!studentId) {
      result.failed.push({ row: i + 1, studentNo: row.studentNo, reason: `学号 ${row.studentNo} 不存在` })
      continue
    }

    const dedupeKey = `${studentId}|${String(row.subject)}|${String(row.semester)}`
    if (existingSet.has(dedupeKey)) {
      result.failed.push({ row: i + 1, studentNo: row.studentNo, reason: `${row.subject}（${row.semester}）成绩已存在` })
      continue
    }
    // 同时防止本批次内重复
    existingSet.add(dedupeKey)

    toCreate.push({
      studentId,
      subject: String(row.subject),
      score: Number(row.score),
      semester: String(row.semester),
    })
  }

  if (toCreate.length > 0) {
    const created = await prisma.score.createMany({ data: toCreate })
    result.success = created.count
  }

  revalidatePath("/teacher/scores")
  return result
}
