"use client"

import { useState, useCallback } from 'react'
import {
  App,
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  Popconfirm,
  Typography,
  Row,
  Col,
  Tag,
  InputNumber,
  Upload,
  Progress,
  Statistic,
  Alert,
  Descriptions,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  BookOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import * as XLSX from 'xlsx'
import { addScore, updateScore, deleteScore, batchImportScores } from './actions'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

interface Student {
  id: string
  studentNo: string
  user: { id: string; name: string; email: string }
  class: { id: string; name: string; grade: string; teacher: { name: string } }
}

interface Score {
  id: string
  subject: string
  score: number
  semester: string
  createdAt: Date
  student: Student
}

interface ScoreManagementClientProps {
  students: Student[]
  scores: Score[]
  subjects: string[]
  semesters: string[]
}

interface ImportPreviewRow {
  studentNo: string
  subject: string
  score: number
  semester: string
  valid: boolean
  error?: string
}

// Excel 导入模板的列名映射
const IMPORT_COLUMNS = {
  studentNo: '学号',
  subject: '科目',
  score: '成绩',
  semester: '学期',
} as const

export default function ScoreManagementClient({
  students,
  scores,
  subjects,
  semesters
}: ScoreManagementClientProps) {
  const { message } = App.useApp()
  const [filteredScores, setFilteredScores] = useState<Score[]>(scores)
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingScore, setEditingScore] = useState<Score | null>(null)
  const [searchText, setSearchText] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string>()
  const [semesterFilter, setSemesterFilter] = useState<string>()
  const [form] = Form.useForm()

  // 导入预览相关状态
  const [importPreviewVisible, setImportPreviewVisible] = useState(false)
  const [importPreviewData, setImportPreviewData] = useState<ImportPreviewRow[]>([])
  const [importLoading, setImportLoading] = useState(false)

  // 表格列配置
  const columns: ColumnsType<Score> = [
    {
      title: '学生信息',
      key: 'studentInfo',
      width: 200,
      render: (_, record) => (
        <div>
          <Space>
            <UserOutlined style={{ color: '#1890ff' }} />
            <div>
              <div style={{ fontWeight: 500 }}>{record.student.user.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {record.student.studentNo} | {record.student.class.name}
              </div>
            </div>
          </Space>
        </div>
      ),
    },
    {
      title: '科目',
      dataIndex: 'subject',
      key: 'subject',
      width: 120,
      filters: subjects.map(subject => ({ text: subject, value: subject })),
      onFilter: (value, record) => record.subject === value,
      render: (subject) => (
        <Tag color="blue" icon={<BookOutlined />}>
          {subject}
        </Tag>
      ),
    },
    {
      title: '成绩',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      sorter: (a, b) => a.score - b.score,
      render: (score) => {
        let color = '#52c41a'
        if (score < 60) color = '#f5222d'
        else if (score < 70) color = '#fa8c16'
        else if (score < 80) color = '#faad14'
        else if (score < 90) color = '#1890ff'

        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color, fontWeight: 'bold', fontSize: 16 }}>
              {score}
            </div>
            <Progress
              percent={score}
              size="small"
              strokeColor={color}
              showInfo={false}
              style={{ margin: 0 }}
            />
          </div>
        )
      },
    },
    {
      title: '学期',
      dataIndex: 'semester',
      key: 'semester',
      width: 100,
      filters: semesters.map(semester => ({ text: semester, value: semester })),
      onFilter: (value, record) => record.semester === value,
      render: (semester) => <Tag>{semester}</Tag>,
    },
    {
      title: '录入时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: Date) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此成绩记录吗？"
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

  // 搜索和筛选
  const handleSearch = (value: string) => {
    setSearchText(value)
    applyFilters(value, subjectFilter, semesterFilter)
  }

  const handleSubjectFilter = (subject: string | undefined) => {
    setSubjectFilter(subject)
    applyFilters(searchText, subject, semesterFilter)
  }

  const handleSemesterFilter = (semester: string | undefined) => {
    setSemesterFilter(semester)
    applyFilters(searchText, subjectFilter, semester)
  }

  const applyFilters = (search: string, subject?: string, semester?: string) => {
    let filtered = scores

    if (search) {
      filtered = filtered.filter(score =>
        score.student.user.name.toLowerCase().includes(search.toLowerCase()) ||
        score.student.studentNo.toLowerCase().includes(search.toLowerCase()) ||
        score.subject.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (subject) {
      filtered = filtered.filter(score => score.subject === subject)
    }

    if (semester) {
      filtered = filtered.filter(score => score.semester === semester)
    }

    setFilteredScores(filtered)
  }

  // 新增成绩
  const handleAdd = () => {
    setEditingScore(null)
    setIsModalVisible(true)
  }

  // 编辑成绩
  const handleEdit = (score: Score) => {
    setEditingScore(score)
    setIsModalVisible(true)
  }

  // 删除成绩
  const handleDelete = async (scoreId: string) => {
    try {
      setLoading(true)
      await deleteScore(scoreId)
      message.success('成绩删除成功')
    } catch {
      message.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存成绩（新增或编辑）
  const handleSave = async (values: { studentId: string; subject: string; score: number; semester: string }) => {
    try {
      setLoading(true)

      if (editingScore) {
        await updateScore(editingScore.id, {
          subject: values.subject,
          score: values.score,
          semester: values.semester,
        })
        message.success('成绩更新成功')
      } else {
        const formData = new FormData()
        formData.set('studentId', values.studentId)
        formData.set('subject', values.subject)
        formData.set('score', String(values.score))
        formData.set('semester', values.semester)
        await addScore(formData)
        message.success('成绩录入成功')
      }

      setIsModalVisible(false)
    } catch {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  // ========== 导出功能 ==========
  const handleExport = useCallback(() => {
    const dataToExport = filteredScores.map(score => ({
      [IMPORT_COLUMNS.studentNo]: score.student.studentNo,
      '姓名': score.student.user.name,
      '班级': score.student.class.name,
      [IMPORT_COLUMNS.subject]: score.subject,
      [IMPORT_COLUMNS.score]: score.score,
      [IMPORT_COLUMNS.semester]: score.semester,
      '录入时间': new Date(score.createdAt).toLocaleDateString('zh-CN'),
    }))

    if (dataToExport.length === 0) {
      message.warning('没有可导出的数据')
      return
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport)

    // 设置列宽
    ws['!cols'] = [
      { wch: 15 }, // 学号
      { wch: 10 }, // 姓名
      { wch: 18 }, // 班级
      { wch: 14 }, // 科目
      { wch: 8 },  // 成绩
      { wch: 12 }, // 学期
      { wch: 14 }, // 录入时间
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '成绩表')

    const today = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `成绩表_${today}.xlsx`)
    message.success('导出成功')
  }, [filteredScores])

  // ========== 下载导入模板 ==========
  const handleDownloadTemplate = useCallback(() => {
    const templateData = [
      {
        [IMPORT_COLUMNS.studentNo]: '2021001',
        [IMPORT_COLUMNS.subject]: '高等数学',
        [IMPORT_COLUMNS.score]: 85,
        [IMPORT_COLUMNS.semester]: '2026-1',
      },
      {
        [IMPORT_COLUMNS.studentNo]: '2021002',
        [IMPORT_COLUMNS.subject]: '线性代数',
        [IMPORT_COLUMNS.score]: 92,
        [IMPORT_COLUMNS.semester]: '2026-1',
      },
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)

    ws['!cols'] = [
      { wch: 15 }, // 学号
      { wch: 14 }, // 科目
      { wch: 8 },  // 成绩
      { wch: 12 }, // 学期
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '成绩导入模板')
    XLSX.writeFile(wb, '成绩导入模板.xlsx')
    message.success('模板下载成功')
  }, [])

  // ========== 批量导入功能 ==========
  const handleBatchImport = useCallback(async (file: File) => {
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]

      if (!sheetName) {
        message.error('Excel 文件为空')
        return
      }

      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

      if (jsonData.length === 0) {
        message.error('表格中没有数据')
        return
      }

      // 解析并校验每一行
      const studentNoSet = new Set(students.map(s => s.studentNo))
      const previewRows: ImportPreviewRow[] = jsonData.map((row) => {
        const studentNo = String(row[IMPORT_COLUMNS.studentNo] ?? '').trim()
        const subject = String(row[IMPORT_COLUMNS.subject] ?? '').trim()
        const scoreVal = Number(row[IMPORT_COLUMNS.score])
        const semester = String(row[IMPORT_COLUMNS.semester] ?? '').trim()

        let valid = true
        let error = ''

        if (!studentNo) {
          valid = false
          error = '学号为空'
        } else if (!studentNoSet.has(studentNo)) {
          valid = false
          error = `学号 ${studentNo} 不存在`
        }

        if (!subject) {
          valid = false
          error = error ? `${error}；科目为空` : '科目为空'
        }

        if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
          valid = false
          error = error ? `${error}；成绩无效` : '成绩无效（需 0-100）'
        }

        if (!semester) {
          valid = false
          error = error ? `${error}；学期为空` : '学期为空'
        }

        return { studentNo, subject, score: scoreVal, semester, valid, error }
      })

      setImportPreviewData(previewRows)
      setImportPreviewVisible(true)
    } catch {
      message.error('文件解析失败，请确认文件格式正确')
    }
  }, [students])

  // 确认导入
  const handleConfirmImport = async () => {
    const validRows = importPreviewData.filter(row => row.valid)

    if (validRows.length === 0) {
      message.warning('没有有效的数据可以导入')
      return
    }

    try {
      setImportLoading(true)

      const result = await batchImportScores(
        validRows.map(row => ({
          studentNo: row.studentNo,
          subject: row.subject,
          score: row.score,
          semester: row.semester,
        }))
      )

      if (result.failed.length === 0) {
        message.success(`成功导入 ${result.success} 条成绩记录`)
      } else {
        message.warning(
          `成功 ${result.success} 条，失败 ${result.failed.length} 条`
        )
      }

      setImportPreviewVisible(false)
      setImportPreviewData([])
    } catch {
      message.error('导入失败，请重试')
    } finally {
      setImportLoading(false)
    }
  }

  // 导入预览表格列
  const importPreviewColumns: ColumnsType<ImportPreviewRow> = [
    {
      title: '行号',
      key: 'row',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: '状态',
      key: 'status',
      width: 60,
      render: (_, record) => record.valid
        ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
        : <CloseCircleOutlined style={{ color: '#f5222d', fontSize: 16 }} />,
    },
    {
      title: '学号',
      dataIndex: 'studentNo',
      key: 'studentNo',
      width: 120,
    },
    {
      title: '科目',
      dataIndex: 'subject',
      key: 'subject',
      width: 120,
    },
    {
      title: '成绩',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (score, record) => (
        <span style={{ color: record.valid ? undefined : '#f5222d' }}>
          {isNaN(score) ? '-' : score}
        </span>
      ),
    },
    {
      title: '学期',
      dataIndex: 'semester',
      key: 'semester',
      width: 100,
    },
    {
      title: '错误原因',
      dataIndex: 'error',
      key: 'error',
      render: (error) => error ? <Text type="danger">{error}</Text> : '-',
    },
  ]

  // 统计数据
  const totalScores = filteredScores.length
  const avgScore = totalScores > 0 ?
    Math.round(filteredScores.reduce((sum, score) => sum + score.score, 0) / totalScores * 10) / 10 : 0
  const passCount = filteredScores.filter(score => score.score >= 60).length
  const passRate = totalScores > 0 ? Math.round((passCount / totalScores) * 100) : 0

  // 导入预览统计
  const validCount = importPreviewData.filter(r => r.valid).length
  const invalidCount = importPreviewData.length - validCount

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="成绩记录"
              value={totalScores}
              suffix="条"
              prefix={<BookOutlined style={{ color: '#1890ff' }} />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均分"
              value={avgScore}
              precision={1}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="及格人次"
              value={passCount}
              suffix="人次"
              prefix={<UserOutlined style={{ color: '#fa8c16' }} />}
              styles={{ content: { color: '#fa8c16' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="及格率"
              value={passRate}
              suffix="%"
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              styles={{ content: { color: '#722ed1' } }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>成绩管理</Title>
            </Col>
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  录入成绩
                </Button>
                <Upload
                  accept=".xlsx,.xls"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    handleBatchImport(file as unknown as File)
                    return false
                  }}
                >
                  <Button icon={<UploadOutlined />}>
                    批量导入
                  </Button>
                </Upload>
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={handleDownloadTemplate}
                >
                  下载模板
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                >
                  导出成绩
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Search
                placeholder="搜索学生姓名、学号或科目"
                allowClear
                onSearch={handleSearch}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="筛选科目"
                allowClear
                style={{ width: '100%' }}
                onChange={handleSubjectFilter}
              >
                {subjects.map(subject => (
                  <Option key={subject} value={subject}>{subject}</Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="筛选学期"
                allowClear
                style={{ width: '100%' }}
                onChange={handleSemesterFilter}
              >
                {semesters.map(semester => (
                  <Option key={semester} value={semester}>{semester}</Option>
                ))}
              </Select>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredScores}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredScores.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 成绩录入/编辑模态框 */}
      <Modal
        title={editingScore ? '编辑成绩' : '录入成绩'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        afterOpenChange={(open) => {
          if (open) {
            if (editingScore) {
              form.setFieldsValue({
                studentId: editingScore.student.id,
                subject: editingScore.subject,
                score: editingScore.score,
                semester: editingScore.semester,
              })
            } else {
              form.setFieldsValue({ semester: semesters[0] })
            }
          }
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="学生"
                name="studentId"
                rules={[{ required: true, message: '请选择学生' }]}
              >
                <Select
                  placeholder="请选择学生"
                  showSearch
                  optionFilterProp="children"
                  disabled={!!editingScore}
                >
                  {students.map(student => (
                    <Option key={student.id} value={student.id}>
                      {student.user.name} ({student.studentNo})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="科目"
                name="subject"
                rules={[{ required: true, message: '请选择科目' }]}
              >
                <Select placeholder="请选择科目">
                  {subjects.map(subject => (
                    <Option key={subject} value={subject}>{subject}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="成绩"
                name="score"
                rules={[
                  { required: true, message: '请输入成绩' },
                  { type: 'number', min: 0, max: 100, message: '成绩必须在0-100之间' }
                ]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={1}
                  placeholder="请输入成绩"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="学期"
                name="semester"
                rules={[{ required: true, message: '请选择学期' }]}
              >
                <Select placeholder="请选择学期">
                  {semesters.map(semester => (
                    <Option key={semester} value={semester}>{semester}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingScore ? '更新' : '录入'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入预览模态框 */}
      <Modal
        title={
          <Space>
            <FileExcelOutlined style={{ color: '#52c41a' }} />
            <span>导入预览</span>
          </Space>
        }
        open={importPreviewVisible}
        onCancel={() => {
          setImportPreviewVisible(false)
          setImportPreviewData([])
        }}
        width={900}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setImportPreviewVisible(false)
              setImportPreviewData([])
            }}
          >
            取消
          </Button>,
          <Button
            key="import"
            type="primary"
            loading={importLoading}
            disabled={validCount === 0}
            onClick={handleConfirmImport}
          >
            确认导入 ({validCount} 条)
          </Button>,
        ]}
      >
        {/* 导入统计 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="总记录数">
                {importPreviewData.length} 条
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={8}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="有效记录">
                <Text type="success">{validCount} 条</Text>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={8}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="错误记录">
                <Text type="danger">{invalidCount} 条</Text>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>

        {invalidCount > 0 && (
          <Alert
            message={`有 ${invalidCount} 条记录存在错误，这些记录将被跳过`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          columns={importPreviewColumns}
          dataSource={importPreviewData}
          rowKey={(_, index) => String(index)}
          size="small"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 700 }}
          rowClassName={(record) => record.valid ? '' : 'ant-table-row-error'}
        />
      </Modal>
    </div>
  )
}
