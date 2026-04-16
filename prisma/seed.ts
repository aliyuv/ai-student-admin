import bcrypt from "bcryptjs"
import { prisma } from "../lib/prisma"

async function main() {
  console.log("🌱 开始生成种子数据...")

  // 清空所有数据（按外键依赖顺序）
  console.log("🗑️  清空旧数据...")
  await prisma.appeal.deleteMany()
  await prisma.evaluation.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.award.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.score.deleteMany()
  await prisma.student.deleteMany()
  await prisma.class.deleteMany()
  await prisma.user.deleteMany()
  await prisma.major.deleteMany()
  await prisma.department.deleteMany()

  // 创建院系和专业
  console.log("🏛️  创建院系和专业...")
  const csDept = await prisma.department.create({
    data: {
      name: "计算机学院", code: "CS", description: "计算机科学与技术学院",
      majors: {
        create: [
          { name: "计算机科学与技术", code: "CS001" },
          { name: "软件工程", code: "SE001" },
          { name: "网络工程", code: "NE001" },
        ],
      },
    },
  })
  await prisma.department.create({
    data: {
      name: "电子信息学院", code: "EE", description: "电子信息工程学院",
      majors: {
        create: [
          { name: "电子信息工程", code: "EE001" },
          { name: "通信工程", code: "CE001" },
        ],
      },
    },
  })
  await prisma.department.create({
    data: {
      name: "经济管理学院", code: "EM", description: "经济与管理学院",
      majors: {
        create: [
          { name: "工商管理", code: "BA001" },
          { name: "市场营销", code: "MK001" },
        ],
      },
    },
  })

  // 密码哈希
  const adminPassword = await bcrypt.hash("admin123", 10)
  const teacherPassword = await bcrypt.hash("teacher123", 10)
  const studentPassword = await bcrypt.hash("student123", 10)

  // 创建管理员
  await prisma.user.create({
    data: {
      name: "系统管理员",
      email: "admin@school.com",
      password: adminPassword,
      role: "ADMIN"
    },
  })

  // 创建多个教师
  const teachers = await Promise.all([
    prisma.user.create({
      data: {
        name: "张老师",
        email: "teacher1@school.com",
        password: teacherPassword,
        role: "TEACHER"
      },
    }),
    prisma.user.create({
      data: {
        name: "王老师",
        email: "teacher2@school.com",
        password: teacherPassword,
        role: "TEACHER"
      },
    }),
    prisma.user.create({
      data: {
        name: "李老师",
        email: "teacher3@school.com",
        password: teacherPassword,
        role: "TEACHER"
      },
    })
  ])

  // 创建班级
  const classes = await Promise.all([
    prisma.class.create({
      data: {
        id: "class-1",
        name: "计算机2101班",
        grade: "2021级",
        teacherId: teachers[0].id
      },
    }),
    prisma.class.create({
      data: {
        id: "class-2",
        name: "计算机2102班",
        grade: "2021级",
        teacherId: teachers[0].id
      },
    }),
    prisma.class.create({
      data: {
        id: "class-3",
        name: "软工2101班",
        grade: "2021级",
        teacherId: teachers[1].id
      },
    }),
    prisma.class.create({
      data: {
        id: "class-4",
        name: "网工2101班",
        grade: "2021级",
        teacherId: teachers[2].id
      },
    })
  ])

  // 创建学生用户和学生记录
  const studentNames = [
    "张三", "李四", "王五", "赵六", "孙七", "周八", "吴九", "郑十",
    "陈明", "刘红", "杨洋", "黄华", "徐静", "朱强", "林丽", "何伟",
    "罗敏", "高峰", "梁雪", "韩磊", "邓颖", "曾勇", "彭飞", "董娜"
  ]

  const students = []
  for (let i = 0; i < studentNames.length; i++) {
    const classIndex = i % classes.length
    const studentNo = `2021${String(i + 1).padStart(3, '0')}`

    const studentUser = await prisma.user.create({
      data: {
        name: studentNames[i],
        email: `student${i + 1}@school.com`,
        password: studentPassword,
        role: "STUDENT"
      },
    })

    const student = await prisma.student.create({
      data: {
        studentNo,
        userId: studentUser.id,
        classId: classes[classIndex].id,
      },
    })

    students.push({ ...student, user: studentUser })
  }

  console.log(`✅ 创建了 ${students.length} 个学生`)

  // 创建成绩数据
  const subjects = [
    "高等数学", "线性代数", "数据结构", "算法设计", "计算机网络",
    "操作系统", "数据库原理", "软件工程", "编程语言", "计算机组成原理"
  ]
  const semesters = ["2024-1", "2024-2", "2023-1", "2023-2"]

  console.log("📊 生成成绩数据...")
  for (const student of students) {
    for (const semester of semesters) {
      // 每个学期随机选择3-5门课程
      const semesterSubjects = subjects.slice(0, Math.floor(Math.random() * 3) + 3)

      for (const subject of semesterSubjects) {
        const score = Math.floor(Math.random() * 40) + 60 // 60-100分
        await prisma.score.create({
          data: {
            studentId: student.id,
            subject,
            score,
            semester,
          },
        })
      }
    }
  }

  // 创建活动数据
  console.log("🎯 生成活动数据...")
  const activities = [
    { type: "ACTIVITY", title: "学生会干部", score: 5 },
    { type: "ACTIVITY", title: "社团组织活动", score: 3 },
    { type: "ACTIVITY", title: "志愿服务", score: 2 },
    { type: "ACTIVITY", title: "文艺表演", score: 2 },
    { type: "PRACTICE", title: "企业实习", score: 8 },
    { type: "PRACTICE", title: "科研项目", score: 6 },
    { type: "PRACTICE", title: "创新创业", score: 5 },
    { type: "PRACTICE", title: "学术竞赛", score: 4 },
  ]

  for (const student of students) {
    // 每个学生随机参与2-5个活动
    const studentActivities = activities.slice(0, Math.floor(Math.random() * 4) + 2)

    for (const activity of studentActivities) {
      await prisma.activity.create({
        data: {
          studentId: student.id,
          type: activity.type as "ACTIVITY" | "PRACTICE",
          title: activity.title,
          score: activity.score,
          date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // 随机日期
        },
      })
    }
  }

  // 创建奖惩数据
  console.log("🏆 生成奖惩数据...")
  for (const student of students) {
    // 30% 概率获得奖励
    if (Math.random() < 0.3) {
      const awards = ["三好学生", "优秀学生干部", "学习标兵", "创新奖"]
      const levels = ["校级", "院级", "班级"]

      await prisma.award.create({
        data: {
          studentId: student.id,
          type: "AWARD",
          description: awards[Math.floor(Math.random() * awards.length)],
          level: levels[Math.floor(Math.random() * levels.length)],
          date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000), // 最近半年
        },
      })
    }

    // 10% 概率有违纪记录
    if (Math.random() < 0.1) {
      const punishments = ["迟到", "旷课", "违反宿舍管理"]
      const levels = ["轻微", "一般"]

      await prisma.award.create({
        data: {
          studentId: student.id,
          type: "PUNISHMENT",
          description: punishments[Math.floor(Math.random() * punishments.length)],
          level: levels[Math.floor(Math.random() * levels.length)],
          date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
        },
      })
    }
  }

  // 创建考勤数据
  console.log("📅 生成考勤数据...")
  const statuses = ["PRESENT", "ABSENT", "LATE", "LEAVE"]
  const weights = [0.85, 0.05, 0.05, 0.05] // 85%出勤，5%缺勤，5%迟到，5%请假

  for (const student of students) {
    // 生成最近3个月的考勤记录（假设每周5天）
    for (let i = 0; i < 60; i++) {
      const random = Math.random()
      let status = statuses[0]

      let cumulative = 0
      for (let j = 0; j < weights.length; j++) {
        cumulative += weights[j]
        if (random < cumulative) {
          status = statuses[j]
          break
        }
      }

      const date = new Date()
      date.setDate(date.getDate() - i)

      await prisma.attendance.create({
        data: {
          studentId: student.id,
          status: status as "PRESENT" | "ABSENT" | "LATE" | "LEAVE",
          date,
        },
      })
    }
  }

  // 生成AI评测数据（简化版）
  console.log("🤖 生成AI评测数据...")
  for (const student of students.slice(0, 15)) { // 为前15个学生生成评测
    // 获取学生数据
    const scores = await prisma.score.findMany({
      where: { studentId: student.id, semester: "2024-1" }
    })
    const activities = await prisma.activity.findMany({
      where: { studentId: student.id }
    })

    // 简单计算评测分数
    const avgScore = scores.length > 0 ?
      Math.round((scores.reduce((sum, s) => sum + s.score, 0) / scores.length) * 10) / 10 : 75

    const activityBonus = Math.min(15, activities.length * 3) // 活动加分
    const finalScore = Math.min(100, Math.max(60, avgScore + activityBonus))

    // 简化的报告
    const report = {
      summary: `${student.user.name}同学本学期综合评测得分${finalScore}分。`,
      dimensions: {
        academic: Math.round(avgScore),
        activity: Math.min(100, 60 + activities.length * 8),
        conduct: 85,
        attendance: 92
      },
      strengths: avgScore >= 80 ? ["学业成绩优秀"] : [],
      suggestions: avgScore < 75 ? ["加强专业课程学习"] : ["继续保持优良状态"],
      grade: finalScore >= 90 ? "优秀" : finalScore >= 80 ? "良好" : finalScore >= 70 ? "中等" : "合格",
      comment: finalScore >= 90 ? "综合表现优异，是同学们学习的榜样。" :
               finalScore >= 80 ? "综合素质良好，继续保持。" :
               finalScore >= 70 ? "表现中等，仍有进步空间。" : "需要在学业和活动方面加强努力。"
    }

    await prisma.evaluation.create({
      data: {
        studentId: student.id,
        semester: "2024-1",
        aiScore: finalScore,
        aiReport: JSON.stringify(report),
        status: "APPROVED",
      },
    })
  }

  // 创建示例申诉
  console.log("📝 生成申诉数据...")
  const evaluations = await prisma.evaluation.findMany({ take: 5 })
  for (const evaluation of evaluations.slice(0, 2)) {
    await prisma.appeal.create({
      data: {
        evaluationId: evaluation.id,
        reason: "我认为我的社团活动参与度评分偏低，我在本学期担任了学生会干部，组织了多次校级活动，应该获得更高的评分。",
        status: "PENDING",
      },
    })
  }

  console.log("🎉 种子数据生成完成！")
  console.log("📋 账号信息：")
  console.log("管理员: admin@school.com / admin123")
  console.log("教师: teacher1@school.com / teacher123")
  console.log("学生: student1@school.com / student123")
  console.log("      student2@school.com / student123")
  console.log("      ...")
  console.log(`      student${students.length}@school.com / student123`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
