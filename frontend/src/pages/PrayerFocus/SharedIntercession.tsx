// 중보 기도 × 공동체 연결 — 이번 주 교회 공동 기도제목(weekly prayer)을
// 기도 화면 하단에 한 개씩 잔잔히 순환하며 띄운다.
// 중보 주제를 골랐거나 ACTS 간구 구간에 들어왔을 때만 표시.
// 공개 API(비로그인 가능)이며 실패하면 조용히 아무것도 그리지 않는다.
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { getCurrentWeeklyPrayer } from '../../api/weeklyPrayer'

interface SharedIntercessionProps {
  show: boolean
  /** 무드 팔레트 강조 텍스트 클래스 */
  accentText: string
  /** 항목 하나가 머무는 ms */
  rotateMs?: number
}

const FADE_MS = 1200

const SharedIntercession = ({ show, accentText, rotateMs = 18000 }: SharedIntercessionProps) => {
  const { t } = useLanguage()
  const [titles, setTitles] = useState<string[] | null>(null)
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const fetchedRef = useRef(false)

  // 처음 보여질 때 한 번만 로드
  useEffect(() => {
    if (!show || fetchedRef.current) return
    fetchedRef.current = true
    getCurrentWeeklyPrayer()
      .then((wp) => {
        const list = (wp.items || []).map((item) => item.title).filter(Boolean)
        if (list.length > 0) setTitles(list)
      })
      .catch(() => {
        // 이번 주 기도제목이 없거나 네트워크 실패 — 표시하지 않음
      })
  }, [show])

  // 순환 — fade-out → 다음 항목 → fade-in
  useEffect(() => {
    if (!show || !titles || titles.length === 0) {
      setVisible(false)
      return
    }
    setVisible(true)
    if (titles.length < 2) return
    const cycle = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % titles.length)
        setVisible(true)
      }, FADE_MS)
    }, rotateMs)
    return () => clearInterval(cycle)
  }, [show, titles, rotateMs])

  if (!show || !titles || titles.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-col items-center px-8 text-center">
      <p className={`text-[10px] tracking-[0.3em] uppercase mb-2 ${accentText} opacity-80`}>
        {t('intercessionSharedTitle')}
      </p>
      <p
        className={`text-white/60 text-sm leading-relaxed max-w-sm break-keep transition-opacity ease-in-out ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        {titles[index]}
      </p>
    </div>
  )
}

export default SharedIntercession
