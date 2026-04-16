import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import { redirect } from "next/navigation"
import StudentProfileClient from "./student-profile-client"

export default async function StudentProfilePage() {
  await connection()

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect("/login")

  const student = await prisma.student.findUnique({
    where: { userId },
    include: { user: true, class: { include: { teacher: true } } },
  })

  if (!student) return <p>未找到学生信息</p>

  return (
    <StudentProfileClient
      student={{
        name: student.user.name,
        email: student.user.email,
        studentNo: student.studentNo,
        className: student.class.name,
        grade: student.class.grade,
        teacherName: student.class.teacher.name,
      }}
    />
  )
}
