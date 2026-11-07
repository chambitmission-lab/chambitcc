// 이미지 주보 목록 — 앰비언트 커버 히어로 + 지난 주보 커버플로우.
// 주보 표지가 매주 거의 같고 계절 판(여름 파랑·가을 주황)만 바뀌어서, 표지를 늘어놓는 대신
// 호수·날짜·계절로 각 주를 구분한다. 호수는 날짜로 계산(제33권 43호 = 2026년 43번째 주일)이라 백엔드 무변경.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getBulletinDetail } from '../../../api/bulletin'
import { BULLETIN_PREVIEW_STALE, bulletinKeys, useBulletinYears, useBulletinsByYear } from '../../../hooks/useBulletins'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { Bulletin } from '../../../types/bulletin'
import { BulletinIcon } from './NewsIcons'
import {
  EDITION_MONTHS,
  SEASON_LABEL,
  editionYearText,
  fill,
  issueDateText,
  issueFullDateText,
  pageMini,
  pageThumb,
  toIssue,
  type Issue,
  type Season,
} from './bulletinIssue'
import { warmImage, warmPagesAround } from './bulletinWarm'
import './bulletinShelf.css'

const ChevronRight = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

interface ShelfProps {
  bulletins: Bulletin[]
  openingId: number | null
  /** page — 처음 펼칠 쪽(0부터) */
  onOpen: (bulletin: Bulletin, page?: number) => void
}

const BulletinShelf = ({ bulletins, openingId, onOpen }: ShelfProps) => {
  const issues = useMemo(() => bulletins.map(toIssue), [bulletins])
  const latest = issues[0]

  return (
    <div>
      {latest && <Hero issue={latest} busy={openingId === latest.bulletin.id} onOpen={onOpen} />}
      {latest && <PastShelf latest={latest} recent={issues} openingId={openingId} onOpen={onOpen} />}
    </div>
  )
}

// ── 지난 주보 — 판 연도(3월~이듬해 2월)별로 ──────────────
// 최근 목록(20개)만으로는 몇 달 지나면 옛 주보가 사라져서, 연도마다 그 해 주보 전체를 따로 받는다.
// 연도 목록·한 해치가 오기 전에는 이미 받은 최근 목록에서 그 해 것만 골라 먼저 그린다
const PastShelf = ({
  latest,
  recent,
  openingId,
  onOpen,
}: {
  latest: Issue
  recent: Issue[]
  openingId: number | null
  onOpen: ShelfProps['onOpen']
}) => {
  const { t } = useLanguage()
  const { data: yearRows } = useBulletinYears()
  const years = useMemo(
    () => (yearRows?.length ? yearRows.map(r => r.year) : [...new Set(recent.map(i => i.edition))]),
    [yearRows, recent],
  )
  const [picked, setPicked] = useState<number | null>(null)
  const year = picked ?? years[0] ?? latest.edition
  // 연도 목록의 count 가 최근 목록에서 센 그 해 개수와 같으면 한 해치 요청을 건너뛴다 —
  // 3~7월엔 올해 주보가 최근 20개에 다 들어 있어 같은 데이터를 두 번 받던 것
  const covered = useMemo(
    () => yearRows?.find(r => r.year === year)?.count === recent.filter(i => i.edition === year).length,
    [yearRows, recent, year],
  )
  const { data: yearList, isFetching } = useBulletinsByYear(covered ? null : year)

  const past = useMemo(() => {
    // 한 해치와 최근 목록을 합친다 — 백엔드가 year 를 모르던 시절엔 최근 10개만 돌아와 오히려 줄어들었다
    const byId = new Map<number, Issue>()
    for (const i of [...recent, ...(yearList ?? []).map(toIssue)]) byId.set(i.bulletin.id, i)
    return [...byId.values()]
      .filter(i => i.edition === year && i.bulletin.id !== latest.bulletin.id)
      .sort((a, b) => b.bulletin.bulletin_date.localeCompare(a.bulletin.bulletin_date))
  }, [yearList, recent, year, latest.bulletin.id])

  // 한 해뿐이고 지난 주보도 없으면(첫 주보) 칸을 그리지 않는다 — 예전과 같다
  if (past.length === 0 && years.length <= 1 && !isFetching) return null

  const idx = years.indexOf(year)
  return (
    <section className="mt-7 lg:mt-9" aria-label={t('newsBulletinPast')}>
      <CoverFlow
        key={year}
        issues={past}
        openingId={openingId}
        onOpen={onOpen}
        year={year}
        older={idx >= 0 ? years[idx + 1] : undefined}
        newer={idx > 0 ? years[idx - 1] : undefined}
        onYear={setPicked}
        loading={isFetching && past.length === 0}
      />
    </section>
  )
}

