// 评分等级映射
export const GRADE_MAP = [
  { min: 90, label: "优秀", color: "#52c41a", description: "表现出色，各方面均达到优秀标准" },
  { min: 80, label: "良好", color: "#1890ff", description: "表现良好，大部分方面达到预期" },
  { min: 70, label: "中等", color: "#faad14", description: "表现一般，有待进一步提升" },
  { min: 60, label: "合格", color: "#fa8c16", description: "达到基本要求，需要努力改进" },
  { min: 0, label: "待提升", color: "#f5222d", description: "表现不佳，需要重点关注和帮助" }
]

export function getGrade(score: number): string {
  return GRADE_MAP.find((g) => score >= g.min)?.label ?? "待提升"
}

export function getGradeInfo(score: number) {
  return GRADE_MAP.find((g) => score >= g.min) ?? GRADE_MAP[GRADE_MAP.length - 1]
}

// 学业成绩计算（支持加权平均）
export function calcAcademicScore(
  scores: { score: number; subject: string; weight?: number }[],
  options?: { includeFailures?: boolean; weightedAverage?: boolean }
): number {
  if (!scores.length) return 60

  const { includeFailures = true, weightedAverage = false } = options || {}

  // 过滤不及格成绩（如果设置）
  const validScores = includeFailures ? scores : scores.filter(s => s.score >= 60)

  if (!validScores.length) return 60

  if (weightedAverage && validScores.some(s => s.weight)) {
    // 加权平均
    const totalWeight = validScores.reduce((sum, s) => sum + (s.weight || 1), 0)
    const weightedSum = validScores.reduce((sum, s) => sum + s.score * (s.weight || 1), 0)
    return Math.round((weightedSum / totalWeight) * 10) / 10
  } else {
    // 简单平均
    return Math.round((validScores.reduce((sum, s) => sum + s.score, 0) / validScores.length) * 10) / 10
  }
}

// 活动实践计算（更细致的评分规则）
export function calcActivityScore(
  activities: { score: number; type: string; date: Date }[],
  options?: { timeDecay?: boolean; typeBonus?: boolean }
): number {
  if (!activities.length) return 60

  const { timeDecay = false, typeBonus = true } = options || {}
  const baseScore = 60
  let totalScore = 0
  let maxPossibleScore = 40 // 最大增长分数

  activities.forEach(activity => {
    let activityScore = activity.score

    // 类型加成
    if (typeBonus) {
      if (activity.type === 'PRACTICE') {
        activityScore *= 1.2 // 实践项目加成
      }
    }

    // 时间衰减（距离现在越远，权重越小）
    if (timeDecay) {
      const monthsAgo = (Date.now() - activity.date.getTime()) / (1000 * 60 * 60 * 24 * 30)
      const decayFactor = Math.max(0.5, 1 - monthsAgo * 0.1) // 每月衰减10%，最低50%
      activityScore *= decayFactor
    }

    totalScore += activityScore
  })

  // 分数转换：活动分数映射到0-40分的增长区间
  const scaledScore = Math.min(maxPossibleScore, totalScore * 4)
  return Math.round((baseScore + scaledScore) * 10) / 10
}

// 品行表现计算（考虑奖惩级别）
export function calcConductScore(
  awards: { type: string; level: string; date: Date }[],
  options?: { levelWeight?: boolean; recentBonus?: boolean }
): number {
  if (!awards.length) return 80 // 默认良好

  const { levelWeight = true, recentBonus = true } = options || {}
  const baseScore = 80
  let bonus = 0
  let penalty = 0

  // 奖惩级别权重
  const levelWeights = {
    '校级': 3,
    '院级': 2,
    '班级': 1,
    '轻微': 1,
    '一般': 2,
    '严重': 3
  }

  awards.forEach(award => {
    let weight = levelWeight && award.level ? (levelWeights[award.level as keyof typeof levelWeights] || 1) : 1

    // 最近时间加成/惩罚
    if (recentBonus) {
      const monthsAgo = (Date.now() - award.date.getTime()) / (1000 * 60 * 60 * 24 * 30)
      if (monthsAgo <= 6) { // 最近6个月
        weight *= 1.2
      }
    }

    if (award.type === 'AWARD') {
      bonus += weight * 5
    } else if (award.type === 'PUNISHMENT') {
      penalty += weight * 8
    }
  })

  const finalScore = Math.min(100, Math.max(0, baseScore + bonus - penalty))
  return Math.round(finalScore * 10) / 10
}

