"use client"

import { useEffect } from 'react'
import { ConfigProvider, App, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add('hydrated')
  }, [])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#4F46E5',
          colorInfo: '#4F46E5',
          colorSuccess: '#10B981',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          borderRadius: 8,
          fontSize: 14,
          colorBgLayout: '#F5F7FA',
        },
        components: {
          Layout: {
            siderBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            bodyBg: '#F5F7FA',
          },
          Menu: {
            itemBg: 'transparent',
            itemSelectedBg: '#EEF2FF',
            itemSelectedColor: '#4F46E5',
            itemHoverBg: '#F5F7FA',
            itemHoverColor: '#4F46E5',
            itemBorderRadius: 8,
            itemMarginInline: 8,
            iconSize: 16,
          },
          Card: {
            borderRadiusLG: 12,
          },
          Table: {
            borderRadius: 12,
            headerBg: '#FAFBFC',
          },
          Button: {
            borderRadius: 8,
            controlHeight: 36,
          },
          Input: {
            borderRadius: 8,
          },
          Select: {
            borderRadius: 8,
          },
        },
      }}
    >
      <App>
        {children}
      </App>
    </ConfigProvider>
  )
}
