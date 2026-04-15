import {
  calcAcademicScore,
  calcActivityScore,
  calcConductScore,
  calcAttendanceScore,
} from "./score-calculator"
import { calcWeightedScore } from "./logistic-model"
import { generateReport } from "./report-generator"

export interface EvaluationInput {
  name: string
  scores: { score: number; subject: string; weight?: number }[]
  activities: { score: number; type: string; date: Date }[]
  awards: { type: string; level: string; date: Date }[]
  attendances: { status: string; date: Date; reason?: string }[]
}

export function runEvaluation(input: EvaluationInput) {
  const academic = calcAcademicScore(input.scores)
  const activity = calcActivityScore(input.activities)
  const conduct = calcConductScore(input.awards)
  const attendance = calcAttendanceScore(input.attendances)

  const finalScore = calcWeightedScore({ academic, activity, conduct, attendance })
  const report = generateReport({ name: input.name, academic, activity, conduct, attendance, finalScore })

  return { aiScore: finalScore, aiReport: report }
}
