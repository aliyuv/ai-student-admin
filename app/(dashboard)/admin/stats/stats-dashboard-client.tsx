"use client"

import { Card, Row, Col, Statistic, Typography, Space, Table, Tag, Progress, Badge, Empty } from "antd"
import {
  UserOutlined,
  BookOutlined,
  TrophyOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  BarChartOutlined,
  CalendarOutlined,
  StarOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer,
} from "recharts"

const { Title, Text } = Typography

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  overview: {
    totalStudents: number
    totalClasses: number
    totalScoreRecords: number
    totalActivities: number
    totalEvaluations: number
    avgScore: number
    avgEvalScore: number
    passRate: number
  }
  scoreDistribution: { range: string; label: string; count: number; color: string }[]
  evalDistribution: { label: string; count: number; color: string }[]
  subjectAnalysis: {
    subject: string; avgScore: number; maxScore: number
    minScore: number; passRate: number; studentCount: number
  }[]
  classRanking: {
    className: string; teacherName: string; studentCount: number
    avgScore: number; avgEvalScore: number; passRate: number
  }[]
  attendanceStats: {
    data: { name: string; value: number; color: string }[]
    rate: number; total: number
  }
  activityStats: {
    clubCount: number; practiceCount: number; avgScore: number
    topStudents: { name: string; className: string; count: number; totalScore: number }[]
  }
  awardStats: {
    awards: number; punishments: number
    levelDistribution: { name: string; value: number }[]
  }
  semesterTrend: { semester: string; avgScore: number; studentCount: number }[]
  semesters: string[]
}

// ── 颜色 ─────────────────────────────────────────────────────────────────────

const AWARD_COLORS = ["#1890ff", "#52c41a", "#faad14", "#722ed1", "#fa8c16"]

