"use client"

import { useState } from 'react'
import { Layout, Menu, Avatar, Typography, theme, Tag, Tooltip } from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  BarChartOutlined,
  FileTextOutlined,
  EditOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  ProfileOutlined,
  ExperimentOutlined,
  ExclamationCircleOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BankOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { signOut } from "next-auth/react"
import Logo from '@/components/logo'

const { Header, Sider, Content } = Layout
const { Text } = Typography

interface DashboardUser {
  id: string
  name?: string | null
  email?: string | null
  role: string
}

interface DashboardLayoutProps {
  children: React.ReactNode
  user: DashboardUser
}

// 角色中文映射
const ROLE_MAP: Record<string, { label: string; color: string; tag: string }> = {
  ADMIN:   { label: '管理员', color: '#4F46E5', tag: 'purple' },
  TEACHER: { label: '教师',   color: '#0891B2', tag: 'cyan' },
  STUDENT: { label: '学生',   color: '#059669', tag: 'green' },
}

// 页面标题映射
const PAGE_TITLES: Record<string, string> = {
  '/admin/users':             '用户管理',
  '/admin/classes':           '班级管理',
  '/admin/departments':       '院系专业',
  '/admin/evaluation-config': '评测配置',
  '/admin/stats':             '统计分析',
  '/teacher/students':        '学生管理',
  '/teacher/scores':          '成绩录入',
  '/teacher/activities':      '活动实践',
  '/teacher/attendance':      '考勤管理',
  '/teacher/review':          '评测审核',
  '/student/profile':         '个人信息',
  '/student/evaluation':      '评测结果',
  '/student/appeal':          '申诉管理',
}

// 菜单配置 — 带分组
const getMenuItems = (role: string) => {
  const config = {
    ADMIN: [
      { type: 'group' as const, label: '系统管理', children: [
        { key: '/admin/users',        icon: <UserOutlined />,        label: <Link href="/admin/users">用户管理</Link> },
        { key: '/admin/classes',      icon: <TeamOutlined />,        label: <Link href="/admin/classes">班级管理</Link> },
        { key: '/admin/departments',  icon: <BankOutlined />,        label: <Link href="/admin/departments">院系专业</Link> },
      ]},
      { type: 'group' as const, label: '评测中心', children: [
        { key: '/admin/evaluation-config', icon: <ExperimentOutlined />, label: <Link href="/admin/evaluation-config">评测配置</Link> },
        { key: '/admin/stats',             icon: <BarChartOutlined />,   label: <Link href="/admin/stats">统计分析</Link> },
      ]},
    ],
    TEACHER: [
      { type: 'group' as const, label: '教学管理', children: [
        { key: '/teacher/students',   icon: <TeamOutlined />,         label: <Link href="/teacher/students">学生管理</Link> },
        { key: '/teacher/scores',     icon: <EditOutlined />,         label: <Link href="/teacher/scores">成绩录入</Link> },
        { key: '/teacher/activities', icon: <FileTextOutlined />,     label: <Link href="/teacher/activities">活动实践</Link> },
      ]},
      { type: 'group' as const, label: '日常工作', children: [
        { key: '/teacher/attendance', icon: <CalendarOutlined />,     label: <Link href="/teacher/attendance">考勤管理</Link> },
        { key: '/teacher/review',    icon: <CheckSquareOutlined />,  label: <Link href="/teacher/review">评测审核</Link> },
      ]},
    ],
    STUDENT: [
      { type: 'group' as const, label: '我的空间', children: [
        { key: '/student/profile',    icon: <ProfileOutlined />,           label: <Link href="/student/profile">个人信息</Link> },
        { key: '/student/evaluation', icon: <FileTextOutlined />,          label: <Link href="/student/evaluation">评测结果</Link> },
        { key: '/student/appeal',     icon: <ExclamationCircleOutlined />, label: <Link href="/student/appeal">申诉管理</Link> },
      ]},
    ],
  }
  return config[role as keyof typeof config] || []
}

