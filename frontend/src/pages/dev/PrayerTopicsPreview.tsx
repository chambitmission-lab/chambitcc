import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { HandHeartIcon } from '../../components/icons/ActionIcons'
import { useTheme } from '../../contexts/ThemeContext'
import { useThemeArt } from '../../hooks/useThemeArt'
import { pairSrc, PRAYER_WEEK_WINDOW } from '../../utils/themeAssets'
import type { WeeklyPrayer, WeeklyPrayerListItem } from '../../types/weeklyPrayer'
import './prayerTopicsPreview.css'

/**
 * /#/dev/prayer-topics — 공동 기도제목(/prayer-topics) 개편 시안 3종 비교. ?v=a|b|c
 * A 창가 히어로 + 기도의 길 / B 한 제목씩 집중(길게 눌러 아멘) / C 기도 편지(낭독형)
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
      amen_count: 2,
      is_amened: false,
    },
    {
      id: 2,
      title: '',
      body: '마음에 품은 그 한 사람에게 다가가게 하소서. 그래서 시간을 내어 찾아가고 이야기를 들으며, 예수님의 사랑을 전하고 새생명전도축제에 초대하게 하소서.',
      scripture: null,
      amen_count: 2,
      is_amened: false,
    },
    {
      id: 3,
      title: '',
      body: '우리를 복음의 일꾼으로 사용하소서. 복음을 전할 때 맞닥뜨리게 되는 두려움보다 함께하시는 주님을 의지하게 하시고, 성령께서 초대받는 이들의 마음을 열어 예수님을 믿게 하소서.',
      scripture: '사도행전 1:8',
      amen_count: 2,
      is_amened: false,
    },
  ],
}

const ARCHIVE: WeeklyPrayerListItem[] = [
  '2026-10-11', '2026-10-04', '2026-09-27', '2026-09-20', '2026-09-13', '2026-09-06',
  '2026-08-23', '2026-08-16', '2026-08-09', '2026-08-02',
].map((d, i) => ({ id: 41 - i, week_date: d, title: '기도제목', is_published: true, item_count: d === '2026-08-09' ? 2 : 3 }))

const parts = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}
const weekLabel = (iso: string) => {
  const { y, m, d } = parts(iso)
  return `${y}년 ${m}월 ${d}일 주일`
}
// "10월 둘째 주일"
const nthSunday = (iso: string) => {
  const { m, d } = parts(iso)
  return `${m}월 ${['첫째', '둘째', '셋째', '넷째', '다섯째'][Math.floor((d - 1) / 7)]} 주일`
}

/** 공용 상태 — 낙관적 아멘 토글 */
const usePrayerState = () => {
  const [prayer, setPrayer] = useState(SAMPLE)
  const toggle = (id?: number, force?: boolean) =>
    setPrayer((p) => ({
      ...p,
      items: p.items.map((it) => {
        if (it.id !== id) return it
        const next = force ?? !it.is_amened
        if (next === it.is_amened) return it
        return { ...it, is_amened: next, amen_count: (it.amen_count ?? 0) + (next ? 1 : -1) }
      }),
    }))
  const mine = prayer.items.filter((i) => i.is_amened).length
  const total = prayer.items.reduce((s, i) => s + (i.amen_count ?? 0), 0)
  return { prayer, toggle, mine, total }
}

const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="5 12.5 10 17.5 19 7" />
  </svg>
)
const BookIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z" />
    <path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" />
  </svg>
)

