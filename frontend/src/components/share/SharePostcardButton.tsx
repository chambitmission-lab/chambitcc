import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { onPostcardSent, useSentPostcardToday } from './sharePostcardsShared'
import './SharePostcards.css'

// 「나누기」 버튼 — 엽서 묶음. 미색 엽서 한 장이 버튼이고 뒤로 두 장이 비스듬히 깔려 있다.
// 윗변 항공우편 줄무늬(펼쳐지는 부채 엽서와 같은 자리) + 손글씨 "나누기" + 오른쪽 오늘 날짜 소인
// (달은 작게, 일은 크게 — '참빛 10.30' 두 줄은 작은 원에서 6px 까지 줄어 읽히지 않았다).
// ★ 소인은 이중 링 + 오른쪽으로 흐르는 물결 취소선 — "안 읽은 3건" 배지가 아니라 찍힌 도장으로 읽히게.
// ★ 오늘 기도·감사·말씀 카드 중 하나라도 보냈으면(is-sent) 외곽선 소인이 잉크로 꽉 찬다 —
//   성경 도장의 '인주 농도 = 진행' 문법. 보내는 순간엔 소인이 한 번 꾹 눌린다(is-stamping).
// 누르면 깔린 엽서가 위로 빠져나가(= 펼쳐지는 엽서 다이얼) 소인 자리에 손그림 × 가 온다.
//   rail: PC 레일 — lg(아이콘 바)에선 기운 작은 엽서, xl 부터 손글씨 라벨이 붙은 가로 엽서
//   dock: 모바일 도크 — 기운 작은 엽서
// 종이비행기+별(HeavenLetterIcon) 버튼을 2026-10-30 사용자 요청으로 교체했다.

const STAMP_MS = 640

interface SharePostcardButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'rail' | 'dock'
  open: boolean
  /** xl 레일에서 보이는 손글씨 라벨 */
  label?: string
  /** 툴팁 등 버튼 안에 덧붙일 것 */
  children?: ReactNode
}

const SharePostcardButton = ({
  variant,
  open,
  label,
  className = '',
  children,
  ...rest
}: SharePostcardButtonProps) => {
  const { language } = useLanguage()
  const sent = useSentPostcardToday()
  // 보낸 순간에만 꾹 — 처음부터 보낸 상태로 뜬 날(새로고침)은 조용히 채워진 소인
  const [stamping, setStamping] = useState(false)
  const timer = useRef(0)
  useEffect(() => {
    const off = onPostcardSent(() => {
      window.clearTimeout(timer.current)
      setStamping(true)
      timer.current = window.setTimeout(() => setStamping(false), STAMP_MS)
    })
    return () => {
      off()
      window.clearTimeout(timer.current)
    }
  }, [])

  const today = new Date()
  const month =
    language === 'ko'
      ? `${today.getMonth() + 1}월`
      : today.toLocaleString('en', { month: 'short' }).toUpperCase()

  return (
    <button
      type="button"
      {...rest}
      className={`share-pcb share-pcb--${variant}${open ? ' is-open' : ''}${sent ? ' is-sent' : ''}${
        stamping ? ' is-stamping' : ''
      } ${className}`}
    >
      <span className="share-pcb__under" aria-hidden />
      <span className="share-pcb__under" aria-hidden />
      <span className="share-pcb__face">
        {label && <span className="share-pcb__word">{label}</span>}
        <span className="share-pcb__mark" aria-hidden>
          {/* 소인 물결 취소선 — 원 오른쪽으로 흘러나가 모서리에서 잘린다 */}
          <svg className="share-pcb__waves" viewBox="0 0 40 24" preserveAspectRatio="none">
            <path d="M0 4c4-2.4 8-2.4 12 0s8 2.4 12 0 8-2.4 12 0 4 1.6 6 1.6" />
            <path d="M0 12c4-2.4 8-2.4 12 0s8 2.4 12 0 8-2.4 12 0 4 1.6 6 1.6" />
            <path d="M0 20c4-2.4 8-2.4 12 0s8 2.4 12 0 8-2.4 12 0 4 1.6 6 1.6" />
          </svg>
          <span className="share-pcb__postmark">
            <small>{month}</small>
            <b>{today.getDate()}</b>
          </span>
          <svg className="share-pcb__close" viewBox="0 0 24 24">
            <path d="M7 7.4c3.4 3 6.6 6.2 9.8 9.6M16.6 7c-3.2 3.3-6.3 6.6-9.4 10" />
          </svg>
        </span>
      </span>
      {children}
    </button>
  )
}

export default SharePostcardButton
