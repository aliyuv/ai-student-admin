import { prisma } from "@/lib/prisma"
import StatsDashboardClient from "./stats-dashboard-client"

export default async function StatsPage() {
  // ── 并行查询所有原始数据 ───────────────────────────────────────────────────
  const [students, scores, activities, awards, attendances, evaluations, classes] =
    await Promise.all([
      prisma.student.findMany({
        include: { user: true, class: true } as const,
      }),
      prisma.score.findMany({
        include: { student: { include: { class: true } } } as const,
      }),
      prisma.activity.findMany({
        include: { student: { include: { user: true, class: true } } } as const,
      }),
      prisma.award.findMany({
        include: { student: { include: { user: true, class: true } } } as const,
      }),
      prisma.attendance.findMany({
        include: { student: { include: { class: true } } } as const,
      }),
      prisma.evaluation.findMany({
        include: { student: { include: { user: true, class: true } } } as const,
      }),
      prisma.class.findMany({
        include: { teacher: true, _count: { select: { students: true } } } as const,
      }),
    ] as const)

  // ── 服务端预处理：只传前端需要的摘要数据 ──────────────────────────────────

  // 1) 学期列表
  const semesters = Array.from(
    new Set([...scores.map((s) => s.semester), ...evaluations.map((e) => e.semester)])
  ).sort()

  // 2) 核心指标
  const approvedEvals = evaluations.filter((e) => e.status === "APPROVED")
  const overview = {
    totalStudents: students.length,
    totalClasses: classes.length,
    totalScoreRecords: scores.length,
    totalActivities: activities.length,
    totalEvaluations: approvedEvals.length,
    avgScore:
      scores.length > 0
        ? Math.round((scores.reduce((s, r) => s + r.score, 0) / scores.length) * 10) / 10
        : 0,
    avgEvalScore:
      approvedEvals.length > 0
        ? Math.round(
            (approvedEvals.reduce((s, e) => s + e.aiScore, 0) / approvedEvals.length) * 10
          ) / 10
        : 0,
    passRate:
      scores.length > 0
        ? Math.round((scores.filter((s) => s.score >= 60).length / scores.length) * 100)
        : 0,
  }

  // 3) 成绩分段分布
  const scoreDistribution = [
    { range: "90-100", label: "优秀", count: scores.filter((s) => s.score >= 90).length, color: "#52c41a" },
    { range: "80-89", label: "良好", count: scores.filter((s) => s.score >= 80 && s.score < 90).length, color: "#1890ff" },
    { range: "70-79", label: "中等", count: scores.filter((s) => s.score >= 70 && s.score < 80).length, color: "#faad14" },
    { range: "60-69", label: "合格", count: scores.filter((s) => s.score >= 60 && s.score < 70).length, color: "#fa8c16" },
    { range: "0-59", label: "不及格", count: scores.filter((s) => s.score < 60).length, color: "#f5222d" },
  ]

  // 4) 评测等级分布
  const evalDistribution = [
    { label: "优秀", count: approvedEvals.filter((e) => e.aiScore >= 90).length, color: "#52c41a" },
    { label: "良好", count: approvedEvals.filter((e) => e.aiScore >= 80 && e.aiScore < 90).length, color: "#1890ff" },
    { label: "中等", count: approvedEvals.filter((e) => e.aiScore >= 70 && e.aiScore < 80).length, color: "#faad14" },
    { label: "合格", count: approvedEvals.filter((e) => e.aiScore >= 60 && e.aiScore < 70).length, color: "#fa8c16" },
    { label: "待提升", count: approvedEvals.filter((e) => e.aiScore < 60).length, color: "#f5222d" },
  ]

  // 5) 各科成绩分析
  const subjectMap: Record<string, number[]> = {}
  scores.forEach((s) => {
    if (!subjectMap[s.subject]) subjectMap[s.subject] = []
    subjectMap[s.subject].push(s.score)
  })
  const subjectAnalysis = Object.entries(subjectMap)
    .map(([subject, arr]) => ({
      subject,
      avgScore: Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10,
      maxScore: Math.max(...arr),
      minScore: Math.min(...arr),
      passRate: Math.round((arr.filter((v) => v >= 60).length / arr.length) * 100),
      studentCount: arr.length,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)

  // 6) 班级排名
  const classRanking = classes
    .map((cls) => {
      const clsScores = scores.filter((s) => s.student?.classId === cls.id)
      const clsEvals = approvedEvals.filter((e) => e.student?.classId === cls.id)
      return {
        className: `${cls.grade} ${cls.name}`,
        teacherName: cls.teacher.name,
        studentCount: cls._count.students,
        avgScore:
          clsScores.length > 0
            ? Math.round((clsScores.reduce((s, r) => s + r.score, 0) / clsScores.length) * 10) / 10
            : 0,
        avgEvalScore:
          clsEvals.length > 0
            ? Math.round((clsEvals.reduce((s, e) => s + e.aiScore, 0) / clsEvals.length) * 10) / 10
            : 0,
        passRate:
          clsScores.length > 0
            ? Math.round((clsScores.filter((s) => s.score >= 60).length / clsScores.length) * 100)
            : 0,
      }
    })
    .sort((a, b) => b.avgScore - a.avgScore)

  // 7) 考勤统计
  const attCounts = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 }
  attendances.forEach((a) => {
    attCounts[a.status as keyof typeof attCounts]++
  })
  const totalAtt = Object.values(attCounts).reduce((s, v) => s + v, 0)
  const attendanceStats = {
    data: [
      { name: "正常出勤", value: attCounts.PRESENT, color: "#52c41a" },
      { name: "缺勤", value: attCounts.ABSENT, color: "#f5222d" },
      { name: "迟到", value: attCounts.LATE, color: "#faad14" },
      { name: "请假", value: attCounts.LEAVE, color: "#1890ff" },
    ].filter((d) => d.value > 0),
    rate: totalAtt > 0 ? Math.round(((attCounts.PRESENT + attCounts.LEAVE) / totalAtt) * 100) : 100,
    total: totalAtt,
  }

  // 8) 活动分析
  const activityStats = {
    clubCount: activities.filter((a) => a.type === "ACTIVITY").length,
    practiceCount: activities.filter((a) => a.type === "PRACTICE").length,
    avgScore:
      activities.length > 0
        ? Math.round((activities.reduce((s, a) => s + a.score, 0) / activities.length) * 10) / 10
        : 0,
    topStudents: (() => {
      const map: Record<string, { name: string; className: string; count: number; totalScore: number }> = {}
      activities.forEach((a) => {
        const sid = a.studentId
        if (!map[sid]) {
          map[sid] = { name: a.student.user.name, className: a.student.class.name, count: 0, totalScore: 0 }
        }
        map[sid].count++
        map[sid].totalScore += a.score
      })
      return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8)
    })(),
  }

  // 9) 奖惩统计
  const awardStats = {
    awards: awards.filter((a) => a.type === "AWARD").length,
    punishments: awards.filter((a) => a.type === "PUNISHMENT").length,
    levelDistribution: (() => {
      const map: Record<string, number> = {}
      awards
        .filter((a) => a.type === "AWARD")
        .forEach((a) => {
          map[a.level] = (map[a.level] || 0) + 1
        })
      return Object.entries(map).map(([level, count]) => ({ name: level, value: count }))
    })(),
  }

  // 10) 学期趋势（各学期平均分）
  const semesterTrend = semesters.map((sem) => {
    const semScores = scores.filter((s) => s.semester === sem)
    return {
      semester: sem,
      avgScore:
        semScores.length > 0
          ? Math.round((semScores.reduce((s, r) => s + r.score, 0) / semScores.length) * 10) / 10
          : 0,
      studentCount: new Set(semScores.map((s) => s.studentId)).size,
    }
  })

  return (
    <StatsDashboardClient
      overview={overview}
      scoreDistribution={scoreDistribution}
      evalDistribution={evalDistribution}
      subjectAnalysis={subjectAnalysis}
      classRanking={classRanking}
      attendanceStats={attendanceStats}
      activityStats={activityStats}
      awardStats={awardStats}
      semesterTrend={semesterTrend}
      semesters={semesters}
    />
  )
}