// ─────────────────────────────────────────────────────────────────────
// A. 창가 히어로 + 기도의 길
// ─────────────────────────────────────────────────────────────────────
const VariantA = () => {
  const { theme } = useTheme()
  const artReady = useThemeArt(PRAYER_WEEK_WINDOW)
  const { prayer, toggle, mine, total } = usePrayerState()
  const n = prayer.items.length
  const allDone = mine === n

  // 지난 기도제목 — 월별 묶음
  const byMonth = ARCHIVE.reduce<Record<string, WeeklyPrayerListItem[]>>((acc, a) => {
    const { y, m } = parts(a.week_date)
    ;(acc[`${y}년 ${m}월`] ??= []).push(a)
    return acc
  }, {})

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:items-start">
      <div>
        {/* 히어로 */}
        <section className="pta-hero">
          <div className={`pta-hero-img${artReady ? ' is-loaded' : ''}`} style={{ backgroundImage: `url(${pairSrc(PRAYER_WEEK_WINDOW, theme)})` }} aria-hidden />
          <div className="relative px-5 pt-5 pb-5 lg:px-8 lg:pt-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/75 dark:bg-white/10 backdrop-blur px-3 py-1 text-[12px] font-bold text-brand lg:text-[14px]">
              <HandHeartIcon size={13} strokeWidth={2} /> {nthSunday(prayer.week_date)} · 공동 기도제목
            </span>
            <h2 className="mt-3 text-[23px] font-extrabold leading-[1.35] tracking-[-0.03em] text-ink-strong break-keep lg:text-[32px]">
              이번 주,
              <br />
              교회가 <span className="text-brand">한마음으로</span> 드리는 기도
            </h2>
            <p className="mt-2 text-[13px] text-gray-600 dark:text-white/65 lg:text-[16px]">
              성도 <b className="text-brand tabular-nums">{prayer.prayed_user_count}명</b>이 <b className="text-brand tabular-nums">{total}번</b> 함께 기도했어요
            </p>
          </div>
          {/* 내 진행 — 창턱 위 */}
          <div className="relative mx-4 mb-4 mt-16 lg:mx-8 lg:mb-6 lg:mt-24 rounded-2xl bg-white/85 dark:bg-[#131313]/70 backdrop-blur-md px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className="flex gap-1.5">
              {prayer.items.map((it, i) => (
                <span key={it.id} className={`pta-dot ${it.is_amened ? 'is-on' : ''}`}>{it.is_amened ? <CheckIcon size={12} /> : i + 1}</span>
              ))}
            </div>
            <p className="text-[13px] font-semibold text-gray-700 dark:text-white/80 lg:text-[15px]">
              {allDone ? '이번 주 기도를 모두 드렸어요' : mine === 0 ? '하나씩 따라 읽으며 기도해요' : `${n}개 중 ${mine}개 함께 기도했어요`}
            </p>
          </div>
        </section>

        {/* 기도의 길 */}
        <ol className="pta-path mt-6 lg:mt-8">
          {prayer.items.map((it, i) => (
            <li key={it.id} className={`pta-step ${it.is_amened ? 'is-done' : ''}`}>
              <span className="pta-node">{it.is_amened ? <CheckIcon size={18} /> : i + 1}</span>
              <div className="pta-card">
                <p className="text-[15.5px] leading-[1.8] text-ink-strong break-keep lg:text-[19.5px] lg:leading-[1.85]">{it.body}</p>
                {it.scripture && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-soft)] px-2.5 py-1 text-[12.5px] font-semibold text-brand lg:text-[15px]">
                    <BookIcon /> {it.scripture}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-3 lg:mt-5">
                  <button type="button" onClick={() => toggle(it.id)} aria-pressed={it.is_amened} className={`pta-amen ${it.is_amened ? 'is-on' : ''}`}>
                    {it.is_amened ? <CheckIcon size={16} /> : <HandHeartIcon size={17} strokeWidth={2} />}
                    {it.is_amened ? '기도했어요' : '아멘, 함께 기도합니다'}
                  </button>
                  <span className="text-[12.5px] text-gray-500 dark:text-white/50 lg:text-[15px]">
                    <b className="text-brand tabular-nums">{it.amen_count}명</b> 함께
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className={`pta-finish ${allDone ? 'is-done' : ''}`}>
          <HandHeartIcon size={22} strokeWidth={1.8} filled={allDone} />
          <p className="text-[14px] font-bold lg:text-[17px]">{allDone ? '아멘. 이번 주 기도를 모두 함께 드렸어요' : '이번 주에도 한마음으로 함께 기도해요'}</p>
          {allDone && <p className="text-[12.5px] opacity-80 lg:text-[15px]">다음 주일에 새 기도제목으로 다시 만나요</p>}
        </div>
      </div>

      {/* 우측 레일 */}
      <aside className="mt-8 space-y-4 lg:mt-0 lg:sticky lg:top-[4.5rem]">
        <div className="pt-card p-5">
          <p className="text-[15px] font-bold text-ink-strong lg:text-[16px]">나의 이번 주 기도</p>
          <div className="mt-3 flex items-end gap-1.5">
            <span className="text-[34px] leading-none font-extrabold brand-text-gradient tabular-nums">{mine}</span>
            <span className="pb-1 text-[15px] font-bold text-gray-400">/ {n}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
            <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${(mine / n) * 100}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 pt-4 border-t border-gray-200/70 dark:border-white/[0.08] text-center">
            <div>
              <p className="text-[24px] font-extrabold brand-text-gradient tabular-nums">{prayer.prayed_user_count}</p>
              <p className="text-[13px] text-gray-500 dark:text-white/55">함께한 성도</p>
            </div>
            <div>
              <p className="text-[24px] font-extrabold brand-text-gradient tabular-nums">{total}</p>
              <p className="text-[13px] text-gray-500 dark:text-white/55">기도 참여</p>
            </div>
          </div>
        </div>
        <div className="pt-card p-5">
          <p className="text-[15px] font-bold text-ink-strong lg:text-[16px]">지난 기도제목</p>
          {Object.entries(byMonth).map(([month, list]) => (
            <div key={month} className="mt-4">
              <p className="text-[12px] font-bold text-gray-400 dark:text-white/40 lg:text-[13.5px]">{month}</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {list.map((a) => {
                  const on = a.id === prayer.id
                  return (
                    <button key={a.id} className={`pta-week ${on ? 'is-on' : ''}`}>
                      <span className="text-[17px] font-extrabold tabular-nums">{parts(a.week_date).d}</span>
                      <span className="text-[10.5px] opacity-70">주일</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// B. 한 제목씩 집중 — 스토리 진행바 + 길게 눌러 아멘
// ─────────────────────────────────────────────────────────────────────
const HOLD_MS = 1200

const VariantB = () => {
  const { prayer, toggle, mine, total } = usePrayerState()
  const [idx, setIdx] = useState(0)
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const n = prayer.items.length
  const it = prayer.items[idx]
  const done = idx >= n

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const start = () => {
    if (it?.is_amened) return
    setHolding(true)
    timer.current = window.setTimeout(() => {
      setHolding(false)
      toggle(it?.id, true)
      navigator.vibrate?.(30)
      window.setTimeout(() => setIdx((v) => v + 1), 650)
    }, HOLD_MS)
  }
  const cancel = () => {
    window.clearTimeout(timer.current)
    setHolding(false)
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:items-start">
      <div>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[13px] font-bold text-brand lg:text-[16px]">{weekLabel(prayer.week_date)}</p>
            <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.03em] text-ink-strong lg:text-[30px]">함께 드리는 기도</h2>
          </div>
          <p className="text-[13px] font-bold text-gray-500 dark:text-white/55 tabular-nums lg:text-[16px]">
            {Math.min(idx + 1, n)} / {n}
          </p>
        </div>

        {/* 스토리 진행바 */}
        <div className="mt-4 flex gap-1.5">
          {prayer.items.map((p, i) => (
            <button key={p.id} onClick={() => setIdx(i)} className="ptb-seg" aria-label={`${i + 1}번 기도`}>
              <span style={{ width: p.is_amened ? '100%' : i === idx && holding ? '100%' : '0%' }} className={i === idx && holding ? 'is-holding' : ''} />
            </button>
          ))}
        </div>

        {/* 무대 */}
        {!done ? (
          <section key={idx} className="ptb-stage mt-5">
            <span className="ptb-num">{String(idx + 1).padStart(2, '0')}</span>
            <p className="relative text-[18px] font-semibold leading-[1.75] tracking-[-0.02em] text-ink-strong break-keep lg:text-[24px] lg:leading-[1.75]">
              {it.body}
            </p>
            {it.scripture && (
              <p className="relative mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand lg:text-[16px]">
                <BookIcon size={15} /> {it.scripture}
              </p>
            )}

            <div className="relative mt-8 flex flex-col items-center gap-3 lg:mt-10">
              <button
                type="button"
                onPointerDown={start}
                onPointerUp={cancel}
                onPointerLeave={cancel}
                onContextMenu={(e) => e.preventDefault()}
                className={`ptb-hold ${holding ? 'is-holding' : ''} ${it.is_amened ? 'is-on' : ''}`}
                style={{ ['--hold' as string]: `${HOLD_MS}ms` }}
              >
                <svg className="ptb-ring" viewBox="0 0 100 100" aria-hidden>
                  <circle cx="50" cy="50" r="46" />
                  <circle cx="50" cy="50" r="46" className="ptb-ring-fill" />
                </svg>
                {it.is_amened ? <CheckIcon size={30} /> : <HandHeartIcon size={32} strokeWidth={1.8} />}
              </button>
              <p className="text-[13px] font-semibold text-gray-500 dark:text-white/55 lg:text-[16px]">
                {it.is_amened ? `아멘 · ${it.amen_count}명이 함께 기도했어요` : holding ? '마음을 모아…' : '기도를 마치면 길게 눌러 아멘'}
              </p>
            </div>

            <div className="relative mt-6 flex justify-between">
              <button disabled={idx === 0} onClick={() => setIdx((v) => v - 1)} className="ptb-nav">← 이전</button>
              <button onClick={() => setIdx((v) => v + 1)} className="ptb-nav">{idx === n - 1 ? '마치기' : '다음'} →</button>
            </div>
          </section>
        ) : (
          <section className="ptb-stage ptb-stage--done mt-5 text-center">
            <HandHeartIcon size={40} strokeWidth={1.6} filled className="mx-auto text-brand" />
            <p className="mt-4 text-[22px] font-extrabold text-ink-strong lg:text-[28px]">
              {mine === n ? '아멘, 모두 함께 기도했어요' : `${n}개 중 ${mine}개를 기도했어요`}
            </p>
            <p className="mt-2 text-[14px] text-gray-500 dark:text-white/60 lg:text-[17px]">
              이번 주 성도 {prayer.prayed_user_count}명과 {total}번의 기도를 함께 올렸어요
            </p>
            <button onClick={() => setIdx(0)} className="mt-6 ptb-nav mx-auto">처음부터 다시</button>
          </section>
        )}
      </div>

      <aside className="mt-8 space-y-4 lg:mt-0 lg:sticky lg:top-[4.5rem]">
        <div className="pt-card p-4">
          <p className="px-1 pb-2 text-[15px] font-bold text-ink-strong lg:text-[16px]">이번 주 기도 순서</p>
          {prayer.items.map((p, i) => (
            <button key={p.id} onClick={() => setIdx(i)} className={`ptb-row ${i === idx ? 'is-cur' : ''}`}>
              <span className={`ptb-row-mark ${p.is_amened ? 'is-on' : ''}`}>{p.is_amened ? <CheckIcon size={12} /> : i + 1}</span>
              <span className="line-clamp-2 text-left text-[13.5px] leading-[1.55] lg:text-[15px]">{p.body}</span>
            </button>
          ))}
        </div>
        <div className="pt-card p-4">
          <p className="px-1 pb-2 text-[15px] font-bold text-ink-strong lg:text-[16px]">지난 기도제목</p>
          <div className="max-h-[280px] overflow-y-auto">
            {ARCHIVE.map((a) => (
              <button key={a.id} className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] lg:text-[15.5px] ${a.id === prayer.id ? 'bg-[var(--brand-soft)] text-brand font-bold' : 'text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.05]'}`}>
                {weekLabel(a.week_date)}
                <span className="text-[12px] text-gray-400">{a.item_count}개</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// C. 기도 편지 — 주차 칩 띠 + 낭독형 한 장
// ─────────────────────────────────────────────────────────────────────
const VariantC = () => {
  const { prayer, toggle, mine, total } = usePrayerState()
  const { y, m, d } = parts(prayer.week_date)
  const n = prayer.items.length
  const allDone = mine === n

  return (
    <div className="max-w-[46rem] mx-auto">
      {/* 주차 칩 띠 */}
      <div className="ptc-strip -mx-4 px-4 lg:mx-0 lg:px-0">
        {ARCHIVE.map((a) => {
          const p = parts(a.week_date)
          const on = a.id === prayer.id
          return (
            <button key={a.id} className={`ptc-chip ${on ? 'is-on' : ''}`}>
              <span className="text-[10.5px] font-semibold opacity-70">{p.m}월</span>
              <span className="text-[18px] font-extrabold tabular-nums leading-none">{p.d}</span>
            </button>
          )
        })}
      </div>

      {/* 편지 */}
      <article className="ptc-letter mt-5">
        <header className="text-center">
          <p className="text-[12px] font-bold tracking-[0.18em] text-brand lg:text-[14px]">
            {y}. {m}. {d}. 주일
          </p>
          <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.03em] text-ink-strong lg:text-[34px]">이번 주 함께 드리는 기도</h2>
          <div className="mt-3 flex items-center justify-center gap-2 text-[13px] text-gray-500 dark:text-white/55 lg:text-[15.5px]">
            <span className="ptc-faces" aria-hidden>
              {Array.from({ length: Math.min(prayer.prayed_user_count ?? 0, 5) }).map((_, i) => <i key={i} />)}
            </span>
            성도 <b className="text-brand">{prayer.prayed_user_count}명</b>이 함께하고 있어요
          </div>
          <div className="ptc-rule" aria-hidden><HandHeartIcon size={16} strokeWidth={1.8} /></div>
        </header>

        {prayer.items.map((it, i) => (
          <section key={it.id} className={`ptc-stanza ${it.is_amened ? 'is-done' : ''}`}>
            <span className="ptc-numeral" aria-hidden>{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[16px] leading-[1.9] text-ink-strong break-keep lg:text-[20px] lg:leading-[1.9]">{it.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                {it.scripture && <span className="text-[13px] font-semibold text-brand lg:text-[15px]">— {it.scripture}</span>}
                <button type="button" onClick={() => toggle(it.id)} aria-pressed={it.is_amened} className={`ptc-amen ${it.is_amened ? 'is-on' : ''}`}>
                  {it.is_amened ? <CheckIcon size={13} /> : <HandHeartIcon size={14} strokeWidth={2} />}
                  아멘 <span className="tabular-nums opacity-80">{it.amen_count}</span>
                </button>
              </div>
            </div>
          </section>
        ))}

        <footer className="mt-8 text-center text-[13px] text-gray-500 dark:text-white/50 lg:text-[16px]">
          예수님의 이름으로 기도합니다. 아멘.
        </footer>
      </article>

      {/* 하단 고정 바 */}
      <div className="ptc-bar">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-ink-strong lg:text-[15px]">{allDone ? '모두 함께 기도했어요' : `${n}개 중 ${mine}개 기도했어요`}</p>
          <p className="text-[11.5px] text-gray-500 dark:text-white/50 lg:text-[13px]">이번 주 기도 참여 {total}번</p>
        </div>
        <button
          type="button"
          onClick={() => prayer.items.forEach((it) => toggle(it.id, !allDone))}
          className={`ptc-all ${allDone ? 'is-on' : ''}`}
        >
          {allDone ? <CheckIcon size={16} /> : <HandHeartIcon size={17} strokeWidth={2} />}
          {allDone ? '아멘' : '모두 아멘'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
const VARIANTS = {
  a: { name: 'A 창가 히어로 + 기도의 길', note: '홈 창가 카드와 같은 그림으로 이어지는 히어로 · 번호를 선으로 이은 순서 · 내 진행(●●○)과 마침 카드 · 지난 주는 월별 날짜 격자 — 참고: YouVersion 기도, Hallow', C: VariantA },
  b: { name: 'B 한 제목씩 집중', note: '스토리형 진행바 · 한 화면에 한 기도 · 다 읽고 길게 눌러 아멘(1.2초 링) → 다음으로 · 마지막에 마침 화면 — 참고: Abide 가이드 기도, 인스타 스토리', C: VariantB },
  c: { name: 'C 기도 편지', note: '위쪽 주차 날짜 칩 띠 · 한 장짜리 기도문을 소리 내어 읽듯 · 큰 숫자 · 아멘은 작은 칩 · 하단 고정 바에서 "모두 아멘" — 참고: 주보·전례문 낭독', C: VariantC },
} as const
type Key = keyof typeof VARIANTS

const PrayerTopicsPreview = () => {
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const v = (sp.get('v') as Key) in VARIANTS ? (sp.get('v') as Key) : 'a'
  const { C } = VARIANTS[v]

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      {/* 시안 선택 */}
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
