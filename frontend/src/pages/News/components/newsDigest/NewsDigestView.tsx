// 주보 소식 카드 보기 (2026-11 A안 '챙길 일 순서') — 삽화 표지 + 세 묶음 접이식 목록
// Single Responsibility: parseNewsDigest 결과를 그린다. 파싱은 parseNewsDigest.ts.
// 주보 번호 순서 대신 "언제 무엇을 챙기나" 순서로 다시 묶는다:
//   1) 이번 주 챙길 일 — 오늘·진행 중 먼저, 그다음 다가오는 일정 가까운 순. 왼쪽 D-day 칸
//   2) 알아 두세요   — 날짜 없는 안내(넓은 칸 2열)
//   3) 지난 일정     — 기본 접힘
// 한 줄 = 제목만, 눌러야 설명·시간·장소가 펼쳐진다. 예전 왼쪽 고정 목차·스티커 목차는 이 구조로 대체(폐지).
import { useState, type ReactNode } from 'react'
import { useLanguage } from '../../../../contexts/LanguageContext'
import type { Translation } from '../../../../locales'
import { copyToClipboard } from '../../../../utils/clipboard'
import { formatMonthDay } from '../../../../utils/date'
import { renderKeepTogether } from '../../../../utils/keepTogether'
import { statusOf, type DigestItem, type DigestKind, type DigestStatus, type NewsDigest } from './parseNewsDigest'
import './newsDigest.css'

interface NewsDigestViewProps {
  digest: NewsDigest
  /** 원문 — "주보 원문 보기"로 언제든 대조할 수 있게 */
  rawContent: string
  postDate: Date
}

const KIND_LABEL: Record<DigestKind, keyof Translation> = {
  worship: 'newsDigestKindWorship',
  prayer: 'newsDigestKindPrayer',
  meet: 'newsDigestKindMeet',
  apply: 'newsDigestKindApply',
  event: 'newsDigestKindEvent',
  share: 'newsDigestKindShare',
  notice: 'newsDigestKindNotice',
}

const svg = (children: ReactNode, className = 'nd-ico') => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    {children}
  </svg>
)

const KIND_ICON: Record<DigestKind, ReactNode> = {
  worship: svg(<path d="M12 3v5M9.5 5.5h5M5 21V12l7-4 7 4v9M10 21v-4a2 2 0 0 1 4 0v4" />),
  prayer: svg(<><path d="M12 3c2 3 3 4.5 3 6.5a3 3 0 0 1-6 0C9 7.5 10 6 12 3z" /><path d="M8 21h8M9 21v-6h6v6" /></>),
  meet: svg(<><circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path d="M2.5 20c.8-3 3-4.5 5.5-4.5S12.7 17 13.5 20M12 16.2c.9-.5 2-.7 4-.7 2.5 0 4.7 1.5 5.5 4.5" /></>),
  apply: svg(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>),
  event: svg(<path d="M5 21V4M5 4h11l-2 4 2 4H5" />),
  share: svg(<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /></>),
  notice: svg(<><path d="M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1z" /><path d="M16 9a3.5 3.5 0 0 1 0 6" /></>),
}
const ICON_CLOCK = svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)
const ICON_PIN = svg(<><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>)
const ICON_USER = svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>)

const ICON_CHEV = svg(<path d="M6 9l6 6 6-6" />, 'nd-ico nd-chev')

interface Entry {
  item: DigestItem
  status: DigestStatus | null
}

const NOW_KINDS: DigestStatus['kind'][] = ['today', 'ongoing']

