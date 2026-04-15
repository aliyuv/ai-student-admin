"use client"

interface LogoProps {
  size?: number
  showText?: boolean
  collapsed?: boolean
}

export default function Logo({ size = 36, showText = true, collapsed = false }: LogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: collapsed ? 0 : 12 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="logo-grad-1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
          <linearGradient id="logo-grad-2" x1="10" y1="8" x2="38" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>
        {/* 背景圆角方块 */}
        <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#logo-grad-1)" />
        {/* 学位帽 - 主体 */}
        <path
          d="M24 14L10 21L24 28L38 21L24 14Z"
          fill="white"
          fillOpacity="0.95"
        />
        {/* 学位帽 - 帽檐阴影 */}
        <path
          d="M24 28L10 21V26L24 33L38 26V21L24 28Z"
          fill="white"
          fillOpacity="0.6"
        />
        {/* 星形高光 */}
        <path
          d="M37 14L38.2 17.1L41.5 17.3L39 19.4L39.7 22.6L37 20.9L34.3 22.6L35 19.4L32.5 17.3L35.8 17.1L37 14Z"
          fill="#FCD34D"
        />
        {/* 流苏 */}
        <line x1="38" y1="21" x2="38" y2="30" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
        <circle cx="38" cy="31" r="1.5" fill="#FCD34D" />
      </svg>

      {showText && !collapsed && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span
            style={{
              fontSize: size > 32 ? 18 : 15,
              fontWeight: 700,
              color: "inherit",
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
            }}
          >
            智评 EduStar
          </span>
          {size > 32 && (
            <span
              style={{
                fontSize: 11,
                color: "inherit",
                opacity: 0.6,
                whiteSpace: "nowrap",
                marginTop: 1,
              }}
            >
              AI 智能评测平台
            </span>
          )}
        </div>
      )}
    </div>
  )
}
