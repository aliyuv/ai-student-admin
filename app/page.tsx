import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { connection } from "next/server"
import { redirect } from "next/navigation"

async function HomeRedirect() {
  await connection()

  const session = await auth()
  if (!session) redirect("/login")

  const role = session.user?.role?.toLowerCase()
  redirect(`/${role}`)
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeRedirect />
    </Suspense>
  )
}
