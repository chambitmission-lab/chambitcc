// 소인 도장 — 둥근 테두리 글자(참빛교회 · 절기) + 가운데 날짜.
// 표지 편지지와 읽기 화면 머리띠가 함께 쓴다.

import { useId } from 'react'
import { specialSundayLabel } from './letterSeason'

interface LetterPostmarkProps {
  date: string
  language: string
  className?: string
}

const LetterPostmark = ({ date, language, className = '' }: LetterPostmarkProps) => {
  const ringId = useId()
  const [y, m, d] = date.split('-').map(Number)
  const ko = language === 'ko'
  const label = specialSundayLabel(date, ko) ?? (ko ? '주일' : 'SUNDAY')
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <path id={ringId} d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
      </defs>
      <g fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="56" strokeWidth="2.5" />
        <circle cx="60" cy="60" r="34" strokeWidth="1.5" />
      </g>
      <text fontSize="10.5" fontWeight="700" letterSpacing="2" fill="currentColor">
        <textPath href={`#${ringId}`}>{ko ? '참빛교회 · CHAMBIT' : 'CHAMBIT CHURCH'} · {label} ·</textPath>
      </text>
      <text x="60" y="56" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">
        {y}
      </text>
      <text x="60" y="74" textAnchor="middle" fontSize="17" fontWeight="800" fill="currentColor">
        {m}.{String(d).padStart(2, '0')}
      </text>
    </svg>
  )
}

export default LetterPostmark
