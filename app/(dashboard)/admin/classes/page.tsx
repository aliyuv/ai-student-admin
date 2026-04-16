import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import ClassManagementClient from "./class-management-client"

const PAGE_SIZE = 10

export default async function AdminClassesPage() {
  await connection()

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
