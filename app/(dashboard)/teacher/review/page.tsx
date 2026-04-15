import { prisma } from "@/lib/prisma"
import ReviewManagementClient from "./review-management-client"

export default async function ReviewPage() {
  const [students, evaluations] = await Promise.all([
    prisma.student.findMany({
      include: { user: true, class: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.evaluation.findMany({
      include: { student: { include: { user: true, class: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // 获取可用学期
  const currentYear = new Date().getFullYear()
  const semesters = [
    `${currentYear}-1`, `${currentYear}-2`,
    `${currentYear - 1}-1`, `${currentYear - 1}-2`,
  ]

  return (
    <ReviewManagementClient
      students={students}
      evaluations={evaluations}
      semesters={semesters}
    />
  )
}
