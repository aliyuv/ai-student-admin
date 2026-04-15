import { prisma } from "@/lib/prisma"
import AttendanceManagementClient from "./attendance-management-client"

export default async function AttendancePage() {
  const [students, attendances] = await Promise.all([
    prisma.student.findMany({
      include: { user: true, class: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.attendance.findMany({
      include: { student: { include: { user: true, class: true } } },
      orderBy: { date: "desc" },
      take: 500,
    }),
  ])

  return <AttendanceManagementClient students={students} attendances={attendances} />
}
