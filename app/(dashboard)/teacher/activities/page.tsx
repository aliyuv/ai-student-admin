import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import ActivityManagementClient from "./activity-management-client"

export default async function ActivitiesPage() {
  await connection()

  const [students, activities] = await Promise.all([
    prisma.student.findMany({
      select: {
        id: true, studentNo: true,
        user: { select: { name: true } },
        class: { select: { name: true, grade: true } },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.activity.findMany({
      select: {
        id: true, type: true, title: true,
        date: true, score: true, studentId: true, createdAt: true,
        student: {
          select: {
            studentNo: true,
            user: { select: { name: true } },
            class: { select: { name: true, grade: true } },
          },
        },
      },
      orderBy: { date: "desc" },
      take: 500,
    }),
  ])

  return <ActivityManagementClient students={students} activities={activities} />
}
