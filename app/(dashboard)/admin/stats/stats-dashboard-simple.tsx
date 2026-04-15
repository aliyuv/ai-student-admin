"use client"

import { useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Progress,
  Table,
  Tag,
  Tabs,
  Badge
} from 'antd'
import {
  UserOutlined,
  BookOutlined,
  TrophyOutlined,
  TeamOutlined,
  BarChartOutlined,
  RiseOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

// 简化的统计 Dashboard 组件（不使用复杂图表库）
interface StatsData {
  students: { id: string }[]
  scores: { score: number; subject: string; student?: { class?: { id: string } } }[]
  activities: { score: number; type: string }[]
  awards: { id: string }[]
  attendances: { id: string }[]
  evaluations: { status: string; aiScore: number; student?: { class?: { id: string } } }[]
  classes: { id: string; name: string; _count?: { students?: number } }[]
}

export default function StatsDashboardSimple(data: StatsData) {

  // 基础统计
  const stats = useMemo(() => {
    const totalStudents = data.students.length
    const totalScores = data.scores.length
    const totalActivities = data.activities.length
    const totalEvaluations = data.evaluations.filter(e => e.status === 'APPROVED').length

    const avgScore = totalScores > 0 ?
      Math.round((data.scores.reduce((sum, s) => sum + s.score, 0) / totalScores) * 10) / 10 : 0

    const avgEvalScore = totalEvaluations > 0 ?
      Math.round((data.evaluations.filter(e => e.status === 'APPROVED')
        .reduce((sum, e) => sum + e.aiScore, 0) / totalEvaluations) * 10) / 10 : 0

    const passCount = data.scores.filter(s => s.score >= 60).length
    const passRate = totalScores > 0 ? Math.round((passCount / totalScores) * 100) : 0

    return {
      totalStudents,
      totalScores,
      totalActivities,
      totalEvaluations,
      avgScore,
      avgEvalScore,
      passRate
    }
  }, [data])

  // 科目分析
  const subjectAnalysis = useMemo(() => {
    const subjectMap: Record<string, number[]> = {}
    data.scores.forEach(score => {
      if (!subjectMap[score.subject]) {
        subjectMap[score.subject] = []
      }
      subjectMap[score.subject].push(score.score)
    })

    return Object.entries(subjectMap).map(([subject, scores]) => ({
      subject,
      avgScore: Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10,
      maxScore: Math.max(...scores),
      minScore: Math.min(...scores),
      passRate: Math.round((scores.filter(s => s >= 60).length / scores.length) * 100),
      studentCount: scores.length
    })).sort((a, b) => b.avgScore - a.avgScore)
  }, [data.scores])

  // 班级排名
  const classRanking = useMemo(() => {
    return data.classes.map(cls => {
      const classScores = data.scores.filter(s => s.student?.class?.id === cls.id)
      const classEvaluations = data.evaluations.filter(e =>
        e.student?.class?.id === cls.id && e.status === 'APPROVED'
      )

      const avgScore = classScores.length > 0 ?
        Math.round((classScores.reduce((sum, s) => sum + s.score, 0) / classScores.length) * 10) / 10 : 0

      const avgEvalScore = classEvaluations.length > 0 ?
        Math.round((classEvaluations.reduce((sum, e) => sum + e.aiScore, 0) / classEvaluations.length) * 10) / 10 : 0

      return {
        className: cls.name,
        studentCount: cls._count?.students || 0,
        avgScore,
        avgEvalScore
      }
    }).sort((a, b) => b.avgEvalScore - a.avgEvalScore)
  }, [data.classes, data.scores, data.evaluations])

  const tabItems = [
    {
      key: 'overview',
      label: <Space><BarChartOutlined />综合概览</Space>,
      children: (
        <Row gutter={24}>
          {/* 各科成绩分析 */}
          <Col span={12}>
            <Card title="各科成绩分析" style={{ height: 400 }}>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {subjectAnalysis.map(subject => (
                  <div key={subject.subject} style={{
                    marginBottom: 16,
                    padding: 12,
                    border: '1px solid #f0f0f0',
                    borderRadius: 6
                  }}>
                    <Row justify="space-between" align="middle">
                      <Col span={8}>
                        <Text strong>{subject.subject}</Text>
                      </Col>
                      <Col span={6}>
                        <Progress
                          percent={subject.avgScore}
                          size="small"
                          strokeColor={
                            subject.avgScore >= 85 ? '#52c41a' :
                            subject.avgScore >= 70 ? '#1890ff' : '#faad14'
                          }
                        />
                      </Col>
                      <Col span={4} style={{ textAlign: 'right' }}>
                        <Text strong>{subject.avgScore}</Text>
                      </Col>
                      <Col span={6} style={{ textAlign: 'right' }}>
                        <Tag color="blue">{subject.passRate}%及格</Tag>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            </Card>
          </Col>

          {/* 班级排名 */}
          <Col span={12}>
            <Card title="班级综合排名" style={{ height: 400 }}>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {classRanking.map((item, index) => (
                  <div
                    key={item.className}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: index < classRanking.length - 1 ? '1px solid #f0f0f0' : 'none',
                      gap: 12,
                    }}
                  >
                    <Badge
                      count={index + 1}
                      style={{
                        backgroundColor: index < 3
                          ? ['#f5222d', '#fa8c16', '#faad14'][index]
                          : '#d9d9d9',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.className}</div>
                      <Space size={4} wrap>
                        <Text type="secondary">{item.studentCount}名学生</Text>
                        <Tag color="blue">平均分 {item.avgScore}</Tag>
                        <Tag color="green">综合评测 {item.avgEvalScore}</Tag>
                      </Space>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'scores',
      label: <Space><BookOutlined />成绩详情</Space>,
      children: (
        <Card title="各科目详细分析">
          <Table
            dataSource={subjectAnalysis}
            pagination={false}
            columns={[
              {
                title: '科目',
                dataIndex: 'subject',
                key: 'subject',
              },
              {
                title: '平均分',
                dataIndex: 'avgScore',
                key: 'avgScore',
                sorter: (a: (typeof subjectAnalysis)[number], b: (typeof subjectAnalysis)[number]) => a.avgScore - b.avgScore,
                render: (score: number) => (
                  <Text strong style={{
                    color: score >= 85 ? '#52c41a' :
                           score >= 70 ? '#1890ff' : '#faad14'
                  }}>
                    {score}
                  </Text>
                )
              },
              {
                title: '最高分',
                dataIndex: 'maxScore',
                key: 'maxScore',
                render: (score: number) => <Tag color="green">{score}</Tag>
              },
              {
                title: '最低分',
                dataIndex: 'minScore',
                key: 'minScore',
                render: (score: number) => <Tag color={score >= 60 ? 'blue' : 'red'}>{score}</Tag>
              },
              {
                title: '及格率',
                dataIndex: 'passRate',
                key: 'passRate',
                sorter: (a: (typeof subjectAnalysis)[number], b: (typeof subjectAnalysis)[number]) => a.passRate - b.passRate,
                render: (rate: number) => (
                  <Progress
                    percent={rate}
                    size="small"
                    strokeColor={rate >= 90 ? '#52c41a' : rate >= 70 ? '#1890ff' : '#f5222d'}
                  />
                )
              },
              {
                title: '参与人数',
                dataIndex: 'studentCount',
                key: 'studentCount',
                render: (count: number) => <Badge count={count} style={{ backgroundColor: '#722ed1' }} />
              }
            ]}
          />
        </Card>
      ),
    },
    {
      key: 'activities',
      label: <Space><TeamOutlined />活动统计</Space>,
      children: (
        <Row gutter={24}>
          <Col span={12}>
            <Card title="活动类型分布">
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="社团活动"
                      value={data.activities.filter((a: (typeof data.activities)[number]) => a.type === 'ACTIVITY').length}
                      suffix="项"
                      styles={{ content: { color: '#1890ff' } }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="实践项目"
                      value={data.activities.filter((a: (typeof data.activities)[number]) => a.type === 'PRACTICE').length}
                      suffix="项"
                      styles={{ content: { color: '#52c41a' } }}
                    />
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="活动参与统计">
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="总参与人次"
                      value={data.activities.length}
                      suffix="人次"
                      styles={{ content: { color: '#722ed1' } }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="平均活动分"
                      value={
                        data.activities.length > 0 ?
                        Math.round((data.activities.reduce((sum: number, a: (typeof data.activities)[number]) => sum + a.score, 0) / data.activities.length) * 10) / 10
                        : 0
                      }
                      precision={1}
                      styles={{ content: { color: '#fa8c16' } }}
                    />
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        </Row>
      ),
    },
  ]

  return (
    <div style={{ padding: '0 24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <BarChartOutlined style={{ marginRight: 8 }} />
          数据统计分析
        </Title>
        <Text type="secondary">学生综合数据统计与分析</Text>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="学生总数"
              value={stats.totalStudents}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均成绩"
              value={stats.avgScore}
              precision={1}
              prefix={<BookOutlined style={{ color: '#52c41a' }} />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="及格率"
              value={stats.passRate}
              suffix="%"
              prefix={<RiseOutlined style={{ color: '#fa8c16' }} />}
              styles={{ content: { color: '#fa8c16' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="综合评测"
              value={stats.avgEvalScore}
              precision={1}
              prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
              styles={{ content: { color: '#722ed1' } }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="overview" type="card" items={tabItems} />
    </div>
  )
}
