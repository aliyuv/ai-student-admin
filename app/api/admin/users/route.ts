import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"

// 获取用户列表（支持分页、搜索、角色筛选）
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "10")))
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || ""

    // 构建 where 条件
    const where: Record<string, unknown> = {}
    const conditions: Record<string, unknown>[] = []

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ]
      })
    }

    if (role && ["ADMIN", "TEACHER", "STUDENT"].includes(role)) {
      conditions.push({ role })
    }

    if (conditions.length > 0) {
      where.AND = conditions
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ users, total, page, pageSize })
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

    // 创建用户（事务保证 user + student 原子性）
    const hashedPassword = await bcrypt.hash(password || "123456", 10)

    const userWithDetails = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
      })

      // 如果是学生，创建学生记录
      if (role === "STUDENT" && studentNo && classId) {
        await tx.student.create({
          data: {
            studentNo,
            userId: newUser.id,
            classId,
          }
        })
      }

      // 返回完整的用户信息
      return tx.user.findUnique({
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
    })

    return NextResponse.json(userWithDetails, { status: 201 })
  } catch (error) {
    console.error("创建用户失败:", error)
    return NextResponse.json({ error: "创建用户失败" }, { status: 500 })
  }
}