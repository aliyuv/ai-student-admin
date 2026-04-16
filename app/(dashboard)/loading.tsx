export default function DashboardLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F5F7FA",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          color: "#6B7280",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "9999px",
            border: "3px solid #E5E7EB",
            borderTopColor: "#4F46E5",
            animation: "dashboard-loading-spin 0.8s linear infinite",
          }}
        />
        <div style={{ fontSize: 14 }}>正在加载工作台...</div>
      </div>
    </div>
  )
}
