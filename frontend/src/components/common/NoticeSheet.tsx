/**
 * 공지 한 건을 읽는 "빛 드는 공지" 시트 — 홈 팝업(HomeNotice)과 /news 공지 보관함이 같이 쓴다.
 *
 * 모바일은 아래에서 올라오는 시트(위 포스터 · 아래 핵심 정보와 엄지 버튼),
 * PC(lg)는 가운데 2단 모달(왼쪽 포스터 전체 · 오른쪽 정보). 같은 DOM 을 CSS 가 두 모양으로
 * 접는다(NoticeSheet.css .nl-*). 위에서 내려오는 빛 · 포스터가 밝아짐 · 제목이 한 글자씩
 * 켜짐은 교회 이름 '참빛'의 모티프 — 라이트는 새벽빛, 다크는 예배당 촛불빛.
 *
 * 포스터 밖 정보(일시·장소 표, 성구, 순서 타임라인, D-day)는 본문 문법에서 읽는다
 * (utils/noticeHighlights) — 스키마 변경 없음.
 *
 * 두 화면의 차이는 슬롯으로만 받는다: 키커 문구, 주 버튼, 바로 아래 보조 줄(오늘은 그만 보기 등),
 * '지난 공지 모두 보기' 같은 하단 링크. 닫기·뒤로가기·키보드는 부르는 쪽이 책임진다.
 */
import { useMemo, type ReactNode } from 'react'
import NoticeContent from './NoticeContent'
import { SheetGrabber } from './SheetGrabber'
import { stripInline } from '../../utils/noticeMarkup'
import {
  downloadNoticeIcs,
  extractNoticeHighlights,
  noticeDday,
  noticeDdayLabel,
  type NoticeWhen,
} from '../../utils/noticeHighlights'
import type { Notification } from '../../types/notification'
import './NoticeSheet.css'

export interface NoticeSheetLabels {
  brand: string
  zoom: string
  link: string
  addCalendar: string
  past: string
  close: string
}

const DEFAULT_LABELS: NoticeSheetLabels = {
  brand: '참빛 소식',
  zoom: '크게 보기',
  link: '바로가기',
  addCalendar: '일정 담기',
  past: '지난 일정',
  close: '닫기',
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })

/**
 * 제목이 한 글자씩 켜진다 — 어절은 줄바꿈되지 않게 묶고(한글 keep-all), 글자는 inline 이라
 * 줄바꿈 규칙을 깨지 않는다. 긴 제목도 1.3초 안에 다 켜지도록 간격을 줄인다.
 */
const GlowTitle = ({ text }: { text: string }) => {
  const chars = Array.from(text)
  const step = Math.min(0.08, 1.3 / Math.max(chars.length, 1))
  let n = 0
  return (
    <h2 className="nl-title" aria-label={text}>
      {text.split(/(\s+)/).map((word, wi) =>
        /^\s+$/.test(word) ? (
          <span key={wi}> </span>
        ) : (
          <span key={wi} className="nl-title__word" aria-hidden>
            {Array.from(word).map((ch, ci) => (
              <span key={ci} style={{ animationDelay: `${0.7 + step * n++}s` }}>
                {ch}
              </span>
            ))}
          </span>
        ),
      )}
    </h2>
  )
}

export interface NoticeSheetProps {
  notice: Notification
  /** 제목 위 작은 줄 — '공지 · 1/3' */
  kicker: ReactNode
  onClose: () => void
  onZoom: (src: string) => void
  /** link_url 이 있을 때 '바로가기' */
  onLink?: () => void
  /** 본문 맨 아래 한 단계 낮은 링크 — 홈은 '지난 공지 모두 보기' */
  moreLink?: { label: string; onClick: () => void }
  primaryLabel: string
  onPrimary: () => void
  /** 주 버튼 아래 보조 줄(오늘은 그만 보기 · 다시 안 보기 / 키보드 힌트) */
  footNote?: ReactNode
  labels?: Partial<NoticeSheetLabels>
}

