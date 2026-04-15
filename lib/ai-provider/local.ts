/**
 * Local Provider — 本地模拟模式
 *
 * 不调用任何外部 API，直接返回空结果或固定提示。
 * 用于：
 * - 开发/测试环境（无需 API Key）
 * - 降级回退（当远程 API 不可用时）
 *
 * 业务层收到 local provider 的结果后，应使用自己的本地算法处理。
 */

import type {
  AIProvider,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "./types"

export class LocalProvider implements AIProvider {
  readonly name = "local" as const
  readonly displayName = "本地模拟"
  readonly defaultModel = "local"
  readonly availableModels = ["local"]

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    // 本地模式不调用 API，返回一个标记内容
    // 业务层应检查 provider 类型，在 local 模式下使用自己的算法
    return {
      content: "",
      model: "local",
    }
  }

  async chatJSON<T = unknown>(_options: ChatCompletionOptions): Promise<T> {
    // local 模式下 chatJSON 不应被直接调用
    // 业务层应先判断 isLocal() 再决定走本地算法还是调 LLM
    throw new Error(
      "[Local] chatJSON is not available in local mode. " +
      "Use getProvider().name === 'local' to check and handle locally."
    )
  }
}

export function createLocalProvider(): LocalProvider {
  return new LocalProvider()
}
