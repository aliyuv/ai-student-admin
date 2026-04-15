"use client"

import { useState } from 'react'
import {
  Card, Table, Button, Space, Input, Select, Modal, Form,
  message, Typography, Row, Col, Tag, Statistic, Progress
} from 'antd'
import {
  PlusOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ClockCircleOutlined, CalendarOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

interface Student {
  id: string
  studentNo: string
  user: { id: string; name: string }
  class: { id: string; name: string; grade: string }
}

interface Attendance {
  id: string
  date: Date
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'
  student: Student
}

interface Props {
  students: Student[]
  attendances: Attendance[]
}

interface AttendanceFormValues {
  studentId: string
  status: Attendance["status"]
  date: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PRESENT: { label: '出勤', color: 'success', icon: <CheckCircleOutlined /> },
  ABSENT: { label: '缺勤', color: 'error', icon: <CloseCircleOutlined /> },
  LATE: { label: '迟到', color: 'warning', icon: <ClockCircleOutlined /> },
  LEAVE: { label: '请假', color: 'processing', icon: <CalendarOutlined /> },
}

const formatDate = (d: Date) => {
  const date = new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function AttendanceManagementClient({ students, attendances }: Props) {
  const [filtered, setFiltered] = useState(attendances)
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>()
  const [form] = Form.useForm()

  // 筛选
  const applyFilters = (search: string, status?: string) => {
    let result = attendances
    if (search) {
      const lower = search.toLowerCase()
      result = result.filter(a =>
        a.student.user.name.toLowerCase().includes(lower) ||
        a.student.studentNo.includes(lower)
      )
    }
    if (status) result = result.filter(a => a.status === status)
    setFiltered(result)
  }

  const handleSearch = (v: string) => { setSearchText(v); applyFilters(v, statusFilter) }
  const handleStatusFilter = (v: string | undefined) => { setStatusFilter(v); applyFilters(searchText, v) }

  const handleSubmit = async (values: AttendanceFormValues) => {
    try {
      setLoading(true)
      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (res.ok) {
        message.success('考勤录入成功')
        setIsModalVisible(false)
      } else {
        // fallback: 使用 server action
        const formData = new FormData()
        formData.set('studentId', values.studentId)
        formData.set('status', values.status)
        formData.set('date', values.date)
        const { addAttendance } = await import('./actions')
        await addAttendance(formData)
        message.success('考勤录入成功')
        setIsModalVisible(false)
        window.location.reload()
      }
    } catch {
      message.error('录入失败')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<Attendance> = [
    {
      title: '学生',
      key: 'student',
      width: 180,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{r.student.user.name}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.student.studentNo} | {r.student.class.name}</Text>
        </div>
      ),
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      render: (d: Date) => formatDate(d),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: Object.entries(STATUS_CONFIG).map(([k, v]) => ({ text: v.label, value: k })),
      onFilter: (v, r) => r.status === v,
      render: (status: string) => {
        const c = STATUS_CONFIG[status]
        return <Tag color={c.color} icon={c.icon}>{c.label}</Tag>
      },
    },
  ]

  // 统计
  const total = filtered.length
  const presentCount = filtered.filter(a => a.status === 'PRESENT').length
  const absentCount = filtered.filter(a => a.status === 'ABSENT').length
  const lateCount = filtered.filter(a => a.status === 'LATE').length
  const leaveCount = filtered.filter(a => a.status === 'LEAVE').length
  const attendRate = total > 0 ? Math.round(((presentCount + leaveCount) / total) * 100) : 100

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={8}>
          <Card styles={{ body: { padding: '20px 24px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>总出勤率</Text>
                <div style={{ fontSize: 32, fontWeight: 700, color: attendRate >= 95 ? '#10B981' : attendRate >= 85 ? '#F59E0B' : '#EF4444' }}>
                  {attendRate}%
                </div>
              </div>
              <Progress
                type="circle"
                percent={attendRate}
                size={64}
                strokeColor={attendRate >= 95 ? '#10B981' : attendRate >= 85 ? '#F59E0B' : '#EF4444'}
                format={() => ''}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card styles={{ body: { padding: '16px 24px' } }}>
            <Row gutter={16}>
              {[
                { label: '出勤', count: presentCount, color: '#10B981', icon: <CheckCircleOutlined /> },
                { label: '缺勤', count: absentCount, color: '#EF4444', icon: <CloseCircleOutlined /> },
                { label: '迟到', count: lateCount, color: '#F59E0B', icon: <ClockCircleOutlined /> },
                { label: '请假', count: leaveCount, color: '#4F46E5', icon: <CalendarOutlined /> },
              ].map(item => (
                <Col span={6} key={item.label}>
                  <Statistic
                    title={<Text type="secondary" style={{ fontSize: 12 }}>{item.label}</Text>}
                    value={item.count}
                    suffix="次"
                    prefix={<span style={{ color: item.color }}>{item.icon}</span>}
                    styles={{ content: { color: item.color, fontSize: 20 } }}
                  />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col><Title level={4} style={{ margin: 0 }}>考勤管理</Title></Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
              录入考勤
            </Button>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="搜索学生姓名或学号"
              allowClear
              onSearch={handleSearch}
              onChange={e => { if (!e.target.value) handleSearch('') }}
            />
          </Col>
          <Col span={4}>
            <Select placeholder="筛选状态" allowClear style={{ width: '100%' }} onChange={handleStatusFilter}>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
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
          size="middle"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: t => `共 ${t} 条记录`,
          }}
        />
      </Card>

      <Modal
        title="录入考勤"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnHidden
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="学生" name="studentId" rules={[{ required: true, message: '请选择学生' }]}>
            <Select placeholder="请选择学生" showSearch optionFilterProp="children">
              {students.map(s => (
                <Option key={s.id} value={s.id}>{s.user.name} ({s.studentNo})</Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="考勤状态" name="status" rules={[{ required: true, message: '请选择状态' }]} initialValue="PRESENT">
                <Select>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <Option key={k} value={k}>{v.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="日期" name="date" rules={[{ required: true, message: '请选择日期' }]}
                initialValue={formatDate(new Date())}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>提交</Button>
              <Button onClick={() => setIsModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
