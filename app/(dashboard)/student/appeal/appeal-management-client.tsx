"use client"

import { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  App,
  Typography,
  Timeline,
  Tag,
  Space,
  Modal,
  Descriptions,
  Row,
  Col,
  Steps,
  Alert,
  Empty,
  Divider
} from 'antd'
import {
  ExclamationCircleOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EyeOutlined,
  SendOutlined
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select

interface Student {
  id: string
  studentNo: string
  user: { name: string; email: string }
  class: { name: string; grade: string }
}

interface Evaluation {
  id: string
  semester: string
  aiScore: number
  aiReport: string
  createdAt: Date
}

interface Appeal {
  id: string
  evaluationId: string
  reason: string
  status: 'PENDING' | 'RESOLVED'
  reply?: string | null
  createdAt: Date
  evaluation: Evaluation
}

interface AppealManagementClientProps {
  student: Student
  evaluations: Evaluation[]
  appeals: Appeal[]
}

export default function AppealManagementClient({
  evaluations,
  appeals
}: AppealManagementClientProps) {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [viewingAppeal, setViewingAppeal] = useState<Appeal | null>(null)
  const [isDetailVisible, setIsDetailVisible] = useState(false)
  const [form] = Form.useForm()

  // 状态映射
  const statusConfig = {
    PENDING: {
      label: '待处理',
      color: 'processing',
      icon: <ClockCircleOutlined />
    },
    RESOLVED: {
      label: '已处理',
      color: 'success',
      icon: <CheckCircleOutlined />
    }
  }

  // 提交申诉
  const handleSubmitAppeal = async (_values: unknown) => {
    try {
      setLoading(true)
      // TODO: 实际提交申诉API
      await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用

      message.success('申诉提交成功！我们将在3-5个工作日内处理您的申诉')
      setIsModalVisible(false)
    } catch (error) {
      message.error('提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 查看申诉详情
  const handleViewDetail = (appeal: Appeal) => {
    setViewingAppeal(appeal)
    setIsDetailVisible(true)
  }

  // 可申诉的评测记录（未申诉过的）
  const appealableEvaluations = evaluations.filter(evaluation =>
    !appeals.some(appeal => appeal.evaluationId === evaluation.id)
  )

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
            申诉管理
          </Title>
          <Text type="secondary">对评测结果有异议时，可通过此页面提交申诉</Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
            disabled={appealableEvaluations.length === 0}
          >
            提交申诉
          </Button>
        </Col>
      </Row>

      {appealableEvaluations.length === 0 && appeals.length === 0 && (
        <Alert
          title="暂无可申诉的评测记录"
          description="当您有已审核的评测结果时，如有异议可在此提交申诉"
          type="info"
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 申诉流程说明 */}
      <Card title="申诉流程" size="small" style={{ marginBottom: 24 }}>
        <Steps
          size="small"
          items={[
            {
              title: '提交申诉',
              status: 'finish',
              icon: <SendOutlined />
            },
            {
              title: '教师审核',
              status: 'process',
              icon: <FileTextOutlined />
            },
            {
              title: '管理员复核',
              status: 'wait',
              icon: <CheckCircleOutlined />
            },
            {
              title: '结果反馈',
              status: 'wait',
              icon: <ExclamationCircleOutlined />
            }
          ]}
        />
        <Paragraph style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
          申诉处理时间：3-5个工作日 | 请确保申诉理由充分，提供相关证明材料
        </Paragraph>
      </Card>

      {/* 申诉记录 */}
      <Card title="我的申诉记录">
        {appeals.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无申诉记录"
          />
        ) : (
          <Timeline
            items={appeals.map((appeal) => {
              const config = statusConfig[appeal.status]

              return {
                key: appeal.id,
                color: appeal.status === 'RESOLVED' ? 'green' : 'blue',
                icon: config.icon,
                content: (
                  <Card size="small" hoverable>
                    <Row justify="space-between" align="top">
                      <Col span={18}>
                        <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                          <div>
                            <Space>
                              <Text strong>{appeal.evaluation.semester} 综合评测</Text>
                              <Tag color="blue">{appeal.evaluation.aiScore}分</Tag>
                              <Tag color={config.color} icon={config.icon}>
                                {config.label}
                              </Tag>
                            </Space>
                          </div>

                          <div>
                            <Text type="secondary">申诉理由：</Text>
                            <Paragraph style={{ margin: 0 }} ellipsis={{ rows: 2 }}>
                              {appeal.reason}
                            </Paragraph>
                          </div>

                          {appeal.reply && (
                            <div>
                              <Text type="secondary">处理回复：</Text>
                              <Paragraph style={{ margin: 0, color: '#52c41a' }}>
                                {appeal.reply}
                              </Paragraph>
                            </div>
                          )}

                          <Text type="secondary" style={{ fontSize: 12 }}>
                            提交时间：{new Date(appeal.createdAt).toLocaleString('zh-CN')}
                          </Text>
                        </Space>
                      </Col>
                      <Col span={6} style={{ textAlign: 'right' }}>
                        <Button
                          type="link"
                          icon={<EyeOutlined />}
                          onClick={() => handleViewDetail(appeal)}
                        >
                          查看详情
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                ),
              }
            })}
          />
        )}
      </Card>

      {/* 提交申诉模态框 */}
      <Modal
        title="提交申诉"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnHidden
        width={600}
      >
        <Alert
          title="申诉注意事项"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>请确保申诉理由充分、客观</li>
              <li>如有相关证明材料，请在理由中说明</li>
              <li>申诉将由教师和管理员共同审核</li>
              <li>处理结果将在3-5个工作日内反馈</li>
            </ul>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitAppeal}
        >
          <Form.Item
            label="选择评测记录"
            name="evaluationId"
            rules={[{ required: true, message: '请选择要申诉的评测记录' }]}
          >
            <Select placeholder="请选择要申诉的评测记录">
              {appealableEvaluations.map(evaluation => {
                const report = JSON.parse(evaluation.aiReport)
                return (
                  <Option key={evaluation.id} value={evaluation.id}>
                    <div style={{ padding: '4px 0' }}>
                      <div>
                        <strong>{evaluation.semester}</strong>
                        <span style={{ marginLeft: 8, color: '#1890ff' }}>
                          {evaluation.aiScore}分
                        </span>
                        <span style={{ marginLeft: 8, color: '#666' }}>
                          ({report.grade})
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        评测时间：{new Date(evaluation.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </Option>
                )
              })}
            </Select>
          </Form.Item>

          <Form.Item
            label="申诉理由"
            name="reason"
            rules={[
              { required: true, message: '请输入申诉理由' },
              { min: 20, message: '申诉理由至少20个字符' },
              { max: 500, message: '申诉理由不超过500个字符' }
            ]}
          >
            <TextArea
              rows={6}
              placeholder="请详细说明申诉理由，如对评测结果的具体异议、相关证明材料情况等"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                提交申诉
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 申诉详情模态框 */}
      <Modal
        title="申诉详情"
        open={isDetailVisible}
        onCancel={() => setIsDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {viewingAppeal && (
          <div>
            <Descriptions
              bordered
              column={2}
              items={[
                {
                  label: '学期',
                  children: viewingAppeal.evaluation.semester,
                  span: 1
                },
                {
                  label: '评测分数',
                  children: <Tag color="blue">{viewingAppeal.evaluation.aiScore}分</Tag>,
                  span: 1
                },
                {
                  label: '申诉状态',
                  children: (
                    <Tag color={statusConfig[viewingAppeal.status].color} icon={statusConfig[viewingAppeal.status].icon}>
                      {statusConfig[viewingAppeal.status].label}
                    </Tag>
                  ),
                  span: 1
                },
                {
                  label: '提交时间',
                  children: new Date(viewingAppeal.createdAt).toLocaleString('zh-CN'),
                  span: 1
                },
                {
                  label: '申诉理由',
                  children: viewingAppeal.reason,
                  span: 2
                }
              ]}
            />

            {viewingAppeal.reply && (
              <>
                <Divider>处理结果</Divider>
                <Alert
                  title="申诉处理完成"
                  description={viewingAppeal.reply}
                  type="success"
                  showIcon
                />
              </>
            )}

            <Divider>评测详情</Divider>
            <Card size="small" title="原始评测报告">
              {(() => {
                const report = JSON.parse(viewingAppeal.evaluation.aiReport)
                return (
                  <div>
                    <p><strong>综合评语：</strong>{report.summary}</p>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Descriptions size="small" title="学业成绩">
                          <Descriptions.Item label="得分">{report.dimensions.academic}</Descriptions.Item>
                        </Descriptions>
                      </Col>
                      <Col span={6}>
                        <Descriptions size="small" title="课外活动">
                          <Descriptions.Item label="得分">{report.dimensions.activity}</Descriptions.Item>
                        </Descriptions>
                      </Col>
                      <Col span={6}>
                        <Descriptions size="small" title="品行表现">
                          <Descriptions.Item label="得分">{report.dimensions.conduct}</Descriptions.Item>
                        </Descriptions>
                      </Col>
                      <Col span={6}>
                        <Descriptions size="small" title="出勤情况">
                          <Descriptions.Item label="得分">{report.dimensions.attendance}</Descriptions.Item>
                        </Descriptions>
                      </Col>
                    </Row>
                  </div>
                )
              })()}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}