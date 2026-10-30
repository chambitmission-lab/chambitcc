import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import './SharePostcards.css'

// 「나누기」 버튼 — 엽서 묶음. 미색 엽서 한 장이 버튼이고 뒤로 두 장이 비스듬히 깔려 있다.
// 왼쪽 끝 항공우편 줄무늬 + 손글씨 "나누기" + 오른쪽 오늘 날짜 소인(달은 작게, 일은 크게 —
// '참빛 10.30' 두 줄은 작은 원에서 6px 까지 줄어 읽히지 않았다).
// 누르면 깔린 엽서가 위로 빠져나가(= 펼쳐지는 엽서 다이얼) 소인 자리에 손그림 × 가 온다.
//   rail: PC 레일 — lg(아이콘 바)에선 기운 작은 엽서, xl 부터 손글씨 라벨이 붙은 가로 엽서
//   dock: 모바일 도크 — 기운 작은 엽서
// 종이비행기+별(HeavenLetterIcon) 버튼을 2026-10-30 사용자 요청으로 교체했다.

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
  const today = new Date()
  const month =
    language === 'ko'
      ? `${today.getMonth() + 1}월`
      : today.toLocaleString('en', { month: 'short' }).toUpperCase()

  return (
    <button
      type="button"
      {...rest}
      className={`share-pcb share-pcb--${variant}${open ? ' is-open' : ''} ${className}`}
    >
      <span className="share-pcb__under" aria-hidden />
      <span className="share-pcb__under" aria-hidden />
      <span className="share-pcb__face">
        {label && <span className="share-pcb__word">{label}</span>}
        <span className="share-pcb__mark" aria-hidden>
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
