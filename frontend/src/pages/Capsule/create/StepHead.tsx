// 단계 머리글 — 손글씨 안내 줄(작은 배지 + 위로 둥글게 휘는 펜글씨 + 반짝) / 아치형 제목 / 한 줄 설명.
// 2026-10-27 받는 사람 단계부터 적용.
// 펜글씨는 SVG textPath 로 아치 위에, 제목은 글자마다 살짝 올리고 기울여 가운데가 솟은 아치로 — 둘 다 "기울인 직선"이 아니다.
import type { CSSProperties, ReactNode } from 'react'

let arcSeq = 0

export type TitlePart = {
  text: string
  /** 브랜드색 강조어 */
  em?: boolean
  /** 글자 아래 연파랑 형광펜 띠(강조어 안에서만) */
  mark?: boolean
}

/** 제목 글자를 아치 위에 — 가운데가 가장 높고 양끝이 내려온다. 글자 자체는 접선 방향으로만 살짝 돈다 */
const ArchTitle = ({ parts }: { parts: TitlePart[] }) => {
  const total = parts.reduce((n, p) => n + Array.from(p.text).length, 0)
  const plain = parts.map((p) => p.text).join('')
  let i = 0
  return (
    <span className="cw-arch" role="text" aria-label={plain}>
      {parts.map((p, pi) => {
        const chars = Array.from(p.text).map((ch) => {
          const t = (i + 0.5) / total // 0 → 1
          i += 1
          const lift = Math.sin(Math.PI * t) // 0 → 1 → 0
          const slope = Math.cos(Math.PI * t) // 1 → 0 → -1
          return (
            <span
              key={i}
              className={`cw-arch__ch ${p.mark ? 'is-mark' : ''}`}
              style={{ '--lift': lift, '--slope': slope } as CSSProperties}
              aria-hidden
            >
              {ch === ' ' ? ' ' : ch}
            </span>
          )
        })
        return p.em ? <em key={pi}>{chars}</em> : <span key={pi}>{chars}</span>
      })}
    </span>
  )
}

const StepHead = ({
  eyebrow,
  badge,
  title,
  sub,
}: {
  /** 펜글씨 한 줄 — 양이 건네는 말투로 */
  eyebrow: string
  /** 안내 줄 앞 둥근 배지 속 선 아이콘(24 viewBox path) */
  badge: ReactNode
  /** 제목 — 조각 배열. em 은 파랑, mark 는 띠 */
  title: TitlePart[]
  sub?: string
}) => {
  // 같은 화면에 머리글이 둘 이상 있어도 경로 id 가 겹치지 않게
  const arcId = `cw-eyebrow-arc-${++arcSeq}`
  return (
    <header className="cw-head">
      <p className="cw-eyebrow" aria-hidden>
        <span className="cw-eyebrow__badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {badge}
          </svg>
        </span>
        <svg className="cw-eyebrow__arc" viewBox="0 0 232 48">
          <defs>
            {/* 왼쪽 아래에서 출발해 오른쪽 위로 둥글게 */}
            <path id={arcId} d="M4 40 Q 100 18 198 22" fill="none" />
          </defs>
          <text className="cw-eyebrow__text">
            <textPath href={`#${arcId}`} textLength="192" lengthAdjust="spacing">
              {eyebrow}
            </textPath>
          </text>
          {/* 글 끝의 반짝 — 오른쪽 위로 퍼지는 세 줄 */}
          <path
            className="cw-eyebrow__spark"
            d="M206 5l8-5M210 13l9-1M207 20l8 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </p>
      <h2 className="cw-title">
        <ArchTitle parts={title} />
      </h2>
      {sub && <p className="cw-sub">{sub}</p>}
    </header>
  )
}

export default StepHead
