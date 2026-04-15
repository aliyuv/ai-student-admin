export const EVALUATION_WEIGHTS = {
  academic: 0.6,
  activity: 0.15,
  conduct: 0.1,
  attendance: 0.05,
  practice: 0.1,
}

export const GRADE_MAP = [
  { min: 90, label: "优秀" },
  { min: 80, label: "良好" },
  { min: 70, label: "中等" },
  { min: 60, label: "合格" },
  { min: 0,  label: "待提升" },
]

export const ATTENDANCE_STATUS_MAP: Record<string, string> = {
  PRESENT: "出勤",
  ABSENT: "缺勤",
  LATE: "迟到",
  LEAVE: "请假",
}

export const EVALUATION_STATUS_MAP: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "已驳回",
}

export const APPEAL_STATUS_MAP: Record<string, string> = {
  PENDING: "处理中",
  RESOLVED: "已处理",
}

export const ROLE_MAP: Record<string, string> = {
  ADMIN: "管理员",
  TEACHER: "教师",
  STUDENT: "学生",
}
