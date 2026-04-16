"use client"

import { useState, useCallback } from 'react'
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Modal,
  Form,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
  Avatar
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
  HomeOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

interface Teacher {
  id: string
  name: string
  email: string
}

interface ClassWithDetails {
  id: string
  name: string
  grade: string
  teacherId: string
  teacher: Teacher
  _count: {
    students: number
  }
}

interface ClassManagementClientProps {
  initialClasses: ClassWithDetails[]
  initialTotal: number
  initialPage: number
  initialPageSize: number
  teachers: Teacher[]
}

interface ClassFormValues {
  name: string
  grade: string
  teacherId: string
}

export default function ClassManagementClient({
  initialClasses,
  initialTotal,
  initialPage,
  initialPageSize,
  teachers
}: ClassManagementClientProps) {
  const [classes, setClasses] = useState<ClassWithDetails[]>(initialClasses)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassWithDetails | null>(null)
  const [searchText, setSearchText] = useState('')
  const [gradeFilter, setGradeFilter] = useState<string>()
  const [form] = Form.useForm()

  // 服务端分页加载
  const loadClasses = useCallback(async (p: number, ps: number, search: string, grade?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(p),
        pageSize: String(ps),
      })
      if (search) params.set('search', search)
      if (grade) params.set('grade', grade)

      const response = await fetch(`/api/admin/classes?${params}`)
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes)
        setTotal(data.total)
        setPage(data.page)
        setPageSize(data.pageSize)
      }
    } catch (error) {
      message.error('加载班级列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 表格列配置
  const columns: ColumnsType<ClassWithDetails> = [
    {
      title: '班级信息',
      key: 'classInfo',
      render: (_, record) => (
        <Space>
          <HomeOutlined style={{ color: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500, fontSize: 16 }}>{record.name}</div>
            <div style={{ color: '#666', fontSize: 12 }}>{record.grade}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '年级',
      dataIndex: 'grade',
      key: 'grade',
      width: 100,
      render: (grade) => <Tag color="blue">{grade}</Tag>
    },
    {
      title: '班主任',
      key: 'teacher',
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.teacher.name}</div>
            <div style={{ color: '#666', fontSize: 12 }}>{record.teacher.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '学生人数',
      key: 'studentCount',
      width: 120,
      render: (_, record) => (
        <Statistic
          value={record._count.students}
          suffix="人"
          styles={{ content: { fontSize: 16 } }}
          prefix={<TeamOutlined />}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此班级吗？"
            description="删除班级后，班级下的学生将需要重新分配班级"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
    loadClasses(1, pageSize, value, gradeFilter)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchText(value)
    if (!value) {
      loadClasses(1, pageSize, '', gradeFilter)
    }
  }

  const handleGradeFilter = (grade: string | undefined) => {
    setGradeFilter(grade)
    loadClasses(1, pageSize, searchText, grade)
  }

  // 分页变化
  const handleTableChange = (newPage: number, newPageSize: number) => {
    loadClasses(newPage, newPageSize, searchText, gradeFilter)
  }

  // 新增班级
  const handleAdd = () => {
    setEditingClass(null)
    setIsModalVisible(true)
  }

  // 编辑班级
  const handleEdit = (classItem: ClassWithDetails) => {
    setEditingClass(classItem)
    setIsModalVisible(true)
  }

  // 删除班级
  const handleDelete = async (classId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/classes/${classId}`, { method: 'DELETE' })
      const data = await response.json()

      if (response.ok) {
        message.success('班级删除成功')
        loadClasses(page, pageSize, searchText, gradeFilter)
      } else {
        message.error(data.error || '删除失败')
      }
    } catch (error) {
      message.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存班级
  const handleSave = async (values: ClassFormValues) => {
    try {
      setLoading(true)

      if (editingClass) {
        const response = await fetch(`/api/admin/classes/${editingClass.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        const data = await response.json()

        if (response.ok) {
          message.success('班级更新成功')
          loadClasses(page, pageSize, searchText, gradeFilter)
        } else {
          message.error(data.error || '更新失败')
          return
        }
      } else {
        const response = await fetch('/api/admin/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        const data = await response.json()

        if (response.ok) {
          message.success('班级创建成功')
          loadClasses(1, pageSize, searchText, gradeFilter)
        } else {
          message.error(data.error || '创建失败')
          return
        }
      }

      setIsModalVisible(false)
    } catch (error) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  // 刷新数据
  const handleRefresh = async () => {
    setSearchText('')
    setGradeFilter(undefined)
    loadClasses(1, pageSize, '', undefined)
  }

  // 统计数据（当前页）
  const totalStudents = classes.reduce((sum, cls) => sum + cls._count.students, 0)

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="班级总数"
              value={total}
              suffix="个"
              prefix={<HomeOutlined style={{ color: '#1890ff' }} />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="当前页学生"
              value={totalStudents}
              suffix="人"
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="教师数量"
              value={teachers.length}
              suffix="位"
              prefix={<UserOutlined style={{ color: '#fa8c16' }} />}
              styles={{ content: { color: '#fa8c16' } }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>班级管理</Title>
            </Col>
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  新建班级
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={loading}
                >
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Search
                placeholder="搜索班级名称或班主任"
                allowClear
                value={searchText}
                onChange={handleSearchChange}
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="筛选年级"
                allowClear
                value={gradeFilter}
                style={{ width: '100%' }}
                onChange={handleGradeFilter}
              >
                {/* 年级列表从当前数据动态生成 */}
                {Array.from(new Set(classes.map(c => c.grade))).sort().map(grade => (
                  <Option key={grade} value={grade}>{grade}</Option>
                ))}
              </Select>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={classes}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个班级`,
            onChange: handleTableChange,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={editingClass ? '编辑班级' : '新建班级'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
        afterOpenChange={(open) => {
          if (open && editingClass) {
            form.setFieldsValue({
              name: editingClass.name,
              grade: editingClass.grade,
              teacherId: editingClass.teacherId,
            })
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            label="班级名称"
            name="name"
            rules={[{ required: true, message: '请输入班级名称' }]}
          >
            <Input placeholder="例如：计算机2101班" />
          </Form.Item>

          <Form.Item
            label="年级"
            name="grade"
            rules={[{ required: true, message: '请输入年级' }]}
          >
            <Input placeholder="例如：2021级" />
          </Form.Item>

          <Form.Item
            label="班主任"
            name="teacherId"
            rules={[{ required: true, message: '请选择班主任' }]}
          >
            <Select
              placeholder="请选择班主任"
              showSearch
              optionFilterProp="children"
            >
              {teachers.map(teacher => (
                <Option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingClass ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
