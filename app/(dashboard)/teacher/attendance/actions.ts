"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function addAttendance(formData: FormData) {
  await prisma.attendance.create({
    data: {
      studentId: formData.get("studentId") as string,
      date: new Date(formData.get("date") as string),
      status: formData.get("status") as "PRESENT" | "ABSENT" | "LATE" | "LEAVE",
    },
  })
  revalidatePath("/teacher/attendance")
}
