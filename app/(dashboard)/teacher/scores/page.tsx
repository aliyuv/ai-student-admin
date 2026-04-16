import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import ScoreManagementClient from "./score-management-client"

export default async function ScoresPage() {
  await connection()

  const [students, scores, scoreSemesters] = await Promise.all([
    prisma.student.findMany({
      select: {
        id: true,
        studentNo: true,
        user: { select: { id: true, name: true, email: true } },
        class: { select: { id: true, name: true, grade: true, teacher: { select: { name: true } } } },
      },
      orderBy: { user: { name: "asc" } }
    }),
    prisma.score.findMany({
      select: {
        id: true,
        subject: true,
        score: true,
        semester: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            studentNo: true,
            user: { select: { id: true, name: true, email: true } },
            class: { select: { id: true, name: true, grade: true, teacher: { select: { name: true } } } },
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.score.findMany({
      distinct: ["semester"],
      select: { semester: true },
      orderBy: { semester: "desc" },
    }),
  ])

  const subjects = [
    "高等数学", "线性代数", "概率统计", "数据结构",
    "算法设计", "计算机网络", "操作系统", "数据库原理",
    "软件工程", "编程语言", "计算机组成原理", "离散数学",
    "大学英语", "思想政治", "体育", "专业选修"
  ]

  const semesters = scoreSemesters.map(({ semester }) => semester)

  return (
    <ScoreManagementClient
      students={students}
      scores={scores}
      subjects={subjects}
      semesters={semesters}
    />
  )
}
