"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function addScore(formData: FormData) {
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
  const result: ImportResult = { success: 0, failed: [] }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    // 校验数据
    if (!row.studentNo || !row.subject || !row.semester) {
      result.failed.push({
        row: i + 1,
        studentNo: row.studentNo || "",
        reason: "学号、科目或学期为空",
      })
      continue
    }

    if (isNaN(row.score) || row.score < 0 || row.score > 100) {
      result.failed.push({
        row: i + 1,
        studentNo: row.studentNo,
        reason: `成绩无效（${row.score}），必须在 0-100 之间`,
      })
      continue
    }

    // 通过学号查找学生
    const student = await prisma.student.findUnique({
      where: { studentNo: String(row.studentNo) },
    })

    if (!student) {
      result.failed.push({
        row: i + 1,
        studentNo: row.studentNo,
        reason: `学号 ${row.studentNo} 不存在`,
      })
      continue
    }

    try {
      await prisma.score.create({
        data: {
          studentId: student.id,
          subject: String(row.subject),
          score: Number(row.score),
          semester: String(row.semester),
        },
      })
      result.success++
    } catch (error) {
      result.failed.push({
        row: i + 1,
        studentNo: row.studentNo,
        reason: "数据库写入失败",
      })
    }
  }

  revalidatePath("/teacher/scores")
  return result
}
