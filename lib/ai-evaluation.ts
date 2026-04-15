/**
 * AI 评测业务模块
 *
 * 职责：学生综合评测的业务逻辑
 * - 构建评测 prompt
 * - 处理大模型返回结果
 * - 本地模式下使用算法模拟评测
 *
 * 大模型调用通过 ai-provider 层完成，本模块不关心具体用的是 GPT 还是 DeepSeek。
 */

import { getAIProvider, isLocalMode } from "@/lib/ai-provider"
import type { ChatMessage } from "@/lib/ai-provider"

// ── 数据类型 ─────────────────────────────────────────────────────────────────

export interface StudentData {
  name: string
  scores: { subject: string; score: number; semester: string }[]
  activities: { type: string; title: string; score: number }[]
  awards: { type: string; description: string; level: string }[]
  attendances: { status: string }[]
}

export interface EvaluationResult {
  aiScore: number
  aiReport: {
    summary: string
    dimensions: {
      academic: number
      activity: number
      conduct: number
      attendance: number
    }
    strengths: string[]
    suggestions: string[]
    grade: string
    comment: string
  }
}

// ── 本地模拟评测（无需大模型） ───────────────────────────────────────────────

function simulateEvaluation(data: StudentData): EvaluationResult {
  const avgScore =
    data.scores.length > 0
      ? data.scores.reduce((s, r) => s + r.score, 0) / data.scores.length
      : 60

  const activityScore = Math.min(100, 60 + data.activities.reduce((s, a) => s + a.score, 0) * 5)

  const awardBonus = data.awards.filter((a) => a.type === "AWARD").length * 5
  const punishPenalty = data.awards.filter((a) => a.type === "PUNISHMENT").length * 10
  const conductScore = Math.min(100, Math.max(0, 80 + awardBonus - punishPenalty))

  const absent = data.attendances.filter((a) => a.status === "ABSENT").length
  const late = data.attendances.filter((a) => a.status === "LATE").length
  const attendanceScore = Math.min(100, Math.max(0, 100 - absent * 5 - late * 2))

  const aiScore = Math.round(avgScore * 0.5 + activityScore * 0.2 + conductScore * 0.2 + attendanceScore * 0.1)

  const strengths: string[] = []
  const suggestions: string[] = []

  if (avgScore >= 85) strengths.push("学业成绩优秀")
  else if (avgScore < 70) suggestions.push("需加强学业学习")

  if (data.activities.length >= 3) strengths.push("积极参与课外活动")
  else suggestions.push("建议多参与课外活动")

  if (absent === 0) strengths.push("出勤表现良好")
  else if (absent >= 3) suggestions.push("需改善出勤情况")

  const grade = aiScore >= 90 ? "优秀" : aiScore >= 80 ? "良好" : aiScore >= 70 ? "中等" : aiScore >= 60 ? "合格" : "待提升"
  const comment = `${data.name}同学综合评分为${aiScore}分，学业成绩${avgScore.toFixed(1)}分，综合表现${grade}。`

  return {
    aiScore,
    aiReport: {
      summary: comment,
      dimensions: {
        academic: Math.round(avgScore),
        activity: Math.round(activityScore),
        conduct: Math.round(conductScore),
        attendance: Math.round(attendanceScore),
      },
      strengths,
      suggestions,
      grade,
      comment,
    },
  }
}

// ── 构建评测 Prompt ──────────────────────────────────────────────────────────

function buildEvaluationPrompt(data: StudentData): ChatMessage[] {
  return [
    {
      role: "system",
      content: "你是一位教育评估专家。请根据学生数据生成综合评测报告，必须返回 JSON 格式。",
    },
    {
      role: "user",
      content: `请根据以下学生数据生成综合评测报告。

学生数据：
${JSON.stringify(data, null, 2)}

返回格式（严格遵守）：
{
  "aiScore": <0-100的综合评分>,
  "aiReport": {
    "summary": "<总结评语>",
    "dimensions": {
      "academic": <0-100>,
      "activity": <0-100>,
      "conduct": <0-100>,
      "attendance": <0-100>
    },
    "strengths": ["<优点1>", "<优点2>"],
    "suggestions": ["<建议1>", "<建议2>"],
    "grade": "<优秀|良好|中等|合格|待提升>",
    "comment": "<综合评语>"
  }
}`,
    },
  ]
}

// ── 通过大模型评测 ───────────────────────────────────────────────────────────

async function llmEvaluation(data: StudentData): Promise<EvaluationResult> {
  const provider = getAIProvider()
  const messages = buildEvaluationPrompt(data)

  try {
    const result = await provider.chatJSON<EvaluationResult>({
      messages,
      temperature: 0.3,
      maxTokens: 2000,
    })

    // 基础校验：确保返回数据结构完整
    if (
      typeof result.aiScore !== "number" ||
      !result.aiReport?.dimensions ||
      !Array.isArray(result.aiReport?.strengths)
    ) {
      console.warn("[AI Evaluation] LLM returned invalid structure, falling back to simulation")
      return simulateEvaluation(data)
    }

    return result
  } catch (error) {
    console.error("[AI Evaluation] LLM call failed, falling back to simulation:", error)
    return simulateEvaluation(data)
  }
}

// ── 入口函数 ─────────────────────────────────────────────────────────────────

/**
 * 评测学生综合表现
 *
 * - local 模式：使用本地算法模拟
 * - 其他模式：调用配置的大模型，失败时自动降级到本地算法
 */
export async function evaluateStudent(data: StudentData): Promise<EvaluationResult> {
  if (isLocalMode()) {
    return simulateEvaluation(data)
  }
  return llmEvaluation(data)
}
