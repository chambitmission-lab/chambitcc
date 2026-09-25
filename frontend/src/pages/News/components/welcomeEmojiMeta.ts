// 환영 리액션 이모지 메타 — 렌더러(welcomeEmoji.tsx)와 분리(react-refresh: 컴포넌트 파일은 컴포넌트만 export)
import type { Translation } from '../../../locales'
import { WELCOME_EMOJIS } from '../../../types/newFamily'

export interface WelcomeEmojiMeta {
  char: string
  code: string
  labelKey: keyof Translation
}

export const WELCOME_EMOJI_META: WelcomeEmojiMeta[] = [
  { char: '👋', code: '1f44b', labelKey: 'newsNfEmojiWelcome' },
  { char: '❤️', code: '2764_fe0f', labelKey: 'newsNfEmojiLove' },
  { char: '🙌', code: '1f64c', labelKey: 'newsNfEmojiTogether' },
  { char: '🎉', code: '1f389', labelKey: 'newsNfEmojiCongrats' },
]

// types의 화이트리스트와 어긋나면 조용히 빠지는 대신 개발 중에 바로 드러나게 한다
if (import.meta.env.DEV) {
  const missing = WELCOME_EMOJIS.filter(
    (c) => !WELCOME_EMOJI_META.some((m) => m.char === c),
  )
  if (missing.length > 0) {
    console.warn('[welcomeEmoji] 메타가 빠진 이모지:', missing)
  }
}

export const findWelcomeMeta = (char: string): WelcomeEmojiMeta | undefined =>
  WELCOME_EMOJI_META.find((m) => m.char === char)
