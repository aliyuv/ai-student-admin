"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function addActivity(formData: FormData) {
  const session = await auth()
  if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    throw new Error("无权限操作")
  }

  await prisma.activity.create({
    data: {
      studentId: formData.get("studentId") as string,
      type: formData.get("type") as "ACTIVITY" | "PRACTICE",
      title: formData.get("title") as string,
      score: parseFloat(formData.get("score") as string),
      date: new Date(formData.get("date") as string),
    },
  })
  revalidatePath("/teacher/activities")
}

export async function updateActivity(id: string, formData: FormData) {
  const session = await auth()
  if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    throw new Error("无权限操作")
  }

  await prisma.activity.update({
    where: { id },
    data: {
      studentId: formData.get("studentId") as string,
      type: formData.get("type") as "ACTIVITY" | "PRACTICE",
      title: formData.get("title") as string,
      score: parseFloat(formData.get("score") as string),
      date: new Date(formData.get("date") as string),
    },
  })
  revalidatePath("/teacher/activities")
}

export async function deleteActivity(id: string) {
  const session = await auth()
  if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    throw new Error("无权限操作")
  }

  await prisma.activity.delete({ where: { id } })
  revalidatePath("/teacher/activities")
}
