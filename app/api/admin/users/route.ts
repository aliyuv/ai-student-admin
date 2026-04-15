import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"

// 获取所有用户
export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
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
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("获取用户列表失败:", error)
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 })
  }
}

// 创建新用户
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, role, password, studentNo, classId } = body

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: "邮箱已存在" }, { status: 400 })
    }

    // 如果是学生，检查学号是否已存在
    if (role === "STUDENT" && studentNo) {
      const existingStudent = await prisma.student.findUnique({
        where: { studentNo }
      })

      if (existingStudent) {
        return NextResponse.json({ error: "学号已存在" }, { status: 400 })
      }
    }

    // 创建用户
    const hashedPassword = await bcrypt.hash(password || "123456", 10)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })

    // 如果是学生，创建学生记录
    if (role === "STUDENT" && studentNo && classId) {
      await prisma.student.create({
        data: {
          studentNo,
          userId: newUser.id,
          classId,
        }
      })
    }

    // 重新获取完整的用户信息
    const userWithDetails = await prisma.user.findUnique({
      where: { id: newUser.id },
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

    return NextResponse.json(userWithDetails, { status: 201 })
  } catch (error) {
    console.error("创建用户失败:", error)
    return NextResponse.json({ error: "创建用户失败" }, { status: 500 })
  }
}