import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import UserManagementClient from "./user-management-client"

const PAGE_SIZE = 10

export default async function AdminUsersPage() {
  const t0 = performance.now()
  await connection()
  const t1 = performance.now()

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
  const t2 = performance.now()

  console.log(`[perf] /admin/users — connection: ${(t1-t0).toFixed(0)}ms, query: ${(t2-t1).toFixed(0)}ms, total: ${(t2-t0).toFixed(0)}ms, rows: ${users.length}/${total}`)

  return (
    <UserManagementClient
      initialUsers={users}
      initialTotal={total}
      initialPage={1}
      initialPageSize={PAGE_SIZE}
    />
  )
}
