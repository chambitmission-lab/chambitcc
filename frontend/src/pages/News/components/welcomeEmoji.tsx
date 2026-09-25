// 환영 리액션 이모지 렌더러 (메타는 welcomeEmojiMeta.ts)
// 기도의 🙏 골드는 "기도하는 순간" 전용이라 새가족 환영은 별도 세트를 쓴다.
// 코드는 Noto Animated Emoji의 코드포인트(소문자 hex, ZWJ는 '_' 결합).
import { useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { animatedEmojiUrl } from '../../../components/common/animatedEmoji'
import type { WelcomeEmojiMeta } from './welcomeEmojiMeta'

interface WelcomeEmojiImgProps {
  meta: WelcomeEmojiMeta
  size: number
  /** 정지 이미지로 보여줄 때(카운트 칩 등) — 실패 시 문자 폴백은 동일 */
  className?: string
}

export const WelcomeEmojiImg = ({ meta, size, className }: WelcomeEmojiImgProps) => {
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
