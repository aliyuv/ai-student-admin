import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import ReviewManagementClient from "./review-management-client"

export default async function ReviewPage() {
  await connection()

  const [students, evaluations, scoreSemesters] = await Promise.all([
    prisma.student.findMany({
      select: {
        id: true, studentNo: true,
        user: { select: { name: true } },
        class: { select: { name: true, grade: true } },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.evaluation.findMany({
      select: {
        id: true, semester: true, aiScore: true, aiReport: true,
        status: true, createdAt: true, studentId: true,
        student: {
          select: {
            studentNo: true,
            user: { select: { name: true } },
            class: { select: { name: true, grade: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.score.findMany({
      distinct: ["semester"],
      select: { semester: true },
      orderBy: { semester: "desc" },
    }),
  ])

  const semesters = scoreSemesters.map(({ semester }) => semester)

  return (
    <ReviewManagementClient
      students={students}
      evaluations={evaluations}
      semesters={semesters}
    />
  )
}
