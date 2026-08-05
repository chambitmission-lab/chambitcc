import { useRef, useState } from 'react'
import type { Event } from '../../../../types/event'
import type { Translation } from '../../../../locales'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { formatKstDateTime } from '../../../../utils/kstTime'
import { downloadEventIcs, buildMapSearchUrl } from '../utils/calendarShare'

interface QuickActionsProps {
  event: Event
  t: Translation
}

const pillClass =
  'flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] text-gray-700 dark:text-white/80 text-[12.5px] font-bold shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[var(--brand-soft-strong)] hover:bg-[var(--brand-soft)] hover:text-brand active:scale-[0.98] transition-all'

export const QuickActions = ({ event, t }: QuickActionsProps) => {
  const { language } = useLanguage()
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<number | undefined>(undefined)

  const handleShare = async () => {
    const url = window.location.href
    const text = `${event.title} — ${formatKstDateTime(event.start_datetime, language)}`
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text, url })
      } catch {
        // 사용자가 공유 시트를 닫은 경우 — 무시
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.clearTimeout(copiedTimer.current)
      copiedTimer.current = window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // 클립보드 접근 불가 환경 — 조용히 무시
    }
  }

  return (
    <div className="flex gap-2 px-4 mt-3">
      <button type="button" onClick={() => downloadEventIcs(event)} className={pillClass}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="12" y1="14" x2="12" y2="18" />
          <line x1="10" y1="16" x2="14" y2="16" />
        </svg>
        {t.addToCalendar}
      </button>

      {event.location && (
        <a
          href={buildMapSearchUrl(event.location)}
          target="_blank"
          rel="noopener noreferrer"
          className={pillClass}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {t.viewMap}
        </a>
      )}

      <button type="button" onClick={handleShare} className={pillClass}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
          <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
        </svg>
        {copied ? t.linkCopied : t.share}
      </button>
    </div>
  )
}
