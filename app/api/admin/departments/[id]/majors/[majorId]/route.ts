import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// 更新专业
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; majorId: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 })
    }

    const { majorId } = await params
    const { name, code } = await request.json()

    if (!name || !code) {
      return NextResponse.json({ error: "专业名称和编码不能为空" }, { status: 400 })
    }

    const existing = await prisma.major.findFirst({
      where: { code, NOT: { id: majorId } },
    })
    if (existing) {
      return NextResponse.json({ error: "专业编码已被其他专业使用" }, { status: 400 })
    }

    const updated = await prisma.major.update({
      where: { id: majorId },
      data: { name, code },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("更新专业失败:", error)
    return NextResponse.json({ error: "更新专业失败" }, { status: 500 })
  }
}

// 删除专业
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; majorId: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 })
    }

    const { majorId } = await params

    const major = await prisma.major.findUnique({ where: { id: majorId } })
    if (!major) {
      return NextResponse.json({ error: "专业不存在" }, { status: 404 })
    }

    await prisma.major.delete({ where: { id: majorId } })

    return NextResponse.json({ message: "专业删除成功" })
  } catch (error) {
    console.error("删除专业失败:", error)
    return NextResponse.json({ error: "删除专业失败" }, { status: 500 })
  }
}
