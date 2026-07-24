// 환영 리액션 이모지 메타 + 렌더러
// 기도의 🙏 골드는 "기도하는 순간" 전용이라 새가족 환영은 별도 세트를 쓴다.
// 코드는 Noto Animated Emoji의 코드포인트(소문자 hex, ZWJ는 '_' 결합).
import { useState } from 'react'
import { animatedEmojiUrl } from '../../../components/common/animatedEmoji'
import { WELCOME_EMOJIS } from '../../../types/newFamily'

export interface WelcomeEmojiMeta {
  char: string
  code: string
  label: string
}

export const WELCOME_EMOJI_META: WelcomeEmojiMeta[] = [
  { char: '👋', code: '1f44b', label: '환영해요' },
  { char: '❤️', code: '2764_fe0f', label: '사랑해요' },
  { char: '🙌', code: '1f64c', label: '함께해요' },
  { char: '🎉', code: '1f389', label: '축하해요' },
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

interface WelcomeEmojiImgProps {
  meta: WelcomeEmojiMeta
  size: number
  /** 정지 이미지로 보여줄 때(카운트 칩 등) — 실패 시 문자 폴백은 동일 */
  className?: string
}

export const WelcomeEmojiImg = ({ meta, size, className }: WelcomeEmojiImgProps) => {
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