// 出勤情况计算（考虑请假类型）
export function calcAttendanceScore(
  attendances: { status: string; date: Date; reason?: string }[],
  options?: { penaltyRates?: Record<string, number>; timeWindow?: number }
): number {
  if (!attendances.length) return 95 // 默认良好

  const {
    penaltyRates = {
      'ABSENT': 5,     // 旷课扣5分
      'LATE': 2,       // 迟到扣2分
      'LEAVE': 1       // 请假扣1分
    },
    timeWindow = 12  // 考虑最近12个月
  } = options || {}

  const baseScore = 100
  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - timeWindow)

  // 过滤时间窗口内的考勤记录
  const recentAttendances = attendances.filter(a => a.date >= cutoffDate)

  let totalPenalty = 0
  const statusCounts = {
    'ABSENT': 0,
    'LATE': 0,
    'LEAVE': 0,
    'PRESENT': 0
  }

  recentAttendances.forEach(attendance => {
    const status = attendance.status as keyof typeof statusCounts
    if (statusCounts.hasOwnProperty(status)) {
      statusCounts[status]++
    }

    // 计算扣分
    if (penaltyRates[status]) {
      totalPenalty += penaltyRates[status]
    }
  })

  // 出勤率计算
  const totalDays = recentAttendances.length
  const presentDays = statusCounts.PRESENT + statusCounts.LEAVE // 请假也算出勤
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) : 1

  // 综合评分：基础分数 - 扣分 + 出勤率加成
  let finalScore = baseScore - totalPenalty

  // 出勤率低于80%额外扣分
  if (attendanceRate < 0.8) {
    finalScore -= (0.8 - attendanceRate) * 20
  }

  return Math.round(Math.min(100, Math.max(0, finalScore)) * 10) / 10
}

// 综合评分计算
export function calculateFinalScore(
  scores: {
    academic: number
    activity: number
    conduct: number
    attendance: number
  },
  weights: {
    academic: number
    activity: number
    conduct: number
    attendance: number
  }
): number {
  // 权重归一化
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0)
  const normalizedWeights = {
    academic: weights.academic / totalWeight,
    activity: weights.activity / totalWeight,
    conduct: weights.conduct / totalWeight,
    attendance: weights.attendance / totalWeight
  }

  // 加权计算
  const finalScore =
    scores.academic * normalizedWeights.academic +
    scores.activity * normalizedWeights.activity +
    scores.conduct * normalizedWeights.conduct +
    scores.attendance * normalizedWeights.attendance

  return Math.round(finalScore * 10) / 10
}

// 维度分析
export function analyzeDimensions(scores: {
  academic: number
  activity: number
  conduct: number
  attendance: number
}) {
  const dimensions = [
    { name: 'academic', label: '学业成绩', score: scores.academic },
    { name: 'activity', label: '课外活动', score: scores.activity },
    { name: 'conduct', label: '品行表现', score: scores.conduct },
    { name: 'attendance', label: '出勤情况', score: scores.attendance }
  ]

  dimensions.sort((a, b) => b.score - a.score)

  return {
    strongest: dimensions[0],
    weakest: dimensions[dimensions.length - 1],
    balanced: Math.abs(dimensions[0].score - dimensions[dimensions.length - 1].score) <= 15,
    average: dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
  }
}
