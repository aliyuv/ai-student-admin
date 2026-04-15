import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"

// 更新用户
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
    const body = await request.json()
    const { name, email, role, password } = body

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 检查邮箱是否被其他用户使用
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id }
        }
      })

      if (emailExists) {
        return NextResponse.json({ error: "邮箱已被其他用户使用" }, { status: 400 })
      }
    }

    // 准备更新数据
    const updateData: any = {
      name,
      email,
      role,
    }

    // 如果提供了密码，则更新密码
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // 更新用户
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        student: {
          select: {
            studentNo: true,
            class: {
              select: {
                name: true,
                grade: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("更新用户失败:", error)
    return NextResponse.json({ error: "更新用户失败" }, { status: 500 })
  }
}

// 删除用户
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

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 不允许删除管理员账户
    if (existingUser.role === "ADMIN") {
      return NextResponse.json({ error: "不能删除管理员账户" }, { status: 400 })
    }

    // 删除相关数据（如果是学生）
    if (existingUser.role === "STUDENT") {
      await prisma.student.deleteMany({
        where: { userId: id }
      })
    }

    // 删除用户
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: "用户删除成功" })
  } catch (error) {
    console.error("删除用户失败:", error)
    return NextResponse.json({ error: "删除用户失败" }, { status: 500 })
  }
}