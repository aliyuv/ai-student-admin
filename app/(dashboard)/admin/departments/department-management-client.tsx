"use client"

import { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Modal,
  Form,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Tabs,
  Tag,
  Collapse
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  BankOutlined,
  BookOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { Search } = Input
const { Panel } = Collapse

interface Major {
  id: string
  name: string
  code: string
  departmentId: string
}

interface Department {
  id: string
  name: string
  code: string
  description: string
  createdAt: Date
  majors: Major[]
}

interface DepartmentManagementClientProps {
  initialDepartments: Department[]
}

export default function DepartmentManagementClient({
  initialDepartments
}: DepartmentManagementClientProps) {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments)
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>(initialDepartments)
  const [loading, setLoading] = useState(false)
  const [isDeptModalVisible, setIsDeptModalVisible] = useState(false)
  const [isMajorModalVisible, setIsMajorModalVisible] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [editingMajor, setEditingMajor] = useState<Major | null>(null)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("")
  const [searchText, setSearchText] = useState('')
  const [deptForm] = Form.useForm()
  const [majorForm] = Form.useForm()

  // 通用过滤函数，支持传入最新数据源以避免 stale closure
  const filterDepartments = (search: string, source?: Department[]) => {
    const base = source ?? departments
    if (!search) {
      setFilteredDepartments(base)
    } else {
      setFilteredDepartments(
        base.filter(dept =>
          dept.name.toLowerCase().includes(search.toLowerCase()) ||
          dept.code.toLowerCase().includes(search.toLowerCase()) ||
          (dept.description ?? '').toLowerCase().includes(search.toLowerCase())
        )
      )
    }
  }

  // 从服务端刷新数据
  const refreshData = async () => {
    try {
      const res = await fetch('/api/admin/departments')
      if (res.ok) {
        const data = await res.json()
        setDepartments(data)
        filterDepartments(searchText, data)
      }
    } catch {
      // 静默失败
    }
  }

  // 搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
    filterDepartments(value)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchText(value)
    filterDepartments(value)
  }

  // 刷新（重置搜索，恢复全量数据）
  const handleRefresh = () => {
    setSearchText('')
    setFilteredDepartments(departments)
    message.success('已刷新')
  }

  // ────────── 院系管理 ──────────

  const handleAddDepartment = () => {
    setEditingDepartment(null)
    setIsDeptModalVisible(true)
  }

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department)
    setIsDeptModalVisible(true)
  }

  const handleDeleteDepartment = async (departmentId: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/departments/${departmentId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        message.error(data.error || '删除失败')
        return
      }
      if (selectedDepartmentId === departmentId) setSelectedDepartmentId('')
      message.success('院系删除成功')
      await refreshData()
    } catch {
      message.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDepartment = async (values: { name: string; code: string; description?: string }) => {
    try {
      setLoading(true)

      if (editingDepartment) {
        const res = await fetch(`/api/admin/departments/${editingDepartment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        const data = await res.json()
        if (!res.ok) {
          message.error(data.error || '更新失败')
          return
        }
        message.success('院系更新成功')
      } else {
        const res = await fetch('/api/admin/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        const data = await res.json()
        if (!res.ok) {
          message.error(data.error || '创建失败')
          return
        }
        message.success('院系创建成功')
      }

      setIsDeptModalVisible(false)
      await refreshData()
    } catch {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  // ────────── 专业管理 ──────────

  const handleManageMajors = (department: Department) => {
    setSelectedDepartmentId(department.id)
  }

  const handleAddMajor = () => {
    if (!selectedDepartmentId) {
      message.error('请先选择院系')
      return
    }
    setEditingMajor(null)
    setIsMajorModalVisible(true)
  }

  const handleEditMajor = (major: Major) => {
    setEditingMajor(major)
    setIsMajorModalVisible(true)
  }

  const handleDeleteMajor = async (majorId: string, departmentId: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/departments/${departmentId}/majors/${majorId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        message.error(data.error || '删除失败')
        return
      }
      message.success('专业删除成功')
      await refreshData()
    } catch {
      message.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMajor = async (values: { name: string; code: string }) => {
    try {
      setLoading(true)

      if (editingMajor) {
        const res = await fetch(`/api/admin/departments/${editingMajor.departmentId}/majors/${editingMajor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        const data = await res.json()
        if (!res.ok) {
          message.error(data.error || '更新失败')
          return
        }
        message.success('专业更新成功')
      } else {
        const res = await fetch(`/api/admin/departments/${selectedDepartmentId}/majors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        const data = await res.json()
        if (!res.ok) {
          message.error(data.error || '创建失败')
          return
        }
        message.success('专业创建成功')
      }

      setIsMajorModalVisible(false)
      await refreshData()
    } catch {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  // ────────── 表格列配置 ──────────

  const departmentColumns: ColumnsType<Department> = [
    {
      title: '院系名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <BankOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 500 }}>{name}</span>
          <Tag>{record.code}</Tag>
        </Space>
      ),
    },
    {
      title: '院系代码',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: '专业数量',
      key: 'majorsCount',
      width: 90,
      render: (_, record) => (
        <Tag color="blue">{record.majors.length} 个</Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date: Date) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size={0} wrap>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditDepartment(record)}
            size="small"
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleManageMajors(record)}
          >
            管理专业
          </Button>
          <Popconfirm
            title="确定删除此院系吗？"
            description="删除后该院系下的所有专业也会一并删除"
            onConfirm={() => handleDeleteDepartment(record.id)}
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

  const majorColumns = (departmentId: string): ColumnsType<Major> => [
    {
      title: '专业名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <BookOutlined style={{ color: '#52c41a' }} />
          <span>{name}</span>
          <Tag color="green">{record.code}</Tag>
        </Space>
      ),
    },
    {
      title: '专业代码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size={0}>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditMajor(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此专业吗？"
            onConfirm={() => handleDeleteMajor(record.id, departmentId)}
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

  // ────────── 渲染 ──────────

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>院系专业管理</Title>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddDepartment}
              >
                新建院系
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>

        <Row style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="搜索院系名称、代码或描述"
              allowClear
              value={searchText}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>

        <Tabs
          defaultActiveKey="departments"
          type="card"
          items={[
            {
              key: 'departments',
              label: <Space><BankOutlined /><span>院系管理</span></Space>,
              children: (
                <Table
                  columns={departmentColumns}
                  dataSource={filteredDepartments}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    total: filteredDepartments.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 个院系`,
                  }}
                />
              ),
            },
            {
              key: 'majors',
              label: <Space><BookOutlined /><span>专业管理</span></Space>,
              children: (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddMajor}
                      disabled={!selectedDepartmentId}
                    >
                      新建专业
                    </Button>
                    {!selectedDepartmentId && (
                      <span style={{ marginLeft: 16, color: '#999' }}>
                        请在院系管理中点击「管理专业」选择院系
                      </span>
                    )}
                    {selectedDepartmentId && (
                      <span style={{ marginLeft: 16, color: '#1890ff' }}>
                        当前选中：{departments.find(d => d.id === selectedDepartmentId)?.name}
                      </span>
                    )}
                  </div>

                  <Collapse>
                    {departments.map(dept => (
                      <Panel
                        header={
                          <Space>
                            <BankOutlined style={{ color: '#1890ff' }} />
                            <span>{dept.name}</span>
                            <Tag>{dept.majors.length} 个专业</Tag>
                          </Space>
                        }
                        key={dept.id}
                      >
                        <Table
                          columns={majorColumns(dept.id)}
                          dataSource={dept.majors}
                          rowKey="id"
                          size="small"
                          pagination={false}
                        />
                      </Panel>
                    ))}
                  </Collapse>
                </>
              ),
            },
          ]}
        />
      </Card>

      {/* 院系编辑模态框 */}
      <Modal
        title={editingDepartment ? '编辑院系' : '新建院系'}
        open={isDeptModalVisible}
        onCancel={() => setIsDeptModalVisible(false)}
        footer={null}
        afterOpenChange={(open) => {
          if (open && editingDepartment) {
            deptForm.setFieldsValue({
              name: editingDepartment.name,
              code: editingDepartment.code,
              description: editingDepartment.description,
            })
          }
        }}
        width={600}
      >
        <Form form={deptForm} layout="vertical" onFinish={handleSaveDepartment}>
          <Form.Item
            label="院系名称"
            name="name"
            rules={[{ required: true, message: '请输入院系名称' }]}
          >
            <Input placeholder="请输入院系名称" />
          </Form.Item>

          <Form.Item
            label="院系代码"
            name="code"
            rules={[{ required: true, message: '请输入院系代码' }]}
          >
            <Input placeholder="请输入院系代码" />
          </Form.Item>

          <Form.Item label="院系描述" name="description">
            <Input.TextArea placeholder="请输入院系描述" rows={3} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingDepartment ? '更新' : '创建'}
              </Button>
              <Button onClick={() => { setIsDeptModalVisible(false) }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 专业编辑模态框 */}
      <Modal
        title={editingMajor ? '编辑专业' : '新建专业'}
        open={isMajorModalVisible}
        onCancel={() => setIsMajorModalVisible(false)}
        footer={null}
        afterOpenChange={(open) => {
          if (open && editingMajor) {
            majorForm.setFieldsValue({ name: editingMajor.name, code: editingMajor.code })
          }
        }}
        width={500}
      >
        <Form form={majorForm} layout="vertical" onFinish={handleSaveMajor}>
          <Form.Item
            label="专业名称"
            name="name"
            rules={[{ required: true, message: '请输入专业名称' }]}
          >
            <Input placeholder="请输入专业名称" />
          </Form.Item>

          <Form.Item
            label="专业代码"
            name="code"
            rules={[{ required: true, message: '请输入专业代码' }]}
          >
            <Input placeholder="请输入专业代码" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingMajor ? '更新' : '创建'}
              </Button>
              <Button onClick={() => { setIsMajorModalVisible(false) }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
