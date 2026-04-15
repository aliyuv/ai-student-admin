"use client"

import { useState } from 'react'
import {
  Card, Table, Input, Select, Tag, Space, Typography, Row, Col,
  Statistic, Avatar, Progress, Badge
} from 'antd'
import {
  UserOutlined, TeamOutlined, SearchOutlined, BookOutlined,
  TrophyOutlined, CalendarOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { Search } = Input

interface StudentData {
  id: string
  studentNo: string
  name: string
  email: string
  className: string
  grade: string
  teacherName: string
  avgScore: number
  activityCount: number
  attendanceRate: number
}

interface Props {
  students: StudentData[]
  classNames: string[]
}

export default function StudentListClient({ students, classNames }: Props) {
  const [filtered, setFiltered] = useState(students)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState<string>()

  const applyFilters = (s: string, cls?: string) => {
    let result = students
    if (s) {
      const lower = s.toLowerCase()
      result = result.filter(st =>
        st.name.toLowerCase().includes(lower) ||
        st.studentNo.includes(lower) ||
        st.email.toLowerCase().includes(lower)
      )
    }
    if (cls) result = result.filter(st => st.className === cls)
    setFiltered(result)
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    applyFilters(value, classFilter)
  }

  const handleClassFilter = (value: string | undefined) => {
    setClassFilter(value)
    applyFilters(search, value)
  }

  const columns: ColumnsType<StudentData> = [
    {
      title: '学生',
      key: 'student',
      width: 220,
      fixed: 'left',
      render: (_, r) => (
        <Space>
          <Avatar
            size={36}
            style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', fontWeight: 600, fontSize: 14 }}
          >
            {r.name.slice(0, 1)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#1F2937' }}>{r.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{r.studentNo}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '班级',
      key: 'class',
      width: 160,
      filters: classNames.map(c => ({ text: c, value: c })),
      onFilter: (v, r) => r.className === v,
      render: (_, r) => (
        <div>
          <Tag color="blue" style={{ margin: 0 }}>{r.className}</Tag>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{r.grade}</div>
        </div>
      ),
    },
    {
      title: '平均成绩',
      dataIndex: 'avgScore',
      key: 'avgScore',
      width: 120,
      sorter: (a, b) => a.avgScore - b.avgScore,
      render: (v: number) => (
        <Text strong style={{
          color: v >= 85 ? '#10B981' : v >= 70 ? '#4F46E5' : v >= 60 ? '#F59E0B' : v > 0 ? '#EF4444' : '#D1D5DB',
          fontSize: 15,
        }}>
          {v > 0 ? v : '-'}
        </Text>
      ),
    },
    {
      title: '出勤率',
      dataIndex: 'attendanceRate',
      key: 'attendanceRate',
      width: 140,
      sorter: (a, b) => a.attendanceRate - b.attendanceRate,
      render: (v: number) => (
        <Progress
          percent={v}
          size="small"
          strokeColor={v >= 95 ? '#10B981' : v >= 85 ? '#F59E0B' : '#EF4444'}
          format={p => `${p}%`}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: '活动',
      dataIndex: 'activityCount',
      key: 'activityCount',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.activityCount - b.activityCount,
      render: (v: number) => (
        <Badge count={v} style={{ backgroundColor: v > 0 ? '#6366F1' : '#D1D5DB' }} showZero />
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>,
    },
  ]

  // 统计
  const total = filtered.length
  const scoredStudents = filtered.filter(s => s.avgScore > 0)
  const avgAll = scoredStudents.length > 0
    ? Math.round((scoredStudents.reduce((s, st) => s + st.avgScore, 0) / scoredStudents.length) * 10) / 10
    : 0
  const avgAtt = total > 0
    ? Math.round(filtered.reduce((s, st) => s + st.attendanceRate, 0) / total)
    : 0

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { title: '学生总数', value: total, suffix: '人', icon: <TeamOutlined />, color: '#4F46E5' },
          { title: '平均成绩', value: avgAll, precision: 1, icon: <BookOutlined />, color: '#10B981' },
          { title: '平均出勤率', value: avgAtt, suffix: '%', icon: <CalendarOutlined />, color: '#F59E0B' },
          { title: '班级数', value: classNames.length, suffix: '个', icon: <TrophyOutlined />, color: '#8B5CF6' },
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
          <Col><Title level={4} style={{ margin: 0 }}>学生管理</Title></Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="搜索姓名、学号或邮箱"
              allowClear
              onSearch={handleSearch}
              onChange={e => { if (!e.target.value) handleSearch('') }}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="筛选班级"
              allowClear
              style={{ width: '100%' }}
              onChange={handleClassFilter}
              options={classNames.map(c => ({ label: c, value: c }))}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: t => `共 ${t} 名学生`,
          }}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>
    </div>
  )
}
