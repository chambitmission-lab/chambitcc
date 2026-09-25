// 행사 앨범 리액션 이모지 렌더러 (메타는 eventAlbumEmojiMeta.ts, welcomeEmoji.tsx 미러링)
// 기도의 🙏 골드 액센트는 기도 버튼 전용 — 여기서는 브랜드 색 리액션 칩으로만 쓴다.
// 코드는 Noto Animated Emoji의 코드포인트(소문자 hex, ZWJ는 '_' 결합).
import { useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { animatedEmojiUrl } from '../../../components/common/animatedEmoji'
import type { EventAlbumEmojiMeta } from './eventAlbumEmojiMeta'

interface EventAlbumEmojiImgProps {
  meta: EventAlbumEmojiMeta
  size: number
  className?: string
}

export const EventAlbumEmojiImg = ({ meta, size, className }: EventAlbumEmojiImgProps) => {
  const { t } = useLanguage()
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
      alt={t(meta.labelKey)}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className={['inline-block select-none', className ?? ''].join(' ')}
    />
  )
}
