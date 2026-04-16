import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import StatsDashboardClient from "./stats-dashboard-client"
import { cacheLife } from "next/cache"

// 缓存 3 分钟，统计数据不需要实时
async function getStatsData() {
  "use cache"
  cacheLife({ revalidate: 180 })
  // ── 第 1 批：基础计数 + 成绩/评测聚合（6 个查询） ────────────────────────────
  const [
    totalStudents,
    totalClasses,
    scoreAgg,
    evalAgg,
    scoreDistRaw,
    evalDistRaw,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.class.count(),

    prisma.$queryRaw<[{ cnt: bigint; avg_score: number; pass_cnt: bigint }]>`
      SELECT COUNT(*) as cnt,
             COALESCE(AVG(score), 0) as avg_score,
             COUNT(*) FILTER (WHERE score >= 60) as pass_cnt
      FROM "Score"`,

    prisma.$queryRaw<[{ cnt: bigint; avg_score: number }]>`
      SELECT COUNT(*) as cnt, COALESCE(AVG("aiScore"), 0) as avg_score
      FROM "Evaluation" WHERE status = 'APPROVED'`,

    prisma.$queryRaw<{ range_label: string; cnt: bigint }[]>`
      SELECT CASE
        WHEN score >= 90 THEN '优秀'
        WHEN score >= 80 THEN '良好'
        WHEN score >= 70 THEN '中等'
        WHEN score >= 60 THEN '合格'
        ELSE '不及格'
      END as range_label, COUNT(*) as cnt
      FROM "Score" GROUP BY range_label`,

    prisma.$queryRaw<{ range_label: string; cnt: bigint }[]>`
      SELECT CASE
        WHEN "aiScore" >= 90 THEN '优秀'
        WHEN "aiScore" >= 80 THEN '良好'
        WHEN "aiScore" >= 70 THEN '中等'
        WHEN "aiScore" >= 60 THEN '合格'
        ELSE '待提升'
      END as range_label, COUNT(*) as cnt
      FROM "Evaluation" WHERE status = 'APPROVED' GROUP BY range_label`,
  ])

  // ── 第 2 批：学科/班级/考勤/活动/奖惩（6 个查询） ────────────────────────────
  const [
    subjectAggRaw,
    classesWithTeacher,
    attAgg,
    activityAgg,
    awardAgg,
    semesterAggRaw,
  ] = await Promise.all([
    prisma.$queryRaw<{ subject: string; avg_score: number; max_score: number; min_score: number; pass_cnt: bigint; cnt: bigint }[]>`
      SELECT subject,
             AVG(score) as avg_score, MAX(score) as max_score, MIN(score) as min_score,
             COUNT(*) FILTER (WHERE score >= 60) as pass_cnt, COUNT(*) as cnt
      FROM "Score" GROUP BY subject ORDER BY avg_score DESC`,

    prisma.class.findMany({
      include: { teacher: { select: { name: true } }, _count: { select: { students: true } } },
    }),

    prisma.$queryRaw<{ status: string; cnt: bigint }[]>`
      SELECT status, COUNT(*) as cnt FROM "Attendance" GROUP BY status`,

    prisma.$queryRaw<[{ club_cnt: bigint; practice_cnt: bigint; avg_score: number }]>`
      SELECT COUNT(*) FILTER (WHERE type = 'ACTIVITY') as club_cnt,
             COUNT(*) FILTER (WHERE type = 'PRACTICE') as practice_cnt,
             COALESCE(AVG(score), 0) as avg_score
      FROM "Activity"`,

    prisma.$queryRaw<[{ award_cnt: bigint; punish_cnt: bigint }]>`
      SELECT COUNT(*) FILTER (WHERE type = 'AWARD') as award_cnt,
             COUNT(*) FILTER (WHERE type = 'PUNISHMENT') as punish_cnt
      FROM "Award"`,

    prisma.$queryRaw<{ semester: string; avg_score: number; student_cnt: bigint }[]>`
      SELECT semester, AVG(score) as avg_score, COUNT(DISTINCT "studentId") as student_cnt
      FROM "Score" GROUP BY semester ORDER BY semester`,
  ])

  // ── 第 3 批：排行榜 + 班级维度聚合（4 个查询） ───────────────────────────────
  const [
    topStudentsRaw,
    awardLevelRaw,
    classScoreAgg,
    classEvalAgg,
  ] = await Promise.all([
    prisma.$queryRaw<{ student_id: string; name: string; class_name: string; cnt: bigint; total_score: number }[]>`
      SELECT a."studentId" as student_id, u.name, c.name as class_name,
             COUNT(*) as cnt, SUM(a.score) as total_score
      FROM "Activity" a
      JOIN "Student" s ON s.id = a."studentId"
      JOIN "User" u ON u.id = s."userId"
      JOIN "Class" c ON c.id = s."classId"
      GROUP BY a."studentId", u.name, c.name
      ORDER BY cnt DESC LIMIT 8`,

    prisma.$queryRaw<{ level: string; cnt: bigint }[]>`
      SELECT level, COUNT(*) as cnt FROM "Award" WHERE type = 'AWARD' GROUP BY level`,

    prisma.$queryRaw<{ class_id: string; avg_score: number; pass_cnt: bigint; cnt: bigint }[]>`
      SELECT s."classId" as class_id, AVG(sc.score) as avg_score,
             COUNT(*) FILTER (WHERE sc.score >= 60) as pass_cnt, COUNT(*) as cnt
      FROM "Score" sc JOIN "Student" s ON s.id = sc."studentId"
      GROUP BY s."classId"`,

    prisma.$queryRaw<{ class_id: string; avg_score: number }[]>`
      SELECT s."classId" as class_id, AVG(e."aiScore") as avg_score
      FROM "Evaluation" e JOIN "Student" s ON s.id = e."studentId"
      WHERE e.status = 'APPROVED'
      GROUP BY s."classId"`,
  ])

  // ── 组装前端数据 ──────────────────────────────────────────────────────────────

  const sa = scoreAgg[0]
  const ea = evalAgg[0]
  const totalScoreRecords = Number(sa.cnt)
  const totalEvaluations = Number(ea.cnt)

  const overview = {
    totalStudents,
    totalClasses,
    totalScoreRecords,
    totalActivities: Number(activityAgg[0].club_cnt) + Number(activityAgg[0].practice_cnt),
    totalEvaluations,
    avgScore: totalScoreRecords > 0 ? Math.round(sa.avg_score * 10) / 10 : 0,
    avgEvalScore: totalEvaluations > 0 ? Math.round(ea.avg_score * 10) / 10 : 0,
    passRate: totalScoreRecords > 0 ? Math.round((Number(sa.pass_cnt) / totalScoreRecords) * 100) : 0,
  }

  const scoreColorMap: Record<string, { range: string; color: string; order: number }> = {
    "优秀": { range: "90-100", color: "#52c41a", order: 0 },
    "良好": { range: "80-89", color: "#1890ff", order: 1 },
    "中等": { range: "70-79", color: "#faad14", order: 2 },
    "合格": { range: "60-69", color: "#fa8c16", order: 3 },
    "不及格": { range: "0-59", color: "#f5222d", order: 4 },
  }
  const scoreDistribution = Object.entries(scoreColorMap).map(([label, meta]) => {
    const found = scoreDistRaw.find(r => r.range_label === label)
    return { range: meta.range, label, count: found ? Number(found.cnt) : 0, color: meta.color }
  }).sort((a, b) => scoreColorMap[a.label].order - scoreColorMap[b.label].order)

  const evalColorMap: Record<string, { color: string; order: number }> = {
    "优秀": { color: "#52c41a", order: 0 },
    "良好": { color: "#1890ff", order: 1 },
    "中等": { color: "#faad14", order: 2 },
    "合格": { color: "#fa8c16", order: 3 },
    "待提升": { color: "#f5222d", order: 4 },
  }
  const evalDistribution = Object.entries(evalColorMap).map(([label, meta]) => {
    const found = evalDistRaw.find(r => r.range_label === label)
    return { label, count: found ? Number(found.cnt) : 0, color: meta.color }
  }).sort((a, b) => evalColorMap[a.label].order - evalColorMap[b.label].order)

  const subjectAnalysis = subjectAggRaw.map(s => ({
    subject: s.subject,
    avgScore: Math.round(s.avg_score * 10) / 10,
    maxScore: s.max_score,
    minScore: s.min_score,
    passRate: Number(s.cnt) > 0 ? Math.round((Number(s.pass_cnt) / Number(s.cnt)) * 100) : 0,
    studentCount: Number(s.cnt),
  }))

  const classScoreMap = Object.fromEntries(classScoreAgg.map(r => [r.class_id, r]))
  const classEvalMap = Object.fromEntries(classEvalAgg.map(r => [r.class_id, r]))

  const classRanking = classesWithTeacher
    .map(cls => {
      const cs = classScoreMap[cls.id]
      const ce = classEvalMap[cls.id]
      return {
        className: `${cls.grade} ${cls.name}`,
        teacherName: cls.teacher.name,
        studentCount: cls._count.students,
        avgScore: cs ? Math.round(cs.avg_score * 10) / 10 : 0,
        avgEvalScore: ce ? Math.round(ce.avg_score * 10) / 10 : 0,
        passRate: cs && Number(cs.cnt) > 0 ? Math.round((Number(cs.pass_cnt) / Number(cs.cnt)) * 100) : 0,
      }
    })
    .sort((a, b) => b.avgScore - a.avgScore)

  const attCounts: Record<string, number> = {}
  attAgg.forEach(r => { attCounts[r.status] = Number(r.cnt) })
  const totalAtt = Object.values(attCounts).reduce((s, v) => s + v, 0)
  const attendanceStats = {
    data: [
      { name: "正常出勤", value: attCounts["PRESENT"] || 0, color: "#52c41a" },
      { name: "缺勤", value: attCounts["ABSENT"] || 0, color: "#f5222d" },
      { name: "迟到", value: attCounts["LATE"] || 0, color: "#faad14" },
      { name: "请假", value: attCounts["LEAVE"] || 0, color: "#1890ff" },
    ].filter(d => d.value > 0),
    rate: totalAtt > 0 ? Math.round(((attCounts["PRESENT"] || 0) + (attCounts["LEAVE"] || 0)) / totalAtt * 100) : 100,
    total: totalAtt,
  }

  const aa = activityAgg[0]
  const activityStats = {
    clubCount: Number(aa.club_cnt),
    practiceCount: Number(aa.practice_cnt),
    avgScore: Math.round(aa.avg_score * 10) / 10,
    topStudents: topStudentsRaw.map(r => ({
      name: r.name,
      className: r.class_name,
      count: Number(r.cnt),
      totalScore: r.total_score,
    })),
  }

  const aw = awardAgg[0]
  const awardStats = {
    awards: Number(aw.award_cnt),
    punishments: Number(aw.punish_cnt),
    levelDistribution: awardLevelRaw.map(r => ({ name: r.level, value: Number(r.cnt) })),
  }

  const semesters = semesterAggRaw.map(r => r.semester)
  const semesterTrend = semesterAggRaw.map(r => ({
    semester: r.semester,
    avgScore: Math.round(r.avg_score * 10) / 10,
    studentCount: Number(r.student_cnt),
  }))

  return {
    overview, scoreDistribution, evalDistribution, subjectAnalysis,
    classRanking, attendanceStats, activityStats, awardStats,
    semesterTrend, semesters,
  }
}

export default async function StatsPage() {
  await connection()

  const data = await getStatsData()

  return (
    <StatsDashboardClient
      overview={data.overview}
      scoreDistribution={data.scoreDistribution}
      evalDistribution={data.evalDistribution}
      subjectAnalysis={data.subjectAnalysis}
      classRanking={data.classRanking}
      attendanceStats={data.attendanceStats}
      activityStats={data.activityStats}
      awardStats={data.awardStats}
      semesterTrend={data.semesterTrend}
      semesters={data.semesters}
    />
  )
}
