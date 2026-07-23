// 움직이는 이모티콘 — 구글 Noto Animated Emoji(fonts.gstatic.com CDN)를 사용한다.
// 키보드의 움직이는 스티커는 웹 입력창에 넣을 수 없으므로(IME 이미지 삽입 미지원)
// 앱 자체 피커로 일반 이모지 "문자"를 입력받아 저장하고, 표시할 때만 애니메이션
// WebP로 바꿔 그린다. 덕분에 서버/DB는 순수 텍스트 그대로라 백엔드 수정이 없고,
// CDN 장애·미지원 이모지는 onError로 원래 문자가 그대로 보인다.
import { useState } from 'react'

export interface AnimatedEmoji {
  char: string
  code: string // Noto CDN 경로용 코드포인트 (소문자 hex, 다중 코드포인트는 _ 연결)
  label: string
}

export const ANIMATED_EMOJIS: AnimatedEmoji[] = [
  { char: '🙏', code: '1f64f', label: '기도' },
  { char: '❤️', code: '2764_fe0f', label: '사랑' },
  { char: '🥰', code: '1f970', label: '사랑스러움' },
  { char: '😊', code: '1f60a', label: '미소' },
  { char: '😭', code: '1f62d', label: '눈물' },
  { char: '😢', code: '1f622', label: '슬픔' },
  { char: '🙌', code: '1f64c', label: '찬양' },
  { char: '👏', code: '1f44f', label: '박수' },
  { char: '🤗', code: '1f917', label: '포옹' },
  { char: '✨', code: '2728', label: '반짝임' },
  { char: '🔥', code: '1f525', label: '불꽃' },
  { char: '🎉', code: '1f389', label: '축하' },
  { char: '💪', code: '1f4aa', label: '힘내요' },
  { char: '🌈', code: '1f308', label: '무지개' },
  { char: '🌟', code: '1f31f', label: '빛나는 별' },
  { char: '🕊️', code: '1f54a_fe0f', label: '평화' },
]

const byChar = new Map<string, AnimatedEmoji>()
for (const e of ANIMATED_EMOJIS) byChar.set(e.char, e)
// 키보드에 따라 변형 선택자(U+FE0F) 없이 입력되는 경우도 같은 애니메이션으로 매칭
for (const e of ANIMATED_EMOJIS) {
  const bare = e.char.replace(/️/g, '')
  if (bare !== e.char && !byChar.has(bare)) byChar.set(bare, e)
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// 긴 문자(FE0F 포함형)가 먼저 매칭되도록 정렬
const emojiPattern = new RegExp(
  `(${[...byChar.keys()]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|')})`,
  'g'
)

export const animatedEmojiUrl = (code: string) =>
  `https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.webp`

interface AnimatedEmojiImgProps {
  emoji: AnimatedEmoji
  size: number
}

// CDN에 애니메이션이 없거나 로드 실패하면 원래 이모지 문자로 폴백
export const AnimatedEmojiImg = ({ emoji, size }: AnimatedEmojiImgProps) => {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span style={{ fontSize: Math.round(size * 0.85), lineHeight: 1 }}>{emoji.char}</span>
    )
  }

  return (
    <img
      src={animatedEmojiUrl(emoji.code)}
      alt={emoji.char}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className="inline-block align-[-0.35em] mx-px select-none"
    />
  )
}

interface AnimatedEmojiTextProps {
  content: string
  className?: string
}

// 텍스트 안의 지원 이모지를 움직이는 이미지로 바꿔 그린다.
// 이모지(1~3개)만 있는 댓글은 메신저처럼 큼직한 스티커로 보여준다.
export const AnimatedEmojiText = ({ content, className }: AnimatedEmojiTextProps) => {
  const parts = content.split(emojiPattern)
  const emojiCount = parts.filter((p) => byChar.has(p)).length
  const stickerOnly =
    emojiCount > 0 && emojiCount <= 3 && parts.every((p) => byChar.has(p) || p.trim() === '')
  const size = stickerOnly ? 52 : 21

  return (
    <p className={className}>
      {parts.map((part, i) => {
        const emoji = byChar.get(part)
        return emoji ? <AnimatedEmojiImg key={i} emoji={emoji} size={size} /> : part
      })}
    </p>
  )
}
