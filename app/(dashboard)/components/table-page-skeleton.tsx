"use client"

import { Skeleton, Card, Row, Col, Space } from 'antd'

/**
 * 表格页通用骨架屏
 * 显示统计卡片 + 搜索栏 + 表格骨架，让用户立刻看到页面结构
 */
export default function TablePageSkeleton({
  cards = 0,
  rows = 6,
  title,
}: {
  cards?: number
  rows?: number
  title?: string
}) {
  return (
    <div>
      {/* 统计卡片骨架 */}
      {cards > 0 && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {Array.from({ length: cards }).map((_, i) => (
            <Col span={Math.floor(24 / cards)} key={i}>
              <Card styles={{ body: { padding: '16px 20px' } }}>
                <Skeleton active paragraph={{ rows: 1, width: 80 }} title={{ width: 60 }} />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 主表格区域 */}
      <Card>
        {/* 标题 + 操作栏 */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            {title ? (
              <span style={{ fontSize: 18, fontWeight: 600, color: '#1F2937' }}>{title}</span>
            ) : (
              <Skeleton.Button active size="small" style={{ width: 120 }} />
            )}
          </Col>
          <Col>
            <Space>
              <Skeleton.Button active size="default" />
              <Skeleton.Button active size="default" />
            </Space>
          </Col>
        </Row>

        {/* 搜索栏骨架 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Skeleton.Button active block size="default" style={{ width: '100%' }} />
          </Col>
          <Col span={4}>
            <Skeleton.Button active block size="default" style={{ width: '100%' }} />
          </Col>
        </Row>

        {/* 表格骨架 */}
        <Skeleton active paragraph={{ rows }} />
      </Card>
    </div>
  )
}
