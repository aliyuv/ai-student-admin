/**
 * AI Provider 类型定义
 *
 * 统一的大模型接口抽象，支持多厂商切换：
 * - OpenAI (GPT-4o, GPT-4o-mini, ...)
 * - DeepSeek (deepseek-chat, deepseek-reasoner, ...)
 * - Anthropic Claude (claude-sonnet, ...)
 * - 本地模拟 (不调用任何外部 API)
 */

// ── 支持的 Provider 类型 ─────────────────────────────────────────────────────

export type AIProviderType = "openai" | "deepseek" | "claude" | "local"

// ── Chat Message 通用格式 ────────────────────────────────────────────────────

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

// ── Chat 请求参数 ────────────────────────────────────────────────────────────

export interface ChatCompletionOptions {
  /** 要使用的具体模型名，如 "gpt-4o-mini", "deepseek-chat" */
  model?: string
  /** 对话消息列表 */
  messages: ChatMessage[]
  /** 温度参数，0~2，越高越随机 */
  temperature?: number
  /** 最大生成 token 数 */
  maxTokens?: number
  /** 是否要求返回 JSON 格式 */
  jsonMode?: boolean
}

// ── Chat 响应 ────────────────────────────────────────────────────────────────

export interface ChatCompletionResult {
  /** 生成的文本内容 */
  content: string
  /** 使用的模型名 */
  model: string
  /** Token 用量（部分 provider 可能不返回） */
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

// ── Provider 接口 ────────────────────────────────────────────────────────────

export interface AIProvider {
  /** Provider 唯一标识 */
  readonly name: AIProviderType
  /** Provider 显示名称 */
  readonly displayName: string
  /** 该 provider 的默认模型 */
  readonly defaultModel: string
  /** 可用模型列表（用于前端展示） */
  readonly availableModels: string[]

  /**
   * 发送 chat completion 请求
   * @throws Error 当 API 调用失败时
   */
  chat(options: ChatCompletionOptions): Promise<ChatCompletionResult>

  /**
   * 发送 chat 请求并解析 JSON 结果
   * 内部自动开启 jsonMode，解析返回的 JSON
   * @throws Error 当 API 调用或 JSON 解析失败时
   */
  chatJSON<T = unknown>(options: ChatCompletionOptions): Promise<T>
}

// ── Provider 配置 ────────────────────────────────────────────────────────────

export interface AIProviderConfig {
  /** 使用哪个 provider */
  provider: AIProviderType
  /** API Key（local 模式不需要） */
  apiKey?: string
  /** 自定义 API Base URL（用于代理或私有部署） */
  baseURL?: string
  /** 指定模型名（不填则使用 provider 默认模型） */
  model?: string
  /** 默认温度 */
  temperature?: number
  /** 默认最大 token */
  maxTokens?: number
}
