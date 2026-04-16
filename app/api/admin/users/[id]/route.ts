import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"

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
    const updateData: Prisma.UserUpdateInput = {
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

    // 使用事务删除用户及其所有关联数据
    await prisma.$transaction(async (tx) => {
      if (existingUser.role === "STUDENT") {
        // 查找该用户对应的学生记录
        const student = await tx.student.findUnique({ where: { userId: id } })

        if (student) {
          // 先删除 evaluation 下的 appeals
          await tx.appeal.deleteMany({
            where: { evaluation: { studentId: student.id } }
          })
          // 删除 evaluations
          await tx.evaluation.deleteMany({ where: { studentId: student.id } })
          // 删除 scores、activities、awards、attendances
          await tx.score.deleteMany({ where: { studentId: student.id } })
          await tx.activity.deleteMany({ where: { studentId: student.id } })
          await tx.award.deleteMany({ where: { studentId: student.id } })
          await tx.attendance.deleteMany({ where: { studentId: student.id } })
          // 删除学生记录
          await tx.student.delete({ where: { id: student.id } })
        }
      }

      // 如果是教师，需要先解除班级关联（否则外键约束失败）
      if (existingUser.role === "TEACHER") {
        const classCount = await tx.class.count({ where: { teacherId: id } })
        if (classCount > 0) {
          throw new Error(`该教师还管理 ${classCount} 个班级，请先更换班主任后再删除`)
        }
      }

      // 删除用户
      await tx.user.delete({ where: { id } })
    })

    return NextResponse.json({ message: "用户删除成功" })
  } catch (error) {
    console.error("删除用户失败:", error)
    const message = error instanceof Error ? error.message : "删除用户失败"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}