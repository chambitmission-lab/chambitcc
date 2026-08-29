/**
 * 텍스트 속 이모지 → Phosphor Duotone 아이콘 렌더 시점 변환.
 * 어드민이 편집하는 문구(로케일·DB)에 섞인 ✝️ 🙏 💗 같은 이모지를
 * 데이터는 그대로 둔 채 앱 아이콘 결(Phosphor duotone)로 바꿔 그린다.
 * 매핑에 없는 이모지는 원래 문자를 그대로 출력한다. (같은 방식: PlanGlyph · EmotionGlyph)
 *
 * 색은 currentColor 라 주변 글자색을 따르고, 크기는 1em 으로 글자에 맞춘다.
 */
import { Fragment, type ReactNode } from 'react'
import {
  Church,
  Cross,
  Fire,
  HandsPraying,
  Heart,
  Sparkle,
  Star,
  SunHorizon,
  type Icon,
} from '@phosphor-icons/react'

const GLYPHS: Record<string, Icon> = {
  '✝': Cross,
  '🙏': HandsPraying,
  '💗': Heart,
  '💙': Heart,
  '❤': Heart,
  '🤍': Heart,
  '✨': Sparkle,
  '⭐': Star,
  '🌟': Star,
  '🔥': Fire,
  '🌅': SunHorizon,
  '⛪': Church,
}

// 매핑된 이모지 + 붙어 있을 수 있는 변이 선택자(FE0F)를 한 토큰으로 자른다
const PATTERN = new RegExp(`(${Object.keys(GLYPHS).join('|')})️?`, 'gu')

// 문자열의 이모지를 아이콘으로 바꿔 ReactNode 배열로 돌려준다
const emojiToGlyphs =(text: string, size: number | string = '1em'): ReactNode[] => {
  const out: ReactNode[] = []
  let last = 0
  let i = 0
  for (const m of text.matchAll(PATTERN)) {
    const idx = m.index ?? 0
    if (idx > last) out.push(text.slice(last, idx))
    const Glyph = GLYPHS[m[1]]
    out.push(
      <Glyph
        key={`g${i++}`}
        size={size}
        weight="duotone"
        color="currentColor"
        aria-hidden="true"
        style={{ display: 'inline-block', verticalAlign: '-0.15em' }}
      />,
    )
    last = idx + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** <EmojiText text="✝️ 참빛교회가 함께합니다" /> */
export const EmojiText = ({ text, size }: { text: string; size?: number | string }) => (
  <Fragment>{emojiToGlyphs(text, size)}</Fragment>
)
