import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import DashboardLayoutClient from "./dashboard-layout-client"

interface DashboardUser {
  id: string
  name?: string | null
  email?: string | null
  role: string
}

export default async function DashboardLayoutWrapper({
  children
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <DashboardLayoutClient user={session.user as DashboardUser}>
      {children}
    </DashboardLayoutClient>
  )
}