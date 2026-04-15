import { prisma } from "@/lib/prisma"
import UserManagementClient from "./user-management-client"

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        include: {
          class: true
        }
      }
    }
  })

  return <UserManagementClient initialUsers={users} />
}
