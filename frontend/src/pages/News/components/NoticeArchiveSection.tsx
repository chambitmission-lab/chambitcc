// 공지 아카이브 섹션 (/news 의 '공지' 탭 본문)
// Single Responsibility: 지난 공지 목록 + 한 건 읽기(공용 NoticeSheet)
//
// 홈 배너는 "지금 띄울 것"(is_popup + 기간 안 지남)만 보여주고, 알림함은 개인 알림과
// 섞여 있어 지난 안내를 되찾아 읽기 어려웠다. 여기가 공지의 보관함이다 —
// 읽음 뱃지 없이(알림함의 안 읽음 뱃지와 성격이 다르다) 최신순으로만 쌓는다.
//
// 2026-11-07 전면 개편 — 예전엔 본문을 한 줄로 눕힌 미리보기("일시: … 장소: … [안내] 대상 | …")를
// 두 줄 잘라 보여줘서 정보가 뒤엉켜 읽혔다. 공지는 사실상 전부 포스터 + `일시:/장소:` 줄로 쓰이므로
//  ① 앞으로 올 일정은 위에 포스터 카드로 크게(Luma·티켓 앱의 "다가오는 이벤트" 문법)
//  ② 전체는 올린 달로 묶은 인셋 리스트 — 포스터 썸네일 + 제목 + 일시·장소 두 칩
//  ③ 탭하면 홈 팝업과 같은 "빛 드는 공지" 시트로 읽는다(펼침 아코디언 폐지)
// 일시·장소는 새 스키마 없이 본문 문법에서 읽는다(utils/noticeHighlights).
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMarkAsRead, useNoticeArchive } from '../../../hooks/useNotifications'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import NoticeSheet from '../../../components/common/NoticeSheet'
import { noticePreviewText } from '../../../utils/noticeMarkup'
import {
  extractNoticeHighlights,
  noticeDday,
  noticeDdayLabel,
  noticeWeekday,
  shortNoticePlace,
  type NoticeWhen,
} from '../../../utils/noticeHighlights'
import { calendarDaysSince, relativeDayLabel } from '../../../utils/dateUtils'
import { NoticeBoardIcon, SignalIcon, InboxIcon, CalendarIcon, PinIcon } from './NewsIcons'
import type { Notification } from '../../../types/notification'
import { can } from '../../../utils/access'
import { tokenStore } from '../../../utils/tokenStore'
import { useLanguage } from '../../../contexts/LanguageContext'
import type { Translate } from '../../../locales'
import './notice-archive.css'

// 포스터 확대 보기는 탭해야 열린다 — lazy 로 분리 (홈 공지와 같은 청크)
const ImageLightbox = lazy(() => import('../../../components/common/ImageLightbox'))

/** 한 건을 목록에 그리기 위한 요약 — 본문 파싱은 목록이 바뀔 때 한 번만 */
interface NoticeItem {
  notice: Notification
  when: NoticeWhen | null
  dday: number | null
  place: string | null
  /** 일시·장소를 못 읽은 공지의 한 줄 — 제목과 같으면 비운다 */
  snippet: string
}

const summarize = (notice: Notification): NoticeItem => {
  const h = extractNoticeHighlights(notice.content)
  const preview = noticePreviewText(h.rest || notice.content)
  return {
    notice,
    when: h.when,
    dday: h.when ? noticeDday(h.when) : null,
    place: h.place ? shortNoticePlace(h.place) : null,
    snippet: preview && preview !== notice.title.trim() ? preview : '',
  }
}

/** '11월 8일 (일) 오전 8시' — 시각이 없으면 날짜만 */
const formatWhen = (w: NoticeWhen, t: Translate, withTime = true) => {
  const weekdays = t('newsWeekdays').split(',')
  const date = t('newsNoticeDate')
    .replace('{m}', String(w.month))
    .replace('{d}', String(w.day))
    .replace('{w}', weekdays[noticeWeekday(w)] ?? '')
  if (!withTime || w.hour == null) return date
  const mer = w.hour < 12 ? t('newsNoticeAm') : t('newsNoticePm')
  const h12 = String(w.hour % 12 || 12)
  const time = w.minute
    ? t('newsNoticeHourMin').replace('{h}', h12).replace('{m}', String(w.minute).padStart(2, '0'))
    : t('newsNoticeHour').replace('{h}', h12)
  return `${date} ${mer} ${time}`
}

