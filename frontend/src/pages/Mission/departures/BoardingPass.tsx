import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { prefersReducedMotion } from '../../../utils/prefersReducedMotion'
import { countryPrayerLine, regionMeta } from '../missionData'
import { dayPhase, distanceFromSeoulKm, formatOffset, localHM, localHour, offsetFromSeoul, type DayPhase } from './missionTime'
import { playPunchClack, playScanBeep } from './ticketSounds'
import { playSpacebarSound, preloadSpacebarSound } from '../../Bible/Typing/typingSound'
import type { PrayerRoute } from './routes'

// 기도 탑승권 — "기도 탑승"을 누르면 실제 탑승구처럼 검표한다.
//   ① 바코드에 빨간 스캔 빛 → ② 삑, 초록 ✓ → ③ 금속 펀치가 내려와 꾹 → ④ 찰칵, 꼬리표에 동그란 구멍
//   ⑤ 뚫린 종잇조각이 떨어진다 → 끝나면 onBoarded (안내판 '기도 완료'·지도 비행이 이어진다)
// 구멍·절취선 홈은 좌석 예약 티켓(Seats/seat-ticket.css)과 같은 문법 — 색을 칠하지 않고 mask 로 진짜로 뚫는다.
// layout: side = 꼬리표가 오른쪽(모바일) / bottom = 꼬리표가 아래(PC 좁은 칼럼 아래 가로형)
// 2026-11-18 입체 개편: 하늘색 머리띠 + 지도와 같은 휜 노선 + 정보 칸 + 눌리는 탑승 단추.
// 구멍·홈·펀치·스캔 동작은 그대로다.

/** 위를 보는 여객기(24×24) — CSS 로 90° 돌려 진행 방향(→)을 보게 한다. ✈ 글리프는 OS 마다 이모지로 바뀐다 */
const PLANE_PATH =
  'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z'

const PHASE_KO: Record<DayPhase, string> = { morning: '아침', midday: '한낮', evening: '저녁', night: '밤' }
const PHASE_EN: Record<DayPhase, string> = { morning: 'Morning there', midday: 'Midday there', evening: 'Evening there', night: 'Night there' }

/** 현지 때 표시 — 아침·한낮 해, 저녁 지는 해, 밤 초승달 (이모지는 OS 마다 달라 SVG 로) */
function PhaseIcon({ phase }: { phase: DayPhase }) {
  return (
    <svg className={`bp-phase bp-phase--${phase}`} viewBox="0 0 16 16" aria-hidden="true">
      {phase === 'night' ? (
        <path d="M10.6 2.2A6 6 0 1 0 13.8 11a5 5 0 0 1-3.2-8.8z" />
      ) : phase === 'evening' ? (
        <>
          <path d="M3 11a5 5 0 0 1 10 0z" />
          <rect x="1.5" y="12.4" width="13" height="1.6" rx="0.8" />
        </>
      ) : (
        <circle cx="8" cy="8" r="4.6" />
      )}
    </svg>
  )
}

type Stage = 'idle' | 'scanning' | 'scanned' | 'punched'

/** el 의 ancestor 기준 좌표 — PC 글씨 zoom 안에서도 맞도록 offset 으로 잰다 */
const offsetWithin = (el: HTMLElement, ancestor: HTMLElement) => {
  let x = 0
  let y = 0
  let n: HTMLElement | null = el
  while (n && n !== ancestor) {
    x += n.offsetLeft
    y += n.offsetTop
    n = n.offsetParent as HTMLElement | null
  }
  return { x, y }
}

