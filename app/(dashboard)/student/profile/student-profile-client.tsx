"use client"

import {
  Card,
  Descriptions,
  Typography,
  Row,
  Col,
  Avatar,
} from 'antd'
import {
  UserOutlined,
  MailOutlined,
  IdcardOutlined,
  TeamOutlined,
  BookOutlined,
  SolutionOutlined,
} from '@ant-design/icons'

const { Title } = Typography

interface StudentProfileClientProps {
  student: {
    name: string
    email: string
    studentNo: string
    className: string
    grade: string
    teacherName: string
  }
}

export default function StudentProfileClient({ student }: StudentProfileClientProps) {
  return (
    <Card>
      <Row gutter={24} align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#4F46E5' }} />
        </Col>
        <Col>
          <Title level={4} style={{ margin: 0 }}>{student.name}</Title>
          <span style={{ color: '#666' }}>{student.grade} · {student.className}</span>
        </Col>
      </Row>

      <Descriptions
        bordered
        column={{ xs: 1, sm: 2 }}
        items={[
          {
            key: 'name',
            label: (
              <span><UserOutlined style={{ marginRight: 8 }} />姓名</span>
            ),
            children: student.name,
          },
          {
            key: 'studentNo',
            label: (
              <span><IdcardOutlined style={{ marginRight: 8 }} />学号</span>
            ),
            children: student.studentNo,
          },
          {
            key: 'email',
            label: (
              <span><MailOutlined style={{ marginRight: 8 }} />邮箱</span>
            ),
            children: student.email,
          },
          {
            key: 'className',
            label: (
              <span><TeamOutlined style={{ marginRight: 8 }} />班级</span>
            ),
            children: student.className,
          },
          {
            key: 'grade',
            label: (
              <span><BookOutlined style={{ marginRight: 8 }} />年级</span>
            ),
            children: student.grade,
          },
          {
            key: 'teacher',
            label: (
              <span><SolutionOutlined style={{ marginRight: 8 }} />班主任</span>
            ),
            children: student.teacherName,
          },
        ]}
      />
    </Card>
  )
}
