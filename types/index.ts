export type Role = "ADMIN" | "TEACHER" | "STUDENT"
export type EvaluationStatus = "PENDING" | "APPROVED" | "REJECTED"
export type AppealStatus = "PENDING" | "RESOLVED"
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "LEAVE"
export type ActivityType = "ACTIVITY" | "PRACTICE"
export type AwardType = "AWARD" | "PUNISHMENT"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: Date
}

export interface Student {
  id: string
  studentNo: string
  userId: string
  classId: string
  user: User
  class: Class
}

export interface Class {
  id: string
  name: string
  grade: string
  teacherId: string
  teacher?: User
}

export interface Score {
  id: string
  studentId: string
  subject: string
  score: number
  semester: string
  createdAt: Date
}

export interface Activity {
  id: string
  studentId: string
  type: ActivityType
  title: string
  score: number
  date: Date
}

export interface Award {
  id: string
  studentId: string
  type: AwardType
  description: string
  level: string
  date: Date
}

export interface Attendance {
  id: string
  studentId: string
  date: Date
  status: AttendanceStatus
}

export interface EvaluationReport {
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

export interface Evaluation {
  id: string
  studentId: string
  semester: string
  aiScore: number
  aiReport: EvaluationReport
  status: EvaluationStatus
  createdAt: Date
}

export interface Appeal {
  id: string
  evaluationId: string
  reason: string
  status: AppealStatus
  reply?: string
  createdAt: Date
}

export interface EvaluationWeight {
  academic: number
  activity: number
  conduct: number
  attendance: number
}
