import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import UserManagementClient from "./user-management-client"

const PAGE_SIZE = 10

export default async function AdminUsersPage() {
  await connection()

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            studentNo: true,
            classId: true,
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
              }
            }
          }
        }
      }
    }),
    prisma.user.count(),
  ])

  return (
    <UserManagementClient
      initialUsers={users}
      initialTotal={total}
      initialPage={1}
      initialPageSize={PAGE_SIZE}
    />
  )
}
