"use client"

import { useState, useCallback } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Typography,
  Space,
  Button,
  Empty,
  Timeline,
  Badge,
  App,
  Avatar,
  Divider,
  Descriptions,
  Modal,
} from 'antd'
import {
  TrophyOutlined,
  BookOutlined,
  TeamOutlined,
  CalendarOutlined,
  StarOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  DownloadOutlined,
  UserOutlined,
  RiseOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import * as XLSX from 'xlsx'
import { EvaluationReport } from '@/types'

const { Title, Text, Paragraph } = Typography

interface StudentWithDetails {
  id: string
  studentNo: string
  user: { name: string; email: string }
  class: { name: string; grade: string }
}

interface EvaluationWithReport {
  id: string
  semester: string
  aiScore: number
  aiReport: string
  createdAt: Date
}

interface StudentEvaluationClientProps {
  student: StudentWithDetails
  evaluations: EvaluationWithReport[]
}

// 等级颜色映射
const GRADE_COLORS: Record<string, string> = {
  '优秀': '#52c41a',
  '良好': '#1890ff',
  '中等': '#faad14',
  '合格': '#fa8c16',
  '待提升': '#f5222d',
}

// 等级渐变背景
const GRADE_GRADIENTS: Record<string, string> = {
  '优秀': 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
  '良好': 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
  '中等': 'linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%)',
  '合格': 'linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)',
  '待提升': 'linear-gradient(135deg, #fff1f0 0%, #ffa39e 100%)',
}

// 维度配置
const DIMENSION_CONFIG = [
  { key: 'academic', label: '学业成绩', color: '#4F46E5', icon: <BookOutlined /> },
  { key: 'activity', label: '课外活动', color: '#52c41a', icon: <TeamOutlined /> },
  { key: 'conduct', label: '品行表现', color: '#fa8c16', icon: <StarOutlined /> },
  { key: 'attendance', label: '出勤情况', color: '#13c2c2', icon: <CalendarOutlined /> },
]

export default function StudentEvaluationClient({
  student,
  evaluations,
}: StudentEvaluationClientProps) {
  const { message } = App.useApp()
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationWithReport | null>(
    evaluations[0] || null,
  )
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  const currentReport = selectedEvaluation
    ? (JSON.parse(selectedEvaluation.aiReport) as EvaluationReport)
    : null

  const getGradeColor = (grade: string) => GRADE_COLORS[grade] || '#666'

  // 雷达图数据
  const getRadarData = (dimensions: EvaluationReport['dimensions']) => [
    { dimension: '学业成绩', score: dimensions.academic, fullMark: 100 },
    { dimension: '课外活动', score: dimensions.activity, fullMark: 100 },
    { dimension: '品行表现', score: dimensions.conduct, fullMark: 100 },
    { dimension: '出勤情况', score: dimensions.attendance, fullMark: 100 },
  ]

  // 查看详情 Modal
  const handleViewDetail = useCallback(() => {
    setDetailModalVisible(true)
  }, [])

  // 导出报告
  const handleExportReport = useCallback(() => {
    if (!selectedEvaluation || !currentReport) {
      message.warning('请先选择评测记录')
      return
    }

    // Sheet 1: 基本信息
    const infoData = [
      { '项目': '学生姓名', '内容': student.user.name },
      { '项目': '学号', '内容': student.studentNo },
      { '项目': '班级', '内容': `${student.class.grade} ${student.class.name}` },
      { '项目': '评测学期', '内容': selectedEvaluation.semester },
      { '项目': '综合得分', '内容': selectedEvaluation.aiScore },
      { '项目': '评测等级', '内容': currentReport.grade },
      { '项目': '评测日期', '内容': new Date(selectedEvaluation.createdAt).toLocaleDateString('zh-CN') },
    ]
    const wsInfo = XLSX.utils.json_to_sheet(infoData)
    wsInfo['!cols'] = [{ wch: 12 }, { wch: 30 }]

    // Sheet 2: 维度得分
    const dimensionData = [
      { '维度': '学业成绩', '得分': currentReport.dimensions.academic, '满分': 100 },
      { '维度': '课外活动', '得分': currentReport.dimensions.activity, '满分': 100 },
      { '维度': '品行表现', '得分': currentReport.dimensions.conduct, '满分': 100 },
      { '维度': '出勤情况', '得分': currentReport.dimensions.attendance, '满分': 100 },
    ]
    const wsDimension = XLSX.utils.json_to_sheet(dimensionData)
    wsDimension['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 8 }]

    // Sheet 3: 综合评语
    const commentData = [
      { '类型': '综合评语', '内容': currentReport.summary },
      { '类型': '教师评语', '内容': currentReport.comment },
      ...currentReport.strengths.map((s) => ({ '类型': '优点', '内容': s })),
      ...currentReport.suggestions.map((s) => ({ '类型': '改进建议', '内容': s })),
    ]
    const wsComment = XLSX.utils.json_to_sheet(commentData)
    wsComment['!cols'] = [{ wch: 12 }, { wch: 60 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, wsInfo, '基本信息')
    XLSX.utils.book_append_sheet(wb, wsDimension, '维度得分')
    XLSX.utils.book_append_sheet(wb, wsComment, '综合评语')

    const fileName = `综合评测报告_${student.user.name}_${selectedEvaluation.semester}.xlsx`
    XLSX.writeFile(wb, fileName)
    message.success('报告导出成功')
  }, [selectedEvaluation, currentReport, student, message])

  // 空状态
  if (evaluations.length === 0) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space orientation="vertical" size={4}>
              <Text strong>暂无评测结果</Text>
              <Text type="secondary">请等待教师完成评测审核</Text>
            </Space>
          }
        />
      </Card>
    )
  }

  // 分数趋势（最新 vs 上一次）
  const scoreTrend = evaluations.length >= 2
    ? evaluations[0].aiScore - evaluations[1].aiScore
    : null

  return (
    <div>
      {/* ── 顶部：学生信息 + 最新评测概览 ── */}
      <Card
        style={{ marginBottom: 24 }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Row gutter={24} align="middle">
          <Col flex="none">
            <Avatar
              size={56}
              icon={<UserOutlined />}
              style={{ backgroundColor: '#4F46E5' }}
            />
          </Col>
          <Col flex="auto">
            <div>
              <Space size={12} align="center">
                <Title level={4} style={{ margin: 0 }}>{student.user.name}</Title>
                {currentReport && (
                  <Tag
                    color={getGradeColor(currentReport.grade)}
                    style={{ fontSize: 13, padding: '2px 12px' }}
                  >
                    {currentReport.grade}
                  </Tag>
                )}
              </Space>
              <div style={{ marginTop: 4 }}>
                <Space size={16}>
                  <Text type="secondary">
                    <BookOutlined style={{ marginRight: 4 }} />
                    {student.studentNo}
                  </Text>
                  <Text type="secondary">
                    <TeamOutlined style={{ marginRight: 4 }} />
                    {student.class.grade} {student.class.name}
                  </Text>
                  <Text type="secondary">
                    <FileTextOutlined style={{ marginRight: 4 }} />
                    共 {evaluations.length} 次评测
                  </Text>
                </Space>
              </div>
            </div>
          </Col>
          <Col flex="none">
            <Row gutter={32}>
              <Col>
                <Statistic
                  title="最新得分"
                  value={evaluations[0].aiScore}
                  precision={1}
                  suffix="分"
                  prefix={<TrophyOutlined />}
                  styles={{ content: { color: getGradeColor(currentReport?.grade || ''), fontSize: 28 } }}
                />
              </Col>
              {scoreTrend !== null && (
                <Col>
                  <Statistic
                    title="较上次"
                    value={Math.abs(scoreTrend)}
                    precision={1}
                    prefix={scoreTrend >= 0 ? <RiseOutlined /> : <RiseOutlined style={{ transform: 'rotate(180deg)' }} />}
                    suffix="分"
                    styles={{
                      content: {
                        color: scoreTrend >= 0 ? '#52c41a' : '#f5222d',
                        fontSize: 28,
                      },
                    }}
                  />
                </Col>
              )}
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={24}>
        {/* ── 左侧：评测历史时间线 ── */}
        <Col xs={24} md={6}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                <span>评测历史</span>
              </Space>
            }
            styles={{ body: { maxHeight: 'calc(100vh - 340px)', overflow: 'auto' } }}
          >
            <Timeline
              items={evaluations.map((evaluation) => {
                const report = JSON.parse(evaluation.aiReport) as EvaluationReport
                const isSelected = selectedEvaluation?.id === evaluation.id

                return {
                  color: isSelected ? 'blue' : 'gray',
                  content: (
                    <div
                      onClick={() => setSelectedEvaluation(evaluation)}
                      style={{
                        cursor: 'pointer',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: isSelected ? '1px solid #4F46E5' : '1px solid transparent',
                        background: isSelected ? '#f0f0ff' : 'transparent',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong style={{ color: isSelected ? '#4F46E5' : undefined }}>
                          {evaluation.semester}
                        </Text>
                        <Tag
                          color={getGradeColor(report.grade)}
                          style={{ margin: 0, fontSize: 11 }}
                        >
                          {report.grade}
                        </Tag>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <Text style={{ fontSize: 20, fontWeight: 700, color: getGradeColor(report.grade) }}>
                          {evaluation.aiScore}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 2 }}>分</Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {new Date(evaluation.createdAt).toLocaleDateString('zh-CN')}
                      </Text>
                    </div>
                  ),
                }
              })}
            />
          </Card>
        </Col>

        {/* ── 右侧：详细报告 ── */}
        <Col xs={24} md={18}>
          {currentReport && selectedEvaluation && (
            <div>
              {/* 操作栏 */}
              <Card
                styles={{ body: { padding: '12px 24px' } }}
                style={{ marginBottom: 16 }}
              >
                <Row justify="space-between" align="middle">
                  <Col>
                    <Space size={12}>
                      <Title level={5} style={{ margin: 0 }}>
                        {selectedEvaluation.semester} 综合评测报告
                      </Title>
                      <Tag
                        color={getGradeColor(currentReport.grade)}
                        style={{ fontSize: 13, padding: '2px 12px' }}
                      >
                        {currentReport.grade}
                      </Tag>
                    </Space>
                  </Col>
                  <Col>
                    <Space>
                      <Button
                        icon={<EyeOutlined />}
                        onClick={handleViewDetail}
                      >
                        查看完整报告
                      </Button>
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleExportReport}
                      >
                        导出报告
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Card>

              {/* 核心指标卡片 */}
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Card
                    styles={{
                      body: {
                        textAlign: 'center',
                        padding: '20px 16px',
                        background: GRADE_GRADIENTS[currentReport.grade] || '#fafafa',
                      },
                    }}
                  >
                    <TrophyOutlined style={{ fontSize: 28, color: getGradeColor(currentReport.grade), marginBottom: 8 }} />
                    <Statistic
                      title="综合得分"
                      value={selectedEvaluation.aiScore}
                      precision={1}
                      suffix="分"
                      styles={{ content: { color: getGradeColor(currentReport.grade), fontSize: 32, fontWeight: 700 } }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card
                    styles={{
                      body: {
                        textAlign: 'center',
                        padding: '20px 16px',
                        background: GRADE_GRADIENTS[currentReport.grade] || '#fafafa',
                      },
                    }}
                  >
                    <StarOutlined style={{ fontSize: 28, color: getGradeColor(currentReport.grade), marginBottom: 8 }} />
                    <Statistic
                      title="评测等级"
                      value={currentReport.grade}
                      styles={{ content: { color: getGradeColor(currentReport.grade), fontSize: 32, fontWeight: 700 } }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card
                    styles={{
                      body: {
                        textAlign: 'center',
                        padding: '20px 16px',
                        background: 'linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%)',
                      },
                    }}
                  >
                    <CalendarOutlined style={{ fontSize: 28, color: '#4F46E5', marginBottom: 8 }} />
                    <Statistic
                      title="评测日期"
                      value={new Date(selectedEvaluation.createdAt).toLocaleDateString('zh-CN')}
                      styles={{ content: { color: '#4F46E5', fontSize: 20 } }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* 维度得分：雷达图 + 得分条 */}
              <Card
                title={
                  <Space>
                    <ExperimentOutlined style={{ color: '#4F46E5' }} />
                    <span>维度得分分析</span>
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                <Row gutter={24} align="middle">
                  {/* 雷达图 */}
                  <Col xs={24} md={12}>
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={getRadarData(currentReport.dimensions)}>
                        <PolarGrid gridType="polygon" />
                        <PolarAngleAxis
                          dataKey="dimension"
                          tick={{ fontSize: 13, fill: '#595959' }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tick={{ fontSize: 11 }}
                        />
                        <Radar
                          name="得分"
                          dataKey="score"
                          stroke="#4F46E5"
                          fill="#4F46E5"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                        <RechartsTooltip
                          formatter={(value) => [`${value} 分`, '得分']}
                          contentStyle={{ borderRadius: 8 }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Col>

                  {/* 各维度得分条 */}
                  <Col xs={24} md={12}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {DIMENSION_CONFIG.map((dim) => {
                        const score = currentReport.dimensions[dim.key as keyof typeof currentReport.dimensions]
                        return (
                          <div key={dim.key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <Space size={8}>
                                <span style={{ color: dim.color }}>{dim.icon}</span>
                                <Text strong>{dim.label}</Text>
                              </Space>
                              <Text strong style={{ color: dim.color, fontSize: 16 }}>
                                {score}
                              </Text>
                            </div>
                            <Progress
                              percent={score}
                              strokeColor={dim.color}
                              showInfo={false}
                              size={['100%', 10]}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* AI 综合评语 */}
              <Card
                title={
                  <Space>
                    <FileTextOutlined style={{ color: '#4F46E5' }} />
                    <span>AI 综合评语</span>
                  </Space>
                }
                style={{ marginBottom: 16 }}
                styles={{
                  body: {
                    background: 'linear-gradient(135deg, #f9f9ff 0%, #f0f0ff 100%)',
                  },
                }}
              >
                <Paragraph style={{ fontSize: 15, lineHeight: 1.8, margin: 0 }}>
                  {currentReport.summary}
                </Paragraph>
                {currentReport.comment && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #d9d9d9' }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      教师评语：{currentReport.comment}
                    </Text>
                  </div>
                )}
              </Card>

              {/* 优点与建议 */}
              <Row gutter={16}>
                <Col span={12}>
                  <Card
                    title={
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <span>表现优秀</span>
                      </Space>
                    }
                    styles={{
                      header: { borderBottom: '2px solid #52c41a' },
                    }}
                  >
                    {currentReport.strengths.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {currentReport.strengths.map((item: string, index: number) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: '#f6ffed',
                            }}
                          >
                            <Badge status="success" />
                            <Text>{item}</Text>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Text type="secondary">暂无特别突出的表现</Text>
                    )}
                  </Card>
                </Col>
                <Col span={12}>
                  <Card
                    title={
                      <Space>
                        <ExperimentOutlined style={{ color: '#fa8c16' }} />
                        <span>改进建议</span>
                      </Space>
                    }
                    styles={{
                      header: { borderBottom: '2px solid #fa8c16' },
                    }}
                  >
                    {currentReport.suggestions.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {currentReport.suggestions.map((item: string, index: number) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: '#fff7e6',
                            }}
                          >
                            <Badge status="warning" />
                            <Text>{item}</Text>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Text type="secondary">继续保持当前良好状态</Text>
                    )}
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Col>
      </Row>

      {/* ── 查看完整报告 Modal ── */}
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: '#4F46E5' }} />
            <span>
              {selectedEvaluation?.semester} 综合评测完整报告
            </span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="export" type="primary" icon={<DownloadOutlined />} onClick={handleExportReport}>
            导出报告
          </Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {currentReport && selectedEvaluation && (
          <div>
            {/* 学生信息 */}
            <Descriptions
              bordered
              size="small"
              column={2}
              style={{ marginBottom: 24 }}
              items={[
                { key: 'name', label: '姓名', children: student.user.name },
                { key: 'studentNo', label: '学号', children: student.studentNo },
                { key: 'class', label: '班级', children: `${student.class.grade} ${student.class.name}` },
                { key: 'semester', label: '评测学期', children: selectedEvaluation.semester },
                {
                  key: 'score',
                  label: '综合得分',
                  children: (
                    <Text strong style={{ fontSize: 18, color: getGradeColor(currentReport.grade) }}>
                      {selectedEvaluation.aiScore} 分
                    </Text>
                  ),
                },
                {
                  key: 'grade',
                  label: '评测等级',
                  children: (
                    <Tag color={getGradeColor(currentReport.grade)} style={{ fontSize: 13 }}>
                      {currentReport.grade}
                    </Tag>
                  ),
                },
                {
                  key: 'date',
                  label: '评测日期',
                  children: new Date(selectedEvaluation.createdAt).toLocaleDateString('zh-CN'),
                  span: 2,
                },
              ]}
            />

            {/* 维度得分 */}
            <Divider titlePlacement="left">维度得分</Divider>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              {DIMENSION_CONFIG.map((dim) => {
                const score = currentReport.dimensions[dim.key as keyof typeof currentReport.dimensions]
                return (
                  <Col span={6} key={dim.key}>
                    <Card
                      size="small"
                      styles={{
                        body: { textAlign: 'center', padding: '16px 8px' },
                      }}
                    >
                      <div style={{ color: dim.color, fontSize: 20, marginBottom: 4 }}>{dim.icon}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{dim.label}</Text>
                      <div style={{ fontSize: 24, fontWeight: 700, color: dim.color, marginTop: 4 }}>
                        {score}
                      </div>
                      <Progress
                        percent={score}
                        size="small"
                        strokeColor={dim.color}
                        showInfo={false}
                      />
                    </Card>
                  </Col>
                )
              })}
            </Row>

            {/* 综合评语 */}
            <Divider titlePlacement="left">综合评语</Divider>
            <Card
              size="small"
              style={{ marginBottom: 16 }}
              styles={{ body: { background: '#f9f9ff' } }}
            >
              <Paragraph style={{ margin: 0, lineHeight: 1.8 }}>
                {currentReport.summary}
              </Paragraph>
            </Card>

            {currentReport.comment && (
              <Card
                size="small"
                style={{ marginBottom: 16 }}
                styles={{ body: { background: '#fffbe6' } }}
              >
                <Text type="secondary">教师评语：</Text>
                <Paragraph style={{ margin: '4px 0 0 0' }}>
                  {currentReport.comment}
                </Paragraph>
              </Card>
            )}

            {/* 优点与建议 */}
            <Row gutter={16}>
              <Col span={12}>
                <Divider titlePlacement="left">
                  <Space><CheckCircleOutlined style={{ color: '#52c41a' }} />表现优秀</Space>
                </Divider>
                {currentReport.strengths.length > 0 ? (
                  currentReport.strengths.map((item: string, i: number) => (
                    <div key={i} style={{ padding: '6px 0' }}>
                      <Badge status="success" text={item} />
                    </div>
                  ))
                ) : (
                  <Text type="secondary">暂无</Text>
                )}
              </Col>
              <Col span={12}>
                <Divider titlePlacement="left">
                  <Space><ExperimentOutlined style={{ color: '#fa8c16' }} />改进建议</Space>
                </Divider>
                {currentReport.suggestions.length > 0 ? (
                  currentReport.suggestions.map((item: string, i: number) => (
                    <div key={i} style={{ padding: '6px 0' }}>
                      <Badge status="warning" text={item} />
                    </div>
                  ))
                ) : (
                  <Text type="secondary">暂无</Text>
                )}
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}