// ── 自定义 Tooltip ───────────────────────────────────────────────────────────

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0]
  return (
    <div style={{ background: "#fff", padding: "8px 12px", border: "1px solid #f0f0f0", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <Text strong>{d.name}</Text>
      <br />
      <Text>{d.value} 人</Text>
    </div>
  )
}

// ── 组件 ─────────────────────────────────────────────────────────────────────

export default function StatsDashboardClient(props: Props) {
  const { overview, scoreDistribution, evalDistribution, subjectAnalysis, classRanking, attendanceStats, activityStats, awardStats, semesterTrend } = props

  const hasData = overview.totalStudents > 0

  if (!hasData) {
    return (
      <div style={{ padding: "0 24px" }}>
        <Title level={3}><BarChartOutlined style={{ marginRight: 8 }} />数据统计分析</Title>
        <Card><Empty description="暂无数据，请先导入学生和成绩信息" /></Card>
      </div>
    )
  }

  return (
    <div style={{ padding: "0 24px" }}>
      {/* ── 标题 ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <BarChartOutlined style={{ marginRight: 8 }} />
          数据统计分析
        </Title>
        <Text type="secondary">全校学生综合数据统计与可视化分析</Text>
      </div>

      {/* ── 核心指标 ────────────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: "学生总数", value: overview.totalStudents, suffix: "人", icon: <UserOutlined />, color: "#1890ff" },
          { title: "班级数量", value: overview.totalClasses, suffix: "个", icon: <TeamOutlined />, color: "#13c2c2" },
          { title: "平均成绩", value: overview.avgScore, precision: 1, icon: <BookOutlined />, color: "#52c41a" },
          { title: "及格率", value: overview.passRate, suffix: "%", icon: <RiseOutlined />, color: overview.passRate >= 90 ? "#52c41a" : overview.passRate >= 70 ? "#fa8c16" : "#f5222d" },
          { title: "综合评测均分", value: overview.avgEvalScore, precision: 1, icon: <TrophyOutlined />, color: "#722ed1" },
          { title: "已完成评测", value: overview.totalEvaluations, suffix: "份", icon: <CheckCircleOutlined />, color: "#eb2f96" },
        ].map((item) => (
          <Col xs={12} sm={8} md={4} key={item.title}>
            <Card hoverable styles={{ body: { padding: "16px 20px" } }}>
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 13 }}>{item.title}</Text>}
                value={item.value}
                precision={item.precision}
                suffix={item.suffix}
                prefix={<span style={{ color: item.color, marginRight: 4 }}>{item.icon}</span>}
                styles={{ content: { color: item.color, fontSize: 22 } }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── 第一行：成绩分布 + 评测等级 ──────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card title={<Space><BarChartOutlined />成绩分段分布</Space>} styles={{ body: { padding: "12px 16px" } }}>
            {overview.totalScoreRecords > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreDistribution} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 13 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [`${value} 人`, "人数"]}
                    contentStyle={{ borderRadius: 8 }}
                  />
                  <Bar dataKey="count" name="人数" radius={[6, 6, 0, 0]}>
                    {scoreDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无成绩数据" style={{ padding: 40 }} />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={<Space><TrophyOutlined />评测等级分布</Space>} styles={{ body: { padding: "12px 16px" } }}>
            {overview.totalEvaluations > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={evalDistribution.filter((d) => d.count > 0)}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={95}
                    paddingAngle={3}
                    dataKey="count"
                    label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {evalDistribution.filter((d) => d.count > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    formatter={(value: string) => <Text style={{ fontSize: 12 }}>{value}</Text>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无评测数据" style={{ padding: 40 }} />
            )}
          </Card>
        </Col>
      </Row>

      {/* ── 第二行：各科成绩柱状图 + 学期趋势线 ─────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card title={<Space><BookOutlined />各科平均成绩</Space>} styles={{ body: { padding: "12px 16px" } }}>
            {subjectAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={subjectAnalysis} barSize={28} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="subject" type="category" width={90} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [`${value} 分`, "平均分"]}
                    contentStyle={{ borderRadius: 8 }}
                  />
                  <Bar dataKey="avgScore" name="平均分" radius={[0, 6, 6, 0]}>
                    {subjectAnalysis.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.avgScore >= 85 ? "#52c41a" : entry.avgScore >= 70 ? "#1890ff" : "#faad14"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无科目数据" style={{ padding: 40 }} />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={<Space><RiseOutlined />学期成绩趋势</Space>} styles={{ body: { padding: "12px 16px" } }}>
            {semesterTrend.length > 1 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={semesterTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semester" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8 }} />
                  <Legend />
                  <Line
                    type="monotone" dataKey="avgScore" name="平均分"
                    stroke="#1890ff" strokeWidth={3}
                    dot={{ r: 5, fill: "#1890ff" }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: 40, textAlign: "center" }}>
                <Statistic
                  title="当前学期平均分"
                  value={semesterTrend[0]?.avgScore ?? 0}
                  precision={1}
                  suffix="分"
                  styles={{ content: { color: "#1890ff", fontSize: 36 } }}
                />
                <Text type="secondary" style={{ marginTop: 8, display: "block" }}>
                  {semesterTrend[0]?.studentCount ?? 0} 名学生参与
                </Text>
                <Text type="secondary" style={{ marginTop: 16, display: "block", fontSize: 12 }}>
                  数据积累 2 个学期后将展示趋势折线图
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── 第三行：考勤饼图 + 活动雷达图 + 奖惩 ───────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card title={<Space><CalendarOutlined />考勤统计</Space>} styles={{ body: { padding: "12px 16px" } }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <Progress
                type="dashboard"
                percent={attendanceStats.rate}
                size={120}
                strokeColor={attendanceStats.rate >= 95 ? "#52c41a" : attendanceStats.rate >= 85 ? "#faad14" : "#f5222d"}
                format={(p) => (
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: attendanceStats.rate >= 95 ? "#52c41a" : attendanceStats.rate >= 85 ? "#faad14" : "#f5222d" }}>
                      {p}%
                    </div>
                    <div style={{ fontSize: 11, color: "#8c8c8c" }}>出勤率</div>
                  </div>
                )}
              />
            </div>
            {attendanceStats.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={attendanceStats.data}
                    cx="50%" cy="50%"
                    innerRadius={35} outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {attendanceStats.data.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    iconSize={8}
                    formatter={(value: string) => <Text style={{ fontSize: 11 }}>{value}</Text>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无考勤数据" />
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title={<Space><TeamOutlined />活动参与分析</Space>} styles={{ body: { padding: "12px 16px" } }}>
            {activityStats.clubCount + activityStats.practiceCount > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart
                    data={[
                      { dim: "社团活动", value: activityStats.clubCount },
                      { dim: "实践项目", value: activityStats.practiceCount },
                      { dim: "平均得分", value: Math.round(activityStats.avgScore * 10) },
                      { dim: "参与人数", value: activityStats.topStudents.length },
                    ]}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis tick={false} />
                    <Radar dataKey="value" stroke="#1890ff" fill="#1890ff" fillOpacity={0.25} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
                <Row gutter={8} style={{ marginTop: 8 }}>
                  <Col span={8}>
                    <Statistic title={<Text style={{ fontSize: 11 }}>社团</Text>} value={activityStats.clubCount} suffix="项" styles={{ content: { fontSize: 18, color: "#1890ff" } }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title={<Text style={{ fontSize: 11 }}>实践</Text>} value={activityStats.practiceCount} suffix="项" styles={{ content: { fontSize: 18, color: "#52c41a" } }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title={<Text style={{ fontSize: 11 }}>均分</Text>} value={activityStats.avgScore} precision={1} styles={{ content: { fontSize: 18, color: "#722ed1" } }} />
                  </Col>
                </Row>
              </>
            ) : (
              <Empty description="暂无活动数据" style={{ padding: 40 }} />
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title={<Space><StarOutlined />奖惩统计</Space>} styles={{ body: { padding: "12px 16px" } }}>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card size="small" styles={{ body: { textAlign: "center", padding: "12px 8px" } }}>
                  <TrophyOutlined style={{ fontSize: 24, color: "#52c41a", marginBottom: 4 }} />
                  <Statistic title={<Text style={{ fontSize: 11 }}>奖励</Text>} value={awardStats.awards} suffix="项" styles={{ content: { fontSize: 20, color: "#52c41a" } }} />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" styles={{ body: { textAlign: "center", padding: "12px 8px" } }}>
                  <ExclamationCircleOutlined style={{ fontSize: 24, color: "#f5222d", marginBottom: 4 }} />
                  <Statistic title={<Text style={{ fontSize: 11 }}>处分</Text>} value={awardStats.punishments} suffix="项" styles={{ content: { fontSize: 20, color: "#f5222d" } }} />
                </Card>
              </Col>
            </Row>
            {awardStats.levelDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={awardStats.levelDistribution}
                    cx="50%" cy="50%"
                    innerRadius={30} outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {awardStats.levelDistribution.map((_, i) => (
                      <Cell key={i} fill={AWARD_COLORS[i % AWARD_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: 24 }}>
                <Text type="secondary">暂无奖励等级数据</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── 第四行：班级排名表 + 科目详情表 ─────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title={<Space><TeamOutlined />班级综合排名</Space>}>
            <Table
              dataSource={classRanking}
              rowKey="className"
              pagination={false}
              size="middle"
              scroll={{ y: 350 }}
              columns={[
                {
                  title: "排名", key: "rank", width: 60, align: "center" as const,
                  render: (_: unknown, __: unknown, index: number) => (
                    <Badge
                      count={index + 1}
                      style={{
                        backgroundColor: index < 3 ? ["#f5222d", "#fa8c16", "#faad14"][index] : "#d9d9d9",
                      }}
                    />
                  ),
                },
                { title: "班级", dataIndex: "className", ellipsis: true },
                { title: "班主任", dataIndex: "teacherName", width: 80 },
                { title: "人数", dataIndex: "studentCount", width: 60, align: "center" as const },
                {
                  title: "平均分", dataIndex: "avgScore", width: 80, align: "center" as const,
                  sorter: (a: (typeof classRanking)[0], b: (typeof classRanking)[0]) => a.avgScore - b.avgScore,
                  render: (v: number) => (
                    <Text strong style={{ color: v >= 85 ? "#52c41a" : v >= 70 ? "#1890ff" : "#faad14" }}>
                      {v}
                    </Text>
                  ),
                },
                {
                  title: "及格率", dataIndex: "passRate", width: 80, align: "center" as const,
                  render: (v: number) => (
                    <Tag color={v >= 90 ? "green" : v >= 70 ? "blue" : "red"}>{v}%</Tag>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<Space><BookOutlined />各科成绩详情</Space>}>
            <Table
              dataSource={subjectAnalysis}
              rowKey="subject"
              pagination={false}
              size="middle"
              scroll={{ y: 350 }}
              columns={[
                { title: "科目", dataIndex: "subject", ellipsis: true },
                {
                  title: "平均分", dataIndex: "avgScore", width: 80, align: "center" as const,
                  sorter: (a: (typeof subjectAnalysis)[0], b: (typeof subjectAnalysis)[0]) => a.avgScore - b.avgScore,
                  render: (v: number) => (
                    <Text strong style={{ color: v >= 85 ? "#52c41a" : v >= 70 ? "#1890ff" : "#faad14" }}>
                      {v}
                    </Text>
                  ),
                },
                {
                  title: "最高/最低", key: "range", width: 100, align: "center" as const,
                  render: (_: unknown, r: (typeof subjectAnalysis)[0]) => (
                    <Space size={4}>
                      <Tag color="green" style={{ margin: 0 }}>{r.maxScore}</Tag>
                      <Text type="secondary">/</Text>
                      <Tag color={r.minScore >= 60 ? "blue" : "red"} style={{ margin: 0 }}>{r.minScore}</Tag>
                    </Space>
                  ),
                },
                {
                  title: "及格率", dataIndex: "passRate", width: 120,
                  sorter: (a: (typeof subjectAnalysis)[0], b: (typeof subjectAnalysis)[0]) => a.passRate - b.passRate,
                  render: (v: number) => (
                    <Progress
                      percent={v} size="small"
                      strokeColor={v >= 90 ? "#52c41a" : v >= 70 ? "#1890ff" : "#f5222d"}
                      format={(p) => `${p}%`}
                    />
                  ),
                },
                {
                  title: "人数", dataIndex: "studentCount", width: 60, align: "center" as const,
                  render: (v: number) => <Badge count={v} style={{ backgroundColor: "#722ed1" }} />,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* ── 第五行：活动积极分子 ─────────────────────────────────────────── */}
      {activityStats.topStudents.length > 0 && (
        <Card title={<Space><StarOutlined />活动积极分子 TOP 8</Space>} style={{ marginBottom: 16 }}>
          <Row gutter={[12, 12]}>
            {activityStats.topStudents.map((stu, index) => (
              <Col xs={12} sm={6} md={3} key={stu.name}>
                <Card
                  hoverable
                  size="small"
                  styles={{
                    body: {
                      textAlign: "center",
                      padding: "16px 8px",
                      background: index < 3 ? "linear-gradient(135deg, #fff7e6 0%, #fff 100%)" : undefined,
                    },
                  }}
                >
                  <Badge
                    count={index + 1}
                    style={{ backgroundColor: index < 3 ? ["#f5222d", "#fa8c16", "#faad14"][index] : "#d9d9d9" }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: index < 3 ? "#fff7e6" : "#f5f5f5",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20,
                    }}>
                      <UserOutlined style={{ color: index < 3 ? "#fa8c16" : "#8c8c8c" }} />
                    </div>
                  </Badge>
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ fontSize: 14 }}>{stu.name}</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 11 }}>{stu.className}</Text>
                  <div style={{ marginTop: 6 }}>
                    <Tag color="blue" style={{ margin: 0 }}>{stu.count} 项活动</Tag>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Tag color="green" style={{ margin: 0 }}>+{stu.totalScore} 分</Tag>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </div>
  )
}
