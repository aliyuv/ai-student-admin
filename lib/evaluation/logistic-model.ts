import { EVALUATION_WEIGHTS } from "@/constants"

// Simplified logistic regression mock
// In production, replace with real model inference (Python API or ONNX)
export function logisticOptimize(dimensions: {
  academic: number
  activity: number
  conduct: number
  attendance: number
}): number {
  // Mock: simulate model output coefficient between 0.9 and 1.1
  const avg = (dimensions.academic + dimensions.activity + dimensions.conduct + dimensions.attendance) / 4
  const normalized = avg / 100
  // Logistic function: 1 / (1 + e^(-k*(x-0.5)))
  const k = 8
  const logistic = 1 / (1 + Math.exp(-k * (normalized - 0.5)))
  // Map to coefficient [0.9, 1.1]
  return 0.9 + logistic * 0.2
}

export function calcWeightedScore(dimensions: {
  academic: number
  activity: number
  conduct: number
  attendance: number
}): number {
  const w = EVALUATION_WEIGHTS
  const base =
    dimensions.academic * w.academic +
    dimensions.activity * w.activity +
    dimensions.conduct * w.conduct +
    dimensions.attendance * w.attendance

  const coefficient = logisticOptimize(dimensions)
  return Math.min(100, Math.round(base * coefficient))
}
