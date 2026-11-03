// 주보 소식 카드 보기 (D-1안) — 삽화 표지 + D-day 스티커 목차 + 항목 카드
// Single Responsibility: parseNewsDigest 결과를 그린다. 파싱은 parseNewsDigest.ts.
// 넓은 칸(≥720px, container query)에서는 스티커가 왼쪽 고정 목차로 바뀐다. 자세한 규칙은 newsDigest.css.
import { useState, type ReactNode } from 'react'
import { useLanguage } from '../../../../contexts/LanguageContext'
import type { Translation } from '../../../../locales'
import { copyToClipboard } from '../../../../utils/clipboard'
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

const anchorId = (no: number) => `nd-item-${no}`

const scrollToItem = (no: number) => {
  const el = document.getElementById(anchorId(no))
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

const NewsDigestView = ({ digest, rawContent, postDate }: NewsDigestViewProps) => {
  const { t, language } = useLanguage()
  const [showRaw, setShowRaw] = useState(false)
  const now = new Date()
  const statuses = digest.items.map((it) => (it.date ? statusOf(it.date, now) : null))

  const ddLabel = (s: DigestStatus | null): string | null => {
    if (!s) return null
    if (s.kind === 'today') return t('newsDigestToday')
    if (s.kind === 'ongoing') return t('newsDigestOngoing')
    if (s.kind === 'past') return t('newsDigestPast')
    return `D-${s.days}`
  }

  const count = (kinds: DigestStatus['kind'][]) => statuses.filter((s) => s && kinds.includes(s.kind)).length
  const summary = [
    [count(['today', 'ongoing']), 'newsDigestNowCount'],
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

      {/* 좁은 칸 — 스티커 목차 */}
      <div className="nd-stickers">
        {digest.items.map((it, i) => (
          <button key={it.no} type="button" className="nd-sticker" data-k={it.kind} onClick={() => scrollToItem(it.no)}>
            <span className={`nd-dd${statuses[i]?.kind === 'past' ? ' is-past' : ''}`}>{ddLabel(statuses[i]) ?? it.no}</span>
            <span className="nd-sticker-text">{it.title}</span>
          </button>
        ))}
      </div>

      <div className="nd-layout">
        {/* 넓은 칸 — 왼쪽 고정 목차 */}
        <nav className="nd-toc" aria-label={t('newsDigestToc')}>
          <h4>{t('newsDigestToc')}</h4>
          {digest.items.map((it, i) => (
            <button key={it.no} type="button" data-k={it.kind} onClick={() => scrollToItem(it.no)}>
              <span className="nd-toc-text">{it.title}</span>
              {ddLabel(statuses[i]) && (
                <span className={`nd-dd is-soft${statuses[i]?.kind === 'past' ? ' is-past' : ''}`}>{ddLabel(statuses[i])}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="nd-cards">
          {digest.items.map((it, i) => (
            <DigestCard key={it.no} item={it} status={statuses[i]} ddLabel={ddLabel(statuses[i])} />
          ))}
        </div>
      </div>

      <button type="button" className="nd-raw-btn" onClick={() => setShowRaw((v) => !v)} aria-expanded={showRaw}>
        {showRaw ? t('newsDigestHideRaw') : t('newsDigestShowRaw')}
      </button>
      {showRaw && <div className="nd-raw">{renderKeepTogether(rawContent)}</div>}
    </div>
  )
}

const DigestCard = ({ item, status, ddLabel }: { item: DigestItem; status: DigestStatus | null; ddLabel: string | null }) => {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const past = status?.kind === 'past'
  const highlight = status?.kind === 'today' || status?.kind === 'ongoing'

  const copy = async (phone: string) => {
    await copyToClipboard(phone)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <article id={anchorId(item.no)} className={`nd-card${past ? ' is-past' : ''}`} data-k={item.kind}>
      <span className="nd-tile">{KIND_ICON[item.kind]}</span>
      <div className="nd-card-body">
        <div className="nd-meta">
          <span>
            {t(KIND_LABEL[item.kind])}
            {item.date && ` · ${item.date.label}`}
          </span>
          {ddLabel && highlight && <span className="nd-dd">{ddLabel}</span>}
          {ddLabel && !highlight && <span className={`nd-dd is-soft${past ? ' is-past' : ''}`}>{ddLabel}</span>}
        </div>
        <h3 className="nd-card-title">{item.title}</h3>
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
      </div>
    </article>
  )
}

export default NewsDigestView