const NewsDigestView = ({ digest, rawContent, postDate }: NewsDigestViewProps) => {
  const { t, language } = useLanguage()
  const [showRaw, setShowRaw] = useState(false)
  const [showPast, setShowPast] = useState(false)
  const [open, setOpen] = useState<Set<number>>(() => new Set())
  const now = new Date()
  const entries: Entry[] = digest.items.map((item) => ({ item, status: item.date ? statusOf(item.date, now) : null }))

  // 오늘·진행 중 → 다가오는 순. 같은 묶음 안에서는 시작일이 빠른 것부터
  const upcoming = entries
    .filter((e) => e.status && e.status.kind !== 'past')
    .sort((a, b) => {
      const an = NOW_KINDS.includes(a.status!.kind) ? 0 : 1
      const bn = NOW_KINDS.includes(b.status!.kind) ? 0 : 1
      return an - bn || a.item.date!.start.getTime() - b.item.date!.start.getTime()
    })
  const notices = entries.filter((e) => !e.status)
  const past = entries.filter((e) => e.status?.kind === 'past')

  const count = (kinds: DigestStatus['kind'][]) => entries.filter((e) => e.status && kinds.includes(e.status.kind)).length
  const summary = [
    [count(NOW_KINDS), 'newsDigestNowCount'],
    [count(['upcoming']), 'newsDigestUpcomingCount'],
    [count(['past']), 'newsDigestPastCount'],
  ] as const
  const summaryText = summary
    .filter(([n]) => n > 0)
    .map(([n, key]) => t(key).replace('{n}', String(n)))
    .join(' · ')

  const eyebrow = t('newsDigestEyebrow').replace(
    '{date}',
    postDate.toLocaleDateString(language === 'en' ? 'en-US' : 'ko-KR', { month: 'long', day: 'numeric' }),
  )

  const toggle = (no: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(no)) next.delete(no)
      else next.add(no)
      return next
    })
  const visible = [...upcoming, ...notices, ...(showPast ? past : [])]
  const allOpen = visible.length > 0 && visible.every((e) => open.has(e.item.no))
  const toggleAll = () => setOpen(allOpen ? new Set() : new Set(visible.map((e) => e.item.no)))
  const allButton = (
    <button type="button" className="nd-all" onClick={toggleAll}>
      {allOpen ? t('newsDigestCollapseAll') : t('newsDigestExpandAll')}
    </button>
  )

  const row = (e: Entry, variant: 'dated' | 'info') => (
    <DigestRow key={e.item.no} entry={e} variant={variant} open={open.has(e.item.no)} onToggle={() => toggle(e.item.no)} />
  )

  return (
    <div className="nd-root">
      <section className="nd-hero">
        <span className="nd-hero-eb">{eyebrow}</span>
        <h3 className="nd-hero-title">
          {t('newsDigestHeadline')} <b>{t('newsDigestCount').replace('{n}', String(digest.items.length))}</b>
        </h3>
        {summaryText && <p className="nd-hero-sub">{summaryText}</p>}
      </section>

      {digest.intro && <p className="nd-intro">{renderKeepTogether(digest.intro)}</p>}

      {upcoming.length > 0 && (
        <section className="nd-sec">
          <div className="nd-sec-h">
            <h4>{t('newsDigestUpcomingTitle')}</h4>
            <span>{t('newsDigestUpcomingSub').replace('{n}', String(upcoming.length))}</span>
            {allButton}
          </div>
          <div className="nd-list">{upcoming.map((e) => row(e, 'dated'))}</div>
        </section>
      )}

      {notices.length > 0 && (
        <section className="nd-sec">
          <div className="nd-sec-h">
            <h4>{t('newsDigestInfoTitle')}</h4>
            <span>{t('newsDigestInfoSub').replace('{n}', String(notices.length))}</span>
            {upcoming.length === 0 && allButton}
          </div>
          <div className="nd-info">{notices.map((e) => row(e, 'info'))}</div>
        </section>
      )}

      {past.length > 0 && (
        <section className="nd-sec">
          <button
            type="button"
            className="nd-past-btn"
            aria-expanded={showPast}
            aria-controls="nd-past-list"
            onClick={() => setShowPast((v) => !v)}
          >
            <span className="nd-past-label">
              <b>{t('newsDigestPastToggle').replace('{n}', String(past.length))}</b>
              <span>{past.map((e) => e.item.title).join(', ')}</span>
            </span>
            {ICON_CHEV}
          </button>
          {showPast && (
            <div id="nd-past-list" className="nd-list is-past">
              {past.map((e) => row(e, 'dated'))}
            </div>
          )}
        </section>
      )}

      <button type="button" className="nd-raw-btn" onClick={() => setShowRaw((v) => !v)} aria-expanded={showRaw}>
        {showRaw ? t('newsDigestHideRaw') : t('newsDigestShowRaw')}
      </button>
      {showRaw && <div className="nd-raw">{renderKeepTogether(rawContent)}</div>}
    </div>
  )
}

