import { useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { nextWaitingQuip } from '../../../utils/waitingQuips'

/* 핵심 절 대기 — 성경 속 "기다림" 한 줄 유머(목록은 utils/waitingQuips).
 * 스켈레톤 quote 와 같은 높이·radius 라 도착 순간 레이아웃이 밀리지 않고,
 * 400ms 안에 채워지면 문구가 드러나기 전에 끝난다(CSS animation-delay). */

const WaitingQuipLoader = () => {
  const { language } = useLanguage()
  const [quip] = useState(nextWaitingQuip)
  const isKo = language === 'ko'

  return (
    <div className="meditation-skeleton quote waiting-quip" aria-hidden>
      <div className="waiting-quip-stage">
        <span className="waiting-quip-label">{isKo ? '잠깐만요' : 'Just a moment'}</span>
        <p className="waiting-quip-text">{isKo ? quip.ko : quip.en}</p>
        <span className="waiting-quip-ref">— {isKo ? quip.refKo : quip.refEn}</span>
        <span className="waiting-quip-dots">
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  )
}

export default WaitingQuipLoader
