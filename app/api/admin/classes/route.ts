import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// 获取所有班级
export async function GET() {
  try {
    const session = await auth()
    if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 })
    }

    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        grade: true,
        teacherId: true,
        teacher: { select: { id: true, name: true, email: true } },
        _count: { select: { students: true } }
      },
      orderBy: [{ grade: "desc" }, { name: "asc" }]
    })

    return NextResponse.json(classes)
  } catch (error) {
    console.error("获取班级列表失败:", error)
    return NextResponse.json({ error: "获取班级列表失败" }, { status: 500 })
  }
}

// 创建班级
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 })
    }

    const { name, grade, teacherId } = await request.json()

    if (!name || !grade || !teacherId) {
      return NextResponse.json({ error: "班级名称、年级和班主任不能为空" }, { status: 400 })
    }

    // 检查班级名称是否已存在
    const existing = await prisma.class.findFirst({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: "班级名称已存在" }, { status: 400 })
    }

    const newClass = await prisma.class.create({
      data: { name, grade, teacherId },
      select: {
        id: true,
        name: true,
        grade: true,
        teacherId: true,
        teacher: { select: { id: true, name: true, email: true } },
        _count: { select: { students: true } }
      }
    })

    return NextResponse.json(newClass, { status: 201 })
  } catch (error) {
    console.error("创建班级失败:", error)
    return NextResponse.json({ error: "创建班级失败" }, { status: 500 })
  }
}