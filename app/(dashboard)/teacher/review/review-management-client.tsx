"use client"

import { useState } from 'react'
import {
  Card, Table, Button, Space, Input, Select, Modal, Form,
  message, Typography, Row, Col, Tag, Statistic, Popconfirm,
  Descriptions, Alert
} from 'antd'
import {
  ExperimentOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ClockCircleOutlined, EyeOutlined, ThunderboltOutlined,
  FileTextOutlined, TrophyOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text, Paragraph } = Typography
const { Search } = Input
const { Option } = Select

interface Student {
  id: string
  studentNo: string
  user: { id: string; name: string }
  class: { id: string; name: string; grade: string }
}

interface Evaluation {
  id: string
  semester: string
  aiScore: number
  aiReport: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: Date
  student: Student
}

interface Props {
  students: Student[]
  evaluations: Evaluation[]
  semesters: string[]
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: '待审核', color: 'warning', icon: <ClockCircleOutlined /> },
  APPROVED: { label: '已通过', color: 'success', icon: <CheckCircleOutlined /> },
  REJECTED: { label: '已拒绝', color: 'error', icon: <CloseCircleOutlined /> },
}

export default function ReviewManagementClient({ students, evaluations, semesters }: Props) {
  const [filtered, setFiltered] = useState(evaluations)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [isGenerateModalVisible, setIsGenerateModalVisible] = useState(false)
  const [viewingEval, setViewingEval] = useState<Evaluation | null>(null)
  const [isDetailVisible, setIsDetailVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>()
  const [form] = Form.useForm()

  const applyFilters = (search: string, status?: string) => {
    let result = evaluations
    if (search) {
      const lower = search.toLowerCase()
      result = result.filter(e =>
        e.student.user.name.toLowerCase().includes(lower) ||
        e.student.studentNo.includes(lower) ||
        e.semester.includes(lower)
      )
    }
    if (status) result = result.filter(e => e.status === status)
    setFiltered(result)
  }

  const handleSearch = (v: string) => { setSearchText(v); applyFilters(v, statusFilter) }
  const handleStatusFilter = (v: string | undefined) => { setStatusFilter(v); applyFilters(searchText, v) }

  // 发起评测
  const handleGenerate = async (values: { studentId: string; semester: string }) => {
    try {
      setGenerating(true)
      const res = await fetch('/api/ai/evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (res.ok) {
        message.success('AI 评测生成成功')
        setIsGenerateModalVisible(false)
        window.location.reload()
      } else {
        const data = await res.json()
        message.error(data.error || '评测生成失败')
      }
    } catch {
      message.error('评测生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  // 审核操作
  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      setLoading(true)
      const { updateEvaluationStatus } = await import('./actions')
      await updateEvaluationStatus(id, status)
      message.success(status === 'APPROVED' ? '已通过' : '已拒绝')
      window.location.reload()
    } catch {
      message.error('操作失败')
    } finally {
      setLoading(false)
    }
  }

  // 查看详情
  const handleViewDetail = (evaluation: Evaluation) => {
    setViewingEval(evaluation)
    setIsDetailVisible(true)
  }

  const parseReport = (reportStr: string) => {
    try { return JSON.parse(reportStr) } catch { return null }
  }

  const columns: ColumnsType<Evaluation> = [
    {
      title: '学生',
      key: 'student',
      width: 160,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{r.student.user.name}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.student.studentNo}</Text>
        </div>
      ),
    },
    {
      title: '班级',
      key: 'class',
      width: 130,
      render: (_, r) => <Tag color="blue">{r.student.class.name}</Tag>,
    },
    {
      title: '学期',
      dataIndex: 'semester',
      key: 'semester',
      width: 90,
      align: 'center',
    },
    {
      title: 'AI 评分',
      dataIndex: 'aiScore',
      key: 'aiScore',
      width: 90,
      align: 'center',
      sorter: (a, b) => a.aiScore - b.aiScore,
      render: (score: number) => (
        <Text strong style={{
          fontSize: 16,
          color: score >= 90 ? '#10B981' : score >= 80 ? '#4F46E5' : score >= 70 ? '#F59E0B' : '#EF4444',
        }}>
          {score}
        </Text>
      ),
    },
    {
      title: '等级',
      key: 'grade',
      width: 80,
      align: 'center',
      render: (_, r) => {
        const report = parseReport(r.aiReport)
        const grade = report?.grade || (r.aiScore >= 90 ? '优秀' : r.aiScore >= 80 ? '良好' : r.aiScore >= 70 ? '中等' : '合格')
        const color = r.aiScore >= 90 ? 'green' : r.aiScore >= 80 ? 'blue' : r.aiScore >= 70 ? 'orange' : 'red'
        return <Tag color={color}>{grade}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: Object.entries(STATUS_MAP).map(([k, v]) => ({ text: v.label, value: k })),
      onFilter: (v, r) => r.status === v,
      render: (status: string) => {
        const c = STATUS_MAP[status]
        return <Tag color={c.color} icon={c.icon}>{c.label}</Tag>
      },
    },
    {
      title: '评测时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (d: Date) => <Text type="secondary" style={{ fontSize: 12 }}>{new Date(d).toLocaleDateString('zh-CN')}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Popconfirm title="确定通过此评测？" onConfirm={() => handleUpdateStatus(record.id, 'APPROVED')} okText="确定" cancelText="取消">
                <Button type="link" size="small" style={{ color: '#10B981' }}>通过</Button>
              </Popconfirm>
              <Popconfirm title="确定拒绝此评测？" onConfirm={() => handleUpdateStatus(record.id, 'REJECTED')} okText="确定" cancelText="取消">
                <Button type="link" danger size="small">拒绝</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ]

  // 统计
  const total = filtered.length
  const pendingCount = filtered.filter(e => e.status === 'PENDING').length
  const approvedCount = filtered.filter(e => e.status === 'APPROVED').length
  const avgScore = total > 0
    ? Math.round((filtered.reduce((s, e) => s + e.aiScore, 0) / total) * 10) / 10
    : 0

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { title: '评测总数', value: total, suffix: '份', icon: <FileTextOutlined />, color: '#4F46E5' },
          { title: '待审核', value: pendingCount, suffix: '份', icon: <ClockCircleOutlined />, color: '#F59E0B' },
          { title: '已通过', value: approvedCount, suffix: '份', icon: <CheckCircleOutlined />, color: '#10B981' },
          { title: '平均分', value: avgScore, precision: 1, icon: <TrophyOutlined />, color: '#8B5CF6' },
        ].map(item => (
          <Col xs={12} md={6} key={item.title}>
            <Card hoverable styles={{ body: { padding: '16px 20px' } }}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>{item.title}</Text>}
                value={item.value}
                precision={item.precision}
                suffix={item.suffix}
                prefix={<span style={{ color: item.color, marginRight: 4 }}>{item.icon}</span>}
                styles={{ content: { color: item.color, fontSize: 22 } }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col><Title level={4} style={{ margin: 0 }}>评测审核</Title></Col>
          <Col>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => setIsGenerateModalVisible(true)}
            >
              发起 AI 评测
            </Button>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search placeholder="搜索学生姓名、学号或学期" allowClear onSearch={handleSearch}
              onChange={e => { if (!e.target.value) handleSearch('') }}
            />
          </Col>
          <Col span={4}>
            <Select placeholder="筛选状态" allowClear style={{ width: '100%' }} onChange={handleStatusFilter}>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <Option key={k} value={k}>{v.label}</Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          scroll={{ x: 960 }}
          size="middle"
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: t => `共 ${t} 条记录`,
          }}
        />
      </Card>

      {/* 发起评测模态框 */}
      <Modal
        title={<Space><ThunderboltOutlined style={{ color: '#4F46E5' }} />发起 AI 评测</Space>}
        open={isGenerateModalVisible}
        onCancel={() => setIsGenerateModalVisible(false)}
        footer={null}
        width={480}
      >
        <Alert
          title="AI 将根据学生的成绩、活动、考勤等数据自动生成综合评测报告"
          type="info"
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
        <Form form={form} layout="vertical" onFinish={handleGenerate}>
          <Form.Item label="选择学生" name="studentId" rules={[{ required: true, message: '请选择学生' }]}>
            <Select placeholder="请选择学生" showSearch optionFilterProp="children">
              {students.map(s => (
                <Option key={s.id} value={s.id}>
                  {s.user.name} ({s.studentNo}) - {s.class.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="学期" name="semester" rules={[{ required: true, message: '请选择学期' }]}>
            <Select placeholder="请选择学期">
              {semesters.map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={generating} icon={<ExperimentOutlined />}>
                {generating ? '生成中...' : '生成评测'}
              </Button>
              <Button onClick={() => setIsGenerateModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 评测详情模态框 */}
      <Modal
        title="评测详情"
        open={isDetailVisible}
        onCancel={() => setIsDetailVisible(false)}
        footer={
          <Space>
            {viewingEval?.status === 'PENDING' && (
              <>
                <Button
                  type="primary"
                  style={{ background: '#10B981', borderColor: '#10B981' }}
                  onClick={() => { handleUpdateStatus(viewingEval.id, 'APPROVED'); setIsDetailVisible(false) }}
                >
                  通过
                </Button>
                <Button danger onClick={() => { handleUpdateStatus(viewingEval!.id, 'REJECTED'); setIsDetailVisible(false) }}>
                  拒绝
                </Button>
              </>
            )}
            <Button onClick={() => setIsDetailVisible(false)}>关闭</Button>
          </Space>
        }
        width={680}
      >
        {viewingEval && (() => {
          const report = parseReport(viewingEval.aiReport)
          return (
            <div>
              <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="学生">{viewingEval.student.user.name}</Descriptions.Item>
                <Descriptions.Item label="学号">{viewingEval.student.studentNo}</Descriptions.Item>
                <Descriptions.Item label="班级">{viewingEval.student.class.name}</Descriptions.Item>
                <Descriptions.Item label="学期">{viewingEval.semester}</Descriptions.Item>
                <Descriptions.Item label="AI 评分">
                  <Text strong style={{ fontSize: 18, color: '#4F46E5' }}>{viewingEval.aiScore}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={STATUS_MAP[viewingEval.status].color} icon={STATUS_MAP[viewingEval.status].icon}>
                    {STATUS_MAP[viewingEval.status].label}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              {report && (
                <>
                  <Card size="small" title="评测维度" style={{ marginBottom: 12 }}>
                    <Row gutter={16}>
                      {[
                        { label: '学业成绩', key: 'academic', color: '#4F46E5' },
                        { label: '课外活动', key: 'activity', color: '#10B981' },
                        { label: '品行表现', key: 'conduct', color: '#F59E0B' },
                        { label: '出勤情况', key: 'attendance', color: '#8B5CF6' },
                      ].map(dim => (
                        <Col span={6} key={dim.key}>
                          <Statistic
                            title={<Text type="secondary" style={{ fontSize: 11 }}>{dim.label}</Text>}
                            value={report.dimensions?.[dim.key] ?? '-'}
                            styles={{ content: { color: dim.color, fontSize: 20 } }}
                          />
                        </Col>
                      ))}
                    </Row>
                  </Card>

                  {report.summary && (
                    <Card size="small" title="综合评语" style={{ marginBottom: 12 }}>
                      <Paragraph style={{ margin: 0 }}>{report.summary}</Paragraph>
                    </Card>
                  )}

                  <Row gutter={12}>
                    {report.strengths?.length > 0 && (
                      <Col span={12}>
                        <Card size="small" title={<Text style={{ color: '#10B981' }}>优势</Text>}>
                          {report.strengths.map((s: string, i: number) => (
                            <Tag key={i} color="green" style={{ margin: '2px 4px 2px 0' }}>{s}</Tag>
                          ))}
                        </Card>
                      </Col>
                    )}
                    {report.suggestions?.length > 0 && (
                      <Col span={12}>
                        <Card size="small" title={<Text style={{ color: '#F59E0B' }}>建议</Text>}>
                          {report.suggestions.map((s: string, i: number) => (
                            <Tag key={i} color="orange" style={{ margin: '2px 4px 2px 0' }}>{s}</Tag>
                          ))}
                        </Card>
                      </Col>
                    )}
                  </Row>
                </>
              )}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
