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
  Divider,
  Upload,
  Image,
  Popconfirm,
} from 'antd'
import type { UploadFile } from 'antd'
import {
  ExclamationCircleOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EyeOutlined,
  SendOutlined,
  InboxOutlined,
  DeleteOutlined,
  PaperClipOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
} from '@ant-design/icons'
import { submitAppeal, deleteAppeal } from './actions'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select
const { Dragger } = Upload

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

interface Attachment {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  fileType: string
}

interface Appeal {
  id: string
  evaluationId: string
  type: string
  reason: string
  description?: string | null
  expectation?: string | null
  status: 'PENDING' | 'RESOLVED'
  reply?: string | null
  createdAt: Date
  evaluation: Evaluation
  attachments: Attachment[]
}

interface AppealManagementClientProps {
  student: Student
  evaluations: Evaluation[]
  appeals: Appeal[]
}

const APPEAL_TYPES = [
  { value: 'SCORE', label: '成绩异议', color: 'red' },
  { value: 'ACTIVITY', label: '活动记录', color: 'blue' },
  { value: 'ATTENDANCE', label: '出勤记录', color: 'orange' },
  { value: 'OTHER', label: '其他', color: 'default' },
]

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return <FileImageOutlined style={{ color: '#10B981' }} />
  if (fileType === 'application/pdf') return <FilePdfOutlined style={{ color: '#EF4444' }} />
  if (fileType.includes('word')) return <FileWordOutlined style={{ color: '#3B82F6' }} />
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileExcelOutlined style={{ color: '#10B981' }} />
  return <PaperClipOutlined />
}

