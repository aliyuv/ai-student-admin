"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { unlink } from "fs/promises"
import path from "path"

interface AttachmentInput {
  fileName: string
  filePath: string
  fileSize: number
  fileType: string
}

export async function submitAppeal(data: {
  evaluationId: string
  type: string
  reason: string
  description?: string
  expectation?: string
  attachments?: AttachmentInput[]
}) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) throw new Error("Unauthorized")

  const student = await prisma.student.findUnique({ where: { userId } })
  if (!student) throw new Error("Student not found")

  // 检查是否已对该评测提过申诉
  const existing = await prisma.appeal.findFirst({
    where: { evaluationId: data.evaluationId },
  })
  if (existing) throw new Error("该评测已存在申诉记录")

  // 检查评测是否属于该学生且状态为 APPROVED
  const evaluation = await prisma.evaluation.findFirst({
    where: { id: data.evaluationId, studentId: student.id, status: "APPROVED" },
  })
  if (!evaluation) throw new Error("评测记录不存在或不可申诉")

  await prisma.appeal.create({
    data: {
      evaluationId: data.evaluationId,
      type: data.type,
      reason: data.reason,
      description: data.description || null,
      expectation: data.expectation || null,
      attachments: data.attachments?.length
        ? {
            create: data.attachments.map((a) => ({
              fileName: a.fileName,
              filePath: a.filePath,
              fileSize: a.fileSize,
              fileType: a.fileType,
            })),
          }
        : undefined,
    },
  })

  revalidatePath("/student/appeal")
}

export async function deleteAppeal(appealId: string) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) throw new Error("Unauthorized")

  const student = await prisma.student.findUnique({ where: { userId } })
  if (!student) throw new Error("Student not found")

  // 只能撤回自己的、PENDING 状态的申诉
  const appeal = await prisma.appeal.findFirst({
    where: {
      id: appealId,
      status: "PENDING",
      evaluation: { studentId: student.id },
    },
    include: { attachments: true },
  })
  if (!appeal) throw new Error("申诉不存在或无法撤回")

  // 删除磁盘上的附件文件
  for (const att of appeal.attachments) {
    try {
      await unlink(path.join(process.cwd(), "public", att.filePath))
    } catch {
      // 文件可能已不存在，忽略
    }
  }

  // 级联删除（AppealAttachment 设置了 onDelete: Cascade）
  await prisma.appeal.delete({ where: { id: appealId } })

  revalidatePath("/student/appeal")
}
