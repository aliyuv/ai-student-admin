"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function submitAppeal(formData: FormData) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) throw new Error("Unauthorized")

  const student = await prisma.student.findUnique({ where: { userId } })
  if (!student) throw new Error("Student not found")

  await prisma.appeal.create({
    data: {
      evaluationId: formData.get("evaluationId") as string,
      reason: formData.get("reason") as string,
    },
  })
  revalidatePath("/student/appeal")
}
