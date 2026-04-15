import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import AppealManagementClient from "./appeal-management-client"

export default async function AppealPage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect("/login")

  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: true,
      class: true
    }
  })

  if (!student) return <p>未找到学生信息</p>

  const [evaluations, appeals] = await Promise.all([
    prisma.evaluation.findMany({
      where: { studentId: student.id, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.appeal.findMany({
      where: { evaluation: { studentId: student.id } },
      include: { evaluation: true },
      orderBy: { createdAt: "desc" },
    })
  ])

  return (
    <AppealManagementClient
      student={student}
      evaluations={evaluations}
      appeals={appeals}
    />
  )
}