// ── 히어로 ─────────────────────────────────────────
const Hero = ({ issue, busy, onOpen }: { issue: Issue; busy: boolean; onOpen: ShelfProps['onOpen'] }) => {
  const { t, language } = useLanguage()
  const { bulletin } = issue

  // 쪽 미리보기 — 조회수를 올리지 않는 조회(count_view=false)라 상세 캐시와 키를 나눈다
  const { data: preview } = useQuery({
    queryKey: bulletinKeys.preview(bulletin.id),
    queryFn: () => getBulletinDetail(bulletin.id, false),
    staleTime: BULLETIN_PREVIEW_STALE,
  })
  const pages = useMemo(
    () => [...(preview?.pages ?? [])].sort((a, b) => a.page_number - b.page_number),
    [preview],
  )
  // 앞장(최대 212px)·번진 배경 모두 480px 썸네일 한 장으로 — 2x 화면에도 충분하고 요청이 하나로 준다
  // (읽기용 WebP 는 549px 남짓이라 해상도 이득 없이 두 배 무겁다)
  const cover = bulletin.thumbnail_url ?? bulletin.cover_url ?? (pages[0] && pageThumb(pages[0]))
  const pageCount = bulletin.page_count ?? pages.length

  // 주일까지 남은 날 — 오늘 기기 날짜 기준
  const now = new Date()
  const dday = Math.round(
    (Date.UTC(issue.y, issue.m - 1, issue.d) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5,
  )
  const ddayLabel =
    dday === 0
      ? t('newsBulletinSundayToday')
      : dday === 1
        ? t('newsBulletinSundayTomorrow')
        : dday > 1 && dday < 7
          ? fill(t('newsBulletinDday'), { n: dday })
          : dday < 0 && dday > -7
            ? t('newsBulletinThisWeek')
            : null

  const dateText = issueDateText(issue, language)
  // 제목이 대부분 날짜('2026년 10월 25일')라 겹치면 숨긴다 — '추수감사주일'처럼 따로 붙인 제목만 보인다
  const customTitle = /^\s*\d{4}\s*년/.test(bulletin.title) ? null : bulletin.title

  // 처음 그려질 때 한 번 부채처럼 펼쳤다 접는다 — 겹친 장이 '넘길 수 있는 것'임을 알려준다
  const [intro, setIntro] = useState(false)
  useEffect(() => {
    if (pages.length < 3 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const on = window.setTimeout(() => setIntro(true), 350)
    const off = window.setTimeout(() => setIntro(false), 1300)
    return () => {
      window.clearTimeout(on)
      window.clearTimeout(off)
    }
  }, [pages.length])

  // 번진 배경은 그림이 도착하면 스며들게 — 그 전엔 계절색 바탕만
  const [ambientReady, setAmbientReady] = useState(false)
  // 뒷장 두 장은 미리보기가 오기 전에도 빈 종이로 자리를 잡아 둔다(나중에 '툭' 끼어들지 않게)
  const backSrc = (i: number) => (pages[i] ? pageThumb(pages[i]) : undefined)
  const showBacks = pages.length >= 3 || (!preview && pageCount >= 3)
  // 열려는 기미(마우스 올림·포커스·누름)에 펼칠 쪽과 옆 쪽 읽기용 그림을 미리 받는다 —
  // 뷰어가 뜰 때 옆 쪽이 빈 채로 있다가 끼어들지 않게. 미리보기 전엔 표지(첫 쪽 읽기용)라도
  const warm = (page = 0) => {
    if (pages.length) warmPagesAround(pages, page)
    else if (page === 0) warmImage(bulletin.cover_url)
  }
  const intent = (page = 0) => ({
    onPointerEnter: () => warm(page),
    onPointerDown: () => warm(page),
    onFocus: () => warm(page),
  })
  // 누르기 전에도 — 히어로 그림이 다 뜬 뒤 유휴 시간에 첫 쪽·둘째 쪽 읽기용을 조용히 받아 둔다.
  // 누르는 순간 출발하면 Supabase 왕복(0.3~1초)만큼 뷰어의 다음 쪽이 늦게 또렷해졌다.
  // 두 장 합쳐 180KB 남짓이라 열지 않는 사용자에게도 부담이 작다(iOS 는 requestIdleCallback 이 없어 타이머로)
  useEffect(() => {
    if (!pages.length || !ambientReady) return
    const id = window.setTimeout(() => warmPagesAround(pages, 0), 800)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length, ambientReady])

  return (
    <article
      className={`bsf-hero bsf-${issue.season} ${busy ? 'opacity-70' : ''}`}
      aria-busy={busy || undefined}
    >
      {cover && (
        <img
          className={`bsf-amb ${ambientReady ? 'is-ready' : ''}`}
          src={cover}
          alt=""
          aria-hidden="true"
          decoding="async"
          onLoad={() => setAmbientReady(true)}
        />
      )}

      <div className="bsf-hero-grid">
        <div className="bsf-hero-info">
          <div className="flex items-center justify-between gap-2">
            {ddayLabel ? <span className="bsf-chip">{ddayLabel}</span> : <span />}
            <span className="bsf-vol">
              {fill(t('newsBulletinIssue'), { vol: issue.vol, no: issue.no })} · {t(SEASON_LABEL[issue.season])}
            </span>
          </div>
          <h2 className="bsf-title">
            {fill(t('newsBulletinHeroTitle'), { date: dateText })}
          </h2>
          <p className="bsf-sub">
            {customTitle && <span className="block font-bold opacity-100 mb-0.5">{customTitle}</span>}
            {fill(t('newsBulletinPageCount'), { n: pageCount })}
            {bulletin.views > 0 && <> · {fill(t('newsBulletinReaders'), { n: bulletin.views })}</>}
          </p>
          {bulletin.description && <p className="bsf-desc">{bulletin.description}</p>}
        </div>

        <button
          type="button"
          className={`bsf-fan ${intro ? 'is-fanned' : ''}`}
          onClick={() => onOpen(bulletin)}
          disabled={busy}
          {...intent()}
          aria-label={t('newsBulletinOpenSpread')}
        >
          {showBacks && <img src={backSrc(2)} alt="" decoding="async" />}
          {showBacks && <img src={backSrc(1)} alt="" decoding="async" />}
          {cover ? (
            <img src={cover} alt={bulletin.title} decoding="async" fetchPriority="high" />
          ) : (
            <span className="bsf-fan-empty">
              <BulletinIcon width={40} height={40} />
            </span>
          )}
        </button>

        <div className="bsf-hero-actions">
          {pages.length > 1 && (
            <div className="bsf-strip scrollbar-hide">
              {pages.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpen(bulletin, i)}
                  disabled={busy}
                  aria-label={fill(t('newsBulletinStartAt'), { n: i + 1 })}
                  {...intent(i)}
                >
                  <img src={pageMini(p)} alt="" decoding="async" />
                  <i>{i + 1}</i>
                </button>
              ))}
            </div>
          )}
          <button type="button" className="bsf-cta" onClick={() => onOpen(bulletin)} disabled={busy} {...intent()}>
            {t('newsBulletinOpenSpread')}
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}

