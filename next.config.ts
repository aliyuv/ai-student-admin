import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 关闭 React 严格模式
  reactStrictMode: false,

  // 部署时忽略 ESLint 错误
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 部署时忽略 TypeScript 错误
  typescript: {
    ignoreBuildErrors: true,
  },

  // 确保样式正确加载
  experimental: {
    optimizePackageImports: ['antd']
  },

  // 编译器选项
  compiler: {
    // 移除console.log（生产环境）
    removeConsole: process.env.NODE_ENV === "production",
  },

  // 静态资源缓存
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          }
        ],
      },
    ];
  },
};

export default nextConfig;
