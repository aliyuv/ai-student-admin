import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import DashboardLayoutClient from "./dashboard-layout-client"

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
    <DashboardLayoutClient user={session.user as any}>
      {children}
    </DashboardLayoutClient>
  )
}