export default function AppealManagementClient({
  evaluations,
  appeals: initialAppeals
}: AppealManagementClientProps) {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [appealsList, setAppealsList] = useState<Appeal[]>(initialAppeals)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [viewingAppeal, setViewingAppeal] = useState<Appeal | null>(null)
  const [isDetailVisible, setIsDetailVisible] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<Attachment[]>([])
  const [form] = Form.useForm()

  // 状态映射
  const statusConfig = {
    PENDING: { label: '待处理', color: 'processing', icon: <ClockCircleOutlined /> },
    RESOLVED: { label: '已处理', color: 'success', icon: <CheckCircleOutlined /> },
  }

  // 提交申诉
  const handleSubmitAppeal = async (values: {
    evaluationId: string
    type: string
    reason: string
    description?: string
    expectation?: string
  }) => {
    const hide = message.loading('正在提交申诉...')
    try {
      setLoading(true)
      await submitAppeal({
        evaluationId: values.evaluationId,
        type: values.type,
        reason: values.reason,
        description: values.description,
        expectation: values.expectation,
        attachments: uploadedFiles.map(f => ({
          fileName: f.fileName,
          filePath: f.filePath,
          fileSize: f.fileSize,
          fileType: f.fileType,
        })),
      })

      // 乐观更新
      const targetEval = evaluations.find(e => e.id === values.evaluationId)!
      const newAppeal: Appeal = {
        id: `temp-${Date.now()}`,
        evaluationId: values.evaluationId,
        type: values.type,
        reason: values.reason,
        description: values.description || null,
        expectation: values.expectation || null,
        status: 'PENDING',
        reply: null,
        createdAt: new Date(),
        evaluation: targetEval,
        attachments: uploadedFiles,
      }
      setAppealsList(prev => [newAppeal, ...prev])

      hide()
      message.success('申诉提交成功！我们将在3-5个工作日内处理您的申诉')
      setIsModalVisible(false)
      form.resetFields()
      setFileList([])
      setUploadedFiles([])
    } catch (err) {
      hide()
      message.error(err instanceof Error ? err.message : '提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 撤回申诉
  const handleDeleteAppeal = async (appeal: Appeal) => {
    const hide = message.loading('正在撤回申诉...')
    try {
      setLoading(true)
      await deleteAppeal(appeal.id)
      setAppealsList(prev => prev.filter(a => a.id !== appeal.id))
      hide()
      message.success('申诉已撤回')
    } catch (err) {
      hide()
      message.error(err instanceof Error ? err.message : '撤回失败')
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
    !appealsList.some(appeal => appeal.evaluationId === evaluation.id)
  )

  // 附件上传配置
  const uploadProps = {
    name: 'files',
    multiple: true,
    action: '/api/upload',
    fileList,
    maxCount: 5,
    accept: '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx',
    beforeUpload: (file: File) => {
      const isAllowedSize = file.size <= 5 * 1024 * 1024
      if (!isAllowedSize) {
        message.error(`${file.name} 超过 5MB 限制`)
        return Upload.LIST_IGNORE
      }
      return true
    },
    onChange: (info: { fileList: UploadFile[] }) => {
      setFileList(info.fileList)
      // 收集所有已上传成功的文件信息
      const uploaded = info.fileList
        .filter(f => f.status === 'done' && f.response?.files)
        .flatMap(f => f.response.files as Attachment[])
      setUploadedFiles(uploaded)
    },
  }

  // 渲染附件列表（用于记录卡片和详情）
  const renderAttachments = (attachments: Attachment[]) => {
    if (!attachments?.length) return null
    return (
      <div style={{ marginTop: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <PaperClipOutlined style={{ marginRight: 4 }} />
          附件 ({attachments.length})
        </Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {attachments.map(att => {
            const isImage = att.fileType.startsWith('image/')
            return isImage ? (
              <Image
                key={att.id || att.filePath}
                src={att.filePath}
                alt={att.fileName}
                width={60}
                height={60}
                style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #f0f0f0' }}
              />
            ) : (
              <a
                key={att.id || att.filePath}
                href={att.filePath}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  background: '#f5f5f5',
                  borderRadius: 6,
                  fontSize: 12,
                  color: '#333',
                  textDecoration: 'none',
                  border: '1px solid #e8e8e8',
                }}
              >
                {getFileIcon(att.fileType)}
                <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {att.fileName}
                </span>
                <span style={{ color: '#999' }}>({formatFileSize(att.fileSize)})</span>
              </a>
            )
          })}
        </div>
      </div>
    )
  }

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
            loading={loading}
          >
            提交申诉
          </Button>
        </Col>
      </Row>

      {appealableEvaluations.length === 0 && appealsList.length === 0 && (
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
            { title: '提交申诉', status: 'finish', icon: <SendOutlined /> },
            { title: '教师审核', status: 'process', icon: <FileTextOutlined /> },
            { title: '管理员复核', status: 'wait', icon: <CheckCircleOutlined /> },
            { title: '结果反馈', status: 'wait', icon: <ExclamationCircleOutlined /> },
          ]}
        />
        <Paragraph style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
          申诉处理时间：3-5个工作日 | 请确保申诉理由充分，提供相关证明材料 | 支持上传图片、PDF、Word、Excel（最多5个，每个不超过5MB）
        </Paragraph>
      </Card>

      {/* 申诉记录 */}
      <Card title="我的申诉记录">
        {appealsList.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无申诉记录" />
        ) : (
          <Timeline
            items={appealsList.map((appeal) => {
              const config = statusConfig[appeal.status]
              const typeInfo = APPEAL_TYPES.find(t => t.value === appeal.type)

              return {
                key: appeal.id,
                color: appeal.status === 'RESOLVED' ? 'green' : 'blue',
                content: (
                  <Card size="small" hoverable>
                    <Row justify="space-between" align="top">
                      <Col span={17}>
                        <div style={{ marginBottom: 6 }}>
                          <Space>
                            <Text strong>{appeal.evaluation.semester} 综合评测</Text>
                            <Tag color="blue">{appeal.evaluation.aiScore}分</Tag>
                            {typeInfo && <Tag color={typeInfo.color}>{typeInfo.label}</Tag>}
                            <Tag color={config.color} icon={config.icon}>
                              {config.label}
                            </Tag>
                          </Space>
                        </div>

                        <div style={{ marginBottom: 4 }}>
                          <Text type="secondary">申诉理由：</Text>
                          <Paragraph style={{ margin: 0 }} ellipsis={{ rows: 2 }}>
                            {appeal.reason}
                          </Paragraph>
                        </div>

                        {appeal.reply && (
                          <div style={{ marginBottom: 4 }}>
                            <Text type="secondary">处理回复：</Text>
                            <Paragraph style={{ margin: 0, color: '#52c41a' }}>
                              {appeal.reply}
                            </Paragraph>
                          </div>
                        )}

                        {renderAttachments(appeal.attachments)}

                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
                          提交时间：{new Date(appeal.createdAt).toLocaleString('zh-CN')}
                        </Text>
                      </Col>
                      <Col span={7} style={{ textAlign: 'right' }}>
                        <Space orientation="vertical" size={4}>
                          <Button
                            type="link"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetail(appeal)}
                          >
                            查看详情
                          </Button>
                          {appeal.status === 'PENDING' && (
                            <Popconfirm
                              title="确定撤回此申诉吗？"
                              description="撤回后可重新提交"
                              onConfirm={() => handleDeleteAppeal(appeal)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button
                                type="link"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                              >
                                撤回申诉
                              </Button>
                            </Popconfirm>
                          )}
                        </Space>
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
        onCancel={() => {
          if (!loading) {
            setIsModalVisible(false)
            form.resetFields()
            setFileList([])
            setUploadedFiles([])
          }
        }}
        footer={null}
        width={680}
        destroyOnHidden
      >
        <Alert
          title="申诉注意事项"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>请确保申诉理由充分、客观</li>
              <li>上传相关证明材料有助于加快审核</li>
              <li>支持图片、PDF、Word、Excel，单个文件不超过5MB，最多5个</li>
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
          initialValues={{ type: 'SCORE' }}
        >
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                label="选择评测记录"
                name="evaluationId"
                rules={[{ required: true, message: '请选择要申诉的评测记录' }]}
              >
                <Select placeholder="请选择要申诉的评测记录">
                  {appealableEvaluations.map(evaluation => {
                    let gradeTxt = ''
                    try {
                      const report = JSON.parse(evaluation.aiReport)
                      gradeTxt = report.grade ? ` (${report.grade})` : ''
                    } catch { /* ignore */ }
                    return (
                      <Option key={evaluation.id} value={evaluation.id}>
                        <span>
                          <strong>{evaluation.semester}</strong>
                          <span style={{ marginLeft: 8, color: '#1890ff' }}>{evaluation.aiScore}分</span>
                          <span style={{ marginLeft: 4, color: '#666' }}>{gradeTxt}</span>
                        </span>
                      </Option>
                    )
                  })}
                </Select>
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                label="申诉类型"
                name="type"
                rules={[{ required: true, message: '请选择申诉类型' }]}
              >
                <Select>
                  {APPEAL_TYPES.map(t => (
                    <Option key={t.value} value={t.value}>
                      <Tag color={t.color} style={{ marginRight: 4 }}>{t.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="申诉理由"
            name="reason"
            rules={[
              { required: true, message: '请输入申诉理由' },
              { min: 20, message: '申诉理由至少20个字符' },
              { max: 500, message: '申诉理由不超过500个字符' },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="简要说明申诉的核心理由"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="详细描述"
            name="description"
            tooltip="提供更多背景信息、具体事实等，有助于审核人员理解情况"
          >
            <TextArea
              rows={3}
              placeholder="（选填）补充详细说明，如涉及的具体课程、时间、事件经过等"
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item
            label="期望结果"
            name="expectation"
            tooltip="说明您希望如何处理此申诉"
          >
            <TextArea
              rows={2}
              placeholder="（选填）例如：希望重新评估活动加分 / 修正出勤记录 / 调整综合评分等"
              showCount
              maxLength={300}
            />
          </Form.Item>

          <Form.Item label="证明材料">
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持图片、PDF、Word、Excel，单个文件不超过5MB，最多5个
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SendOutlined />}>
                提交申诉
              </Button>
              <Button onClick={() => { setIsModalVisible(false); form.resetFields(); setFileList([]); setUploadedFiles([]) }}>
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
          </Button>,
        ]}
        width={720}
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
                  span: 1,
                },
                {
                  label: '评测分数',
                  children: <Tag color="blue">{viewingAppeal.evaluation.aiScore}分</Tag>,
                  span: 1,
                },
                {
                  label: '申诉类型',
                  children: (() => {
                    const t = APPEAL_TYPES.find(t => t.value === viewingAppeal.type)
                    return t ? <Tag color={t.color}>{t.label}</Tag> : viewingAppeal.type
                  })(),
                  span: 1,
                },
                {
                  label: '申诉状态',
                  children: (
                    <Tag color={statusConfig[viewingAppeal.status].color} icon={statusConfig[viewingAppeal.status].icon}>
                      {statusConfig[viewingAppeal.status].label}
                    </Tag>
                  ),
                  span: 1,
                },
                {
                  label: '提交时间',
                  children: new Date(viewingAppeal.createdAt).toLocaleString('zh-CN'),
                  span: 2,
                },
                {
                  label: '申诉理由',
                  children: viewingAppeal.reason,
                  span: 2,
                },
                ...(viewingAppeal.description
                  ? [{
                      label: '详细描述',
                      children: viewingAppeal.description,
                      span: 2,
                    }]
                  : []),
                ...(viewingAppeal.expectation
                  ? [{
                      label: '期望结果',
                      children: viewingAppeal.expectation,
                      span: 2,
                    }]
                  : []),
              ]}
            />

            {/* 附件展示 */}
            {viewingAppeal.attachments?.length > 0 && (
              <>
                <Divider>证明材料 ({viewingAppeal.attachments.length})</Divider>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {viewingAppeal.attachments.map(att => {
                    const isImage = att.fileType.startsWith('image/')
                    return (
                      <Card
                        key={att.id || att.filePath}
                        size="small"
                        hoverable
                        style={{ width: isImage ? 120 : 'auto', maxWidth: 240 }}
                        styles={{ body: { padding: isImage ? 4 : '8px 12px' } }}
                      >
                        {isImage ? (
                          <Image
                            src={att.filePath}
                            alt={att.fileName}
                            width={112}
                            height={80}
                            style={{ objectFit: 'cover', borderRadius: 4 }}
                          />
                        ) : (
                          <a href={att.filePath} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                            <Space>
                              {getFileIcon(att.fileType)}
                              <div>
                                <div style={{ fontSize: 13, color: '#333', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {att.fileName}
                                </div>
                                <div style={{ fontSize: 11, color: '#999' }}>{formatFileSize(att.fileSize)}</div>
                              </div>
                            </Space>
                          </a>
                        )}
                        <div style={{ textAlign: 'center', marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {isImage ? att.fileName.slice(0, 12) : ''}
                          </Text>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}

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
                try {
                  const report = JSON.parse(viewingAppeal.evaluation.aiReport)
                  return (
                    <div>
                      <p><strong>综合评语：</strong>{report.summary}</p>
                      <Row gutter={16}>
                        {[
                          { key: 'academic', label: '学业成绩' },
                          { key: 'activity', label: '课外活动' },
                          { key: 'conduct', label: '品行表现' },
                          { key: 'attendance', label: '出勤情况' },
                        ].map(dim => (
                          <Col span={6} key={dim.key}>
                            <Descriptions size="small" title={dim.label}>
                              <Descriptions.Item label="得分">{report.dimensions?.[dim.key] ?? '-'}</Descriptions.Item>
                            </Descriptions>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )
                } catch {
                  return <Text type="secondary">报告解析失败</Text>
                }
              })()}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}
