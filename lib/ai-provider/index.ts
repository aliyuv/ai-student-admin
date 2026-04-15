/**
 * AI Provider 入口
 *
 * 提供统一的 getAIProvider() 获取当前配置的 AI 大模型实例。
 *
 * 用法：
 *   import { getAIProvider } from "@/lib/ai-provider"
 *
 *   const provider = getAIProvider()
 *
 *   if (provider.name === "local") {
 *     // 走本地算法
 *   } else {
 *     // 调用大模型
 *     const result = await provider.chatJSON<MyType>({ messages: [...] })
 *   }
 *
 * 配置方式（.env）：
 *   AI_PROVIDER=openai|deepseek|claude|local
 *   AI_API_KEY=sk-xxx
 *   AI_BASE_URL=https://api.openai.com/v1     # 可选，用于代理/私有部署
 *   AI_MODEL=gpt-4o-mini                       # 可选，覆盖默认模型
 */

export type { AIProvider, AIProviderType, AIProviderConfig } from "./types"
export type { ChatMessage, ChatCompletionOptions, ChatCompletionResult } from "./types"

import type { AIProvider, AIProviderType, AIProviderConfig } from "./types"
import { createOpenAIProvider, createDeepSeekProvider } from "./openai-compatible"
import { createClaudeProvider } from "./claude"
import { createLocalProvider } from "./local"

// ── Provider 工厂 ────────────────────────────────────────────────────────────

/**
 * 根据配置创建 AI Provider 实例
 */
export function createAIProvider(config: AIProviderConfig): AIProvider {
  switch (config.provider) {
    case "openai":
      if (!config.apiKey) {
        throw new Error("[AI Provider] OpenAI requires AI_API_KEY")
      }
      return createOpenAIProvider({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        model: config.model,
      })

    case "deepseek":
      if (!config.apiKey) {
        throw new Error("[AI Provider] DeepSeek requires AI_API_KEY")
      }
      return createDeepSeekProvider({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        model: config.model,
      })

    case "claude":
      if (!config.apiKey) {
        throw new Error("[AI Provider] Claude requires AI_API_KEY")
      }
      return createClaudeProvider({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        model: config.model,
      })

    case "local":
      return createLocalProvider()

    default:
      console.warn(
        `[AI Provider] Unknown provider "${config.provider}", falling back to local`
      )
      return createLocalProvider()
  }
}

// ── 从环境变量读取配置 ───────────────────────────────────────────────────────

function loadConfigFromEnv(): AIProviderConfig {
  const provider = (process.env.AI_PROVIDER ?? "local") as AIProviderType
  return {
    provider,
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL,
    model: process.env.AI_MODEL,
    temperature: process.env.AI_TEMPERATURE
      ? parseFloat(process.env.AI_TEMPERATURE)
      : undefined,
    maxTokens: process.env.AI_MAX_TOKENS
      ? parseInt(process.env.AI_MAX_TOKENS, 10)
      : undefined,
  }
}

// ── 单例（每次配置变更需重启服务） ───────────────────────────────────────────

let _provider: AIProvider | null = null

/**
 * 获取当前配置的 AI Provider（单例）
 *
 * 根据环境变量自动选择 provider，开发环境默认使用 local 模式。
 */
export function getAIProvider(): AIProvider {
  if (!_provider) {
    const config = loadConfigFromEnv()
    _provider = createAIProvider(config)
    console.log(`[AI Provider] Initialized: ${_provider.displayName} (${_provider.defaultModel})`)
  }
  return _provider
}

/**
 * 获取当前 provider 配置信息（用于前端展示/调试）
 */
export function getAIProviderInfo() {
  const provider = getAIProvider()
  return {
    name: provider.name,
    displayName: provider.displayName,
    defaultModel: provider.defaultModel,
    availableModels: provider.availableModels,
  }
}

/**
 * 判断当前是否为本地模式
 */
export function isLocalMode(): boolean {
  return getAIProvider().name === "local"
}

/**
 * 重置 provider 实例（仅用于测试）
 */
export function _resetProvider(): void {
  _provider = null
}
