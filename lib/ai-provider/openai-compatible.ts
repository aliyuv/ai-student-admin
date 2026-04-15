/**
 * OpenAI 兼容 Provider
 *
 * 同时支持所有兼容 OpenAI API 格式的服务：
 * - OpenAI 官方 (api.openai.com)
 * - DeepSeek (api.deepseek.com) — 完全兼容 OpenAI 接口
 * - 其他兼容服务（通过自定义 baseURL）
 *
 * DeepSeek 和 OpenAI 使用同一套 SDK，只是 baseURL 和模型名不同，
 * 因此共用这个实现，通过配置区分。
 */

import type {
  AIProvider,
  AIProviderType,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "./types"

interface OpenAICompatibleConfig {
  name: AIProviderType
  displayName: string
  apiKey: string
  baseURL: string
  defaultModel: string
  availableModels: string[]
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly name: AIProviderType
  readonly displayName: string
  readonly defaultModel: string
  readonly availableModels: string[]

  private apiKey: string
  private baseURL: string

  constructor(config: OpenAICompatibleConfig) {
    this.name = config.name
    this.displayName = config.displayName
    this.apiKey = config.apiKey
    this.baseURL = config.baseURL.replace(/\/$/, "") // 去掉末尾斜杠
    this.defaultModel = config.defaultModel
    this.availableModels = config.availableModels
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const model = options.model ?? this.defaultModel

    const body: Record<string, unknown> = {
      model,
      messages: options.messages,
    }

    if (options.temperature !== undefined) {
      body.temperature = options.temperature
    }
    if (options.maxTokens !== undefined) {
      body.max_tokens = options.maxTokens
    }
    if (options.jsonMode) {
      body.response_format = { type: "json_object" }
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      throw new Error(
        `[${this.displayName}] API request failed (${response.status}): ${errorText}`
      )
    }

    const data = await response.json()
    const choice = data.choices?.[0]

    if (!choice?.message?.content) {
      throw new Error(`[${this.displayName}] Empty response from model`)
    }

    return {
      content: choice.message.content,
      model: data.model ?? model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens ?? 0,
            completionTokens: data.usage.completion_tokens ?? 0,
            totalTokens: data.usage.total_tokens ?? 0,
          }
        : undefined,
    }
  }

  async chatJSON<T = unknown>(options: ChatCompletionOptions): Promise<T> {
    const result = await this.chat({ ...options, jsonMode: true })

    try {
      return JSON.parse(result.content) as T
    } catch {
      throw new Error(
        `[${this.displayName}] Failed to parse JSON response: ${result.content.slice(0, 200)}`
      )
    }
  }
}

// ── 工厂函数：创建 OpenAI Provider ──────────────────────────────────────────

export function createOpenAIProvider(config: {
  apiKey: string
  baseURL?: string
  model?: string
}): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider({
    name: "openai",
    displayName: "OpenAI",
    apiKey: config.apiKey,
    baseURL: config.baseURL ?? "https://api.openai.com/v1",
    defaultModel: config.model ?? "gpt-4o-mini",
    availableModels: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  })
}

// ── 工厂函数：创建 DeepSeek Provider ────────────────────────────────────────

export function createDeepSeekProvider(config: {
  apiKey: string
  baseURL?: string
  model?: string
}): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider({
    name: "deepseek",
    displayName: "DeepSeek",
    apiKey: config.apiKey,
    baseURL: config.baseURL ?? "https://api.deepseek.com/v1",
    defaultModel: config.model ?? "deepseek-chat",
    availableModels: ["deepseek-chat", "deepseek-reasoner"],
  })
}
