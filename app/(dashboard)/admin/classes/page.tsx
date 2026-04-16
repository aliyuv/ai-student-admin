import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import ClassManagementClient from "./class-management-client"

const PAGE_SIZE = 10

export default async function AdminClassesPage() {
  const t0 = performance.now()
  await connection()
  const t1 = performance.now()

  const [classes, total, teachers] = await Promise.all([
    prisma.class.findMany({
      select: {
        id: true,
        name: true,
        grade: true,
        teacherId: true,
        teacher: { select: { id: true, name: true, email: true } },
        _count: { select: { students: true } },
      },
      orderBy: [{ grade: "desc" }, { name: "asc" }],
      take: PAGE_SIZE,
    }),
    prisma.class.count(),
    prisma.user.findMany({
      where: { role: "TEACHER" },
      select: { id: true, name: true, email: true },
    }),
  ])
  const t2 = performance.now()

  console.log(`[perf] /admin/classes — connection: ${(t1-t0).toFixed(0)}ms, query: ${(t2-t1).toFixed(0)}ms, total: ${(t2-t0).toFixed(0)}ms, classes: ${classes.length}/${total}`)

  return (
    <ClassManagementClient
      initialClasses={classes}
      initialTotal={total}
      initialPage={1}
      initialPageSize={PAGE_SIZE}
      teachers={teachers}
    />
  )
}
