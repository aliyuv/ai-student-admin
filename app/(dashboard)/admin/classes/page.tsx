import { prisma } from "@/lib/prisma"
import ClassManagementClient from "./class-management-client"

export default async function AdminClassesPage() {
  const [classes, teachers] = await Promise.all([
    prisma.class.findMany({
      include: {
        teacher: true,
        _count: { select: { students: true } }
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "TEACHER" },
      select: { id: true, name: true, email: true }
    })
  ])

  return <ClassManagementClient initialClasses={classes} teachers={teachers} />
}
