import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { HandHeartIcon } from '../../components/icons/ActionIcons'
import type { WeeklyPrayer, WeeklyPrayerItem, WeeklyPrayerListItem } from '../../types/weeklyPrayer'
import sunriseImg from '../../assets/hero/autumn-evening.webp'
import forestImg from '../../assets/hero/autumn-morning.webp'
import mountainImg from '../../assets/hero/winter-morning.webp'
import blossomImg from '../../assets/hero/spring-morning.webp'
import lanternArt from '../../assets/growth/hero-evening-dark.webp'
import lanternArtLight from '../../assets/growth/hero-evening-light.webp'
import { useTheme } from '../../contexts/ThemeContext'
import churchNight from '../../assets/landing/church-night.webp'
import './prayerTopicsPreview.css'

/**
 * /#/dev/prayer-topics — 공동 기도제목(/prayer-topics) 개편 시안 비교. ?v=b|d|e|f|g
 * 공통: 한 화면에 한 기도(B 방향) + 다 읽고 길게 눌러 아멘.
 * B 기본 집중 / D 새벽을 깨우는 기도 / E 등불 길 / F 별이 된 기도 / G 올려드리는 카드
 */

const SAMPLE: WeeklyPrayer = {
  id: 41,
  week_date: '2026-10-11',
  title: '기도제목',
  is_published: true,
  prayed_user_count: 2,
  items: [
    {
      id: 1,
      title: '',
      body: '주님의 긍휼을 품게 하소서. 사람을 겉모습으로 판단하지 않고, 한 영혼의 아픔을 헤아리며, 주님의 애끓는 사랑으로 바라보게 하소서.',
      scripture: '마태복음 9:36',
      amen_count: 4,
      is_amened: false,
    },
    {
      id: 2,
      title: '',
      body: '마음에 품은 그 한 사람에게 다가가게 하소서. 그래서 시간을 내어 찾아가고 이야기를 들으며, 예수님의 사랑을 전하고 새생명전도축제에 초대하게 하소서.',
      scripture: null,
      amen_count: 3,
      is_amened: false,
    },
    {
      id: 3,
      title: '',
      body: '우리를 복음의 일꾼으로 사용하소서. 복음을 전할 때 맞닥뜨리게 되는 두려움보다 함께하시는 주님을 의지하게 하시고, 성령께서 초대받는 이들의 마음을 열어 예수님을 믿게 하소서.',
      scripture: '사도행전 1:8',
      amen_count: 5,
      is_amened: false,
    },
  ],
}

const ARCHIVE: WeeklyPrayerListItem[] = [
  '2026-10-11', '2026-10-04', '2026-09-27', '2026-09-20', '2026-09-13', '2026-09-06',
  '2026-08-23', '2026-08-16', '2026-08-09', '2026-08-02',
].map((d, i) => ({ id: 41 - i, week_date: d, title: '기도제목', is_published: true, item_count: d === '2026-08-09' ? 2 : 3 }))

const ORDINAL = ['첫 번째', '두 번째', '세 번째', '네 번째', '다섯 번째']
const parts = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}
const weekLabel = (iso: string) => {
  const { y, m, d } = parts(iso)
  return `${y}년 ${m}월 ${d}일 주일`
}

