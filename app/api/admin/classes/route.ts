import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// 获取班级列表（支持分页、搜索、年级筛选；mode=options 返回轻量选项）
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get("mode")

    // 轻量模式：仅返回 id/name/grade，用于下拉选择器
    if (mode === "options") {
      const classes = await prisma.class.findMany({
        select: { id: true, name: true, grade: true },
        orderBy: [{ grade: "desc" }, { name: "asc" }],
      })
      return NextResponse.json(classes)
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "10")))
    const search = searchParams.get("search") || ""
    const grade = searchParams.get("grade") || ""

    const where: Record<string, unknown> = {}
    const conditions: Record<string, unknown>[] = []

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { teacher: { name: { contains: search, mode: "insensitive" } } },
        ]
      })
    }

    if (grade) {
      conditions.push({ grade })
    }

    if (conditions.length > 0) {
      where.AND = conditions
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        select: {
          id: true,
          name: true,
          grade: true,
          teacherId: true,
          teacher: { select: { id: true, name: true, email: true } },
          _count: { select: { students: true } },
        },
        orderBy: [{ grade: "desc" }, { name: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.class.count({ where }),
    ])

    return NextResponse.json({ classes, total, page, pageSize })
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