"use client"

import { useState, useEffect } from 'react'
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
  Col
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { User, Role } from '@/types'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

interface UserWithDetails extends User {
  student?: {
    studentNo: string
    class: {
      name: string
      grade: string
    }
  } | null
}

interface UserManagementClientProps {
  initialUsers: UserWithDetails[]
}

export default function UserManagementClient({ initialUsers }: UserManagementClientProps) {
  const [users, setUsers] = useState<UserWithDetails[]>(initialUsers)
  const [filteredUsers, setFilteredUsers] = useState<UserWithDetails[]>(initialUsers)
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null)
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | undefined>()
  const [classes, setClasses] = useState<any[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | undefined>()
  const [form] = Form.useForm()

  // 编辑时回填表单
  useEffect(() => {
    if (isModalVisible && editingUser) {
      // 延迟一帧，确保 Modal 已挂载、Form 已连接
      const timer = setTimeout(() => {
        form.setFieldsValue({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
        })
      }, 0)
      return () => clearTimeout(timer)
    }
    if (isModalVisible && !editingUser) {
      form.resetFields()
    }
  }, [isModalVisible, editingUser, form])

  // 获取班级列表
  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/admin/classes')
      if (response.ok) {
        const classData = await response.json()
        setClasses(classData)
      }
    } catch (error) {
      console.error('获取班级列表失败:', error)
    }
  }

  // 角色标签配置
  const getRoleTag = (role: Role) => {
    const roleConfig = {
      ADMIN: { color: 'red', text: '管理员' },
      TEACHER: { color: 'blue', text: '教师' },
      STUDENT: { color: 'green', text: '学生' }
    }
    return roleConfig[role]
  }

  // 表格列配置
  const columns: ColumnsType<UserWithDetails> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: Role) => {
        const config = getRoleTag(role)
        return <Tag color={config.color}>{config.text}</Tag>
      },
      filters: [
        { text: '管理员', value: 'ADMIN' },
        { text: '教师', value: 'TEACHER' },
        { text: '学生', value: 'STUDENT' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: '学号/班级',
      key: 'studentInfo',
      render: (_, record) => {
        if (record.role === 'STUDENT' && record.student) {
          return (
            <div>
              <div>学号: {record.student.studentNo}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {record.student.class.grade} {record.student.class.name}
              </div>
            </div>
          )
        }
        return '-'
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => new Date(date).toLocaleDateString('zh-CN'),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
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
            title="确定删除此用户吗？"
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

  // 搜索过滤（source 参数用于绕过 stale closure，传入最新数据源）
  const filterUsers = (search: string, role?: Role, source?: UserWithDetails[]) => {
    let filtered = source ?? users

    if (search) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (role) {
      filtered = filtered.filter(user => user.role === role)
    }

    setFilteredUsers(filtered)
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    filterUsers(value, roleFilter)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchText(value)
    filterUsers(value, roleFilter)
  }

  const handleRoleFilter = (role: Role | undefined) => {
    setRoleFilter(role)
    filterUsers(searchText, role)
  }

  // 新增用户
  const handleAdd = () => {
    setEditingUser(null)
    setIsModalVisible(true)
    setSelectedRole(undefined)
  }

  // 编辑用户
  const handleEdit = (user: UserWithDetails) => {
    setEditingUser(user)
    setSelectedRole(user.role)
    setIsModalVisible(true)
  }

  // 删除用户
  const handleDelete = async (userId: string) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        message.success('用户删除成功')
        const newUsers = users.filter(user => user.id !== userId)
        setUsers(newUsers)
        filterUsers(searchText, roleFilter, newUsers)
      } else {
        const data = await response.json()
        message.error(data.error || '删除失败')
      }
    } catch (error) {
      message.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存用户
  const handleSave = async (values: any) => {
    try {
      setLoading(true)

      if (editingUser) {
        // 更新用户
        const response = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        })

        if (response.ok) {
          const updatedUser = await response.json()
          message.success('用户更新成功')

          const newUsers = users.map(user =>
            user.id === editingUser.id ? updatedUser : user
          )
          setUsers(newUsers)
          filterUsers(searchText, roleFilter, newUsers)
        } else {
          const data = await response.json()
          message.error(data.error || '更新失败')
        }
      } else {
        // 创建新用户
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        })

        if (response.ok) {
          const newUser = await response.json()
          message.success('用户创建成功')

          const newUsers = [newUser, ...users]
          setUsers(newUsers)
          filterUsers(searchText, roleFilter, newUsers)
        } else {
          const data = await response.json()
          message.error(data.error || '创建失败')
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
    try {
      setLoading(true)

      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const freshUsers = await response.json()
        setUsers(freshUsers)
        setSearchText('')
        setRoleFilter(undefined)
        filterUsers('', undefined, freshUsers)
        message.success('数据已刷新')
      } else {
        message.error('刷新失败')
      }
    } catch (error) {
      message.error('刷新失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>用户管理</Title>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                新增用户
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
              placeholder="搜索用户姓名或邮箱"
              allowClear
              value={searchText}
              onChange={handleSearchChange}
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="筛选角色"
              allowClear
              value={roleFilter}
              style={{ width: '100%' }}
              onChange={handleRoleFilter}
            >
              <Option value="ADMIN">管理员</Option>
              <Option value="TEACHER">教师</Option>
              <Option value="STUDENT">学生</Option>
            </Select>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
        pagination={{
          total: filteredUsers.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnHidden
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select
              placeholder="请选择角色"
              onChange={(value) => setSelectedRole(value)}
            >
              <Option value="ADMIN">管理员</Option>
              <Option value="TEACHER">教师</Option>
              <Option value="STUDENT">学生</Option>
            </Select>
          </Form.Item>

          {(selectedRole === 'STUDENT' || form.getFieldValue('role') === 'STUDENT') && !editingUser && (
            <>
              <Form.Item
                label="学号"
                name="studentNo"
                rules={[{ required: true, message: '请输入学号' }]}
              >
                <Input placeholder="请输入学号" />
              </Form.Item>

              <Form.Item
                label="所属班级"
                name="classId"
                rules={[{ required: true, message: '请选择班级' }]}
              >
                <Select placeholder="请选择班级">
                  {classes.map(cls => (
                    <Option key={cls.id} value={cls.id}>
                      {cls.grade} {cls.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}

          {!editingUser && (
            <Form.Item
              label="初始密码"
              name="password"
              rules={[{ required: true, message: '请输入初始密码' }]}
            >
              <Input.Password placeholder="请输入初始密码" />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingUser ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}