const NoticeSheet = ({
  notice,
  kicker,
  onClose,
  onZoom,
  onLink,
  moreLink,
  primaryLabel,
  onPrimary,
  footNote,
  labels: labelOverrides,
}: NoticeSheetProps) => {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides }
  const highlights = useMemo(() => extractNoticeHighlights(notice.content), [notice.content])
  const ddayValue = highlights.when ? noticeDday(highlights.when) : null
  const ddayLabel = highlights.when ? noticeDdayLabel(highlights.when) : null
  const isPast = ddayValue != null && ddayValue < 0
  const statusChip = ddayLabel ? (
    <span className="nl-chip nl-chip--dday">{ddayLabel}</span>
  ) : isPast ? (
    <span className="nl-chip nl-chip--past">{labels.past}</span>
  ) : null

  return (
    <div className="nl-backdrop fixed inset-0 z-[120]" onClick={onClose}>
      <span aria-hidden className="nl-beam" />
      <div
        key={notice.id}
        data-sheet-root
        className={`nl-card${notice.image_url ? '' : ' nl-card--plain'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={notice.title}
      >
        <SheetGrabber onClose={onClose} className="nl-grab sheet-grabber absolute" />
        <button type="button" onClick={onClose} aria-label={labels.close} className="nl-close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {notice.image_url && (
          <button
            type="button"
            onClick={() => onZoom(notice.image_url as string)}
            aria-label={`${notice.title} ${labels.zoom}`}
            className="nl-media"
          >
            <span aria-hidden className="nl-media__amb" style={{ backgroundImage: `url("${notice.image_url}")` }} />
            <span aria-hidden className="nl-media__beam" />
            <img src={notice.image_url} alt="" className="nl-media__img" />
            <span aria-hidden className="nl-media__sheen" />
            <span className="nl-chips">
              <span className="nl-chip">{labels.brand}</span>
              {statusChip}
            </span>
            <span className="nl-chip nl-zoom">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.2-3.2M11 8.5v5M8.5 11h5" />
              </svg>
              {labels.zoom}
            </span>
          </button>
        )}

        <div className="nl-info">
          <span aria-hidden className="nl-info__glow" />
          <div className="nl-scroll">
            <div className="nl-rise">
              <p className="nl-kick">
                {kicker}
                {!notice.image_url && statusChip}
              </p>
              <GlowTitle text={notice.title} />
              <p className="nl-meta">{formatDate(notice.created_at)} · 참빛교회</p>
            </div>

            {highlights.rows.length > 0 && (
              <dl className="nl-rows nl-rise">
                {highlights.rows.map((r) => (
                  <div key={`${r.label}-${r.value}`} className="nl-row">
                    <dt>{r.label}</dt>
                    <dd>{stripInline(r.value)}</dd>
                  </div>
                ))}
              </dl>
            )}

            {/* 짧은 줄 묶음으로 쓴 순서 — 금빛 점이 이어지는 한 줄기 타임라인 */}
            {highlights.program && (
              <ol className="nl-prog nl-rise">
                {highlights.program.map((item, i) => (
                  <li key={`${i}-${item.title}`} className="nl-prog__item">
                    <span aria-hidden className="nl-prog__dot" />
                    <p className="nl-prog__title">{item.title}</p>
                    {item.details.map((d, j) => (
                      <p key={j} className="nl-prog__detail">
                        {d.label && <span className="nl-prog__label">{d.label}</span>}
                        {d.text}
                      </p>
                    ))}
                  </li>
                ))}
              </ol>
            )}

            {highlights.verse && (
              <p className="nl-verse nl-rise">
                {highlights.verse.text} <small>{highlights.verse.ref}</small>
              </p>
            )}

            {highlights.rest && (
              <div className="nl-content nl-rise">
                <NoticeContent source={highlights.rest} />
              </div>
            )}

            {(notice.link_url && onLink) || moreLink ? (
              <div className="nl-more nl-rise">
                {notice.link_url && onLink && (
                  <button type="button" onClick={onLink} className="nl-more__link">
                    {labels.link}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                )}
                {moreLink && (
                  <button type="button" onClick={moreLink.onClick} className="nl-more__archive">
                    {moreLink.label}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {/* 푸터 — 주 동작 하나, 일정 담기는 앞으로 올 날짜를 읽은 공지만 */}
          <div className="nl-foot">
            <div className="nl-act">
              {highlights.when && !isPast && (
                <button
                  type="button"
                  onClick={() => downloadNoticeIcs(notice, highlights.when as NoticeWhen, highlights.place)}
                  className="nl-btn nl-btn--sec"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="3" y="4.5" width="18" height="16" rx="3" />
                    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
                  </svg>
                  {labels.addCalendar}
                </button>
              )}
              <button type="button" onClick={onPrimary} className="nl-btn nl-btn--pri">
                {primaryLabel}
              </button>
            </div>
            {footNote && <div className="nl-links">{footNote}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoticeSheet
