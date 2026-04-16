import { Suspense } from "react"
import AntdProvider from "../antd-provider"
import AuthProvider from "../auth-provider"
import DashboardLoading from "./loading"
import DashboardLayoutWrapper from "./dashboard-layout-wrapper"

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <AntdProvider>
        <Suspense fallback={<DashboardLoading />}>
          <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
        </Suspense>
      </AntdProvider>
    </AuthProvider>
  )
}
