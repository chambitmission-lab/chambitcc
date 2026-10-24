// 이미지 주보 목록 — 앰비언트 커버 히어로 + 지난 주보 커버플로우.
// 주보 표지가 매주 거의 같고 계절 판(여름 파랑·가을 주황)만 바뀌어서, 표지를 늘어놓는 대신
// 호수·날짜·계절로 각 주를 구분한다. 호수는 날짜로 계산(제33권 43호 = 2026년 43번째 주일)이라 백엔드 무변경.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBulletinDetail } from '../../../api/bulletin'
import { bulletinKeys } from '../../../hooks/useBulletins'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { Bulletin } from '../../../types/bulletin'
import { BulletinIcon } from './NewsIcons'
import { SEASON_LABEL, fill, issueDateText, pageSrc, pageThumb, toIssue, type Issue, type Season } from './bulletinIssue'
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
  const { t } = useLanguage()
  const issues = useMemo(() => bulletins.map(toIssue), [bulletins])
  const [latest, ...past] = issues

  return (
    <div>
      {latest && <Hero issue={latest} busy={openingId === latest.bulletin.id} onOpen={onOpen} />}
      {past.length > 0 && (
        <section className="mt-7 lg:mt-9" aria-label={t('newsBulletinPast')}>
          <CoverFlow issues={past} openingId={openingId} onOpen={onOpen} />
        </section>
      )}
    </div>
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
    staleTime: 10 * 60_000,
  })
  const pages = useMemo(
    () => [...(preview?.pages ?? [])].sort((a, b) => a.page_number - b.page_number),
    [preview],
  )
  // 앞장은 크게 보여 읽기용 WebP, 번진 배경은 어차피 흐려서 480px 썸네일이면 충분
  const cover = bulletin.cover_url ?? bulletin.thumbnail_url ?? (pages[0] && pageSrc(pages[0]))
  const ambient = bulletin.thumbnail_url ?? cover

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

  const pageCount = bulletin.page_count ?? pages.length

  return (
    <article
      className={`bsf-hero bsf-${issue.season} ${busy ? 'opacity-70' : ''}`}
      aria-busy={busy || undefined}
    >
      {ambient && <div className="bsf-amb" style={{ backgroundImage: `url("${ambient}")` }} aria-hidden="true" />}

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
          aria-label={t('newsBulletinOpenSpread')}
        >
          {pages[2] && <img src={pageThumb(pages[2])} alt="" decoding="async" />}
          {pages[1] && <img src={pageThumb(pages[1])} alt="" decoding="async" />}
          {cover ? (
            <img src={cover} alt={bulletin.title} decoding="async" />
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
                >
                  <img src={pageThumb(p)} alt="" loading="lazy" decoding="async" />
                  <i>{i + 1}</i>
                </button>
              ))}
            </div>
          )}
          <button type="button" className="bsf-cta" onClick={() => onOpen(bulletin)} disabled={busy}>
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
}: {
  issues: Issue[]
  openingId: number | null
  onOpen: ShelfProps['onOpen']
}) => {
  const { t, language } = useLanguage()
  const trackRef = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const [season, setSeason] = useState<Season | 'all'>('all')
  const [center, setCenter] = useState(0)

  // 실제로 있는 계절 판만 칩으로 — 한 계절뿐이면 칩 줄을 숨긴다
  const seasons = useMemo(() => [...new Set(issues.map(i => i.season))], [issues])
  const list = useMemo(
    () => (season === 'all' ? issues : issues.filter(i => i.season === season)),
    [issues, season],
  )

  // 스크롤 위치에 따라 카드마다 기울기를 직접 쓴다(리렌더 없이) — 가운데 카드만 state 로
  const update = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const r = track.getBoundingClientRect()
    const cx = r.left + r.width / 2
    let best = 0
    let bestDist = Infinity
    track.querySelectorAll<HTMLElement>('.bsf-card').forEach((card, i) => {
      const cr = card.getBoundingClientRect()
      const dist = (cr.left + cr.width / 2 - cx) / cr.width
      const k = Math.max(-1.6, Math.min(1.6, dist))
      card.style.transform = `rotateY(${-k * 38}deg) translateZ(${-Math.abs(k) * 70}px) scale(${1 - Math.min(Math.abs(k), 1) * 0.06})`
      card.style.zIndex = String(100 - Math.round(Math.abs(dist) * 10))
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

  const scrollToCard = (index: number) => {
    const track = trackRef.current
    const card = track?.querySelectorAll<HTMLElement>('.bsf-card')[index]
    if (!track || !card) return
    const r = track.getBoundingClientRect()
    const cr = card.getBoundingClientRect()
    track.scrollBy({ left: cr.left + cr.width / 2 - (r.left + r.width / 2), behavior: 'smooth' })
  }

  // 옆 카드는 가운데로 데려오고, 가운데 카드를 누르면 연다
  const handleCard = (index: number) => {
    if (index !== center) scrollToCard(index)
    else onOpen(list[index].bulletin)
  }

  const current = list[center]

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-1">
        <h3 className="text-[17px] lg:text-[20px] font-bold text-ink-strong">{t('newsBulletinPast')}</h3>
        {seasons.length > 1 && (
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
        )}
      </div>

      <div className="relative">
        <div ref={trackRef} className="bsf-flow scrollbar-hide" onScroll={schedule}>
          {list.map((issue, i) => (
            <button
              key={issue.bulletin.id}
              type="button"
              className={`bsf-card bsf-${issue.season} ${openingId === issue.bulletin.id ? 'opacity-60' : ''}`}
              onClick={() => handleCard(i)}
              disabled={openingId === issue.bulletin.id}
              aria-label={`${fill(t('newsBulletinIssue'), { vol: issue.vol, no: issue.no })} ${issue.bulletin.title}`}
              aria-current={i === center || undefined}
            >
              <span className="bsf-card-no">{fill(t('newsBulletinIssueShort'), { no: issue.no })}</span>
              {issue.bulletin.thumbnail_url ? (
                <img src={issue.bulletin.thumbnail_url} alt="" loading="lazy" decoding="async" />
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
            {issueDateText(current, language)}
          </p>
          <p className="mt-0.5 text-[13px] lg:text-[15px] font-semibold text-gray-500 dark:text-white/55">
            {fill(t('newsBulletinIssue'), { vol: current.vol, no: current.no })} · {t(SEASON_LABEL[current.season])}
            {current.bulletin.page_count ? ` · ${fill(t('newsBulletinPageCount'), { n: current.bulletin.page_count })}` : ''}
          </p>
        </div>
      )}
    </>
  )
}

export default BulletinShelf
