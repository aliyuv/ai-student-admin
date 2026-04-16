import { Suspense } from "react"
import AntdProvider from "../antd-provider"
import LoginPageClient from "./login-page-client"

function LoginPageFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0F172A",
        color: "#E5E7EB",
      }}
    >
      正在加载登录页...
    </div>
  )
}

export default function LoginPage() {
  return (
    <AntdProvider>
      <Suspense fallback={<LoginPageFallback />}>
        <LoginPageClient />
      </Suspense>
    </AntdProvider>
  )
}
