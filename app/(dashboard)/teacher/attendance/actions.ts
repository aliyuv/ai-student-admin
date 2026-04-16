"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function addAttendance(formData: FormData) {
  const session = await auth()
  if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
    throw new Error("无权限操作")
  }

  await prisma.attendance.create({
    data: {
      studentId: formData.get("studentId") as string,
      date: new Date(formData.get("date") as string),
      status: formData.get("status") as "PRESENT" | "ABSENT" | "LATE" | "LEAVE",
    },
  })
  revalidatePath("/teacher/attendance")
}
