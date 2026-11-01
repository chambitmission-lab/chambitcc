import { useRef, useState } from 'react'
import type { Translation } from '../../../../locales'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { formatKstDateTime } from '../../../../utils/kstTime'
import { downloadEventIcs, type IcsEvent } from '../utils/calendarShare'

interface EventToolsProps {
  event: IcsEvent
  t: Translation
}

const toolClass =
  'flex-1 inline-flex items-center justify-center gap-1.5 h-11 lg:h-12 rounded-[14px] bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] text-gray-600 dark:text-white/75 text-[14px] lg:text-[15px] font-bold shadow-sm dark:shadow-none hover:border-[var(--brand-soft-strong)] hover:text-brand active:scale-[0.98] transition-all'

/** 초대장 아래 도구 줄 — 캘린더 담기 · 공유 */
export const EventTools = ({ event, t }: EventToolsProps) => {
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
    <div className="flex gap-2 mt-3">
      <button type="button" onClick={() => downloadEventIcs(event)} className={toolClass}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2.5" />
          <path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" />
        </svg>
        {t.addToCalendar}
      </button>
      <button type="button" onClick={handleShare} className={toolClass}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" />
        </svg>
        {copied ? t.linkCopied : t.share}
      </button>
    </div>
  )
}
