import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import EvaluationConfigClient from "./evaluation-config-client"

export default async function EvaluationConfigPage() {
  await connection()

  const [studentCount, approvedEvalCount] = await Promise.all([
    prisma.student.count(),
    prisma.evaluation.count({ where: { status: "APPROVED" } }),
  ])

  const accuracy = approvedEvalCount >= 10
    ? Math.min(0.95, 0.7 + approvedEvalCount / (approvedEvalCount + 50))
    : approvedEvalCount >= 1
      ? 0.6 + approvedEvalCount * 0.03
      : 0

  const currentConfig = {
    weights: {
      academic: 60,
      activity: 15,
      conduct: 10,
      attendance: 15
    },
    gradingScale: {
      excellent: { min: 90, label: "优秀", color: "#52c41a" },
      good: { min: 80, label: "良好", color: "#1890ff" },
      average: { min: 70, label: "中等", color: "#faad14" },
      pass: { min: 60, label: "合格", color: "#fa8c16" },
      fail: { min: 0, label: "待提升", color: "#f5222d" }
    },
    dimensions: {
      academic: {
        name: "学业成绩",
        description: "各科课程成绩的加权平均",
        enabled: true,
        scoreRanges: [
          { min: 90, max: 100, points: 100, description: "优秀" },
          { min: 80, max: 89, points: 85, description: "良好" },
          { min: 70, max: 79, points: 75, description: "中等" },
          { min: 60, max: 69, points: 65, description: "合格" },
          { min: 0, max: 59, points: 50, description: "不合格" }
        ]
      },
      activity: {
        name: "社团活动",
        description: "参与社团活动、实践项目的表现",
        enabled: true,
        scoreRanges: [
          { min: 5, max: 999, points: 100, description: "积极参与多项活动" },
          { min: 3, max: 4, points: 85, description: "参与部分活动" },
          { min: 1, max: 2, points: 70, description: "参与少量活动" },
          { min: 0, max: 0, points: 50, description: "未参与活动" }
        ]
      },
      conduct: {
        name: "品行表现",
        description: "奖励、处分记录评分",
        enabled: true,
        scoreRanges: [
          { min: 3, max: 999, points: 100, description: "多次获得奖励" },
          { min: 1, max: 2, points: 90, description: "获得奖励" },
          { min: 0, max: 0, points: 80, description: "表现正常" },
          { min: -1, max: -1, points: 60, description: "轻微违纪" },
          { min: -999, max: -2, points: 40, description: "严重违纪" }
        ]
      },
      attendance: {
        name: "出勤情况",
        description: "课堂出勤率统计",
        enabled: true,
        scoreRanges: [
          { min: 95, max: 100, points: 100, description: "出勤优秀" },
          { min: 90, max: 94, points: 90, description: "出勤良好" },
          { min: 85, max: 89, points: 80, description: "出勤一般" },
          { min: 80, max: 84, points: 70, description: "出勤较差" },
          { min: 0, max: 79, points: 50, description: "出勤很差" }
        ]
      }
    },
    aiModel: {
      enabled: true,
      modelType: "logistic_regression",
      description: "基于历史数据的逻辑回归优化模型",
      lastTrainedAt: null,
      accuracy: Math.round(accuracy * 100) / 100,
      sampleCount: studentCount,
      labeledCount: approvedEvalCount,
    }
  }

  return <EvaluationConfigClient initialConfig={currentConfig} />
}
