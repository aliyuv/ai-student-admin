"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Row,
  Col,
  Slider,
  InputNumber,
  Switch,
  Button,
  App,
  Typography,
  Tabs,
  Form,
  Table,
  Space,
  Tag,
  Progress,
  Statistic,
  Alert,
  Input,
  Select,
  Divider,
  Tooltip
} from 'antd'
import {
  SettingOutlined,
  ExperimentOutlined,
  BarChartOutlined,
  SaveOutlined,
  ReloadOutlined,
  TrophyOutlined,
  TeamOutlined,
  BookOutlined,
  CalendarOutlined,
  WarningOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

interface ScoreRange {
  min: number
  max: number
  points: number
  description: string
}

interface Dimension {
  name: string
  description: string
  enabled: boolean
  scoreRanges: ScoreRange[]
}

interface GradeLevel {
  min: number
  label: string
  color: string
}

interface EvaluationConfig {
  weights: {
    academic: number
    activity: number
    conduct: number
    attendance: number
  }
  gradingScale: {
    [key: string]: GradeLevel
  }
  dimensions: {
    [key: string]: Dimension
  }
  aiModel: {
    enabled: boolean
    modelType: string
    description: string
    lastTrainedAt: string
    accuracy: number
    sampleCount: number
    labeledCount: number
  }
}

interface EvaluationConfigClientProps {
  initialConfig: EvaluationConfig
}

export default function EvaluationConfigClient({ initialConfig }: EvaluationConfigClientProps) {
  const { message, modal } = App.useApp()
  const [config, setConfig] = useState<EvaluationConfig>(initialConfig)
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // ── AI 大模型 Provider 状态 ──────────────────────────────────────────────
  const [providerInfo, setProviderInfo] = useState<{
    provider: string
    displayName: string
    model: string
    defaultModel: string
    availableModels: string[]
    baseURL: string
    apiKeyConfigured: boolean
    apiKeyMasked: string
    isLocal: boolean
  } | null>(null)
  const [providerLoading, setProviderLoading] = useState(true)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    latency?: string
    model?: string
  } | null>(null)
  const [testing, setTesting] = useState(false)

  // 加载 AI Provider 配置
  const loadProviderInfo = useCallback(async () => {
    try {
      setProviderLoading(true)
      const res = await fetch("/api/admin/ai-provider")
      if (res.ok) {
        setProviderInfo(await res.json())
      }
    } catch {
      console.error("Failed to load AI provider info")
    } finally {
      setProviderLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProviderInfo()
  }, [loadProviderInfo])

  // 测试 AI 连通性
  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/admin/ai-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      })
      const data = await res.json()
      setTestResult(data)
    } catch {
      setTestResult({ success: false, message: "请求失败，请检查网络" })
    } finally {
      setTesting(false)
    }
  }

  // 权重调整
  const handleWeightChange = (dimension: keyof typeof config.weights, value: number) => {
    setConfig(prev => ({
      ...prev,
      weights: { ...prev.weights, [dimension]: value }
    }))
    setHasChanges(true)
  }

  // 维度开关：禁用时将该维度权重清零，避免总权重超 100%
  const handleDimensionToggle = (dimension: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      weights: enabled
        ? prev.weights
        : { ...prev.weights, [dimension]: 0 },
      dimensions: {
        ...prev.dimensions,
        [dimension]: { ...prev.dimensions[dimension], enabled }
      }
    }))
    setHasChanges(true)
  }

  // AI 模型开关
  const handleAiModelToggle = (enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      aiModel: { ...prev.aiModel, enabled }
    }))
    setHasChanges(true)
  }

  // AI 模型类型切换
  const handleModelTypeChange = (modelType: string) => {
    const descriptions: Record<string, string> = {
      logistic_regression: '基于逻辑回归的线性分类模型，训练速度快，可解释性强',
      random_forest: '集成多棵决策树的随机森林模型，抗过拟合能力强',
      neural_network: '多层神经网络模型，拟合能力强，适合复杂特征'
    }
    setConfig(prev => ({
      ...prev,
      aiModel: {
        ...prev.aiModel,
        modelType,
        description: descriptions[modelType] ?? prev.aiModel.description
      }
    }))
    setHasChanges(true)
  }

  // 保存配置
  const handleSave = async () => {
    // 验证权重总和
    const total = Object.values(config.weights).reduce((sum, w) => sum + w, 0)
    if (Math.abs(total - 100) > 0.1) {
      message.error(`权重总和必须等于 100%，当前为 ${total.toFixed(1)}%`)
      return
    }

    try {
      setLoading(true)
      // TODO: 保存配置到数据库
      await new Promise(resolve => setTimeout(resolve, 1000))
      message.success('配置保存成功')
      setHasChanges(false)
    } catch (error) {
      message.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 重置配置
  const handleReset = () => {
    modal.confirm({
      title: '确定重置配置吗？',
      content: '这将恢复到初始配置，当前未保存的更改将丢失。',
      okText: '确定重置',
      cancelText: '取消',
      onOk() {
        setConfig(initialConfig)
        setHasChanges(false)
        message.success('配置已重置')
      }
    })
  }

  // 权重总和及有效性
  const totalWeight = Object.values(config.weights).reduce((sum, w) => sum + w, 0)
  const isWeightValid = Math.abs(totalWeight - 100) < 0.1
  const remainingWeight = 100 - totalWeight

  // 维度图标映射
  const dimensionIcons: Record<string, React.ReactNode> = {
    academic: <BookOutlined />,
    activity: <TeamOutlined />,
    conduct: <TrophyOutlined />,
    attendance: <CalendarOutlined />
  }

  // 维度颜色映射
  const dimensionColors: Record<string, string> = {
    academic: '#1890ff',
    activity: '#52c41a',
    conduct: '#fa8c16',
    attendance: '#13c2c2'
  }

  const tabItems = [
    {
      key: 'weights',
      label: <Space><BarChartOutlined />权重配置</Space>,
      children: (
        <Row gutter={24}>
          <Col span={16}>
            <Card title="维度权重设置">
              <Space orientation="vertical" style={{ width: '100%' }} size="large">
                {Object.entries(config.weights).map(([key, weight]) => {
                  const dimension = config.dimensions[key]
                  if (!dimension) return null
                  const isDisabled = !dimension.enabled
                  // 当前维度可用的最大值 = 当前值 + 剩余空间（不超过100）
                  const maxForThis = Math.min(100, weight + Math.max(0, remainingWeight))

                  return (
                    <div key={key}>
                      <Row align="middle" gutter={16}>
                        <Col span={6}>
                          <Space>
                            <span style={{ color: isDisabled ? '#d9d9d9' : dimensionColors[key] }}>
                              {dimensionIcons[key]}
                            </span>
                            <Text strong style={{ color: isDisabled ? '#bfbfbf' : undefined }}>
                              {dimension.name}
                            </Text>
                          </Space>
                        </Col>
                        <Col span={12}>
                          <Slider
                            min={0}
                            max={maxForThis}
                            value={weight}
                            disabled={isDisabled}
                            onChange={(value) => handleWeightChange(key as keyof typeof config.weights, value)}
                            trackStyle={{ backgroundColor: isDisabled ? undefined : dimensionColors[key] }}
                            handleStyle={{ borderColor: isDisabled ? undefined : dimensionColors[key] }}
                          />
                        </Col>
                        <Col span={4}>
                          <InputNumber
                            min={0}
                            max={maxForThis}
                            value={weight}
                            disabled={isDisabled}
                            formatter={v => `${v}%`}
                            parser={v => Number(v?.replace('%', '') ?? 0)}
                            onChange={(value) => handleWeightChange(
                              key as keyof typeof config.weights,
                              Math.min(maxForThis, Math.max(0, value ?? 0))
                            )}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col span={2}>
                          <Tooltip title={dimension.enabled ? '点击禁用（权重将清零）' : '点击启用'}>
                            <Switch
                              checked={dimension.enabled}
                              onChange={(checked) => handleDimensionToggle(key, checked)}
                              size="small"
                            />
                          </Tooltip>
                        </Col>
                      </Row>
                      <div style={{ marginTop: 4, paddingLeft: 40 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dimension.description}
                        </Text>
                      </div>
                    </div>
                  )
                })}

                <Divider />

                <Row justify="space-between" align="middle">
                  <Col>
                    <Text strong>权重总和：</Text>
                    <Text
                      type={isWeightValid ? 'success' : totalWeight > 100 ? 'danger' : 'warning'}
                      style={{ fontSize: 16, marginLeft: 8 }}
                    >
                      {totalWeight.toFixed(1)}%
                    </Text>
                    {!isWeightValid && (
                      <Text type={totalWeight > 100 ? 'danger' : 'warning'} style={{ fontSize: 12, marginLeft: 8 }}>
                        {totalWeight > 100
                          ? `超出 ${(totalWeight - 100).toFixed(1)}%`
                          : `还差 ${(100 - totalWeight).toFixed(1)}%`}
                      </Text>
                    )}
                  </Col>
                  <Col>
                    <Progress
                      percent={Math.min(totalWeight, 100)}
                      status={isWeightValid ? 'success' : totalWeight > 100 ? 'exception' : 'active'}
                      size="small"
                      style={{ width: 200 }}
                    />
                  </Col>
                </Row>
              </Space>
            </Card>
          </Col>

          <Col span={8}>
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              <Card title="权重分布预览" size="small">
                {Object.entries(config.weights).some(([k]) => config.dimensions[k]?.enabled) ? (
                  Object.entries(config.weights).map(([key, weight]) => {
                    const dimension = config.dimensions[key]
                    if (!dimension?.enabled) return null
                    return (
                      <div key={key} style={{ marginBottom: 12 }}>
                        <Row justify="space-between">
                          <Text strong style={{ fontSize: 12 }}>{dimension.name}</Text>
                          <Text style={{ fontSize: 12, color: dimensionColors[key] }}>{weight}%</Text>
                        </Row>
                        <Progress
                          percent={weight}
                          size="small"
                          strokeColor={dimensionColors[key]}
                          showInfo={false}
                        />
                      </div>
                    )
                  })
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>请至少启用一个评分维度</Text>
                )}
              </Card>

              <Card title="配置说明" size="small">
                <ul style={{ paddingLeft: 20, margin: 0, fontSize: 12 }}>
                  <li>权重总和必须等于 100%</li>
                  <li>禁用维度时其权重自动清零</li>
                  <li>权重越高对总分影响越大</li>
                  <li>建议学业成绩权重占主导</li>
                </ul>
              </Card>
            </Space>
          </Col>
        </Row>
      ),
    },
    {
      key: 'scoring',
      label: <Space><TrophyOutlined />评分规则</Space>,
      children: (
        <Row gutter={24}>
          {Object.entries(config.dimensions).map(([key, dimension]) => (
            <Col span={12} key={key} style={{ marginBottom: 16 }}>
              <Card
                title={
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space>
                        <span style={{ color: dimension.enabled ? dimensionColors[key] : '#bfbfbf' }}>
                          {dimensionIcons[key]}
                        </span>
                        <Text style={{ color: dimension.enabled ? undefined : '#bfbfbf' }}>
                          {dimension.name}
                        </Text>
                      </Space>
                    </Col>
                    <Col>
                      <Tooltip title={dimension.enabled ? '点击禁用' : '点击启用'}>
                        <Switch
                          size="small"
                          checked={dimension.enabled}
                          onChange={(checked) => handleDimensionToggle(key, checked)}
                        />
                      </Tooltip>
                    </Col>
                  </Row>
                }
                size="small"
                style={{ opacity: dimension.enabled ? 1 : 0.6 }}
              >
                <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
                  {dimension.description}
                </Text>

                <Table
                  dataSource={dimension.scoreRanges}
                  rowKey={(r) => `${r.min}-${r.max}`}
                  size="small"
                  pagination={false}
                  columns={[
                    {
                      title: '原始范围',
                      render: (_: unknown, record: ScoreRange) =>
                        `${record.min} – ${record.max === 999 ? '∞' : record.max}`,
                      width: 90
                    },
                    {
                      title: '综合得分',
                      dataIndex: 'points',
                      width: 70,
                      render: (points: number) => <Tag color="blue">{points} 分</Tag>
                    },
                    {
                      title: '等级描述',
                      dataIndex: 'description',
                      ellipsis: true
                    }
                  ]}
                />
              </Card>
            </Col>
          ))}
        </Row>
      ),
    },
    {
      key: 'ai',
      label: <Space><ExperimentOutlined />AI 模型</Space>,
      children: (
        <Row gutter={24}>
          <Col span={16}>
            <Card title="AI 模型配置">
              <Row gutter={16} align="middle" style={{ marginBottom: 24 }}>
                <Col span={4}>
                  <Text strong>启用 AI 优化：</Text>
                </Col>
                <Col span={4}>
                  <Switch
                    checked={config.aiModel.enabled}
                    onChange={handleAiModelToggle}
                  />
                </Col>
                <Col span={16}>
                  <Text type="secondary">
                    {config.aiModel.enabled
                      ? 'AI 模型将对权重评分结果进行智能优化'
                      : '仅使用基础加权评分，不启用 AI 优化'}
                  </Text>
                </Col>
              </Row>

              <Form layout="vertical">
                <Form.Item label="模型类型">
                  <Select
                    value={config.aiModel.modelType}
                    disabled={!config.aiModel.enabled}
                    style={{ width: 220 }}
                    onChange={handleModelTypeChange}
                  >
                    <Option value="logistic_regression">逻辑回归模型</Option>
                    <Option value="random_forest">随机森林模型</Option>
                    <Option value="neural_network">神经网络模型</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="模型描述">
                  <Input.TextArea
                    value={config.aiModel.description}
                    rows={3}
                    disabled
                    style={{ color: '#595959' }}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="最后训练时间">
                      <Input
                        value={new Date(config.aiModel.lastTrainedAt).toLocaleDateString('zh-CN')}
                        disabled
                        style={{ color: '#595959' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="模型准确率">
                      <Progress
                        percent={Math.round(config.aiModel.accuracy * 100)}
                        status="success"
                        format={(percent) => `${percent}%`}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>

              <Space style={{ marginTop: 8 }}>
                <Button
                  type="primary"
                  disabled={!config.aiModel.enabled}
                  onClick={async () => {
                    message.loading({ content: '正在训练模型...', key: 'model-train' })
                    try {
                      const res = await fetch('/api/admin/ai-model', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'train' }),
                      })
                      const data = await res.json()
                      if (data.success) {
                        const { model } = data
                        const weightsStr = `学业${(model.weights.academic * 100).toFixed(0)}% / 活动${(model.weights.activity * 100).toFixed(0)}% / 品行${(model.weights.conduct * 100).toFixed(0)}% / 出勤${(model.weights.attendance * 100).toFixed(0)}%`
                        message.success({
                          content: `训练完成（${data.latency}）｜样本 ${model.sampleCount} 人｜权重: ${weightsStr}${model.accuracy > 0 ? `｜R²=${model.accuracy}` : ''}`,
                          key: 'model-train',
                          duration: 6,
                        })
                        // 刷新右侧模型性能数据
                        setConfig(prev => ({
                          ...prev,
                          aiModel: {
                            ...prev.aiModel,
                            accuracy: model.accuracy,
                            sampleCount: model.sampleCount,
                            labeledCount: model.labeledCount,
                            lastTrainedAt: model.trainedAt,
                          }
                        }))
                      } else {
                        message.error({ content: data.error || '训练失败', key: 'model-train', duration: 4 })
                      }
                    } catch {
                      message.error({ content: '请求失败，请检查服务是否运行', key: 'model-train', duration: 3 })
                    }
                  }}
                >
                  重新训练模型
                </Button>
                <Button
                  disabled={!config.aiModel.enabled}
                  onClick={async () => {
                    message.loading({ content: '正在导出模型数据...', key: 'model-export' })
                    try {
                      const res = await fetch('/api/admin/ai-model', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'export' }),
                      })
                      const data = await res.json()
                      if (data.success) {
                        // 下载为 JSON 文件
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `evaluation-model-${new Date().toISOString().slice(0, 10)}.json`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                        message.success({
                          content: `导出成功｜${data.overview.totalStudents} 名学生数据`,
                          key: 'model-export',
                          duration: 3,
                        })
                      } else {
                        message.error({ content: data.error || '导出失败', key: 'model-export', duration: 4 })
                      }
                    } catch {
                      message.error({ content: '请求失败，请检查服务是否运行', key: 'model-export', duration: 3 })
                    }
                  }}
                >
                  导出模型
                </Button>
                <Button
                  disabled={!config.aiModel.enabled}
                  onClick={async () => {
                    message.loading({ content: '正在随机抽取学生测试...', key: 'model-test' })
                    try {
                      const res = await fetch('/api/admin/ai-model', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'test' }),
                      })
                      const data = await res.json()
                      if (data.success) {
                        const { student, result } = data
                        modal.success({
                          title: `测试通过（${data.latency}）`,
                          width: 520,
                          content: (
                            <div style={{ marginTop: 12 }}>
                              <p><strong>抽测学生：</strong>{student.name}（{student.studentNo}）- {student.className}</p>
                              <p><strong>综合评分：</strong>{result.aiScore} 分 ({result.grade})</p>
                              <p><strong>维度明细：</strong></p>
                              <ul style={{ paddingLeft: 20 }}>
                                <li>学业成绩：{result.dimensions.academic} 分</li>
                                <li>课外活动：{result.dimensions.activity} 分</li>
                                <li>品行表现：{result.dimensions.conduct} 分</li>
                                <li>出勤情况：{result.dimensions.attendance} 分</li>
                              </ul>
                              {result.strengths.length > 0 && (
                                <p><strong>优势：</strong>{result.strengths.join('、')}</p>
                              )}
                              {result.suggestions.length > 0 && (
                                <p><strong>建议：</strong>{result.suggestions.join('、')}</p>
                              )}
                            </div>
                          ),
                        })
                        message.destroy('model-test')
                      } else {
                        message.error({ content: data.error || '测试失败', key: 'model-test', duration: 4 })
                      }
                    } catch {
                      message.error({ content: '请求失败，请检查服务是否运行', key: 'model-test', duration: 3 })
                    }
                  }}
                >
                  测试模型
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={8}>
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              <Card title="模型性能" size="small">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="准确率"
                      value={config.aiModel.accuracy > 0 ? config.aiModel.accuracy * 100 : '-'}
                      precision={config.aiModel.accuracy > 0 ? 1 : 0}
                      suffix={config.aiModel.accuracy > 0 ? '%' : ''}
                      styles={{
                        content: {
                          color: config.aiModel.accuracy > 0.8 ? '#3f8600'
                            : config.aiModel.accuracy > 0 ? '#cf1322'
                            : '#8c8c8c'
                        }
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="训练样本"
                      value={config.aiModel.sampleCount}
                      suffix="人"
                    />
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={12}>
                    <Statistic
                      title="已标注评测"
                      value={config.aiModel.labeledCount}
                      suffix="条"
                    />
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      最后训练<br />
                      {new Date(config.aiModel.lastTrainedAt).toLocaleDateString('zh-CN')}
                    </Text>
                  </Col>
                </Row>
                {config.aiModel.accuracy > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Progress
                      percent={Math.round(config.aiModel.accuracy * 100)}
                      size="small"
                      status={config.aiModel.accuracy > 0.8 ? 'success' : 'exception'}
                      format={(p) => `R² ${p}%`}
                    />
                  </div>
                )}
                {config.aiModel.accuracy === 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      需要至少 5 条已审核评测数据才能计算准确率
                    </Text>
                  </div>
                )}
              </Card>

              <Card title="模型说明" size="small">
                <Paragraph style={{ fontSize: 12, marginBottom: 8 }}>
                  AI 模型基于历史评测数据训练，能够：
                </Paragraph>
                <ul style={{ fontSize: 12, paddingLeft: 20, margin: 0 }}>
                  <li>识别评分模式和趋势</li>
                  <li>动态优化维度权重</li>
                  <li>提供个性化评语建议</li>
                  <li>预测学生发展趋势</li>
                </ul>
              </Card>
            </Space>
          </Col>
        </Row>
      ),
    },
    {
      key: 'llm',
      label: <Space><ApiOutlined />AI 大模型</Space>,
      children: (
        <Row gutter={24}>
          <Col span={16}>
            <Card title="大模型服务配置" loading={providerLoading}>
              {providerInfo && (
                <Space orientation="vertical" style={{ width: '100%' }} size="large">
                  {/* 当前状态 */}
                  <Alert
                    title={
                      providerInfo.isLocal
                        ? '当前为本地模式（未连接大模型）'
                        : `已连接 ${providerInfo.displayName}`
                    }
                    description={
                      providerInfo.isLocal
                        ? '评测将使用本地算法生成评语。如需 AI 生成更智能的评语，请在服务器 .env 文件中配置大模型。'
                        : `当前模型: ${providerInfo.model}`
                    }
                    type={providerInfo.isLocal ? 'info' : 'success'}
                    showIcon
                    icon={providerInfo.isLocal ? <SettingOutlined /> : <CheckCircleOutlined />}
                  />

                  {/* Provider 信息 */}
                  <Card size="small" title="服务商信息">
                    <Row gutter={[16, 16]}>
                      <Col span={8}>
                        <Text type="secondary">服务商</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag
                            color={
                              providerInfo.provider === 'openai' ? 'green' :
                              providerInfo.provider === 'deepseek' ? 'blue' :
                              providerInfo.provider === 'claude' ? 'orange' :
                              'default'
                            }
                            style={{ fontSize: 14, padding: '4px 12px' }}
                          >
                            {providerInfo.displayName}
                          </Tag>
                        </div>
                      </Col>
                      <Col span={8}>
                        <Text type="secondary">当前模型</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>{providerInfo.model}</Text>
                        </div>
                      </Col>
                      <Col span={8}>
                        <Text type="secondary">API Key</Text>
                        <div style={{ marginTop: 4 }}>
                          {providerInfo.apiKeyConfigured ? (
                            <Space>
                              <CheckCircleOutlined style={{ color: '#52c41a' }} />
                              <Text code>{providerInfo.apiKeyMasked}</Text>
                            </Space>
                          ) : (
                            <Space>
                              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                              <Text type="secondary">未配置</Text>
                            </Space>
                          )}
                        </div>
                      </Col>
                    </Row>
                    {providerInfo.baseURL && (
                      <div style={{ marginTop: 12 }}>
                        <Text type="secondary">自定义地址: </Text>
                        <Text code>{providerInfo.baseURL}</Text>
                      </div>
                    )}
                  </Card>

                  {/* 可用模型列表 */}
                  {!providerInfo.isLocal && (
                    <Card size="small" title="可用模型">
                      <Space wrap>
                        {providerInfo.availableModels.map((m) => (
                          <Tag
                            key={m}
                            color={m === providerInfo.model ? 'blue' : 'default'}
                          >
                            {m}
                            {m === providerInfo.model && ' (当前)'}
                            {m === providerInfo.defaultModel && m !== providerInfo.model && ' (默认)'}
                          </Tag>
                        ))}
                      </Space>
                    </Card>
                  )}

                  {/* 连通性测试 */}
                  <Card size="small" title="连通性测试">
                    <Space orientation="vertical" style={{ width: '100%' }}>
                      <Button
                        type="primary"
                        icon={testing ? <LoadingOutlined /> : <ThunderboltOutlined />}
                        loading={testing}
                        onClick={handleTestConnection}
                      >
                        {testing ? '测试中...' : '测试连接'}
                      </Button>

                      {testResult && (
                        <Alert
                          title={testResult.success ? '测试通过' : '测试失败'}
                          description={
                            <Space orientation="vertical">
                              <Text>{testResult.message}</Text>
                              {testResult.latency && (
                                <Text type="secondary">响应延迟: {testResult.latency}</Text>
                              )}
                              {testResult.model && (
                                <Text type="secondary">实际模型: {testResult.model}</Text>
                              )}
                            </Space>
                          }
                          type={testResult.success ? 'success' : 'error'}
                          showIcon
                          closable
                          onClose={() => setTestResult(null)}
                        />
                      )}
                    </Space>
                  </Card>
                </Space>
              )}
            </Card>
          </Col>

          <Col span={8}>
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              <Card title="配置说明" size="small">
                <Paragraph style={{ fontSize: 12, marginBottom: 8 }}>
                  AI 大模型用于生成更智能的学生评语和建议。需要在服务器
                  <Text code style={{ fontSize: 12 }}>.env</Text> 文件中配置：
                </Paragraph>
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 12, fontFamily: 'monospace' }}>
                  <div style={{ color: '#8c8c8c' }}># 选择服务商</div>
                  <div>AI_PROVIDER=&quot;deepseek&quot;</div>
                  <div style={{ marginTop: 4, color: '#8c8c8c' }}># 填写 API Key</div>
                  <div>AI_API_KEY=&quot;sk-xxx&quot;</div>
                  <div style={{ marginTop: 4, color: '#8c8c8c' }}># 指定模型（可选）</div>
                  <div>AI_MODEL=&quot;deepseek-chat&quot;</div>
                </div>
              </Card>

              <Card title="支持的服务商" size="small">
                <Space orientation="vertical" style={{ width: '100%' }} size="small">
                  <div>
                    <Tag color="green">OpenAI</Tag>
                    <Text style={{ fontSize: 12 }}>GPT-4o, GPT-4o-mini</Text>
                  </div>
                  <div>
                    <Tag color="blue">DeepSeek</Tag>
                    <Text style={{ fontSize: 12 }}>DeepSeek-Chat, DeepSeek-Reasoner</Text>
                  </div>
                  <div>
                    <Tag color="orange">Claude</Tag>
                    <Text style={{ fontSize: 12 }}>Claude Sonnet, Claude Haiku</Text>
                  </div>
                  <div>
                    <Tag>本地模式</Tag>
                    <Text style={{ fontSize: 12 }}>使用内置算法，无需 API</Text>
                  </div>
                </Space>
              </Card>

              <Card title="注意事项" size="small">
                <ul style={{ paddingLeft: 20, margin: 0, fontSize: 12 }}>
                  <li>修改 .env 后需重启服务生效</li>
                  <li>API Key 请妥善保管，勿泄露</li>
                  <li>大模型调用会产生费用</li>
                  <li>网络异常时自动降级为本地算法</li>
                </ul>
              </Card>
            </Space>
          </Col>
        </Row>
      ),
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <SettingOutlined style={{ marginRight: 8 }} />
            AI 评测配置管理
          </Title>
          <Text type="secondary">配置综合评测的权重、评分规则和 AI 模型参数</Text>
        </Col>
        <Col>
          <Space>
            <Button onClick={handleReset} disabled={!hasChanges} icon={<ReloadOutlined />}>
              重置
            </Button>
            <Button
              type="primary"
              loading={loading}
              onClick={handleSave}
              disabled={!hasChanges || !isWeightValid}
              icon={<SaveOutlined />}
            >
              保存配置
            </Button>
          </Space>
        </Col>
      </Row>

      {hasChanges && (
        <Alert
          title="配置已修改"
          description={
            isWeightValid
              ? '修改已就绪，点击「保存配置」使其生效'
              : `权重总和为 ${totalWeight.toFixed(1)}%，需调整至 100% 才能保存`
          }
          type={isWeightValid ? 'info' : 'warning'}
          showIcon
          icon={isWeightValid ? undefined : <WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      <Tabs defaultActiveKey="weights" type="card" items={tabItems} />
    </div>
  )
}
