import { prisma } from "@/lib/prisma"
import StudentListClient from "./student-list-client"

export default async function TeacherStudentsPage() {
  const students = await prisma.student.findMany({
    include: {
      user: true,
      class: {
        include: { teacher: true }
      },
      scores: { orderBy: { createdAt: "desc" }, take: 10 },
      activities: true,
      attendances: { orderBy: { date: "desc" }, take: 30 },
    },
    orderBy: { studentNo: "asc" },
  })

  // 预处理统计数据
  const studentsData = students.map(s => {
    const avgScore = s.scores.length > 0
      ? Math.round((s.scores.reduce((sum, sc) => sum + sc.score, 0) / s.scores.length) * 10) / 10
      : 0
    const attendanceRate = s.attendances.length > 0
      ? Math.round(
          (s.attendances.filter(a => a.status === "PRESENT" || a.status === "LEAVE").length / s.attendances.length) * 100
        )
      : 100

    return {
      id: s.id,
      studentNo: s.studentNo,
      name: s.user.name,
      email: s.user.email,
      className: s.class.name,
      grade: s.class.grade,
      teacherName: s.class.teacher.name,
      avgScore,
      activityCount: s.activities.length,
      attendanceRate,
    }
  })

  const classNames = Array.from(new Set(studentsData.map(s => s.className)))

  return (
    <StudentListClient
      students={studentsData}
      classNames={classNames}
    />
  )
}