/** 올린 날 — 오늘·어제는 사람 말로, 그 외는 11.05 */
const formatPosted = (iso: string, t: Translate) =>
  relativeDayLabel(iso, { today: t('newsNoticeToday'), yesterday: t('newsNoticeYesterday') }, (x) => {
    const d = new Date(x)
    return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  })

/**
 * 공지 링크 → 실제 이동 대상.
 * /prayers/:id 는 전용 페이지가 아니라 홈의 기도 상세 모달이라 state로 넘겨야 한다
 * (HomeNotice·NotificationModal 의 resolveTarget 과 같은 규칙).
 */
const resolveTarget = (
  linkUrl: string,
): { path: string; state?: Record<string, unknown> } => {
  const prayer = linkUrl.match(/^\/prayers\/(\d+)$/)
  if (prayer) return { path: '/', state: { openPrayerId: Number(prayer[1]) } }
  return { path: linkUrl }
}

const NoticeArchiveSection = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const admin = can('content:manage')
  const markAsRead = useMarkAsRead()

  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useNoticeArchive()

  const [openId, setOpenId] = useState<number | null>(null)
  const [zoomSrc, setZoomSrc] = useState<string | null>(null)
  const readMarkedRef = useRef<Set<number>>(new Set())

  const items = useMemo(
    () => (data?.pages.flatMap((page) => page.notifications) ?? []).map(summarize),
    [data],
  )
  const total = data?.pages[0]?.total ?? 0

  // 앞으로 올 일정 — 가까운 날부터. 두 달 넘게 남은 것도 포함(칩만 안 붙는다)
  const upcoming = useMemo(
    () =>
      items
        .filter((it) => it.dday != null && it.dday >= 0)
        .sort((a, b) => (a.dday as number) - (b.dday as number)),
    [items],
  )

  // 올린 달로 묶기 (목록은 이미 최신순)
  const groups = useMemo(() => {
    const out: { key: string; y: number; m: number; items: NoticeItem[] }[] = []
    for (const it of items) {
      const d = new Date(it.notice.created_at)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const last = out[out.length - 1]
      if (last?.key === key) last.items.push(it)
      else out.push({ key, y: d.getFullYear(), m: d.getMonth() + 1, items: [it] })
    }
    return out
  }, [items])

  const openIndex = openId == null ? -1 : items.findIndex((it) => it.notice.id === openId)
  const opened = openIndex >= 0 ? items[openIndex].notice : null
  const nextItem = openIndex >= 0 ? items[openIndex + 1] : undefined

  const close = useCallback(() => setOpenId(null), [])
  useModalBackButton(close, opened != null)

  // 보관함에서 연 공지도 읽음 처리 — 헤더 알림 뱃지가 이미 읽은 공지로 울리지 않게
  useEffect(() => {
    if (!opened || opened.is_read || !tokenStore.getAccess()) return
    if (readMarkedRef.current.has(opened.id)) return
    readMarkedRef.current.add(opened.id)
    markAsRead.mutate(opened.id, { onError: () => {} })
  }, [opened, markAsRead])

  // PC 키보드 — Esc 닫기, ←/→ 이웃 공지. 포스터 확대 중에는 라이트박스가 키를 쓴다
  useEffect(() => {
    if (!opened || zoomSrc) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight' && items[openIndex + 1]) setOpenId(items[openIndex + 1].notice.id)
      else if (e.key === 'ArrowLeft' && openIndex > 0) setOpenId(items[openIndex - 1].notice.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [opened, zoomSrc, items, openIndex, close])

  const handleLink = () => {
    if (!opened?.link_url) return
    const target = resolveTarget(opened.link_url)
    setOpenId(null)
    navigate(target.path, target.state ? { state: target.state } : undefined)
  }

  return (
    <div className="na px-4 pt-4 pb-8 lg:px-6 lg:pt-5">
      {/* 머리 — 큰 삽화 히어로 대신 한 줄. 첫 화면은 정보(다가오는 일정)가 차지해야 한다 */}
      <div className="flex items-end justify-between gap-3 px-1 mb-4 lg:mb-5">
        <div className="min-w-0">
          <h2 className="text-ink-strong text-[20px] lg:text-[26px] font-bold tracking-[-0.02em] leading-tight">
            {t('newsNoticeTitle')}
          </h2>
          {!isLoading && !error && total > 0 && (
            <p className="mt-0.5 text-[12.5px] lg:text-[15px] text-[var(--text-muted)]">
              {t('newsCountPrefix')}
              <span className="font-bold text-ink-strong tabular-nums">{total}</span>
              {t('newsCountSuffix')}
            </p>
          )}
        </div>
        {admin && (
          <button
            type="button"
            onClick={() => navigate('/admin/notifications')}
            className="shrink-0 inline-flex items-center gap-1 h-9 px-3.5 lg:h-11 lg:px-5 lg:text-[15px] rounded-full bg-[var(--brand-soft)] text-brand text-[12.5px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('newsNoticeCreate')}
          </button>
        )}
      </div>

      {isLoading ? (
        <ArchiveSkeleton />
      ) : error ? (
        <EmptyBox
          icon={<SignalIcon width={28} height={28} />}
          title={t('newsNoticeErrorTitle')}
          desc={t('newsNoticeErrorDesc')}
        />
      ) : items.length === 0 ? (
        <EmptyBox
          icon={<InboxIcon width={28} height={28} />}
          title={t('newsNoticeEmptyTitle')}
          desc={t('newsNoticeEmptyDesc')}
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mb-7 lg:mb-9" aria-label={t('newsNoticeUpcoming')}>
              <SectionLabel>
                {t('newsNoticeUpcoming')}
                <span className="na-count">{upcoming.length}</span>
              </SectionLabel>
              <div className={`na-feat-track${upcoming.length > 1 ? ' na-feat-track--many' : ''}`}>
                {upcoming.map((it) => (
                  <FeaturedCard key={it.notice.id} item={it} onOpen={() => setOpenId(it.notice.id)} />
                ))}
              </div>
            </section>
          )}

          <SectionLabel>{t('newsNoticeAll')}</SectionLabel>
          <div className="space-y-5 lg:space-y-7">
            {groups.map((g) => (
              <section key={g.key} aria-label={t('newsNoticeMonth').replace('{y}', String(g.y)).replace('{m}', String(g.m))}>
                <h3 className="na-month">
                  {t('newsNoticeMonth').replace('{y}', String(g.y)).replace('{m}', String(g.m))}
                </h3>
                <ul className="na-list">
                  {g.items.map((it) => (
                    <li key={it.notice.id}>
                      <NoticeRow item={it} onOpen={() => setOpenId(it.notice.id)} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-5">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-5 h-10 lg:h-12 lg:px-7 lg:text-[16px] rounded-full text-[12.5px] font-bold text-brand bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? t('newsLoadingMore') : t('newsNoticeLoadMore')}
          </button>
        </div>
      )}

      {opened && (
        <NoticeSheet
          notice={opened}
          kicker={t('newsNoticeTitle')}
          onClose={close}
          onZoom={setZoomSrc}
          onLink={handleLink}
          primaryLabel={nextItem ? t('newsNoticeNext') : t('newsNoticeConfirm')}
          onPrimary={() => (nextItem ? setOpenId(nextItem.notice.id) : close())}
          footNote={
            <span className="nl-kbd" aria-hidden>
              <kbd>Esc</kbd>
              {t('newsNoticeClose')}
              <kbd>←</kbd>
              <kbd>→</kbd>
            </span>
          }
          labels={{
            brand: t('newsNoticeBrand'),
            zoom: t('newsNoticeZoom'),
            link: t('newsNoticeLink'),
            addCalendar: t('newsNoticeAddCalendar'),
            past: t('newsNoticePast'),
            close: t('newsNoticeClose'),
          }}
        />
      )}

      {zoomSrc && (
        <Suspense fallback={null}>
          <ImageLightbox src={zoomSrc} alt={t('newsNoticePosterAlt')} caption={opened?.title} onClose={() => setZoomSrc(null)} />
        </Suspense>
      )}
    </div>
  )
}

// ── 다가오는 일정 — 포스터 카드 ─────────────────────────
// 포스터를 흐리게 깐 앰비언트 바탕 위에 포스터 원본 + D-day + 일시·장소.
// 여러 건이면 모바일은 옆으로 넘기는 트랙, PC 는 두 칸 격자(notice-archive.css).
const FeaturedCard = ({ item, onOpen }: { item: NoticeItem; onOpen: () => void }) => {
  const { t } = useLanguage()
  const { notice, when, place } = item
  const dday = when ? noticeDdayLabel(when) : null

  return (
    <button type="button" onClick={onOpen} className="na-feat group">
      {notice.image_url && (
        <span aria-hidden className="na-feat__amb" style={{ backgroundImage: `url("${notice.image_url}")` }} />
      )}
      <span className="na-feat__body">
        {notice.image_url ? (
          <img src={notice.image_url} alt="" className="na-feat__poster" />
        ) : (
          <span className="na-feat__poster na-feat__poster--none" aria-hidden>
            <NoticeBoardIcon width={30} height={30} />
          </span>
        )}
        <span className="na-feat__info">
          {dday && <span className="na-dday">{dday}</span>}
          <span className="na-feat__title">{notice.title}</span>
          <span className="na-feat__meta">
            {when && (
              <span className="na-meta-line">
                <CalendarIcon width={15} height={15} />
                {formatWhen(when, t)}
              </span>
            )}
            {place && (
              <span className="na-meta-line">
                <PinIcon width={15} height={15} />
                <span className="truncate">{place}</span>
              </span>
            )}
          </span>
          <span className="na-feat__cta">
            {t('newsNoticeDetail')}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform group-hover:translate-x-0.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </span>
      </span>
    </button>
  )
}

// ── 전체 목록 한 줄 ─────────────────────────────────────
const NoticeRow = ({ item, onOpen }: { item: NoticeItem; onOpen: () => void }) => {
  const { t } = useLanguage()
  const { notice, when, dday, place, snippet } = item
  const ddayLabel = when ? noticeDdayLabel(when) : null
  const ended = dday != null && dday < 0
  const fresh = calendarDaysSince(notice.created_at) <= 2

  return (
    <button type="button" onClick={onOpen} className={`na-row group${ended ? ' na-row--ended' : ''}`}>
      {notice.image_url ? (
        <img src={notice.image_url} alt="" loading="lazy" className="na-thumb" />
      ) : (
        <span className="na-thumb na-thumb--none" aria-hidden>
          <NoticeBoardIcon width={20} height={20} />
        </span>
      )}

      <span className="flex-1 min-w-0">
        <span className="na-row__top">
          {ddayLabel ? (
            <span className="na-tag na-tag--dday">{ddayLabel}</span>
          ) : ended ? (
            <span className="na-tag na-tag--ended">{t('newsNoticeEnded')}</span>
          ) : null}
          {fresh && !ended && <span className="na-tag na-tag--new">{t('newsNoticeNew')}</span>}
          <span className="na-row__posted">{t('newsNoticePosted').replace('{date}', formatPosted(notice.created_at, t))}</span>
        </span>
        <span className="na-row__title">{notice.title}</span>
        {when || place ? (
          <span className="na-row__meta">
            {when && (
              <span className="na-meta-line">
                <CalendarIcon width={14} height={14} />
                {formatWhen(when, t, false)}
              </span>
            )}
            {place && (
              <span className="na-meta-line min-w-0">
                <PinIcon width={14} height={14} />
                <span className="truncate">{place}</span>
              </span>
            )}
          </span>
        ) : snippet ? (
          <span className="na-row__snippet">{snippet}</span>
        ) : null}
      </span>

      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="na-row__chev">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}

// ── 작은 조각들 ────────────────────────────────────────
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="na-sec">{children}</p>
)

/** 실제 골격(머리 → 포스터 카드 → 인셋 리스트)을 그대로 세워 도착 순간 흔들림이 없게 */
const ArchiveSkeleton = () => (
  <div aria-hidden>
    <div className="na-sec"><span className="inline-block h-[1em] w-20 rounded bg-[var(--surface-inset)]" /></div>
    <div className="na-feat na-feat--skel mb-7 lg:mb-9" />
    <div className="na-list">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="na-row">
          <span className="na-thumb animate-pulse" />
          <span className="flex-1 space-y-2">
            <span className="block h-3 w-16 rounded bg-[var(--surface-inset)] animate-pulse" />
            <span className="block h-4 w-3/4 rounded bg-[var(--surface-inset)] animate-pulse" />
            <span className="block h-3 w-1/2 rounded bg-[var(--surface-inset)] animate-pulse" />
          </span>
        </div>
      ))}
    </div>
  </div>
)

const EmptyBox = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) => (
  <div className="rounded-2xl border border-[var(--card-border)] bg-white/80 dark:bg-card-dark px-6 py-12 text-center">
    <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--brand-soft-strong)] text-brand mb-2.5">
      {icon}
    </span>
    <p className="text-[13.5px] font-bold text-ink-strong mb-1">{title}</p>
    <p className="text-[12px] text-gray-500 dark:text-white/55">{desc}</p>
  </div>
)

export default NoticeArchiveSection
