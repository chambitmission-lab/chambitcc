// 홈 만나 내리기 배너 — 지금(또는 2시간 안) 라이브 한 판이 있으면 라이브, 아니면 월~수요일 지난주 광야 챔피언.
// 챔피언 배너는 주마다 한 번 닫을 수 있다(기기 저장). 라이브는 늘 보인다.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMannaHome } from '../../../hooks/useBibleTyping'
import { useHomeBundlePending } from '../../../hooks/useHomeSummary'
import { isAuthenticated } from '../../../utils/auth'
import { parseApiDate } from '../../../utils/dateUtils'
import { preloadRoute } from '../../../utils/routePreload'
import { safeStorage } from '../../../utils/safeStorage'
import { formatNumberKo as fmt } from '../../../utils/formatNumber'

const PATH = '/bible/typing/manna'
const DISMISS_KEY = 'manna-champion-dismissed'
const hhmm = (iso: string) => {
  const d = parseApiDate(iso)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

const MannaHomeBanner = () => {
  const navigate = useNavigate()
  const bundlePending = useHomeBundlePending()
  const { data } = useMannaHome(isAuthenticated() && !bundlePending)
  const [dismissed, setDismissed] = useState(() => safeStorage.get(DISMISS_KEY))

  if (!data) return null
  const go = () => navigate(PATH)
  const pre = () => void preloadRoute(PATH)

  if (data.live) {
    const isOn = data.live.state === 'live'
    return (
      <section className="px-4 pt-3">
        <button
          type="button"
          onClick={go}
          onMouseEnter={pre}
          onTouchStart={pre}
          className="w-full text-left rounded-2xl border border-[#ffd27a] bg-[#fff6e3] dark:bg-[#2a2415] dark:border-[#5a4a1e] px-4 py-3.5 flex items-center gap-3 transition-transform active:scale-[0.99]"
        >
          <span className="relative shrink-0 w-11 h-11 rounded-2xl bg-white/80 dark:bg-white/[0.08] flex items-center justify-center text-[#c27800] dark:text-[#ffc94d]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="2.5" />
              <path d="M8.5 15.5a5 5 0 0 1 0-7M15.5 8.5a5 5 0 0 1 0 7M5.6 18.4a9 9 0 0 1 0-12.8M18.4 5.6a9 9 0 0 1 0 12.8" />
            </svg>
            {isOn && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#e5484d] ring-2 ring-white dark:ring-[#2a2415] animate-pulse" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10.5px] font-bold tracking-[0.1em] text-[#c27800] dark:text-[#ffc94d] uppercase">MANNA LIVE</span>
              {isOn && <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full bg-[#e5484d] text-white">LIVE</span>}
            </div>
            <p className="text-[14.5px] font-bold text-ink-strong truncate">
              {isOn ? `만나 라이브 진행 중 · ${hhmm(data.live.ends_at)}까지` : `${hhmm(data.live.starts_at)}에 만나 라이브가 열려요`}
            </p>
            <p className="text-[12px] text-ink-muted mt-0.5">
              {isOn ? `교회 전체가 같은 판을 쳐요 · 지금 ${data.live.players}명이 마쳤어요` : '20분 동안 교회 전체가 동시에 · 끝난 사람 점수가 실시간으로'}
            </p>
          </div>
          <span className="shrink-0 text-[#c27800] dark:text-[#ffc94d]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </span>
        </button>
      </section>
    )
  }

  const c = data.champion
  if (!c || dismissed === c.week_start) return null
  const title = c.is_me
    ? '이번 주 광야 챔피언은 바로 당신!'
    : c.is_my_team && c.team
      ? `우리 ${c.team.name}가 광야 대항전 1위!`
      : c.person
        ? `지난주 광야 챔피언 · ${c.person.name}`
        : c.team
          ? `지난주 광야 대항전 1위 · ${c.team.name}`
          : ''
  const sub = [c.person ? `개인 ${c.person.name} ${fmt(c.person.points)}점` : null, c.team ? `부서 ${c.team.name} 1인당 ${fmt(c.team.score)}점` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <section className="px-4 pt-3">
      <div className="relative w-full rounded-2xl border border-[#ffd27a] bg-[#fff6e3] dark:bg-[#2a2415] dark:border-[#5a4a1e] pl-4 pr-10 py-3.5 flex items-center gap-3">
        <button type="button" onClick={go} onMouseEnter={pre} onTouchStart={pre} className="absolute inset-0 rounded-2xl" aria-label="만나 내리기로 가기" />
        <span className="shrink-0 w-11 h-11 rounded-2xl bg-white/80 dark:bg-white/[0.08] flex items-center justify-center text-[#c27800] dark:text-[#ffc94d]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
            <path d="M7 6H4.5a1 1 0 0 0-1 1 4 4 0 0 0 3.5 4M17 6h2.5a1 1 0 0 1 1 1 4 4 0 0 1-3.5 4" />
          </svg>
        </span>
        <div className="min-w-0 flex-1 pointer-events-none">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10.5px] font-bold tracking-[0.1em] text-[#c27800] dark:text-[#ffc94d] uppercase">WEEKLY CHAMPION</span>
            <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-white/[0.1] text-[#c27800] dark:text-[#ffc94d]">
              {c.week_start.slice(5).replace('-', '.')}~{c.week_end.slice(5).replace('-', '.')}
            </span>
          </div>
          <p className="text-[14.5px] font-bold text-ink-strong truncate">{title}</p>
          <p className="text-[12px] text-ink-muted mt-0.5 truncate">{sub || '만나 내리기 · 이번 주도 가나안까지'}</p>
        </div>
        <button
          type="button"
          className="absolute right-2.5 top-2.5 w-7 h-7 rounded-full flex items-center justify-center text-ink-muted hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="이번 주는 그만 보기"
          onClick={() => {
            safeStorage.set(DISMISS_KEY, c.week_start)
            setDismissed(c.week_start)
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </section>
  )
}

export default MannaHomeBanner