// ── 지난 주보 커버플로우 ─────────────────────────────
const CoverFlow = ({
  issues,
  openingId,
  onOpen,
  year,
  older,
  newer,
  onYear,
  loading,
}: {
  issues: Issue[]
  openingId: number | null
  onOpen: ShelfProps['onOpen']
  year: number
  older?: number
  newer?: number
  onYear: (year: number) => void
  loading: boolean
}) => {
  const { t, language } = useLanguage()
  const qc = useQueryClient()
  const trackRef = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const [season, setSeason] = useState<Season | 'all'>('all')
  const [center, setCenter] = useState(0)

  // 가운데(= 눌러서 열 수 있는) 카드에 마우스를 올리거나 누르면 표지와 첫 두 쪽을 미리 받는다 —
  // 지난 주보는 쪽 목록이 없어 조회수를 올리지 않는 미리보기(preview)로 알아낸다
  const warm = (issue: Issue) => {
    const b = issue.bulletin
    warmImage(b.cover_url)
    qc.prefetchQuery({
      queryKey: bulletinKeys.preview(b.id),
      queryFn: () => getBulletinDetail(b.id, false),
      staleTime: BULLETIN_PREVIEW_STALE,
    }).then(() => warmPagesAround(qc.getQueryData<Bulletin>(bulletinKeys.preview(b.id))?.pages, 0))
  }

  // 실제로 있는 계절 판만 칩으로 — 한 계절뿐이면 칩 줄을 숨긴다
  const seasons = useMemo(() => [...new Set(issues.map(i => i.season))], [issues])
  const list = useMemo(
    () => (season === 'all' ? issues : issues.filter(i => i.season === season)),
    [issues, season],
  )

  // 스크롤 위치에 따라 카드마다 기울기를 직접 쓴다(리렌더 없이) — 가운데 카드만 state 로.
  // 거리는 기울기 전 레이아웃 자리(offsetLeft)로 잰다 — 기울어진 getBoundingClientRect 로 재면
  // 쓴 transform 이 다음 측정을 비틀어 가운데 판정·옆 카드 이동이 어긋났다
  const update = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const cx = track.scrollLeft + track.clientWidth / 2
    let best = 0
    let bestDist = Infinity
    track.querySelectorAll<HTMLElement>('.bsf-card').forEach((card, i) => {
      const dist = (card.offsetLeft + card.offsetWidth / 2 - cx) / card.offsetWidth
      const k = Math.max(-1.6, Math.min(1.6, dist))
      card.style.transform = `perspective(var(--bsf-persp)) rotateY(${-k * 38}deg) translateZ(${-Math.abs(k) * 70}px) scale(${1 - Math.min(Math.abs(k), 1) * 0.06})`
      // 겹침 순서는 두 카드가 가운데에서 같은 거리가 되는 순간(0.5 간격)에만 바뀌면 된다 —
      // 프레임마다 다른 값을 쓰면 레이어가 매번 다시 정렬되어 옆 카드가 덜컥거렸다
      const z = String(100 - Math.round(Math.abs(dist)))
      if (card.style.zIndex !== z) card.style.zIndex = z
      if (Math.abs(dist) < bestDist) {
        bestDist = Math.abs(dist)
        best = i
      }
    })
    setCenter(best)
  }, [])

  const schedule = useCallback(() => {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(update)
  }, [update])

  useLayoutEffect(() => {
    if (trackRef.current) trackRef.current.scrollLeft = 0
    // 카드 위치를 재야 가운데가 정해진다 — 레이아웃을 읽고 쓰는 자리라 의도된 setState
    // eslint-disable-next-line react-hooks/set-state-in-effect
    update()
  }, [list, update])

  useEffect(() => {
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame.current)
    }
  }, [schedule])

  // 버튼·옆 카드로 넘길 때는 직접 이징한다 — 브라우저 smooth 스크롤은 거리마다 속도가 달라
  // 한 장 넘김이 툭 끝나고, 스냅 컨테이너에선 멈춘 뒤 스냅이 한 번 더 움직여 끊겨 보였다.
  // 움직이는 동안만 스냅을 끄고(끄지 않으면 scrollLeft 가 바로 스냅 자리로 튄다) 도착하면 되돌린다
  const anim = useRef(0)
  const stopAnim = useCallback(() => {
    if (!anim.current) return
    cancelAnimationFrame(anim.current)
    anim.current = 0
    if (trackRef.current) trackRef.current.style.scrollSnapType = ''
  }, [])

  const scrollToCard = (index: number) => {
    const track = trackRef.current
    const card = track?.querySelectorAll<HTMLElement>('.bsf-card')[index]
    if (!track || !card) return
    const target = card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2
    stopAnim()
    const from = track.scrollLeft
    const delta = target - from
    if (Math.abs(delta) < 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      track.scrollLeft = target
      update()
      return
    }
    track.style.scrollSnapType = 'none'
    const duration = Math.min(640, 360 + (Math.abs(delta) / card.offsetWidth) * 70)
    let t0 = 0
    const step = (now: number) => {
      if (!t0) t0 = now
      const p = Math.min(1, (now - t0) / duration)
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
      track.scrollLeft = from + delta * eased
      update()
      if (p < 1) {
        anim.current = requestAnimationFrame(step)
      } else {
        anim.current = 0
        track.style.scrollSnapType = ''
      }
    }
    anim.current = requestAnimationFrame(step)
  }

  // 손으로 넘기기 시작하면 진행 중이던 이징을 바로 놓아 준다
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    track.addEventListener('wheel', stopAnim, { passive: true })
    track.addEventListener('touchstart', stopAnim, { passive: true })
    return () => {
      track.removeEventListener('wheel', stopAnim)
      track.removeEventListener('touchstart', stopAnim)
      stopAnim()
    }
  }, [stopAnim])

  // 옆 카드는 가운데로 데려오고, 가운데 카드를 누르면 연다
  const handleCard = (index: number) => {
    if (index !== center) scrollToCard(index)
    else onOpen(list[index].bulletin)
  }

  const current = list[center]

  // 달 바로 가기 — 판 연도 순서(3월→이듬해 2월)로, 지금 목록에 있는 달만
  const months = useMemo(() => {
    const has = new Set(list.map(i => i.m))
    return EDITION_MONTHS.filter(m => has.has(m))
  }, [list])
  // 가운데 카드가 바뀔 때마다 리렌더되니 Intl 포맷은 언어당 한 번만
  const monthLabels = useMemo(() => {
    const f = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ko-KR', { month: 'short', timeZone: 'UTC' })
    return new Map(EDITION_MONTHS.map(m => [m, f.format(new Date(Date.UTC(2000, m - 1, 1)))]))
  }, [language])

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-1">
        <h3 className="text-[17px] lg:text-[20px] font-bold text-ink-strong">{t('newsBulletinPast')}</h3>
        <div className="bsf-year" role="group">
          {(older !== undefined || newer !== undefined) && (
            <button
              type="button"
              className="bsf-year-btn"
              onClick={() => older !== undefined && onYear(older)}
              disabled={older === undefined}
              aria-label={t('newsBulletinYearOlder')}
            >
              <span className="rotate-180 inline-flex"><ChevronRight size={14} /></span>
            </button>
          )}
          <span className="bsf-year-label" aria-live="polite">
            {editionYearText(year, season)}
          </span>
          {(older !== undefined || newer !== undefined) && (
            <button
              type="button"
              className="bsf-year-btn"
              onClick={() => newer !== undefined && onYear(newer)}
              disabled={newer === undefined}
              aria-label={t('newsBulletinYearNewer')}
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {seasons.length > 1 && (
        <div className="bsf-season-row scrollbar-hide">
          <div className="flex gap-1.5">
            {(['all', ...seasons] as const).map(s => (
              <button
                key={s}
                type="button"
                aria-pressed={season === s}
                onClick={() => setSeason(s)}
                className={`bsf-season-chip ${season === s ? 'is-on' : ''}`}
              >
                {s === 'all' ? t('newsBulletinSeasonAll') : t(SEASON_LABEL[s])}
              </button>
            ))}
          </div>
        </div>
      )}

      {list.length === 0 && (
        <p className="bsf-year-empty">{t(loading ? 'newsBulletinYearLoading' : 'newsBulletinYearEmpty')}</p>
      )}

      <div className={`relative ${list.length === 0 ? 'hidden' : ''}`}>
        <div ref={trackRef} className="bsf-flow scrollbar-hide" onScroll={() => { if (!anim.current) schedule() }}>
          {list.map((issue, i) => (
            <button
              key={issue.bulletin.id}
              type="button"
              className={`bsf-card bsf-${issue.season} ${openingId === issue.bulletin.id ? 'opacity-60' : ''}`}
              onClick={() => handleCard(i)}
              onPointerEnter={e => e.pointerType === 'mouse' && i === center && warm(issue)}
              onPointerDown={() => i === center && warm(issue)}
              disabled={openingId === issue.bulletin.id}
              aria-label={`${fill(t('newsBulletinIssue'), { vol: issue.vol, no: issue.no })} ${issue.bulletin.title}`}
              aria-current={i === center || undefined}
            >
              <span className="bsf-card-no">{fill(t('newsBulletinIssueShort'), { no: issue.no })}</span>
              {issue.bulletin.thumbnail_url ? (
                <img
                  src={issue.bulletin.thumbnail_url}
                  alt=""
                  // 가운데 근처 카드는 넘기는 도중 그림이 툭 뜨지 않게 미리 받아 둔다
                  loading={Math.abs(i - center) <= 4 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority="low"
                />
              ) : (
                <span className="bsf-card-empty">
                  <BulletinIcon width={30} height={30} />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* PC — 마우스로 넘기는 자리라 좌우 버튼을 둔다 */}
        <button
          type="button"
          className="bsf-nav bsf-nav-prev"
          onClick={() => scrollToCard(center - 1)}
          disabled={center <= 0}
          aria-label={t('newsBulletinPrev')}
        >
          <span className="rotate-180 inline-flex"><ChevronRight size={18} /></span>
        </button>
        <button
          type="button"
          className="bsf-nav bsf-nav-next"
          onClick={() => scrollToCard(center + 1)}
          disabled={center >= list.length - 1}
          aria-label={t('newsBulletinNext')}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {current && (
        <div className="text-center pb-2" aria-live="polite">
          <p className="text-[17px] lg:text-[20px] font-bold text-ink-strong">
            {issueFullDateText(current, language)}
          </p>
          <p className="mt-0.5 text-[13px] lg:text-[15px] font-semibold text-gray-500 dark:text-white/55">
            {fill(t('newsBulletinIssue'), { vol: current.vol, no: current.no })} · {t(SEASON_LABEL[current.season])}
            {current.bulletin.page_count ? ` · ${fill(t('newsBulletinPageCount'), { n: current.bulletin.page_count })}` : ''}
          </p>
        </div>
      )}

      {months.length > 1 && (
        <nav className="bsf-months scrollbar-hide" aria-label={t('newsBulletinMonthJump')}>
          {months.map(m => (
            <button
              key={m}
              type="button"
              className={`bsf-month ${current?.m === m ? 'is-on' : ''}`}
              aria-current={current?.m === m || undefined}
              // 목록이 최신순이라 그 달의 첫 칸 = 그 달 마지막 주일
              onClick={() => scrollToCard(list.findIndex(i => i.m === m))}
            >
              {monthLabels.get(m)}
            </button>
          ))}
        </nav>
      )}
    </>
  )
}

export default BulletinShelf