export function BoardingPass({
  route,
  nowMs,
  boarded,
  layout,
  onBoarded,
}: {
  route: PrayerRoute
  nowMs: number
  boarded: boolean
  layout: 'side' | 'bottom'
  onBoarded: (key: string) => void
}) {
  const { t, language } = useLanguage()
  const ko = language === 'ko'
  const [stage, setStage] = useState<Stage>('idle')
  const punched = boarded || stage === 'punched'
  const wrapRef = useRef<HTMLDivElement>(null)
  const ticketRef = useRef<HTMLDivElement>(null)
  const stubRef = useRef<HTMLDivElement>(null)
  const spotRef = useRef<HTMLSpanElement>(null)
  const toolRef = useRef<HTMLSpanElement>(null)
  const chadRef = useRef<HTMLSpanElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const pending = useRef(false)
  const onBoardedRef = useRef(onBoarded)
  useEffect(() => {
    onBoardedRef.current = onBoarded
  }, [onBoarded])

  // 검표 도중 다른 노선으로 바뀌어 사라져도 기록은 남긴다
  useEffect(() => {
    const key = route.key
    const list = timers.current
    return () => {
      list.forEach(clearTimeout)
      if (pending.current) onBoardedRef.current(key)
    }
  }, [route.key])

  // 절취선 홈·구멍 자리 재기 — 크기가 바뀔 때마다
  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const ticket = ticketRef.current
    const stub = stubRef.current
    const spot = spotRef.current
    if (!wrap || !ticket || !stub || !spot) return
    const place = () => {
      const s = offsetWithin(stub, ticket)
      const h = offsetWithin(spot, ticket)
      const hx = h.x + spot.offsetWidth / 2
      const hy = h.y + spot.offsetHeight / 2
      ticket.style.setProperty('--perf', `${layout === 'side' ? s.x : s.y}px`)
      ticket.style.setProperty('--hx', `${hx}px`)
      ticket.style.setProperty('--hy', `${hy}px`)
      const tk = offsetWithin(ticket, wrap)
      for (const el of [toolRef.current, chadRef.current]) {
        if (!el) continue
        el.style.left = `${tk.x + hx}px`
        el.style.top = `${tk.y + hy}px`
      }
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(ticket)
    ro.observe(stub)
    return () => ro.disconnect()
  }, [layout, punched])

  const board = () => {
    if (boarded || stage !== 'idle') return
    pending.current = true
    const done = () => {
      pending.current = false
      onBoardedRef.current(route.key)
    }
    if (prefersReducedMotion()) {
      playScanBeep()
      setStage('punched')
      done()
      return
    }
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms))
    preloadSpacebarSound() // 검표(1.3초 뒤)까지 녹음을 받아 둔다
    setStage('scanning')
    at(620, () => {
      playScanBeep()
      setStage('scanned')
    })
    at(1000, () => {
      const tool = toolRef.current
      if (!tool) return
      tool.classList.remove('is-go')
      void tool.offsetWidth // 애니메이션 처음부터 다시
      tool.classList.add('is-go')
    })
    at(1290, () => {
      // 키보드 스페이스바 소리 — 녹음을 아직 못 받았으면 합성 찰칵으로
      if (!playSpacebarSound()) playPunchClack()
      setStage('punched')
      const chad = chadRef.current
      if (chad) {
        chad.classList.remove('is-falling')
        void chad.offsetWidth
        chad.classList.add('is-falling')
      }
      try {
        navigator.vibrate?.([12, 40, 12])
      } catch {
        /* 진동 미지원 */
      }
    })
    at(1800, done)
  }

  const { detail, missionary } = route
  const meta = regionMeta[route.region]
  const km = Math.round(distanceFromSeoulKm(detail) / 100) * 100
  const city = ko ? detail.city : detail.cityEn
  const phase = dayPhase(localHour(detail.tz, nowMs))
  const offset = offsetFromSeoul(detail.tz, nowMs)
  const gap = Math.abs(offset)
  const offsetLine =
    offset === 0
      ? ko ? '서울과 같은 시간' : 'Same as Seoul'
      : ko ? `서울보다 ${gap}시간 ${offset < 0 ? '늦어요' : '빨라요'}` : `${gap}h ${offset < 0 ? 'behind' : 'ahead of'} Seoul`
  // 여객기 순항 약 800km/h — 감으로 읽는 숫자라 시간 단위로 반올림
  const flightH = Math.max(1, Math.round(km / 800))
  const btnLabel =
    punched ? t('missionPassBoarded') : stage === 'scanning' ? t('missionPassChecking') : stage === 'scanned' ? t('missionPassVerified') : t('missionPassBoard')

  return (
    <div className={`bp-wrap bp--${layout}`} ref={wrapRef}>
      <div
        ref={ticketRef}
        className={`bp${stage === 'scanning' ? ' is-scanning' : ''}${stage === 'scanned' ? ' is-scanned' : ''}${punched ? ' is-punched' : ''}`}
      >
        <div className="bp-head">
          <span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={PLANE_PATH} />
            </svg>
            PRAYER BOARDING PASS
          </span>
          <b>{route.flight}</b>
        </div>
        <div className="bp-main">
          <div className="bp-route">
            <b>
              CBC<small>{t('missionPassFrom')}</small>
            </b>
            <span className="bp-arc" aria-hidden="true">
              <svg className="bp-arc__line" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M3 26 Q50 -14 97 26" />
              </svg>
              <svg className="bp-arc__plane" viewBox="0 0 24 24">
                <path d={PLANE_PATH} />
              </svg>
            </span>
            <b className="bp-to">
              {detail.code}
              <small>
                {route.country} {city}
              </small>
            </b>
          </div>
          <dl className="bp-meta">
            <div>
              <dt>{t('missionPassMissionary')}</dt>
              <dd>
                <span className="bp-val">
                  {missionary.name}
                  {missionary.note && <span className="bp-note">{missionary.note}</span>}
                </span>
                <span className="bp-sub">{ko ? `${route.country} 선교` : `Serving in ${route.country}`}</span>
              </dd>
            </div>
            <div>
              <dt>{t('missionPassLocalTime')}</dt>
              <dd>
                <span className="bp-val bp-num">
                  <PhaseIcon phase={phase} />
                  {localHM(detail.tz, nowMs)}
                </span>
                <span className="bp-sub">{ko ? `현지는 ${PHASE_KO[phase]}` : PHASE_EN[phase]}</span>
              </dd>
            </div>
            <div>
              <dt>{t('missionPassTimeDiff')}</dt>
              <dd>
                <span className="bp-val bp-num">{formatOffset(offset).replace('-', '−')}</span>
                <span className="bp-sub">{offsetLine}</span>
              </dd>
            </div>
            <div>
              <dt>{t('missionPassGate')}</dt>
              <dd>
                <span className="bp-val">
                  <span className="bp-gate-dot" style={{ background: meta.color }} />
                  {ko ? meta.label : meta.labelEn}
                </span>
                <span className="bp-sub">{ko ? `노선 ${route.flight}` : `Route ${route.flight}`}</span>
              </dd>
            </div>
            <div>
              <dt>{t('missionPassDistance')}</dt>
              <dd>
                <span className="bp-val bp-num">
                  {km.toLocaleString()}
                  <small>km</small>
                </span>
                <span className="bp-sub">{ko ? `비행 약 ${flightH}시간` : `About ${flightH}h by air`}</span>
              </dd>
            </div>
            <div>
              <dt>{t('missionPassSeat')}</dt>
              <dd>
                <span className="bp-val">{t('missionPassSeatValue')}</span>
                <span className="bp-sub">{ko ? '언제든 앉을 수 있어요' : 'Always open'}</span>
              </dd>
            </div>
          </dl>
          <p className="bp-req">{countryPrayerLine(route.country, ko ? 'ko' : 'en')}</p>
        </div>

        <div className="bp-stub" ref={stubRef}>
          <span className="bp-check">
            <span className="bp-spot" ref={spotRef} aria-hidden="true" />
            <span className="bp-stub-label">{punched ? t('missionPassChecked') : t('missionPassCheck')}</span>
          </span>
          <span className="bp-plate" aria-hidden="true">
            <span className="bp-bar">
              <span className="bp-scan" />
              <span className="bp-ok">✓</span>
            </span>
            <span className="bp-plate__code">{route.flight}</span>
          </span>
          {punched ? (
            <span className="bp-stamp" role="status">
              <b>{t('missionPassStamp')}</b>
              <small>BOARDED · {route.flight}</small>
            </span>
          ) : (
            <button type="button" className="bp-go" onClick={board} disabled={stage !== 'idle'} aria-live="polite">
              <span className="bp-go__text">{btnLabel}</span>
              {stage === 'idle' && (
                <span className="bp-go__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d={PLANE_PATH} />
                  </svg>
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      <span className="bp-punch" ref={toolRef} aria-hidden="true">
        <i />
      </span>
      <span className="bp-chad" ref={chadRef} aria-hidden="true" />
    </div>
  )
}
