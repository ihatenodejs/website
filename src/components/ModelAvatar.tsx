import {
  Antigravity,
  ChatGLM,
  Claude,
  Cohere,
  Cursor,
  DeepSeek,
  Gemini,
  Grok,
  Meta,
  Microsoft,
  Minimax,
  Mistral,
  Moonshot,
  Nvidia,
  OpenAI,
  Perplexity,
  Qwen,
  V0,
  XiaomiMiMo,
  ZAI,
} from '@lobehub/icons'
import type { IconType } from '@lobehub/icons'
import type { ModelIconKey } from '~/lib/model-usage'

/* Cursor, Grok, Moonshot, OpenAI, V0, Xiaomi MiMo, and Z.ai ship a mono mark
   only, so the color variant is optional here. */
const ICONS: Record<ModelIconKey, IconType & { Color?: IconType }> = {
  openai: OpenAI,
  claude: Claude,
  gemini: Gemini,
  deepseek: DeepSeek,
  grok: Grok,
  qwen: Qwen,
  zai: ZAI,
  chatglm: ChatGLM,
  mistral: Mistral,
  meta: Meta,
  minimax: Minimax,
  moonshot: Moonshot,
  'xiaomi-mimo': XiaomiMiMo,
  antigravity: Antigravity,
  cursor: Cursor,
  v0: V0,
  cohere: Cohere,
  nvidia: Nvidia,
  perplexity: Perplexity,
  microsoft: Microsoft,
}

export function ModelAvatar({
  iconKey,
  name,
  size = 16,
}: {
  iconKey: ModelIconKey | 'none' | null
  name: string
  size?: number
}) {
  if (iconKey === null || iconKey === 'none') {
    return (
      <span
        className="model-icon model-icon-fallback"
        style={{ width: size, height: size, fontSize: size * 0.55 }}
        aria-hidden="true"
      >
        {name.trim().charAt(0).toUpperCase() || '?'}
      </span>
    )
  }

  const Icon = ICONS[iconKey].Color ?? ICONS[iconKey]

  return (
    <span
      className="model-icon"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon size={size} />
    </span>
  )
}
