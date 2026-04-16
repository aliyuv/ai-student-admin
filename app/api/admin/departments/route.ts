import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// 获取所有院系
export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 })
    }

    const departments = await prisma.department.findMany({
      include: { majors: true },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(departments)
  } catch (error) {
    console.error("获取院系列表失败:", error)
    return NextResponse.json({ error: "获取院系列表失败" }, { status: 500 })
  }
}

// 创建院系
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 })
    }

    const { name, code, description } = await request.json()

    if (!name || !code) {
      return NextResponse.json({ error: "院系名称和编码不能为空" }, { status: 400 })
    }

    const existing = await prisma.department.findFirst({
      where: { OR: [{ name }, { code }] },
    })
    if (existing) {
      return NextResponse.json({ error: "院系名称或编码已存在" }, { status: 400 })
    }

    const dept = await prisma.department.create({
      data: { name, code, description: description ?? "" },
      include: { majors: true },
    })

    return NextResponse.json(dept, { status: 201 })
  } catch (error) {
    console.error("创建院系失败:", error)
    return NextResponse.json({ error: "创建院系失败" }, { status: 500 })
  }
}
