"use client"

import { useState } from 'react'
import {
  Card, Table, Button, Space, Input, Select, Modal, Form,
  message, Popconfirm, Typography, Row, Col, Tag, InputNumber,
  Tabs, Descriptions, Statistic, Tooltip
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  TeamOutlined, TrophyOutlined, EyeOutlined,
  ExperimentOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { addActivity, updateActivity, deleteActivity } from './actions'

const formatDate = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

interface Student {
  id: string
  studentNo: string
  user: { id: string; name: string; email: string }
  class: { id: string; name: string; grade: string }
}

interface Activity {
  id: string
  type: 'ACTIVITY' | 'PRACTICE'
  title: string
  score: number
  date: Date
  createdAt: Date
  student: Student
}

interface ActivityManagementClientProps {
  students: Student[]
  activities: Activity[]
}

interface ActivityTemplate {
  title: string
  score: number
  description: string
}

interface ActivityFormValues {
  studentId: string
  type: Activity["type"]
  title: string
  score: number
  date: string
}

const activityTypes = [
  { value: 'ACTIVITY', label: '社团活动', color: 'blue', icon: <TeamOutlined /> },
  { value: 'PRACTICE', label: '实践项目', color: 'green', icon: <ExperimentOutlined /> },
]

const activityTemplates = {
  ACTIVITY: [
    { title: '学生会干部', score: 5, description: '担任学生会各部门干部职务' },
    { title: '社团组织活动', score: 3, description: '组织或参与社团活动' },
    { title: '志愿服务活动', score: 2, description: '参与各类志愿服务' },
    { title: '文艺表演', score: 2, description: '参与学校文艺演出' },
    { title: '体育竞赛', score: 3, description: '参与体育比赛获得名次' },
  ],
  PRACTICE: [
    { title: '企业实习', score: 8, description: '在企业进行专业实习' },
    { title: '科研项目', score: 6, description: '参与教师科研项目' },
    { title: '创新创业项目', score: 5, description: '参与创新创业竞赛' },
    { title: '学术竞赛', score: 4, description: '参与学科专业竞赛' },
    { title: '社会调研', score: 3, description: '进行社会实践调研' },
  ],
}

export default function ActivityManagementClient({ students, activities: initialActivities }: ActivityManagementClientProps) {
  const [activitiesList, setActivitiesList] = useState<Activity[]>(initialActivities)
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>(initialActivities)
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isDetailVisible, setIsDetailVisible] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [viewingActivity, setViewingActivity] = useState<Activity | null>(null)
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>()
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null)
  const [form] = Form.useForm()

  const columns: ColumnsType<Activity> = [
    {
      title: '学生',
      key: 'studentInfo',
      width: 160,
      ellipsis: true,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{r.student.user.name}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.student.studentNo}</Text>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      filters: activityTypes.map(t => ({ text: t.label, value: t.value })),
      onFilter: (v, r) => r.type === v,
      render: (type: string) => {
        const c = activityTypes.find(t => t.value === type)
        return c ? <Tag color={c.color}>{c.label}</Tag> : type
      },
    },
    {
      title: '活动标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (title: string) => (
        <Tooltip title={title}>
          <Text style={{ color: '#4F46E5', fontWeight: 500 }}>{title}</Text>
        </Tooltip>
      ),
    },
    {
      title: '加分',
      dataIndex: 'score',
      key: 'score',
      width: 70,
      align: 'center',
      sorter: (a, b) => a.score - b.score,
      render: (score: number) => (
        <Tag color={score >= 5 ? 'green' : score >= 3 ? 'orange' : 'blue'}>+{score}</Tag>
      ),
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      render: (date: Date) => <Text type="secondary" style={{ fontSize: 12 }}>{new Date(date).toLocaleDateString('zh-CN')}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="确定删除此活动记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleSearch = (value: string) => { setSearchText(value); applyFilters(value, typeFilter) }
  const handleTypeFilter = (type: string | undefined) => { setTypeFilter(type); applyFilters(searchText, type) }

  const applyFilters = (search: string, type?: string, source?: Activity[]) => {
    let f = source ?? activitiesList
    if (search) {
      const lower = search.toLowerCase()
      f = f.filter(a =>
        a.student.user.name.toLowerCase().includes(lower) ||
        a.student.studentNo.includes(lower) ||
        a.title.toLowerCase().includes(lower)
      )
    }
    if (type) f = f.filter(a => a.type === type)
    setFilteredActivities(f)
  }

  const handleAdd = () => { setEditingActivity(null); setSelectedTemplate(null); setIsModalVisible(true) }
  const handleEdit = (activity: Activity) => { setEditingActivity(activity); setIsModalVisible(true) }
  const handleViewDetail = (activity: Activity) => { setViewingActivity(activity); setIsDetailVisible(true) }

  const handleDelete = async (activityId: string) => {
    const hide = message.loading('正在删除...')
    try {
      setLoading(true)
      await deleteActivity(activityId)

      // 乐观更新：立即从列表移除
      const updated = activitiesList.filter(a => a.id !== activityId)
      setActivitiesList(updated)
      applyFilters(searchText, typeFilter, updated)

      hide()
      message.success('活动记录删除成功')
    } catch {
      hide()
      message.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (values: ActivityFormValues) => {
    const hide = message.loading(editingActivity ? '正在更新...' : '正在录入...')
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('studentId', values.studentId)
      formData.append('type', values.type)
      formData.append('title', values.title)
      formData.append('score', String(values.score))
      formData.append('date', values.date)

      if (editingActivity) {
        await updateActivity(editingActivity.id, formData)

        // 乐观更新：立即更新列表中对应项
        const updated = activitiesList.map(a =>
          a.id === editingActivity.id
            ? { ...a, type: values.type, title: values.title, score: values.score, date: new Date(values.date) }
            : a
        )
        setActivitiesList(updated)
        applyFilters(searchText, typeFilter, updated)

        hide()
        message.success('活动更新成功')
      } else {
        await addActivity(formData)

        // 乐观更新：立即添加到列表
        const student = students.find(s => s.id === values.studentId)!
        const newActivity: Activity = {
          id: `temp-${Date.now()}`,
          type: values.type,
          title: values.title,
          score: values.score,
          date: new Date(values.date),
          createdAt: new Date(),
          student,
        }
        const updated = [newActivity, ...activitiesList]
        setActivitiesList(updated)
        applyFilters(searchText, typeFilter, updated)

        hide()
        message.success('活动录入成功')
      }
      setIsModalVisible(false)
      form.resetFields()
    } catch {
      hide()
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = (template: ActivityTemplate) => {
    setSelectedTemplate(template)
    form.setFieldsValue({ title: template.title, score: template.score })
  }

  const totalActivities = filteredActivities.length
  const activityCount = filteredActivities.filter(a => a.type === 'ACTIVITY').length
  const practiceCount = filteredActivities.filter(a => a.type === 'PRACTICE').length
  const totalScore = filteredActivities.reduce((sum, a) => sum + a.score, 0)

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { title: '活动总数', value: totalActivities, suffix: '项', icon: <TeamOutlined />, color: '#4F46E5' },
          { title: '社团活动', value: activityCount, suffix: '项', icon: <TeamOutlined />, color: '#10B981' },
          { title: '实践项目', value: practiceCount, suffix: '项', icon: <ExperimentOutlined />, color: '#F59E0B' },
          { title: '总加分', value: totalScore, icon: <TrophyOutlined />, color: '#8B5CF6' },
        ].map(item => (
          <Col xs={12} md={6} key={item.title}>
            <Card hoverable styles={{ body: { padding: '16px 20px' } }}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>{item.title}</Text>}
                value={item.value}
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
          <Col><Title level={4} style={{ margin: 0 }}>活动实践管理</Title></Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} loading={loading}>录入活动</Button>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search placeholder="搜索学生姓名、学号或活动标题" allowClear onSearch={handleSearch} />
          </Col>
          <Col span={4}>
            <Select placeholder="筛选类型" allowClear style={{ width: '100%' }} onChange={handleTypeFilter}>
              {activityTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredActivities}
          rowKey="id"
          loading={loading}
          scroll={{ x: 780 }}
          size="middle"
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 项活动`,
          }}
        />
      </Card>

      {/* 录入/编辑模态框 */}
      <Modal
        title={editingActivity ? '编辑活动' : '录入活动'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        afterOpenChange={(open) => {
          if (open) {
            if (editingActivity) {
              form.setFieldsValue({
                studentId: editingActivity.student.id,
                type: editingActivity.type,
                title: editingActivity.title,
                score: editingActivity.score,
                date: formatDate(new Date(editingActivity.date)),
              })
            } else {
              form.setFieldsValue({ date: formatDate(new Date()), score: 0 })
            }
          }
        }}
        width={720}
      >
        <Tabs
          defaultActiveKey="form"
          items={[
            {
              key: 'form',
              label: '活动信息',
              children: (
                <Form form={form} layout="vertical" onFinish={handleSave}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="学生" name="studentId" rules={[{ required: true, message: '请选择学生' }]}>
                        <Select placeholder="请选择学生" showSearch optionFilterProp="children" disabled={!!editingActivity}>
                          {students.map(s => (
                            <Option key={s.id} value={s.id}>{s.user.name} ({s.studentNo})</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="活动类型" name="type" rules={[{ required: true, message: '请选择活动类型' }]}>
                        <Select placeholder="请选择活动类型">
                          {activityTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={14}>
                      <Form.Item label="活动标题" name="title" rules={[{ required: true, message: '请输入活动标题' }]}>
                        <Input placeholder="请输入活动标题" />
                      </Form.Item>
                    </Col>
                    <Col span={10}>
                      <Row gutter={12}>
                        <Col span={12}>
                          <Form.Item label="加分" name="score" rules={[{ required: true, message: '请输入' }]}>
                            <InputNumber min={0} max={10} precision={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="活动日期" name="date" rules={[{ required: true, message: '请选择日期' }]}>
                            <Input type="date" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={loading}>
                        {editingActivity ? '更新' : '录入'}
                      </Button>
                      <Button onClick={() => setIsModalVisible(false)}>取消</Button>
                    </Space>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'template',
              label: '快速模板',
              children: (
                <Tabs
                  size="small"
                  items={activityTypes.map(type => ({
                    key: type.value,
                    label: type.label,
                    children: (
                      <Row gutter={[12, 12]}>
                        {activityTemplates[type.value as keyof typeof activityTemplates].map((tpl, i) => (
                          <Col span={12} key={i}>
                            <Card
                              size="small"
                              hoverable
                              onClick={() => handleUseTemplate(tpl)}
                              style={{
                                border: selectedTemplate?.title === tpl.title ? '2px solid #4F46E5' : '1px solid #E5E7EB',
                                borderRadius: 10,
                              }}
                              styles={{ body: { padding: '12px 14px' } }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <Text strong style={{ fontSize: 13 }}>{tpl.title}</Text>
                                <Tag color="green">+{tpl.score}</Tag>
                              </div>
                              <Text type="secondary" style={{ fontSize: 12 }}>{tpl.description}</Text>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ),
                  }))}
                />
              ),
            },
          ]}
        />
      </Modal>

      {/* 详情模态框 */}
      <Modal
        title="活动详情"
        open={isDetailVisible}
        onCancel={() => setIsDetailVisible(false)}
        footer={<Button onClick={() => setIsDetailVisible(false)}>关闭</Button>}
        width={560}
      >
        {viewingActivity && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="学生" span={1}>{viewingActivity.student.user.name}</Descriptions.Item>
            <Descriptions.Item label="学号" span={1}>{viewingActivity.student.studentNo}</Descriptions.Item>
            <Descriptions.Item label="班级" span={1}>{viewingActivity.student.class.name}</Descriptions.Item>
            <Descriptions.Item label="类型" span={1}>
              <Tag color={activityTypes.find(t => t.value === viewingActivity.type)?.color}>
                {activityTypes.find(t => t.value === viewingActivity.type)?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="活动标题" span={2}>{viewingActivity.title}</Descriptions.Item>
            <Descriptions.Item label="加分" span={1}><Tag color="green">+{viewingActivity.score}</Tag></Descriptions.Item>
            <Descriptions.Item label="日期" span={1}>{new Date(viewingActivity.date).toLocaleDateString('zh-CN')}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
