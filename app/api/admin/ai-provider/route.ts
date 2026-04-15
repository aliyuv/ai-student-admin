import { NextRequest, NextResponse } from "next/server"
import { getAIProviderInfo, isLocalMode } from "@/lib/ai-provider"

/**
 * GET /api/admin/ai-provider
 * 获取当前 AI 大模型配置信息（脱敏）
 */
export async function GET() {
  try {
    const info = getAIProviderInfo()

    // 从环境变量读取配置（API Key 脱敏处理）
    const rawKey = process.env.AI_API_KEY ?? ""
    const maskedKey = rawKey
      ? rawKey.slice(0, 5) + "****" + rawKey.slice(-4)
      : ""

    return NextResponse.json({
      provider: info.name,
      displayName: info.displayName,
      model: process.env.AI_MODEL ?? info.defaultModel,
      defaultModel: info.defaultModel,
      availableModels: info.availableModels,
      baseURL: process.env.AI_BASE_URL ?? "",
      apiKeyConfigured: !!process.env.AI_API_KEY,
      apiKeyMasked: maskedKey,
      isLocal: isLocalMode(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get AI provider info" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/ai-provider/test
 * 测试当前 AI 大模型连通性
 */
export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json()

    if (action === "test") {
      if (isLocalMode()) {
        return NextResponse.json({
          success: true,
          message: "当前为本地模式，无需连接外部 API",
          mode: "local",
        })
      }

      const provider = (await import("@/lib/ai-provider")).getAIProvider()

      const startTime = Date.now()
      const result = await provider.chat({
        messages: [{ role: "user", content: "请回复：连接成功" }],
        maxTokens: 50,
      })
      const latency = Date.now() - startTime

      return NextResponse.json({
        success: true,
        message: `${provider.displayName} 连接成功`,
        model: result.model,
        latency: `${latency}ms`,
        usage: result.usage,
      })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({
      success: false,
      message: `连接失败: ${message}`,
    })
  }
}
