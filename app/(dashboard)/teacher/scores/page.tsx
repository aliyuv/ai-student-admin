import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import ScoreManagementClient from "./score-management-client"

const SCORES_PAGE_SIZE = 50

export default async function ScoresPage() {
  const t0 = performance.now()
  await connection()
  const t1 = performance.now()

  const [students, scores, totalScores, scoreSemesters] = await Promise.all([
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
      take: SCORES_PAGE_SIZE,
    }),
    prisma.score.count(),
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
  const t2 = performance.now()

  console.log(`[perf] /teacher/scores — connection: ${(t1-t0).toFixed(0)}ms, query: ${(t2-t1).toFixed(0)}ms, total: ${(t2-t0).toFixed(0)}ms, students: ${students.length}, scores: ${scores.length}/${totalScores}`)

  return (
    <ScoreManagementClient
      students={students}
      scores={scores}
      subjects={subjects}
      semesters={semesters}
    />
  )
}
