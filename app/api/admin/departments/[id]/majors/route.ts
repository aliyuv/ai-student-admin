import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// 添加专业
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 })
    }

    const { id: departmentId } = await params
    const { name, code } = await request.json()

    if (!name || !code) {
      return NextResponse.json({ error: "专业名称和编码不能为空" }, { status: 400 })
    }

    const existing = await prisma.major.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: "专业编码已存在" }, { status: 400 })
    }

    const major = await prisma.major.create({
      data: { name, code, departmentId },
    })

    return NextResponse.json(major, { status: 201 })
  } catch (error) {
    console.error("添加专业失败:", error)
    return NextResponse.json({ error: "添加专业失败" }, { status: 500 })
  }
}
