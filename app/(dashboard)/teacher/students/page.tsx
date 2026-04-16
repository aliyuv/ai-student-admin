import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import { cacheLife } from "next/cache"
import StudentListClient from "./student-list-client"

// 聚合数据缓存 2 分钟——成绩/活动/考勤不需要每次切页都实时算
async function getStudentAggregations() {
  "use cache"
  cacheLife({ revalidate: 120 })

  const t0 = performance.now()
  const [scoreAgg, activityAgg, attendanceAgg] = await Promise.all([
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
  const t1 = performance.now()
  console.log(`[perf] /teacher/students aggregations: ${(t1-t0).toFixed(0)}ms`)

  return { scoreAgg, activityAgg, attendanceAgg }
}

export default async function TeacherStudentsPage() {
  const t0 = performance.now()
  await connection()
  const t1 = performance.now()

  // 学生列表和聚合并行加载，聚合走缓存
  const [students, { scoreAgg, activityAgg, attendanceAgg }] = await Promise.all([
    prisma.student.findMany({
      select: {
        id: true, studentNo: true,
        user: { select: { name: true, email: true } },
        class: { select: { name: true, grade: true, teacher: { select: { name: true } } } },
      },
      orderBy: { studentNo: "asc" },
    }),
    getStudentAggregations(),
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
  const t2 = performance.now()

  console.log(`[perf] /teacher/students — connection: ${(t1-t0).toFixed(0)}ms, query+transform: ${(t2-t1).toFixed(0)}ms, total: ${(t2-t0).toFixed(0)}ms, rows: ${students.length}`)

  return <StudentListClient students={studentsData} classNames={classNames} />
}
