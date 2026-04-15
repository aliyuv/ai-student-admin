import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { evaluateStudent } from "@/lib/ai-evaluation"
import {
  calcAcademicScore,
  calcActivityScore,
  calcConductScore,
  calcAttendanceScore,
  calculateFinalScore,
} from "@/lib/evaluation/score-calculator"

// ── POST /api/admin/ai-model ─────────────────────────────────────────────────
// action: "test" | "train" | "export"

export async function POST(req: NextRequest) {
  let body: { action?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { action } = body

  switch (action) {
    case "test":
      return handleTest()
    case "train":
      return handleTrain()
    case "export":
      return handleExport()
    default:
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      )
  }
}

// ── 测试模型：随机抽一个真实学生，跑完整评测 ─────────────────────────────────

async function handleTest() {
  try {
    // 统计学生总数
    const studentCount = await prisma.student.count()
    if (studentCount === 0) {
      return NextResponse.json({
        success: false,
        error: "数据库中没有学生数据，请先导入学生信息",
      })
    }

    // 随机抽一个学生
    const skip = Math.floor(Math.random() * studentCount)
    const students = await prisma.student.findMany({
      skip,
      take: 1,
      include: {
        user: true,
        scores: { orderBy: { createdAt: "desc" }, take: 10 },
        activities: true,
        awards: true,
        attendances: { orderBy: { date: "desc" }, take: 60 },
        class: true,
      },
    })

    const student = students[0]
    if (!student) {
      return NextResponse.json({ success: false, error: "未能抽取学生" })
    }

    // 用 ai-evaluation 模块跑评测
    const startTime = Date.now()
    const result = await evaluateStudent({
      name: student.user.name,
      scores: student.scores.map((s) => ({
        subject: s.subject,
        score: s.score,
        semester: s.semester,
      })),
      activities: student.activities.map((a) => ({
        type: a.type,
        title: a.title,
        score: a.score,
      })),
      awards: student.awards.map((a) => ({
        type: a.type,
        description: a.description,
        level: a.level,
      })),
      attendances: student.attendances.map((a) => ({ status: a.status })),
    })
    const latency = Date.now() - startTime

    return NextResponse.json({
      success: true,
      student: {
        name: student.user.name,
        studentNo: student.studentNo,
        className: student.class.name,
      },
      result: {
        aiScore: result.aiScore,
        grade: result.aiReport.grade,
        dimensions: result.aiReport.dimensions,
        strengths: result.aiReport.strengths,
        suggestions: result.aiReport.suggestions,
      },
      latency: `${latency}ms`,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

// ── 训练模型：基于所有学生历史数据拟合最优权重 ───────────────────────────────
//
// 原理：遍历所有学生数据，计算各维度分数，然后基于已审核评测的分数
// 用最小二乘法拟合 4 个维度的最优权重。如果没有已审核评测数据，
// 则基于数据分布计算推荐权重。

async function handleTrain() {
  try {
    const startTime = Date.now()

    // 获取所有学生及其完整数据
    const students = await prisma.student.findMany({
      include: {
        user: true,
        scores: true,
        activities: true,
        awards: true,
        attendances: true,
      },
    })

    if (students.length === 0) {
      return NextResponse.json({
        success: false,
        error: "没有学生数据，无法训练模型",
      })
    }

    // 计算每个学生的各维度得分
    const dataPoints: {
      academic: number
      activity: number
      conduct: number
      attendance: number
    }[] = []

    for (const student of students) {
      const academic = calcAcademicScore(
        student.scores.map((s) => ({ score: s.score, subject: s.subject }))
      )
      const activity = calcActivityScore(
        student.activities.map((a) => ({
          score: a.score,
          type: a.type,
          date: a.date,
        }))
      )
      const conduct = calcConductScore(
        student.awards.map((a) => ({
          type: a.type,
          level: a.level,
          date: a.date,
        }))
      )
      const attendance = calcAttendanceScore(
        student.attendances.map((a) => ({
          status: a.status,
          date: a.date,
        }))
      )

      dataPoints.push({ academic, activity, conduct, attendance })
    }

    // 获取已审核的评测数据作为标签
    const evaluations = await prisma.evaluation.findMany({
      where: { status: "APPROVED" },
      select: { studentId: true, aiScore: true },
    })

    const studentScoreMap = new Map<string, number>()
    for (const ev of evaluations) {
      studentScoreMap.set(ev.studentId, ev.aiScore)
    }

    // 计算维度统计信息
    const dimStats = {
      academic: calcStats(dataPoints.map((d) => d.academic)),
      activity: calcStats(dataPoints.map((d) => d.activity)),
      conduct: calcStats(dataPoints.map((d) => d.conduct)),
      attendance: calcStats(dataPoints.map((d) => d.attendance)),
    }

    // 拟合权重
    let trainedWeights: { academic: number; activity: number; conduct: number; attendance: number }
    let accuracy = 0
    let method: string

    if (evaluations.length >= 5) {
      // 有足够标签数据：用梯度下降拟合权重
      const labeled = students
        .filter((s) => studentScoreMap.has(s.id))
        .map((s) => {
          const idx = students.indexOf(s)
          return {
            dims: dataPoints[idx],
            target: studentScoreMap.get(s.id)!,
          }
        })

      const fitResult = fitWeights(labeled)
      trainedWeights = fitResult.weights
      accuracy = fitResult.accuracy
      method = "supervised"
    } else {
      // 无标签数据：基于方差分析推荐权重（方差大的维度区分度高，应给更高权重）
      const variances = {
        academic: dimStats.academic.stdDev,
        activity: dimStats.activity.stdDev,
        conduct: dimStats.conduct.stdDev,
        attendance: dimStats.attendance.stdDev,
      }

      const totalVar = Object.values(variances).reduce((s, v) => s + v, 0)
      if (totalVar === 0) {
        trainedWeights = { academic: 0.5, activity: 0.2, conduct: 0.2, attendance: 0.1 }
      } else {
        trainedWeights = {
          academic: Math.round((variances.academic / totalVar) * 100) / 100,
          activity: Math.round((variances.activity / totalVar) * 100) / 100,
          conduct: Math.round((variances.conduct / totalVar) * 100) / 100,
          attendance: Math.round((variances.attendance / totalVar) * 100) / 100,
        }
      }
      // 确保 academic 至少 0.3（学业应该是主导因素）
      if (trainedWeights.academic < 0.3) {
        const diff = 0.3 - trainedWeights.academic
        trainedWeights.academic = 0.3
        // 从最高的其他维度扣
        const others = ['activity', 'conduct', 'attendance'] as const
        const maxOther = others.reduce((max, k) => trainedWeights[k] > trainedWeights[max] ? k : max, others[0])
        trainedWeights[maxOther] = Math.max(0.05, trainedWeights[maxOther] - diff)
      }

      accuracy = 0
      method = "unsupervised"
    }

    const latency = Date.now() - startTime

    return NextResponse.json({
      success: true,
      model: {
        weights: trainedWeights,
        method,
        accuracy: Math.round(accuracy * 1000) / 1000,
        trainedAt: new Date().toISOString(),
        sampleCount: students.length,
        labeledCount: evaluations.length,
      },
      stats: dimStats,
      latency: `${latency}ms`,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

// ── 导出模型：模型参数 + 全体学生统计 ────────────────────────────────────────

async function handleExport() {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: true,
        scores: true,
        activities: true,
        awards: true,
        attendances: true,
        class: true,
      },
    })

    if (students.length === 0) {
      return NextResponse.json({
        success: false,
        error: "没有学生数据，无法导出",
      })
    }

    // 为每个学生计算各维度得分
    const studentResults = students.map((student) => {
      const academic = calcAcademicScore(
        student.scores.map((s) => ({ score: s.score, subject: s.subject }))
      )
      const activity = calcActivityScore(
        student.activities.map((a) => ({
          score: a.score,
          type: a.type,
          date: a.date,
        }))
      )
      const conduct = calcConductScore(
        student.awards.map((a) => ({
          type: a.type,
          level: a.level,
          date: a.date,
        }))
      )
      const attendance = calcAttendanceScore(
        student.attendances.map((a) => ({
          status: a.status,
          date: a.date,
        }))
      )

      const finalScore = calculateFinalScore(
        { academic, activity, conduct, attendance },
        { academic: 60, activity: 15, conduct: 10, attendance: 15 }
      )

      return {
        studentNo: student.studentNo,
        name: student.user.name,
        className: student.class.name,
        dimensions: {
          academic: Math.round(academic * 10) / 10,
          activity: Math.round(activity * 10) / 10,
          conduct: Math.round(conduct * 10) / 10,
          attendance: Math.round(attendance * 10) / 10,
        },
        finalScore: Math.round(finalScore * 10) / 10,
      }
    })

    // 统计信息
    const allScores = studentResults.map((r) => r.finalScore)
    const overview = {
      totalStudents: students.length,
      scoreDistribution: {
        excellent: allScores.filter((s) => s >= 90).length,
        good: allScores.filter((s) => s >= 80 && s < 90).length,
        average: allScores.filter((s) => s >= 70 && s < 80).length,
        pass: allScores.filter((s) => s >= 60 && s < 70).length,
        fail: allScores.filter((s) => s < 60).length,
      },
      stats: calcStats(allScores),
    }

    // 已有评测数据
    const evaluationCount = await prisma.evaluation.count()
    const approvedCount = await prisma.evaluation.count({
      where: { status: "APPROVED" },
    })

    return NextResponse.json({
      success: true,
      exportedAt: new Date().toISOString(),
      model: {
        type: "weighted_scoring",
        defaultWeights: { academic: 0.6, activity: 0.15, conduct: 0.1, attendance: 0.15 },
        description: "基于加权评分的学生综合评测模型",
      },
      overview,
      evaluations: {
        total: evaluationCount,
        approved: approvedCount,
      },
      students: studentResults,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

// ── 工具函数 ─────────────────────────────────────────────────────────────────

function calcStats(values: number[]) {
  if (values.length === 0) return { mean: 0, min: 0, max: 0, stdDev: 0, count: 0 }

  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const min = Math.min(...values)
  const max = Math.max(...values)
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  const stdDev = Math.sqrt(variance)

  return {
    mean: Math.round(mean * 10) / 10,
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    count: values.length,
  }
}

/**
 * 简单梯度下降拟合权重
 * 给定 (维度分数, 目标总分) 对，找到最优权重使得 加权和 ≈ 目标分
 */
function fitWeights(
  data: { dims: { academic: number; activity: number; conduct: number; attendance: number }; target: number }[]
) {
  // 初始权重
  let w = { academic: 0.5, activity: 0.2, conduct: 0.2, attendance: 0.1 }
  const lr = 0.00001 // 学习率
  const epochs = 500

  for (let epoch = 0; epoch < epochs; epoch++) {
    let gradA = 0, gradB = 0, gradC = 0, gradD = 0

    for (const { dims, target } of data) {
      const pred = dims.academic * w.academic + dims.activity * w.activity +
                   dims.conduct * w.conduct + dims.attendance * w.attendance
      const err = pred - target

      gradA += err * dims.academic
      gradB += err * dims.activity
      gradC += err * dims.conduct
      gradD += err * dims.attendance
    }

    // 更新
    w.academic = Math.max(0.05, w.academic - lr * gradA / data.length)
    w.activity = Math.max(0.05, w.activity - lr * gradB / data.length)
    w.conduct  = Math.max(0.05, w.conduct  - lr * gradC / data.length)
    w.attendance = Math.max(0.05, w.attendance - lr * gradD / data.length)

    // 归一化：权重总和为 1
    const total = w.academic + w.activity + w.conduct + w.attendance
    w.academic /= total
    w.activity /= total
    w.conduct /= total
    w.attendance /= total
  }

  // 计算准确率（R²）
  const predictions = data.map(({ dims }) =>
    dims.academic * w.academic + dims.activity * w.activity +
    dims.conduct * w.conduct + dims.attendance * w.attendance
  )
  const targets = data.map((d) => d.target)
  const meanTarget = targets.reduce((s, v) => s + v, 0) / targets.length
  const ssRes = targets.reduce((s, t, i) => s + (t - predictions[i]) ** 2, 0)
  const ssTot = targets.reduce((s, t) => s + (t - meanTarget) ** 2, 0)
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot)

  return {
    weights: {
      academic: Math.round(w.academic * 1000) / 1000,
      activity: Math.round(w.activity * 1000) / 1000,
      conduct:  Math.round(w.conduct * 1000) / 1000,
      attendance: Math.round(w.attendance * 1000) / 1000,
    },
    accuracy: r2,
  }
}
