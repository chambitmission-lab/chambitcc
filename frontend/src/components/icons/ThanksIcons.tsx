// 감사 스레드용 라인 아이콘 세트 (ActionIcons와 같은 24 그리드 · currentColor · 둥근 캡)
//
// 이모지(😊 ✨ 🙏 …)를 쓰지 않는 이유:
//  - OS/폰트마다 생김새가 달라 카드 톤이 기기별로 흔들린다
//  - 컬러 이모지는 감정 hue(색 액센트)와 따로 놀아 카드 색과 충돌한다
//  - 흔한 글자라 "뻔한" 인상을 준다
// 여기 한 곳에서만 모양을 정의하고, 감사 카드·티커·작성 모달이 모두 이 컴포넌트를 쓴다.
import React from 'react'
import type { ThanksEmotion } from '../../types/thanks'

/** 감정 5종 + 감정 미선택(thanks) + 빈 상태(jar) */
export type ThanksIconName = ThanksEmotion | 'thanks' | 'jar'

interface ThanksIconProps {
  name: ThanksIconName
  size?: number
  strokeWidth?: number
  className?: string
  style?: React.CSSProperties
}

/** 이름 → path 조합. 모두 24×24 그리드, 채움 없이 스트로크만 쓴다. */
const SHAPES: Record<ThanksIconName, React.ReactNode> = {
  // 기쁨 — 떠오른 해
  joy: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.6v1.9M12 19.5v1.9M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.6 12h1.9M19.5 12h1.9M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
  // 평안 — 잎 하나 (감람나무 가지)
  peace: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" />
      <path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12" />
    </>
  ),
  // 감격 — 빛나는 반짝임
  awe: (
    <>
      <path d="M12 3.2 13.6 8a2 2 0 0 0 1.3 1.3l4.9 1.6-4.9 1.6A2 2 0 0 0 13.6 14L12 18.8 10.4 14a2 2 0 0 0-1.3-1.3L4.2 11l4.9-1.6A2 2 0 0 0 10.4 8Z" />
      <path d="M18.6 17.4v3.4M16.9 19.1h3.4M5.2 3.4v2.8M3.8 4.8h2.8" />
    </>
  ),
  // 사랑 — 하트
  love: (
    <path d="M12 20.4 4.9 13.6C3.4 12.1 2 10.4 2 8.3A5.3 5.3 0 0 1 7.3 3c1.8 0 3.2.7 4.7 2.2C13.5 3.7 14.9 3 16.7 3A5.3 5.3 0 0 1 22 8.3c0 2.1-1.4 3.8-2.9 5.3Z" />
  ),
  // 웃음 — 웃는 입이 담긴 말풍선 (얼굴 이모지 대신)
  laugh: (
    <>
      <path d="M21 11.8a8.2 8.2 0 0 1-8.4 8.1 8.7 8.7 0 0 1-3.6-.8L3.6 21l1.9-5.2a8 8 0 0 1-.9-3.7A8.2 8.2 0 0 1 12.8 4 8.2 8.2 0 0 1 21 11.8Z" />
      <path d="M9.3 10.9c.8 1.1 2 1.8 3.4 1.8s2.6-.7 3.4-1.8" />
    </>
  ),
  // 감정을 안 고른 감사 — 한 줄을 담은 따옴표
  thanks: (
    <>
      <path d="M10.6 6.6C7.9 7.9 6.3 10.1 6.3 12.9v4.5h5.4V12H9.1c.1-1.6 1-2.8 2.5-3.6Z" />
      <path d="M19.3 6.6c-2.7 1.3-4.3 3.5-4.3 6.3v4.5h5.4V12h-2.6c.1-1.6 1-2.8 2.5-3.6Z" />
    </>
  ),
  // 빈 상태 — 아직 아무것도 안 담긴 감사 항아리
  jar: (
    <>
      <path d="M7.6 2.8h8.8" />
      <path d="M9.2 2.8v2.4a2.5 2.5 0 0 1-.7 1.7A6.4 6.4 0 0 0 6 11.3v6.4a3.5 3.5 0 0 0 3.5 3.5h5a3.5 3.5 0 0 0 3.5-3.5v-6.4a6.4 6.4 0 0 0-2.5-4.4 2.5 2.5 0 0 1-.7-1.7V2.8" />
      <path d="M12 11.8c-.8-.9-2.7-.6-2.7 1 0 1.2 1.8 2.4 2.7 3.2.9-.8 2.7-2 2.7-3.2 0-1.6-1.9-1.9-2.7-1Z" />
    </>
  ),
}

/**
 * 감사 아이콘 — name 하나로 감정/기본/빈 상태를 모두 그린다.
 * 색은 currentColor라 감정 hue든 브랜드든 부모의 color만 바꾸면 된다.
 */
export const ThanksIcon = ({
  name,
  size = 24,
  strokeWidth = 1.7,
  className,
  style,
}: ThanksIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    {SHAPES[name]}
  </svg>
)

export default ThanksIcon
