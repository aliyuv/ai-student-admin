import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import StudentListClient from "./student-list-client"

export default async function TeacherStudentsPage() {
  await connection()

  const [students, scoreAgg, activityAgg, attendanceAgg] = await Promise.all([
    prisma.student.findMany({
      select: {
        id: true, studentNo: true,
        user: { select: { name: true, email: true } },
        class: { select: { name: true, grade: true, teacher: { select: { name: true } } } },
      },
      orderBy: { studentNo: "asc" },
    }),
    prisma.$queryRaw<{ student_id: string; avg_score: number }[]>`
      SELECT "studentId" as student_id, AVG(score) as avg_score
      FROM (
        SELECT "studentId", score, ROW_NUMBER() OVER (PARTITION BY "studentId" ORDER BY "createdAt" DESC) as rn
        FROM "Score"
      ) t WHERE rn <= 10
      GROUP BY "studentId"`,
    prisma.$queryRaw<{ student_id: string; cnt: bigint }[]>`
      SELECT "studentId" as student_id, COUNT(*) as cnt FROM "Activity" GROUP BY "studentId"`,
    prisma.$queryRaw<{ student_id: string; total: bigint; present: bigint }[]>`
      SELECT "studentId" as student_id, COUNT(*) as total,
             COUNT(*) FILTER (WHERE status IN ('PRESENT', 'LEAVE')) as present
      FROM (
        SELECT "studentId", status, ROW_NUMBER() OVER (PARTITION BY "studentId" ORDER BY date DESC) as rn
        FROM "Attendance"
      ) t WHERE rn <= 30
      GROUP BY "studentId"`,
  ])

  const scoreMap = Object.fromEntries(scoreAgg.map(r => [r.student_id, r.avg_score]))
  const activityMap = Object.fromEntries(activityAgg.map(r => [r.student_id, Number(r.cnt)]))
  const attMap = Object.fromEntries(attendanceAgg.map(r => [r.student_id, { total: Number(r.total), present: Number(r.present) }]))

  const studentsData = students.map(s => ({
    id: s.id,
    studentNo: s.studentNo,
    name: s.user.name,
    email: s.user.email,
    className: s.class.name,
    grade: s.class.grade,
    teacherName: s.class.teacher.name,
    avgScore: scoreMap[s.id] ? Math.round(scoreMap[s.id] * 10) / 10 : 0,
    activityCount: activityMap[s.id] || 0,
    attendanceRate: attMap[s.id] ? Math.round((attMap[s.id].present / attMap[s.id].total) * 100) : 100,
  }))

  const classNames = Array.from(new Set(studentsData.map(s => s.className)))

  return <StudentListClient students={studentsData} classNames={classNames} />
}
