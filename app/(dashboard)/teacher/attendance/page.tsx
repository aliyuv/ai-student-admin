import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import AttendanceManagementClient from "./attendance-management-client"

export default async function AttendancePage() {
  await connection()

  const [students, attendances] = await Promise.all([
    prisma.student.findMany({
      select: {
        id: true, studentNo: true,
        user: { select: { name: true } },
        class: { select: { name: true, grade: true } },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.attendance.findMany({
      select: {
        id: true, date: true, status: true, studentId: true,
        student: {
          select: {
            studentNo: true,
            user: { select: { name: true } },
            class: { select: { name: true, grade: true } },
          },
        },
      },
      orderBy: { date: "desc" },
      take: 200,
    }),
  ])

  return <AttendanceManagementClient students={students} attendances={attendances} />
}
