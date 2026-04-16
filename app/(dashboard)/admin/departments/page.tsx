import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import DepartmentManagementClient from "./department-management-client"

export default async function AdminDepartmentsPage() {
  await connection()

  const departments = await prisma.department.findMany({
    include: { majors: true },
    orderBy: { createdAt: "asc" },
  })

  return <DepartmentManagementClient initialDepartments={departments} />
}