export default function DashboardLayoutClient({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { token } = theme.useToken()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = getMenuItems(user.role)
  const selectedKeys = [pathname]
  const roleInfo = ROLE_MAP[user.role] || ROLE_MAP.STUDENT
  const pageTitle = PAGE_TITLES[pathname] || '工作台'
  const userName = user.name || '用户'
  const initials = userName.slice(0, 1)

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ── 侧边栏 ─────────────────────────────────────────── */}
      <Sider
        width={260}
        collapsedWidth={72}
        collapsed={collapsed}
        theme="light"
        className="edustar-sider"
        style={{
          overflow: 'hidden',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
        }}
      >
        {/* 整个侧边栏的 flex 容器 */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo 区 */}
          <div
            className="edustar-logo-area"
            style={{
              padding: collapsed ? '20px 12px 16px' : '20px 20px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderBottom: '1px solid #F3F4F6',
            }}
          >
            {collapsed ? (
              <Tooltip title="智评 EduStar" placement="right">
                <div><Logo size={36} showText={false} /></div>
              </Tooltip>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Logo size={38} showText={false} />
                <div style={{ lineHeight: 1.3 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#1F2937', letterSpacing: '-0.01em' }}>
                    智评 EduStar
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                    AI 智能评测平台
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 角色标签 */}
          {!collapsed && (
            <div style={{ padding: '12px 20px 4px' }}>
              <Tag
                color={roleInfo.tag}
                style={{
                  borderRadius: 6,
                  fontSize: 12,
                  padding: '2px 10px',
                  border: 'none',
                }}
              >
                <DashboardOutlined style={{ marginRight: 4 }} />
                {roleInfo.label}工作台
              </Tag>
            </div>
          )}

          {/* 菜单区 */}
          <div
            className="edustar-menu-scroll"
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '8px 0',
            }}
          >
            <Menu
              mode="inline"
              selectedKeys={selectedKeys}
              items={menuItems}
              style={{
                border: 'none',
                background: 'transparent',
              }}
            />
          </div>

          {/* 底部用户区 */}
          <div
            className="edustar-user-area"
            style={{
              borderTop: '1px solid #F3F4F6',
              padding: collapsed ? '12px 8px' : '16px',
            }}
          >
            {collapsed ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <Tooltip title={userName} placement="right">
                  <Avatar
                    size={36}
                    style={{
                      background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {initials}
                  </Avatar>
                </Tooltip>
                <Tooltip title="退出登录" placement="right">
                  <div
                    onClick={handleLogout}
                    style={{
                      cursor: 'pointer',
                      color: '#9CA3AF',
                      fontSize: 16,
                      padding: 4,
                      borderRadius: 6,
                      transition: 'all 0.2s',
                    }}
                    className="edustar-logout-btn"
                  >
                    <LogoutOutlined />
                  </div>
                </Tooltip>
              </div>
            ) : (
              <div
                className="edustar-user-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#F9FAFB',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <Avatar
                    size={36}
                    style={{
                      background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                      fontSize: 15,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </Avatar>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1F2937',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {userName}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: '#9CA3AF',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {user.email || ''}
                    </div>
                  </div>
                </div>
                <Tooltip title="退出登录">
                  <div
                    onClick={handleLogout}
                    className="edustar-logout-btn"
                    style={{
                      cursor: 'pointer',
                      color: '#9CA3AF',
                      fontSize: 16,
                      padding: '6px',
                      borderRadius: 6,
                      transition: 'all 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <LogoutOutlined />
                  </div>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </Sider>

      {/* ── 主区域 ─────────────────────────────────────────── */}
      <Layout style={{ marginLeft: collapsed ? 72 : 260, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <Header
          style={{
            padding: '0 24px',
            background: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #E5E7EB',
            height: 56,
            lineHeight: '56px',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              onClick={() => setCollapsed(!collapsed)}
              className="edustar-collapse-btn"
              style={{
                cursor: 'pointer',
                fontSize: 18,
                color: '#6B7280',
                padding: '4px 8px',
                borderRadius: 6,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
            <div style={{ height: 20, width: 1, background: '#E5E7EB' }} />
            <Text strong style={{ fontSize: 16, color: '#1F2937' }}>
              {pageTitle}
            </Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {userName}
            </Text>
            <Avatar
              size={32}
              style={{
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {initials}
            </Avatar>
          </div>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: 20,
            padding: 24,
            background: '#FFFFFF',
            borderRadius: 12,
            minHeight: 'calc(100vh - 96px)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
