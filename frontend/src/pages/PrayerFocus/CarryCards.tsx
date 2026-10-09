// 기도 중 '품은 기도제목' — 하단에 한 장씩. 기도 시간을 개수만큼 나눠 저절로 넘어가고,
// 탭하면 다음 장으로. 구간 안내(ACTS) 모드에서는 간구 구간(마지막 1/4)에만 나타난다.
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import type { CarryItem } from './carryPrayers'

interface CarryCardsProps {
  items: CarryItem[]
  elapsedSeconds: number
  totalSeconds: number
  guidedMode: boolean
  dimmed: boolean
  accentText: string
}

const CarryCards = ({ items, elapsedSeconds, totalSeconds, guidedMode, dimmed, accentText }: CarryCardsProps) => {
  const { t } = useLanguage()
  const [manualOffset, setManualOffset] = useState(0)

  const windowStart = guidedMode ? totalSeconds * 0.75 : 0
  const windowLen = Math.max(1, totalSeconds - windowStart)
  const n = items.length
  const slot = Math.min(n - 1, Math.max(0, Math.floor(((elapsedSeconds - windowStart) / windowLen) * n)))
  const index = n > 0 ? (slot + manualOffset) % n : 0

  // 장이 바뀌는 순간 짧게 진동 — 눈을 감고 있어도 다음 기도제목으로 넘어간 걸 알게
  const prevIndexRef = useRef(index)
  useEffect(() => {
    if (prevIndexRef.current !== index && 'vibrate' in navigator) navigator.vibrate(25)
    prevIndexRef.current = index
  }, [index])

  if (n === 0 || elapsedSeconds < windowStart) return null
  const item = items[index]

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-col items-center px-8 text-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setManualOffset((v) => v + 1)
        }}
        aria-label={t('carryNext')}
        className={`pointer-events-auto max-w-sm lg:max-w-lg transition-opacity duration-[2000ms] ${dimmed ? 'opacity-50' : 'opacity-100'}`}
      >
        <p className={`text-[10px] lg:text-[13px] tracking-[0.3em] mb-2 ${accentText} opacity-80`}>
          {t('carryCardLabel')} <span className="tabular-nums">{index + 1}/{n}</span>
        </p>
        <p key={item.id} className="text-white/75 text-[15px] lg:text-[19px] lg:text-white/90 leading-relaxed break-keep line-clamp-3 font-serif-kr animate-fade-in">
          {item.text}
        </p>
        {item.who && <p className="mt-1.5 text-[11px] lg:text-[13.5px] text-white/35 lg:text-white/55">{item.who}</p>}
      </button>
    </div>
  )
}

export default CarryCards
