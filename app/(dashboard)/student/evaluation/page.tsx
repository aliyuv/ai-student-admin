import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import StudentEvaluationClient from "./student-evaluation-client"

export default async function StudentEvaluationPage() {
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

  const evaluations = await prisma.evaluation.findMany({
    where: { studentId: student.id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  })

  return <StudentEvaluationClient student={student} evaluations={evaluations} />
}
