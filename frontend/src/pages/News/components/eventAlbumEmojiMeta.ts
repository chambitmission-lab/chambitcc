// 행사 앨범 리액션 이모지 메타 — 렌더러(eventAlbumEmoji.tsx)와 분리(react-refresh: 컴포넌트 파일은 컴포넌트만 export)
import type { Translation } from '../../../locales'
import { EVENT_ALBUM_EMOJIS } from '../../../types/eventAlbum'

export interface EventAlbumEmojiMeta {
  char: string
  code: string
  labelKey: keyof Translation
}

export const EVENT_ALBUM_EMOJI_META: EventAlbumEmojiMeta[] = [
  { char: '🙏', code: '1f64f', labelKey: 'newsEaEmojiGrace' },
  { char: '❤️', code: '2764_fe0f', labelKey: 'newsEaEmojiLove' },
  { char: '🎉', code: '1f389', labelKey: 'newsEaEmojiJoy' },
  { char: '🙌', code: '1f64c', labelKey: 'newsEaEmojiTogether' },
]

// types의 화이트리스트와 어긋나면 조용히 빠지는 대신 개발 중에 바로 드러나게 한다
if (import.meta.env.DEV) {
  const missing = EVENT_ALBUM_EMOJIS.filter(
    (c) => !EVENT_ALBUM_EMOJI_META.some((m) => m.char === c),
  )
  if (missing.length > 0) {
    console.warn('[eventAlbumEmoji] 메타가 빠진 이모지:', missing)
  }
}
