import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// 更新班级
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
    const { name, grade, teacherId } = await request.json()

    if (!name || !grade || !teacherId) {
      return NextResponse.json({ error: "班级名称、年级和班主任不能为空" }, { status: 400 })
    }

    // 检查名称是否被其他班级使用
    const existing = await prisma.class.findFirst({
      where: { name, NOT: { id } }
    })
    if (existing) {
      return NextResponse.json({ error: "班级名称已被其他班级使用" }, { status: 400 })
    }

    const updated = await prisma.class.update({
      where: { id },
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error("更新班级失败:", error)
    return NextResponse.json({ error: "更新班级失败" }, { status: 500 })
  }
}

// 删除班级
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

    // 检查班级是否有学生
    const classWithStudents = await prisma.class.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } }
    })

    if (!classWithStudents) {
      return NextResponse.json({ error: "班级不存在" }, { status: 404 })
    }

    if (classWithStudents._count.students > 0) {
      return NextResponse.json(
        { error: `该班级还有 ${classWithStudents._count.students} 名学生，请先转移学生后再删除` },
        { status: 400 }
      )
    }

    await prisma.class.delete({ where: { id } })

    return NextResponse.json({ message: "班级删除成功" })
  } catch (error) {
    console.error("删除班级失败:", error)
    return NextResponse.json({ error: "删除班级失败" }, { status: 500 })
  }
}
