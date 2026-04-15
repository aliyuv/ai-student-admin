/**
 * Claude (Anthropic) Provider
 *
 * Anthropic 的 API 格式与 OpenAI 不同，需要单独实现。
 * 使用 Anthropic Messages API: https://docs.anthropic.com/en/api/messages
 */

import type {
  AIProvider,
  ChatCompletionOptions,
  ChatCompletionResult,
  ChatMessage,
} from "./types"

interface ClaudeConfig {
  apiKey: string
  baseURL?: string
  model?: string
}

export class ClaudeProvider implements AIProvider {
  readonly name = "claude" as const
  readonly displayName = "Claude"
  readonly defaultModel: string
  readonly availableModels = [
    "claude-sonnet-4-20250514",
    "claude-3-5-haiku-20241022",
    "claude-3-5-sonnet-20241022",
  ]

  private apiKey: string
  private baseURL: string

  constructor(config: ClaudeConfig) {
    this.apiKey = config.apiKey
    this.baseURL = (config.baseURL ?? "https://api.anthropic.com").replace(/\/$/, "")
    this.defaultModel = config.model ?? "claude-sonnet-4-20250514"
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const model = options.model ?? this.defaultModel

    // Anthropic 的 system message 需要单独传，不在 messages 数组里
    const systemMessage = options.messages.find((m) => m.role === "system")
    const chatMessages = options.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }))

    const body: Record<string, unknown> = {
      model,
      messages: chatMessages,
      max_tokens: options.maxTokens ?? 4096,
    }

    if (systemMessage) {
      body.system = systemMessage.content
    }
    if (options.temperature !== undefined) {
      body.temperature = options.temperature
    }

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      throw new Error(
        `[Claude] API request failed (${response.status}): ${errorText}`
      )
    }

    const data = await response.json()
    const textBlock = data.content?.find(
      (block: { type: string }) => block.type === "text"
    )

    if (!textBlock?.text) {
      throw new Error("[Claude] Empty response from model")
    }

    return {
      content: textBlock.text,
      model: data.model ?? model,
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens ?? 0,
            completionTokens: data.usage.output_tokens ?? 0,
            totalTokens:
              (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
          }
        : undefined,
    }
  }

  async chatJSON<T = unknown>(options: ChatCompletionOptions): Promise<T> {
    // Claude 没有原生 json_mode，通过 prompt 引导输出 JSON
    const messagesWithJsonHint = options.messages.map((m) => {
      if (m.role === "system") {
        return {
          ...m,
          content: m.content + "\n\nIMPORTANT: You must respond with valid JSON only, no other text.",
        }
      }
      return m
    })

    const result = await this.chat({
      ...options,
      messages: messagesWithJsonHint,
    })

    // 尝试从返回内容中提取 JSON（Claude 有时会在 JSON 前后加文字）
    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error(
        `[Claude] Failed to extract JSON from response: ${result.content.slice(0, 200)}`
      )
    }

    try {
      return JSON.parse(jsonMatch[0]) as T
    } catch {
      throw new Error(
        `[Claude] Failed to parse JSON response: ${jsonMatch[0].slice(0, 200)}`
      )
    }
  }
}

// ── 工厂函数 ─────────────────────────────────────────────────────────────────

export function createClaudeProvider(config: ClaudeConfig): ClaudeProvider {
  return new ClaudeProvider(config)
}