// 시드 고정 난수 — 별·빛 알갱이 위치가 렌더마다 흔들리지 않게
const seeded = (seed: number) => () => {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

// ─── 공용 상태 ──────────────────────────────────────────────────────
const HOLD_MS = 1300

const usePrayerFlow = (advanceDelay = 900) => {
  const [prayer, setPrayer] = useState(SAMPLE)
  const [idx, setIdx] = useState(0)
  const [holding, setHolding] = useState(false)
  const [justAmened, setJustAmened] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => {
    timers.current.forEach(window.clearTimeout)
    window.clearTimeout(holdTimer.current)
  }, [])

  const n = prayer.items.length
  const item: WeeklyPrayerItem | undefined = prayer.items[idx]
  const mine = prayer.items.filter((i) => i.is_amened).length
  const total = prayer.items.reduce((s, i) => s + (i.amen_count ?? 0), 0)

  const amen = (id?: number) =>
    setPrayer((p) => ({
      ...p,
      items: p.items.map((it) => (it.id === id && !it.is_amened ? { ...it, is_amened: true, amen_count: (it.amen_count ?? 0) + 1 } : it)),
    }))

  // 누르는 동안의 타이머만 손 뗄 때 취소한다 — 아멘 뒤 '다음으로' 타이머까지 지우면 손 떼는 순간 멈춘다
  const holdTimer = useRef<number | undefined>(undefined)
  const start = () => {
    if (!item || item.is_amened) return
    setHolding(true)
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = undefined
      setHolding(false)
      amen(item.id)
      setJustAmened(idx)
      navigator.vibrate?.(30)
      timers.current.push(window.setTimeout(() => setIdx((v) => v + 1), advanceDelay))
    }, HOLD_MS)
  }
  const cancel = () => {
    window.clearTimeout(holdTimer.current)
    holdTimer.current = undefined
    setHolding(false)
  }
  const reset = () => {
    cancel()
    timers.current.forEach(window.clearTimeout)
    timers.current = []
    setPrayer(SAMPLE)
    setIdx(0)
    setJustAmened(null)
  }
  return { prayer, idx, setIdx, item, n, mine, total, holding, justAmened, start, cancel, reset, done: idx >= n }
}
type Flow = ReturnType<typeof usePrayerFlow>

const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="5 12.5 10 17.5 19 7" />
  </svg>
)

/** 길게 눌러 아멘 — 둘레 링이 HOLD_MS 동안 차오른다 */
const HoldButton = ({ flow, tone, label }: { flow: Flow; tone: 'brand' | 'glass' | 'ember' | 'dawn'; label?: ReactNode }) => {
  const on = flow.item?.is_amened ?? false
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onPointerDown={flow.start}
        onPointerUp={flow.cancel}
        onPointerLeave={flow.cancel}
        onContextMenu={(e) => e.preventDefault()}
        className={`pt-hold pt-hold--${tone} ${flow.holding ? 'is-holding' : ''} ${on ? 'is-on' : ''}`}
        style={{ ['--hold' as string]: `${HOLD_MS}ms` } as CSSProperties}
        aria-label="길게 눌러 아멘"
      >
        <svg className="pt-hold-ring" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="46" />
          <circle cx="50" cy="50" r="46" className="pt-hold-fill" />
        </svg>
        {on ? <CheckIcon size={28} /> : <HandHeartIcon size={30} strokeWidth={1.7} />}
      </button>
      <p className="pt-hold-hint">{on ? '아멘' : flow.holding ? '마음을 모아…' : (label ?? '다 읽었으면 길게 눌러 아멘')}</p>
    </div>
  )
}

