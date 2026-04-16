import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// 更新院系
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 })
    }

    const { id } = await params
    const { name, code, description } = await request.json()

    if (!name || !code) {
      return NextResponse.json({ error: "院系名称和编码不能为空" }, { status: 400 })
    }

    const existing = await prisma.department.findFirst({
      where: { OR: [{ name }, { code }], NOT: { id } },
    })
    if (existing) {
      return NextResponse.json({ error: "院系名称或编码已被其他院系使用" }, { status: 400 })
    }

    const updated = await prisma.department.update({
      where: { id },
      data: { name, code, description: description ?? "" },
      include: { majors: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("更新院系失败:", error)
    return NextResponse.json({ error: "更新院系失败" }, { status: 500 })
  }
}

// 删除院系
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 })
    }

    const { id } = await params

    const dept = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { majors: true } } },
    })

    if (!dept) {
      return NextResponse.json({ error: "院系不存在" }, { status: 404 })
    }

    if (dept._count.majors > 0) {
      return NextResponse.json(
        { error: `该院系还有 ${dept._count.majors} 个专业，请先删除专业后再删除院系` },
        { status: 400 }
      )
    }

    await prisma.department.delete({ where: { id } })

    return NextResponse.json({ message: "院系删除成功" })
  } catch (error) {
    console.error("删除院系失败:", error)
    return NextResponse.json({ error: "删除院系失败" }, { status: 500 })
  }
}