interface DigestRowProps {
  entry: Entry
  variant: 'dated' | 'info'
  open: boolean
  onToggle: () => void
}

const DigestRow = ({ entry: { item, status }, variant, open, onToggle }: DigestRowProps) => {
  const { t, language } = useLanguage()
  const bodyId = `nd-body-${item.no}`
  const lang = language === 'en' ? 'en' : 'ko'
  const isNow = status?.kind === 'today' || status?.kind === 'ongoing'
  const isPast = status?.kind === 'past'

  let whenBig = ''
  let whenSmall = ''
  if (status && item.date) {
    const startLabel = formatMonthDay(item.date.start, { lang })
    if (status.kind === 'today') whenBig = t('newsDigestToday')
    else if (status.kind === 'ongoing') whenBig = t('newsDigestOngoing')
    else if (isPast) whenBig = t('newsDigestPast')
    else whenBig = `D-${status.days}`
    whenSmall =
      status.kind === 'ongoing' ? t('newsDigestUntil').replace('{date}', formatMonthDay(item.date.end, { lang })) : startLabel
  }

  return (
    <div className={`nd-row${open ? ' is-open' : ''}`} data-k={item.kind}>
      <button type="button" className={`nd-row-head is-${variant}`} aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
        {variant === 'dated' ? (
          <span className={`nd-when${isNow ? ' is-now' : ''}${isPast ? ' is-past' : ''}`}>
            <b>{whenBig}</b>
            <small>{whenSmall}</small>
          </span>
        ) : (
          <span className="nd-tile">{KIND_ICON[item.kind]}</span>
        )}
        <span className="nd-row-main">
          <span className="nd-row-title">{item.title}</span>
          {variant === 'dated' && (
            <span className="nd-row-meta">
              <i>{t(KIND_LABEL[item.kind])}</i>
              {item.date && <span>{item.date.label}</span>}
            </span>
          )}
        </span>
        {ICON_CHEV}
      </button>
      {open && (
        <div id={bodyId} className="nd-row-body">
          <DigestDetail item={item} />
        </div>
      )}
    </div>
  )
}

const DigestDetail = ({ item }: { item: DigestItem }) => {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)

  const copy = async (phone: string) => {
    await copyToClipboard(phone)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      {item.desc && <p className="nd-desc">{renderKeepTogether(item.desc)}</p>}
      {(item.time || item.place || item.who) && (
        <div className="nd-pills">
          {item.time && <span className="nd-pill">{ICON_CLOCK}{item.time}</span>}
          {item.place && <span className="nd-pill">{ICON_PIN}{item.place}</span>}
          {item.who && <span className="nd-pill is-who">{ICON_USER}{item.who}</span>}
        </div>
      )}
      {item.table && (
        <div className="nd-table-wrap">
          <table className="nd-table">
            <thead>
              <tr>
                {item.table[0].map((cell, i) => (
                  <th key={i}>{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {item.table.slice(1).map((row, r) => (
                <tr key={r}>
                  {row.map((cell, i) => (
                    <td key={i}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {item.notes.map((note) => (
        <p key={note} className="nd-note">{renderKeepTogether(note)}</p>
      ))}
      {item.contact && (
        <div className="nd-call">
          <span>
            {item.contact.name && `${item.contact.name} `}
            <b className="whitespace-nowrap">{item.contact.phone}</b>
          </span>
          <button type="button" onClick={() => copy(item.contact!.phone)}>
            {copied ? t('newsDigestCopied') : t('newsDigestCopy')}
          </button>
        </div>
      )}
    </>
  )
}

export default NewsDigestView
