import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import ScoreManagementClient from "./score-management-client"

export default async function ScoresPage() {
  const session = await auth()

  // 获取当前教师负责的班级学生
  const students = await prisma.student.findMany({
    include: {
      user: true,
      class: {
        include: {
          teacher: true
        }
      }
    },
    // TODO: 根据当前教师权限过滤学生
    orderBy: { user: { name: "asc" } }
  })

  const scores = await prisma.score.findMany({
    include: {
      student: {
        include: {
          user: true,
          class: {
            include: {
              teacher: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
  })

  // 科目列表（可以从配置或数据库获取）
  const subjects = [
    "高等数学", "线性代数", "概率统计", "数据结构",
    "算法设计", "计算机网络", "操作系统", "数据库原理",
    "软件工程", "编程语言", "计算机组成原理", "离散数学",
    "大学英语", "思想政治", "体育", "专业选修"
  ]

  // 学期列表
  const currentYear = new Date().getFullYear()
  const semesters = [
    `${currentYear}-1`,
    `${currentYear}-2`,
    `${currentYear-1}-1`,
    `${currentYear-1}-2`,
    `${currentYear+1}-1`,
    `${currentYear+1}-2`
  ]

  return (
    <ScoreManagementClient
      students={students}
      scores={scores}
      subjects={subjects}
      semesters={semesters}
    />
  )
}
