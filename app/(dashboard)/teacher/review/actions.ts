"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateEvaluationStatus(id: string, status: "APPROVED" | "REJECTED") {
  await prisma.evaluation.update({ where: { id }, data: { status } })
  revalidatePath("/teacher/review")
}

export async function triggerEvaluation(formData: FormData) {
  const res = await fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/ai/evaluation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: formData.get("studentId"),
      semester: formData.get("semester"),
    }),
  })
  if (!res.ok) throw new Error("Evaluation failed")
  revalidatePath("/teacher/review")
}
