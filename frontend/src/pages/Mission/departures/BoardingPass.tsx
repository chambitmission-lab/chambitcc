import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { prefersReducedMotion } from '../../../utils/prefersReducedMotion'
import { countryPrayerLine, regionMeta } from '../missionData'
import { distanceFromSeoulKm, formatOffset, localHM, offsetFromSeoul } from './missionTime'
import { playPunchClack, playScanBeep } from './ticketSounds'
import type { PrayerRoute } from './routes'

// 기도 탑승권 — "기도 탑승"을 누르면 실제 탑승구처럼 검표한다.
//   ① 바코드에 빨간 스캔 빛 → ② 삑, 초록 ✓ → ③ 금속 펀치가 내려와 꾹 → ④ 찰칵, 꼬리표에 동그란 구멍
//   ⑤ 뚫린 종잇조각이 떨어진다 → 끝나면 onBoarded (안내판 '기도 완료'·지도 비행이 이어진다)
// 구멍·절취선 홈은 좌석 예약 티켓(Seats/seat-ticket.css)과 같은 문법 — 색을 칠하지 않고 mask 로 진짜로 뚫는다.
// layout: side = 꼬리표가 오른쪽(모바일) / bottom = 꼬리표가 아래(PC 좁은 칼럼 아래 가로형)

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
    return () => ro.disconnect()
  }, [layout])

  const punched = boarded || stage === 'punched'

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
      playPunchClack()
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
  const btnLabel =
    punched ? t('missionPassBoarded') : stage === 'scanning' ? t('missionPassChecking') : stage === 'scanned' ? t('missionPassVerified') : t('missionPassBoard')

  return (
    <div className={`bp-wrap bp--${layout}`} ref={wrapRef}>
      <div
        ref={ticketRef}
        className={`bp${stage === 'scanning' ? ' is-scanning' : ''}${stage === 'scanned' ? ' is-scanned' : ''}${punched ? ' is-punched' : ''}`}
      >
        <div className="bp-main">
          <div className="bp-label">PRAYER BOARDING PASS · {route.flight}</div>
          <div className="bp-route">
            <b>
              SEL<small>{t('missionPassFrom')}</small>
            </b>
            <i aria-hidden="true" />
            <b className="bp-to">
              {detail.code}
              <small>
                {route.country} {city}
              </small>
            </b>
          </div>
          <dl className="bp-meta">
            <div>
              <dt className="bp-label">{t('missionPassMissionary')}</dt>
              <dd>
                {missionary.name}
                {missionary.note && <span className="bp-note">{missionary.note}</span>}
              </dd>
            </div>
            <div>
              <dt className="bp-label">{t('missionPassLocalTime')}</dt>
              <dd className="bp-num">{localHM(detail.tz, nowMs)}</dd>
            </div>
            <div>
              <dt className="bp-label">{t('missionPassTimeDiff')}</dt>
              <dd className="bp-num">{formatOffset(offsetFromSeoul(detail.tz, nowMs))}</dd>
            </div>
            <div>
              <dt className="bp-label">{t('missionPassGate')}</dt>
              <dd>
                <span className="bp-gate-dot" style={{ background: meta.color }} />
                {ko ? meta.label : meta.labelEn}
              </dd>
            </div>
            <div>
              <dt className="bp-label">{t('missionPassDistance')}</dt>
              <dd className="bp-num">{km.toLocaleString()}km</dd>
            </div>
            <div>
              <dt className="bp-label">{t('missionPassSeat')}</dt>
              <dd>{t('missionPassSeatValue')}</dd>
            </div>
          </dl>
          <p className="bp-req">{countryPrayerLine(route.country, ko ? 'ko' : 'en')}</p>
        </div>

        <div className="bp-stub" ref={stubRef}>
          <span className="bp-label bp-stub-label">{punched ? t('missionPassChecked') : t('missionPassCheck')}</span>
          <span className="bp-spot" ref={spotRef} aria-hidden="true" />
          <span className="bp-bar" aria-hidden="true">
            <span className="bp-scan" />
            <span className="bp-ok">✓</span>
          </span>
          <button type="button" className={`bp-go${punched ? ' is-done' : ''}`} onClick={board} disabled={punched} aria-live="polite">
            {btnLabel}
          </button>
        </div>
      </div>
      <span className="bp-punch" ref={toolRef} aria-hidden="true">
        <i />
      </span>
      <span className="bp-chad" ref={chadRef} aria-hidden="true" />
    </div>
  )
}
