// 행사 앨범 리액션 이모지 메타 (welcomeEmoji.tsx 미러링)
// 기도의 🙏 골드 액센트는 기도 버튼 전용 — 여기서는 브랜드 색 리액션 칩으로만 쓴다.
// 코드는 Noto Animated Emoji의 코드포인트(소문자 hex, ZWJ는 '_' 결합).
import { useState } from 'react'
import { animatedEmojiUrl } from '../../../components/common/animatedEmoji'
import { EVENT_ALBUM_EMOJIS } from '../../../types/eventAlbum'

export interface EventAlbumEmojiMeta {
  char: string
  code: string
  label: string
}

export const EVENT_ALBUM_EMOJI_META: EventAlbumEmojiMeta[] = [
  { char: '🙏', code: '1f64f', label: '은혜였어요' },
  { char: '❤️', code: '2764_fe0f', label: '사랑해요' },
  { char: '🎉', code: '1f389', label: '즐거웠어요' },
  { char: '🙌', code: '1f64c', label: '함께해요' },
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

interface EventAlbumEmojiImgProps {
  meta: EventAlbumEmojiMeta
  size: number
  className?: string
}

export const EventAlbumEmojiImg = ({ meta, size, className }: EventAlbumEmojiImgProps) => {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        className={className}
        style={{ fontSize: Math.round(size * 0.85), lineHeight: 1 }}
      >
        {meta.char}
      </span>
    )
  }

  return (
    <img
      src={animatedEmojiUrl(meta.code)}
      alt={meta.label}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className={['inline-block select-none', className ?? ''].join(' ')}
    />
  )
}
