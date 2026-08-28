// 홈 "함께 나누는 은혜" 3행 전용 아이콘 — 클레이(3D-lite) 듀오톤.
//
// 선화(Lucide 톤)는 어디서나 보는 문법이라 "뻔하게" 읽혔다. 요즘 토스·카뱅류 앱의
// 리스트 아이콘처럼 ①면으로 채우고 ②같은 hue의 진한/연한 두 톤으로 앞뒤 깊이를 주고
// ③위쪽에 흰 하이라이트를 얹어 말랑한 입체감을 낸다. 색은 부모 color(currentColor)
// 하나만 받아서 칩 틴트와 자동으로 맞는다. 이미지 에셋 없이 SVG만으로 렌더.
import React, { useId } from 'react'

export type GraceIconName = 'thanksJar' | 'candles' | 'openDoor'

interface GraceIconProps {
  name: GraceIconName
  size?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * 각 모양은 (뒤 레이어: 연한 톤) → (앞 레이어: 그라데이션 본체) → (하이라이트: 흰 반투명) 순.
 * g = 본체 그라데이션 id, 부모 currentColor 기반.
 */
const SHAPES: Record<GraceIconName, (g: string) => React.ReactNode> = {
  // 오늘의 감사 한 줄 — 감사가 담기는 항아리, 안에 하트가 떠 있다
  thanksJar: (g) => (
    <>
      {/* 항아리 본체 */}
      <path
        d="M9 3.5h6a1 1 0 0 1 1 1v.9c0 .6.3 1.2.8 1.6A6.3 6.3 0 0 1 19 12v5.5A3.5 3.5 0 0 1 15.5 21h-7A3.5 3.5 0 0 1 5 17.5V12a6.3 6.3 0 0 1 2.2-4.9c.5-.4.8-1 .8-1.6v-.9a1 1 0 0 1 1-1Z"
        fill={`url(#${g})`}
      />
      {/* 뚜껑 띠 — 연한 톤 */}
      <rect x="8" y="2.2" width="8" height="2.6" rx="1.3" fill="currentColor" opacity="0.55" />
      {/* 하이라이트 */}
      <path d="M7.6 9.2c.4-1 1-1.7 1.7-2.2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      {/* 하트 — 흰색으로 떠 있게 */}
      <path
        d="M12 16.6c-1.4-1.1-3.2-2.4-3.2-4a1.8 1.8 0 0 1 3.2-1.2 1.8 1.8 0 0 1 3.2 1.2c0 1.6-1.8 2.9-3.2 4Z"
        fill="#fff"
        opacity="0.95"
      />
    </>
  ),
  // 공동 기도제목 — 교회가 함께 켠 촛불 셋
  candles: (g) => (
    <>
      {/* 받침 — 연한 톤 */}
      <rect x="2.5" y="19" width="19" height="2.6" rx="1.3" fill="currentColor" opacity="0.4" />
      {/* 양옆 초 — 연한 톤(뒤) */}
      <rect x="4" y="12.2" width="4.2" height="7.6" rx="1.2" fill="currentColor" opacity="0.55" />
      <rect x="15.8" y="12.2" width="4.2" height="7.6" rx="1.2" fill="currentColor" opacity="0.55" />
      {/* 가운데 초 — 본체 */}
      <rect x="9.6" y="8.8" width="4.8" height="11" rx="1.4" fill={`url(#${g})`} />
      {/* 초 하이라이트 */}
      <path d="M10.7 10.4v7.2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      {/* 불꽃 — 흰 심지 불꽃에 hue 외곽 */}
      <path d="M12 2.6c-1.3 1.6-2 2.7-2 3.8a2 2 0 0 0 4 0c0-1.1-.7-2.2-2-3.8Z" fill="currentColor" />
      <path d="M12 4.6c-.6.8-.9 1.3-.9 1.9a.9.9 0 0 0 1.8 0c0-.6-.3-1.1-.9-1.9Z" fill="#fff" opacity="0.9" />
      <path d="M6.1 8.2c-.9 1.1-1.4 1.9-1.4 2.6a1.4 1.4 0 0 0 2.8 0c0-.7-.5-1.5-1.4-2.6Z" fill="currentColor" opacity="0.8" />
      <path d="M17.9 8.2c-.9 1.1-1.4 1.9-1.4 2.6a1.4 1.4 0 0 0 2.8 0c0-.7-.5-1.5-1.4-2.6Z" fill="currentColor" opacity="0.8" />
    </>
  ),
  // 응답의 전당 — 빛이 새어나오는 열린 아치문
  openDoor: (g) => (
    <>
      {/* 바깥 아치 — 연한 톤(벽) */}
      <path d="M4.5 21V10.5a7.5 7.5 0 0 1 15 0V21Z" fill="currentColor" opacity="0.4" />
      {/* 안쪽 문 — 본체 그라데이션 */}
      <path d="M8 21v-9.6a4 4 0 0 1 8 0V21Z" fill={`url(#${g})`} />
      {/* 새어나오는 빛 — 흰 세로 띠 */}
      <path d="M12 12.4v8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
      {/* 바닥 */}
      <rect x="2.5" y="20.2" width="19" height="1.9" rx="0.95" fill="currentColor" opacity="0.6" />
      {/* 아치 위 반짝임 */}
      <path d="M12 1.6l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5Z" fill="currentColor" opacity="0.8" />
    </>
  ),
}

export const GraceIcon = ({ name, size = 20, className, style }: GraceIconProps) => {
  const g = `grace-${useId().replace(/:/g, '')}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        {/* 위는 살짝 밝고 아래는 본색 — 클레이 볼륨감 */}
        <linearGradient id={g} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.72" />
        </linearGradient>
      </defs>
      {SHAPES[name](g)}
    </svg>
  )
}

export default GraceIcon
