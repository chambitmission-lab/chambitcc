// 예배 화면 소품 — 상태 배지 · 카운트다운 · 무드 아이콘.

import { memo, useState, useEffect, type ReactElement } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { DawnIcon, DayIcon, DuskIcon, NightIcon } from '../../About/icons'
import type { Mood, ServiceStatus } from './worshipTime'

const STATUS_KEY = {
  waiting: 'worshipStatusWaiting',
  open: 'worshipStatusOpen',
  ongoing: 'worshipStatusOngoing',
  ended: 'worshipStatusEnded'
} as const

const StatusChip = ({ status }: { status: ServiceStatus }) => {
  const { t } = useLanguage()
  return (
    <span className={`worship-status worship-status--${status}`}>
      <span className="worship-status-dot" aria-hidden />
      {t(STATUS_KEY[status])}
    </span>
  )
}

// 세그먼트 한 칸 — 카드는 고정하고, 바뀐 자리 숫자만 key 교체로 remount 되어
// 아래에서 굴러 올라오는 롤 애니메이션이 재생된다 (자리별 key = 위치+값)
const CountdownSeg = ({ value, label }: { value: number; label: string }) => {
  const text = String(value).padStart(2, '0')
  return (
    <div className="worship-cd-box">
      <span className="worship-cd-num">
        {text.split('').map((ch, i) => (
          <span key={`${i}${ch}`} className="worship-cd-digit">{ch}</span>
        ))}
      </span>
      <span className="worship-cd-lab">{label}</span>
    </div>
  )
}

// 무드 마크 — 종료된 예배의 마무리 한 줄에 붙는다.
// 이모지였을 땐 12px 문장 안에서 작은 색 사각형처럼 뭉개져 아이콘으로 바꿨다.
const MOOD_ICON: Record<Mood, (p: { size?: number }) => ReactElement> = {
  dawn: DawnIcon,
  day: DayIcon,
  dusk: DuskIcon,
  night: NightIcon,
}

// 초 단위 카운트다운만 따로 떼어낸 컴포넌트.
// 1초 인터벌을 여기서만 돌려, 페이지 전체(히어로·필터·카드 전부)가
// 매초 재렌더되며 CPU/배터리를 소모하던 것을 이 span 하나의 갱신으로 줄인다.
const CountdownClock = memo(({ deadlineTs }: { deadlineTs: number }) => {
  const { t } = useLanguage()
  const [remainSec, setRemainSec] = useState(0)
  useEffect(() => {
    const update = () =>
      setRemainSec(Math.max(0, Math.round((deadlineTs - Date.now()) / 1000)))
    update()
    const timer = setInterval(update, 1_000)
    return () => clearInterval(timer)
  }, [deadlineTs])
  const sec = Math.max(0, remainSec)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return (
    <div className="worship-cd" role="timer" aria-label={t('worshipCountdownAria')}>
      <CountdownSeg value={h} label={t('worshipHourUnit')} />
      <span className="worship-cd-sep" aria-hidden>:</span>
      <CountdownSeg value={m} label={t('worshipMinuteUnit')} />
      <span className="worship-cd-sep" aria-hidden>:</span>
      <CountdownSeg value={s} label={t('worshipSecondUnit')} />
    </div>
  )
})

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { StatusChip, MOOD_ICON, CountdownClock }