/** 우측 레일(PC) / 아래(모바일) — 이번 주 순서 + 지난 기도제목 */
const SideRail = ({ flow }: { flow: Flow }) => (
  <aside className="mt-8 space-y-4 lg:mt-0 lg:sticky lg:top-[4.5rem]">
    <div className="pt-card p-4">
      <p className="px-1 pb-2 text-[15px] font-bold text-ink-strong lg:text-[16px]">이번 주 기도 순서</p>
      {flow.prayer.items.map((p, i) => (
        <button key={p.id} onClick={() => flow.setIdx(i)} className={`pt-row ${i === flow.idx ? 'is-cur' : ''}`}>
          <span className={`pt-row-mark ${p.is_amened ? 'is-on' : ''}`}>{p.is_amened ? <CheckIcon size={12} /> : i + 1}</span>
          <span className="line-clamp-2 text-left text-[13.5px] leading-[1.55] lg:text-[15px]">{p.body}</span>
        </button>
      ))}
    </div>
    <div className="pt-card p-4">
      <p className="px-1 pb-2 text-[15px] font-bold text-ink-strong lg:text-[16px]">지난 기도제목</p>
      <div className="max-h-[260px] overflow-y-auto">
        {ARCHIVE.map((a) => (
          <button
            key={a.id}
            className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] lg:text-[15.5px] ${
              a.id === flow.prayer.id ? 'bg-[var(--brand-soft)] text-brand font-bold' : 'text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.05]'
            }`}
          >
            {weekLabel(a.week_date)}
            <span className="text-[12px] text-gray-400">{a.item_count}개</span>
          </button>
        ))}
      </div>
    </div>
  </aside>
)

const Shell = ({ flow, children }: { flow: Flow; children: ReactNode }) => (
  <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:items-start">
    <div>{children}</div>
    <SideRail flow={flow} />
  </div>
)

/** 이전/다음 — 몰입 화면 아래쪽 */
const StepNav = ({ flow, light }: { flow: Flow; light?: boolean }) => (
  <div className="flex justify-between">
    <button disabled={flow.idx === 0} onClick={() => flow.setIdx((v) => v - 1)} className={`pt-nav ${light ? 'pt-nav--light' : ''}`}>← 이전</button>
    <button onClick={() => flow.setIdx((v) => v + 1)} className={`pt-nav ${light ? 'pt-nav--light' : ''}`}>{flow.idx === flow.n - 1 ? '마치기' : '다음'} →</button>
  </div>
)

/** 한 번 터지는 빛 알갱이 — 아멘 순간 */
const Burst = ({ k, color }: { k: number; color: string }) => {
  const motes = useMemo(() => {
    const r = seeded(k * 31 + 7)
    return Array.from({ length: 14 }, () => ({ dx: (r() - 0.5) * 160, dy: -80 - r() * 160, s: 3 + r() * 4, d: r() * 0.25 }))
  }, [k])
  return (
    <span className="pt-burst" aria-hidden>
      {motes.map((m, i) => (
        <i
          key={i}
          style={{ ['--dx' as string]: `${m.dx}px`, ['--dy' as string]: `${m.dy}px`, width: m.s, height: m.s, animationDelay: `${m.d}s`, background: color } as CSSProperties}
        />
      ))}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────
// B. 기본 집중 (이전 시안)
// ─────────────────────────────────────────────────────────────────────
const VariantB = () => {
  const flow = usePrayerFlow(650)
  const { prayer, idx, item, n, mine, total, done } = flow
  return (
    <Shell flow={flow}>
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[13px] font-bold text-brand lg:text-[16px]">{weekLabel(prayer.week_date)}</p>
          <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-ink-strong lg:text-[30px]">함께 드리는 기도</h2>
        </div>
        <p className="text-[13px] font-bold text-gray-500 dark:text-white/55 tabular-nums lg:text-[16px]">{Math.min(idx + 1, n)} / {n}</p>
      </div>
      <div className="mt-4 flex gap-1.5">
        {prayer.items.map((p, i) => (
          <span key={p.id} className="ptb-seg"><span style={{ width: p.is_amened || (i === idx && flow.holding) ? '100%' : '0%' }} className={i === idx && flow.holding ? 'is-holding' : ''} /></span>
        ))}
      </div>
      {!done && item ? (
        <section key={idx} className="ptb-stage mt-5">
          <span className="ptb-num">{String(idx + 1).padStart(2, '0')}</span>
          <p className="relative text-[18px] font-semibold leading-[1.75] tracking-[-0.02em] text-ink-strong break-keep lg:text-[24px]">{item.body}</p>
          {item.scripture && <p className="relative mt-4 text-[13px] font-bold text-brand lg:text-[16px]">{item.scripture}</p>}
          <div className="relative mt-8 lg:mt-10"><HoldButton flow={flow} tone="brand" /></div>
          <div className="relative mt-6"><StepNav flow={flow} /></div>
        </section>
      ) : (
        <section className="ptb-stage mt-5 text-center !py-12">
          <HandHeartIcon size={40} strokeWidth={1.6} filled className="mx-auto text-brand" />
          <p className="mt-4 text-[22px] font-extrabold text-ink-strong lg:text-[28px]">{mine === n ? '아멘, 모두 함께 기도했어요' : `${n}개 중 ${mine}개를 기도했어요`}</p>
          <p className="mt-2 text-[14px] text-gray-500 dark:text-white/60 lg:text-[17px]">이번 주 {total}번의 기도가 함께 올라갔어요</p>
          <button onClick={flow.reset} className="mt-6 pt-nav">처음부터 다시</button>
        </section>
      )}
    </Shell>
  )
}

// ─────────────────────────────────────────────────────────────────────
// D. 새벽을 깨우는 기도 — 기도할수록 밤하늘이 걷히고 해가 떠오른다
// ─────────────────────────────────────────────────────────────────────
const VariantD = () => {
  const flow = usePrayerFlow()
  const { prayer, idx, item, n, mine, total, done } = flow
  const night = done && mine === n ? 0 : Math.max(0.12, 0.88 - (mine / n) * 0.76)
  const stars = useMemo(() => {
    const r = seeded(11)
    return Array.from({ length: 46 }, () => ({ x: r() * 100, y: r() * 55, s: r() < 0.15 ? 2.5 : 1.5, o: 0.4 + r() * 0.6 }))
  }, [])

  return (
    <Shell flow={flow}>
      <section className="ptd-stage" style={{ ['--night' as string]: night } as CSSProperties}>
        <div className="ptd-photo" style={{ backgroundImage: `url(${sunriseImg})` }} aria-hidden />
        <div className="ptd-night" aria-hidden />
        <div className="ptd-stars" aria-hidden>
          {stars.map((s, i) => <i key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o }} />)}
        </div>
        <div className="ptd-scrim" aria-hidden />

        <div className="relative z-[1] flex flex-col px-6 pt-6 pb-6 lg:px-12 lg:pt-10 lg:pb-8">
          <div className="flex items-center justify-between text-white/85">
            <p className="text-[12.5px] font-bold tracking-[0.08em] lg:text-[15px]">{weekLabel(prayer.week_date)}</p>
            <div className="flex gap-1.5">
              {prayer.items.map((p, i) => <span key={p.id} className={`ptd-pip ${p.is_amened ? 'is-on' : ''} ${i === idx ? 'is-cur' : ''}`} />)}
            </div>
          </div>

          {!done && item ? (
            <div key={idx} className="pt-fade mt-auto">
              <p className="text-[13px] font-bold text-white/70 lg:text-[16px]">새벽을 깨우는 {ORDINAL[idx]} 기도</p>
              <p className="mt-3 text-[20px] font-semibold leading-[1.7] tracking-[-0.02em] text-white break-keep ptd-text lg:text-[27px] lg:leading-[1.7]">{item.body}</p>
              {item.scripture && <p className="mt-3 text-[13px] font-semibold text-white/75 lg:text-[16px]">{item.scripture}</p>}
              <div className="relative mt-8 lg:mt-10">
                {flow.justAmened === idx && <Burst k={idx} color="#ffe2b0" />}
                <HoldButton flow={flow} tone="glass" label={`${item.amen_count}명이 이 기도로 새벽을 깨웠어요`} />
              </div>
              <div className="mt-6"><StepNav flow={flow} light /></div>
            </div>
          ) : (
            <div className="pt-fade mt-auto text-center">
              <p className="text-[13px] font-bold tracking-[0.12em] text-white/80 lg:text-[16px]">아멘</p>
              <p className="mt-3 text-[26px] font-extrabold leading-[1.4] text-white ptd-text lg:text-[36px]">
                {mine === n ? <>기도로 아침이<br />밝았어요</> : `${n}개 중 ${mine}개를 기도했어요`}
              </p>
              <p className="mt-3 text-[14px] text-white/85 lg:text-[18px]">이번 주 성도들과 {total}번의 기도를 함께 올렸어요</p>
              <button onClick={flow.reset} className="mt-7 pt-nav pt-nav--light">처음부터 다시</button>
            </div>
          )}
        </div>
      </section>
    </Shell>
  )
}

// ─────────────────────────────────────────────────────────────────────
// E. 등불 길 — 기도 하나에 등불 하나. 다크: 어둠이 물러남 / 라이트: 새벽 안개가 걷힘
//   라이트 두 갈래(?el=): mist 크림 종이 + 삽화 띠 / frame 삽화 전면 + 종이 패널
// ─────────────────────────────────────────────────────────────────────
type LightLook = 'mist' | 'frame'

const VariantE = () => {
  const flow = usePrayerFlow()
  const { theme } = useTheme()
  const [sp] = useSearchParams()
  const lightLook: LightLook = sp.get('el') === 'frame' ? 'frame' : 'mist'
  const look = theme === 'dark' ? 'dark' : lightLook
  const isDark = look === 'dark'
  const { prayer, idx, item, n, mine, total, done } = flow
  // 덮개 폭 — 0개: 양 곁 등불만, 다 마치면 길 끝까지
  const cover = 78 - (mine / n) * 78

  return (
    <Shell flow={flow}>
      <section className="pte-stage" data-look={look}>
        <div className="pte-art">
          <div className="pte-art-img" style={{ backgroundImage: `url(${isDark ? lanternArt : lanternArtLight})` }} aria-hidden />
          <div className="pte-dark" style={{ width: `${cover}%` }} aria-hidden />
          <div className="absolute left-5 top-4 lg:left-8 lg:top-6">
            <p className="pte-kicker">{weekLabel(prayer.week_date)}</p>
            <p className="pte-title">기도 하나에 등불 하나</p>
          </div>
        </div>

        <div className="pte-panel">
          <div className="flex items-center gap-2.5">
            {prayer.items.map((p, i) => (
              <span key={p.id} className={`pte-lamp ${p.is_amened ? 'is-on' : ''} ${i === idx ? 'is-cur' : ''}`}>{i + 1}</span>
            ))}
            <span className="pte-meta ml-1">{mine}개의 등불이 켜졌어요</span>
          </div>

          {!done && item ? (
            <div key={idx} className="pt-fade mt-6">
              <p className="pte-body">{item.body}</p>
              {item.scripture && <p className="pte-scripture">{item.scripture}</p>}
              <div className="relative mt-8">
                {flow.justAmened === idx && <Burst k={idx + 3} color={isDark ? '#ffc773' : '#f6b54d'} />}
                <HoldButton flow={flow} tone={isDark ? 'ember' : 'dawn'} label={`길게 눌러 등불 켜기 · ${item.amen_count}명이 밝혔어요`} />
              </div>
              <div className="mt-6"><StepNav flow={flow} light={isDark} /></div>
            </div>
          ) : (
            <div className="pt-fade mt-8 text-center">
              <p className="pte-end-title">{mine === n ? '길 끝까지 등불이 켜졌어요' : `${mine}개의 등불을 밝혔어요`}</p>
              <p className="pte-end-sub mt-2">“주의 말씀은 내 발에 등이요 내 길에 빛이니이다” · 시 119:105</p>
              <p className="pte-meta mt-4">이번 주 성도들이 밝힌 등불 {total}개</p>
              <button onClick={flow.reset} className={`mt-6 pt-nav ${isDark ? 'pt-nav--light' : ''}`}>처음부터 다시</button>
            </div>
          )}
        </div>
      </section>
    </Shell>
  )
}

// ─────────────────────────────────────────────────────────────────────
// F. 별이 된 기도 — 교회 위 밤하늘, 함께 기도한 사람만큼 별이 뜨고 내 별이 이어진다
// ─────────────────────────────────────────────────────────────────────
const VariantF = () => {
  const flow = usePrayerFlow(1500)
  const { prayer, idx, item, n, mine, total, done } = flow

  // 기도마다 다른 별자리 — 마지막 점이 '내 별'
  const stars = useMemo(() => {
    if (!item) return []
    const r = seeded(idx * 97 + 5)
    const count = (item.amen_count ?? 0) - (item.is_amened ? 1 : 0)
    return Array.from({ length: count + 1 }, (_, i) => ({
      x: 12 + (i / count) * 76 + (r() - 0.5) * 8,
      y: 5 + r() * 19,
      mine: i === count,
    }))
  }, [idx, item])
  const poly = stars.map((s) => `${s.x},${s.y}`).join(' ')

  return (
    <Shell flow={flow}>
      <section className="ptf-stage">
        <div className="ptf-church" style={{ backgroundImage: `url(${churchNight})` }} aria-hidden />
        <div className="ptf-dust" aria-hidden />

        {!done && item && (
          <svg key={`sky-${idx}`} className="ptf-sky" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden>
            {item.is_amened && <polyline points={poly} className="ptf-line" vectorEffect="non-scaling-stroke" />}
          </svg>
        )}
        {!done && item && stars.map((s, i) =>
          s.mine && !item.is_amened ? null : (
            <span
              key={`${idx}-${i}`}
              className={`ptf-star ${s.mine ? 'is-mine' : ''}`}
              style={{ left: `${s.x}%`, top: `${(s.y / 60) * 100}%`, animationDelay: s.mine ? '0.9s' : `${i * 0.12}s` }}
            >
              {s.mine && <em>나</em>}
            </span>
          ),
        )}
        {flow.justAmened === idx && item?.is_amened && (() => {
          const me = stars[stars.length - 1]
          return <span className="ptf-rise" style={{ ['--tx' as string]: `${me.x}%`, ['--ty' as string]: `${(me.y / 60) * 100}%` } as CSSProperties} aria-hidden />
        })()}

        <div className="relative z-[2] flex flex-col px-6 pt-6 pb-6 lg:px-12 lg:pt-8 lg:pb-8">
          <div className="flex items-center justify-between">
            <p className="text-[12.5px] font-bold tracking-[0.08em] text-white/70 lg:text-[15px]">{weekLabel(prayer.week_date)}</p>
            <p className="text-[12.5px] font-bold text-white/70 tabular-nums lg:text-[15px]">{Math.min(idx + 1, n)} / {n}</p>
          </div>

          {!done && item ? (
            <div key={idx} className="pt-fade mt-auto">
              <p className="text-[12.5px] font-semibold text-[#bcd4ff] lg:text-[15px]">
                이 기도 위에 별 {item.amen_count}개 — 성도들의 기도가 모였어요
              </p>
              <p className="mt-3 text-[19px] font-semibold leading-[1.75] text-white break-keep ptd-text lg:text-[25px]">{item.body}</p>
              {item.scripture && <p className="mt-3 text-[13px] font-semibold text-white/70 lg:text-[16px]">{item.scripture}</p>}
              <div className="mt-8"><HoldButton flow={flow} tone="glass" label="길게 눌러 내 별 띄우기" /></div>
              <div className="mt-6"><StepNav flow={flow} light /></div>
            </div>
          ) : (
            <div className="pt-fade my-auto text-center">
              <p className="text-[26px] font-extrabold leading-[1.4] text-white ptd-text lg:text-[34px]">
                {mine === n ? <>오늘 밤 교회 위에<br />내 별 {mine}개가 떴어요</> : `${mine}개의 별을 띄웠어요`}
              </p>
              <p className="mt-3 text-[14px] text-white/80 lg:text-[17px]">이번 주 성도들의 별 {total}개가 함께 빛나고 있어요</p>
              <button onClick={flow.reset} className="mt-7 pt-nav pt-nav--light">처음부터 다시</button>
            </div>
          )}
        </div>
      </section>
    </Shell>
  )
}

// ─────────────────────────────────────────────────────────────────────
// G. 올려드리는 카드 — 사진 카드 한 장씩, 아멘하면 하늘로 날아오른다
// ─────────────────────────────────────────────────────────────────────
const CARD_ART = [forestImg, mountainImg, blossomImg]

const VariantG = () => {
  const flow = usePrayerFlow(950)
  const { prayer, idx, n, mine, total, done } = flow

  return (
    <Shell flow={flow}>
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[13px] font-bold text-brand lg:text-[16px]">{weekLabel(prayer.week_date)}</p>
          <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-ink-strong lg:text-[30px]">한 장씩, 하나님께 올려드려요</h2>
        </div>
      </div>

      <div className="ptg-deck mt-6">
        {done ? (
          <div className="ptg-done pt-fade">
            <div className="ptg-done-thumbs">
              {prayer.items.map((p, i) => (
                <span key={p.id} style={{ backgroundImage: `url(${CARD_ART[i % 3]})`, ['--r' as string]: `${(i - 1) * 8}deg` } as CSSProperties} className={p.is_amened ? '' : 'is-off'} />
              ))}
            </div>
            <p className="mt-6 text-[22px] font-extrabold text-ink-strong lg:text-[28px]">{mine === n ? `${n}장 모두 올려드렸어요` : `${mine}장을 올려드렸어요`}</p>
            <p className="mt-2 text-[14px] text-gray-500 dark:text-white/60 lg:text-[17px]">이번 주 성도들과 {total}번 함께 기도했어요</p>
            <button onClick={flow.reset} className="mt-6 pt-nav">처음부터 다시</button>
          </div>
        ) : (
          prayer.items.map((p, i) => {
            const depth = i - idx
            if (depth < -1 || depth > 2) return null
            const flying = depth === -1 || (depth === 0 && p.is_amened)
            return (
              <article
                key={p.id}
                className={`ptg-card ${flying ? 'is-flying' : ''}`}
                style={{ ['--k' as string]: Math.max(depth, 0), zIndex: 10 - depth } as CSSProperties}
                aria-hidden={depth !== 0}
              >
                <div className="ptg-photo" style={{ backgroundImage: `url(${CARD_ART[i % 3]})` }}>
                  <span className="ptg-badge">{ORDINAL[i]} 기도 · {i + 1}/{n}</span>
                </div>
                <div className="ptg-body">
                  <p className="text-[17px] font-semibold leading-[1.75] tracking-[-0.02em] text-ink-strong break-keep lg:text-[22px]">{p.body}</p>
                  {p.scripture && <p className="mt-2.5 text-[13px] font-bold text-brand lg:text-[15.5px]">{p.scripture}</p>}
                  {depth === 0 && (
                    <div className="mt-6 flex items-center justify-between gap-4">
                      <p className="text-[12.5px] text-gray-500 dark:text-white/55 lg:text-[15px]">
                        <b className="text-brand">{p.amen_count}명</b>이 올려드렸어요
                      </p>
                      <HoldButton flow={flow} tone="brand" label="길게 눌러 올려드리기" />
                    </div>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>
      {!done && <div className="mt-5"><StepNav flow={flow} /></div>}
    </Shell>
  )
}

// ─────────────────────────────────────────────────────────────────────
// 테마 짝 — 라이트는 G 올려드리는 카드, 다크는 E 등불 길
// ─────────────────────────────────────────────────────────────────────
const VariantThemed = () => {
  const { theme } = useTheme()
  return theme === 'dark' ? <VariantE /> : <VariantG />
}

// ─────────────────────────────────────────────────────────────────────
const VARIANTS = {
  t: { name: '★ 테마 짝 (라이트 G · 다크 E)', note: '라이트 테마면 G 올려드리는 카드, 다크 테마면 E 등불 길 — 오른쪽 ☀/☾ 버튼으로 바꿔 보세요', C: VariantThemed },
  d: { name: 'D 새벽을 깨우는 기도', note: '해돋이 사진 위에 밤하늘이 덮여 있고, 기도를 하나 드릴 때마다 밤이 걷히며 마지막에 해가 떠요 · 아멘 순간 빛 알갱이 — 새벽기도 정서', C: VariantD },
  e: { name: 'E 등불 길', note: '/growth 양·등불 삽화 — 처음엔 양 곁 등불만 보이고, 기도할 때마다 어둠이 물러나 길 끝까지 등불이 이어져요 · 따뜻한 호박빛 · 시 119:105로 마침', C: VariantE },
  f: { name: 'F 별이 된 기도', note: '실제 참빛교회 야경 위 밤하늘 — 함께 기도한 성도 수만큼 별, 내가 아멘하면 내 별이 솟아올라 별자리로 이어져요', C: VariantF },
  g: { name: 'G 올려드리는 카드', note: '풍경 사진 카드 덱 — 한 장씩 읽고 길게 누르면 카드가 하늘로 날아올라요 · 마침엔 올려드린 카드 부채꼴 — 참고: Glorify·Hallow 데일리 카드', C: VariantG },
  b: { name: 'B (이전 시안)', note: '비교용 — 이전 B안 그대로', C: VariantB },
} as const
type Key = keyof typeof VARIANTS

const PrayerTopicsPreview = () => {
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const v: Key = (sp.get('v') ?? '') in VARIANTS ? (sp.get('v') as Key) : 'd'
  const { C } = VARIANTS[v]
  const { theme, toggleTheme } = useTheme()
  const el = sp.get('el') === 'frame' ? 'frame' : 'mist'

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      <div className="sticky top-14 z-30 bg-[#111827] text-white px-4 py-2.5">
        <div className="max-w-[76rem] mx-auto flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-bold text-white/60 mr-1">시안</span>
          {(Object.keys(VARIANTS) as Key[]).map((k) => (
            <button
              key={k}
              onClick={() => setSp({ v: k }, { replace: true })}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${k === v ? 'bg-[#3182f6] text-white' : 'bg-white/10 text-white/75 hover:bg-white/20'}`}
            >
              {VARIANTS[k].name}
            </button>
          ))}
          <button onClick={toggleTheme} className="ml-auto rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] font-bold text-white/85 hover:bg-white/20">
            {theme === 'dark' ? '☀ 라이트로 보기' : '☾ 다크로 보기'}
          </button>
          {v === 'e' && (
            <div className="basis-full flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[12px] font-bold text-white/60 mr-1">라이트 테마</span>
              {([['mist', 'L1 새벽 안개 (크림 종이)'], ['frame', 'L2 안개 액자 (그림 전면)']] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setSp({ v: 'e', el: k }, { replace: true })}
                  className={`rounded-full px-3 py-1 text-[12px] font-bold ${el === k ? 'bg-[#f2b450] text-[#3a2508]' : 'bg-white/10 text-white/75 hover:bg-white/20'}`}
                >
                  {label}
                </button>
              ))}
              {theme === 'dark' && <span className="text-[12px] text-white/50">← 라이트로 바꿔야 보여요</span>}
            </div>
          )}
          <p className="basis-full text-[12px] text-white/60 mt-1">{VARIANTS[v].note}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-28 lg:max-w-[64rem] xl:max-w-[76rem] lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:min-h-0">
        <div className="border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between lg:px-8 lg:py-4">
          <button onClick={() => navigate(-1)} className="text-sm font-semibold text-gray-600 dark:text-white/70 lg:text-[16px]">‹ 뒤로</button>
          <h1 className="text-base font-bold text-ink-strong lg:text-[21px]">공동 기도제목</h1>
          <span className="w-10" />
        </div>
        <div key={v} className="px-4 py-5 lg:px-8 lg:py-8">
          <C />
        </div>
      </div>
    </div>
  )
}

export default PrayerTopicsPreview
