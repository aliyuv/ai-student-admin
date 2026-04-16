import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import { redirect } from "next/navigation"
import AppealManagementClient from "./appeal-management-client"

export default async function AppealPage() {
  await connection()

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect("/login")

  // 先查学生，再用 studentId 直接查评测和申诉（避免嵌套关系子查询）
  const student = await prisma.student.findUnique({
    where: { userId },
    select: {
      id: true, studentNo: true,
      user: { select: { name: true, email: true } },
      class: { select: { name: true, grade: true } },
    },
  })

  if (!student) return <p>未找到学生信息</p>

  const [evaluations, appeals] = await Promise.all([
    prisma.evaluation.findMany({
      where: { studentId: student.id, status: "APPROVED" },
      select: {
        id: true, semester: true, aiScore: true, aiReport: true,
        status: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.appeal.findMany({
      where: { evaluation: { studentId: student.id } },
      select: {
        id: true, reason: true, status: true, reply: true,
        createdAt: true,
        evaluation: {
          select: { id: true, semester: true, aiScore: true, aiReport: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return (
    <AppealManagementClient
      student={student}
      evaluations={evaluations}
      appeals={appeals}
    />
  )
}
