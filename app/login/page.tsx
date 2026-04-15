"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Form,
  Input,
  Button,
  Typography,
  Alert,
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import Logo from '@/components/logo'

const { Title, Text } = Typography

const TEST_ACCOUNTS = [
  { role: '管理员', email: 'admin@school.com', pwd: 'admin123', icon: '🛡️' },
  { role: '教师', email: 'teacher1@school.com', pwd: 'teacher123', icon: '📚' },
  { role: '学生', email: 'student1@school.com', pwd: 'student123', icon: '🎓' },
]

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  async function handleSubmit(values: { email: string; password: string }) {
    setLoading(true)
    setError("")

    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError("邮箱或密码错误，请检查后重试")
    } else {
      router.push("/")
    }
  }

  // 点击测试账号快速填充
  const handleQuickFill = (email: string, pwd: string) => {
    form.setFieldsValue({ email, password: pwd })
  }

  return (
    <div className="login-page">
      {/* 背景 */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
        {/* 网格纹理 */}
        <div className="login-bg-grid" />
      </div>

      <div className="login-container">
        {/* 左侧品牌区 - 仅桌面端 */}
        <div className="login-brand">
          <div className="login-brand-content">
            <Logo size={56} showText={false} />
            <h1 className="login-brand-title">智评 EduStar</h1>
            <p className="login-brand-subtitle">AI 驱动的学生综合素质评测平台</p>
            <div className="login-brand-features">
              {[
                { icon: '🤖', text: 'AI 智能评测算法' },
                { icon: '📊', text: '多维度数据分析' },
                { icon: '🎯', text: '精准个性化建议' },
                { icon: '🔒', text: '安全可靠的数据保障' },
              ].map(f => (
                <div key={f.text} className="login-brand-feature">
                  <span className="login-brand-feature-icon">{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="login-brand-footer">
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              &copy; 2026 EduStar &middot; Powered by AI
            </Text>
          </div>
        </div>

        {/* 右侧表单区 */}
        <div className="login-form-panel">
          <div className="login-form-inner">
            {/* 移动端 Logo */}
            <div className="login-mobile-logo">
              <Logo size={40} showText={false} />
            </div>

            <div className="login-form-header">
              <Title level={3} style={{ margin: 0, color: '#111827', fontWeight: 700 }}>
                欢迎回来
              </Title>
              <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 6, display: 'block' }}>
                登录您的账号以继续使用
              </Text>
            </div>

            {error && (
              <Alert
                title={error}
                type="error"
                showIcon
                closable
                onClose={() => setError("")}
                style={{ marginBottom: 20, borderRadius: 10 }}
              />
            )}

            <Form
              form={form}
              name="login"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
              requiredMark={false}
            >
              <Form.Item
                label={<span style={{ color: '#374151', fontWeight: 500, fontSize: 13 }}>邮箱地址</span>}
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#9CA3AF' }} />}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="login-input"
                />
              </Form.Item>

              <Form.Item
                label={<span style={{ color: '#374151', fontWeight: 500, fontSize: 13 }}>密码</span>}
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  className="login-input"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 20, marginTop: 4 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className="login-submit-btn"
                >
                  <SafetyCertificateOutlined style={{ marginRight: 6 }} />
                  {loading ? "正在验证..." : "安全登录"}
                </Button>
              </Form.Item>
            </Form>

            {/* 快速登录 */}
            <div className="login-quick-section">
              <div className="login-quick-divider">
                <div className="login-quick-divider-line" />
                <span className="login-quick-divider-text">快速体验</span>
                <div className="login-quick-divider-line" />
              </div>

              <div className="login-quick-accounts">
                {TEST_ACCOUNTS.map(item => (
                  <button
                    key={item.role}
                    type="button"
                    className="login-quick-card"
                    onClick={() => handleQuickFill(item.email, item.pwd)}
                  >
                    <span className="login-quick-card-icon">{item.icon}</span>
                    <span className="login-quick-card-role">{item.role}</span>
                    <span className="login-quick-card-email">{item.email.split('@')[0]}</span>
                  </button>
                ))}
              </div>
              <Text style={{ color: '#9CA3AF', fontSize: 11, textAlign: 'center', display: 'block', marginTop: 10 }}>
                点击上方角色可快速填充账号密码
              </Text>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: #0F172A;
        }

        .login-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
        }
        .login-bg-orb-1 {
          width: 600px; height: 600px;
          top: -15%; right: -10%;
          background: radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%);
        }
        .login-bg-orb-2 {
          width: 500px; height: 500px;
          bottom: -10%; left: -8%;
          background: radial-gradient(circle, rgba(139,92,246,0.3), transparent 70%);
        }
        .login-bg-orb-3 {
          width: 300px; height: 300px;
          top: 40%; left: 30%;
          background: radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%);
        }
        .login-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .login-container {
          position: relative;
          z-index: 1;
          display: flex;
          width: 100%;
          max-width: 920px;
          min-height: 580px;
          margin: 20px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);
        }

        /* 左侧品牌区 */
        .login-brand {
          display: none;
          width: 380px;
          flex-shrink: 0;
          background: linear-gradient(160deg, rgba(79,70,229,0.9) 0%, rgba(67,56,202,0.95) 100%);
          backdrop-filter: blur(20px);
          padding: 48px 36px 32px;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .login-brand::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -30%;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }
        .login-brand-content { position: relative; z-index: 1; }
        .login-brand-title {
          font-size: 28px;
          font-weight: 800;
          color: #FFFFFF;
          margin: 20px 0 8px;
          letter-spacing: -0.02em;
        }
        .login-brand-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.7);
          margin: 0 0 36px;
          line-height: 1.5;
        }
        .login-brand-features {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .login-brand-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: rgba(255,255,255,0.85);
        }
        .login-brand-feature-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .login-brand-footer {
          position: relative;
          z-index: 1;
        }

        /* 右侧表单区 */
        .login-form-panel {
          flex: 1;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        .login-form-inner {
          width: 100%;
          max-width: 360px;
        }
        .login-mobile-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }
        .login-form-header {
          margin-bottom: 28px;
          text-align: center;
        }

        /* 输入框 */
        .login-input {
          height: 46px !important;
          border-radius: 10px !important;
          border-color: #E5E7EB !important;
          font-size: 14px !important;
        }
        .login-input:hover, .login-input:focus {
          border-color: #6366F1 !important;
        }

        /* 登录按钮 */
        .login-submit-btn {
          height: 48px !important;
          font-size: 15px !important;
          font-weight: 600 !important;
          border-radius: 12px !important;
          border: none !important;
          background: linear-gradient(135deg, #6366F1, #4F46E5) !important;
          box-shadow: 0 4px 16px rgba(79, 70, 229, 0.35) !important;
          transition: all 0.25s ease !important;
        }
        .login-submit-btn:hover {
          box-shadow: 0 6px 24px rgba(79, 70, 229, 0.5) !important;
          transform: translateY(-1px);
        }

        /* 快速登录 */
        .login-quick-section {
          margin-top: 24px;
        }
        .login-quick-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .login-quick-divider-line {
          flex: 1;
          height: 1px;
          background: #E5E7EB;
        }
        .login-quick-divider-text {
          font-size: 12px;
          color: #9CA3AF;
          white-space: nowrap;
        }
        .login-quick-accounts {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .login-quick-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 14px 8px 12px;
          border-radius: 12px;
          border: 1.5px solid #F3F4F6;
          background: #FAFBFC;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          font-family: inherit;
        }
        .login-quick-card:hover {
          border-color: #C7D2FE;
          background: #EEF2FF;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99,102,241,0.12);
        }
        .login-quick-card:active {
          transform: translateY(0);
        }
        .login-quick-card-icon {
          font-size: 22px;
          line-height: 1;
        }
        .login-quick-card-role {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }
        .login-quick-card-email {
          font-size: 10px;
          color: #9CA3AF;
        }

        /* 桌面端 */
        @media (min-width: 768px) {
          .login-brand {
            display: flex;
          }
          .login-mobile-logo {
            display: none;
          }
          .login-form-header {
            text-align: left;
          }
        }

        /* 移动端 */
        @media (max-width: 767px) {
          .login-container {
            max-width: 440px;
            min-height: auto;
            border-radius: 16px;
          }
          .login-form-panel {
            padding: 32px 24px;
          }
        }
      `}</style>
    </div>
  )
}
