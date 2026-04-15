import { prisma } from "@/lib/prisma"
import ActivityManagementClient from "./activity-management-client"

export default async function ActivitiesPage() {
  const [students, activities] = await Promise.all([
    prisma.student.findMany({
      include: {
        user: true,
        class: true
      },
      orderBy: { user: { name: "asc" } }
    }),
    prisma.activity.findMany({
      include: {
        student: {
          include: {
            user: true,
            class: true
          }
        }
      },
      orderBy: { date: "desc" }
    })
  ])

  return <ActivityManagementClient students={students} activities={activities} />
}
