import type { Event } from '../../../../types/event'
import type { Translation } from '../../../../locales'
import { SectionCard } from './EventAvatar'
import { ChurchGlyph } from './EventDetailIcons'

interface EventGuideCardProps {
  event: Pick<Event, 'description' | 'attachment_url' | 'group'>
  t: Translation
}

/** 모임 안내 — 설명을 주최 측 말풍선으로 */
export const EventGuideCard = ({ event, t }: EventGuideCardProps) => {
  const { description, attachment_url: attachmentUrl, group } = event
  if (!description && !attachmentUrl) return null
  const host = group?.name ?? t.hostChurch

  return (
    <SectionCard title={t.guideTitle}>
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-[var(--brand-soft-strong)] text-brand flex items-center justify-center shrink-0">
          <ChurchGlyph size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-gray-500 dark:text-white/50 text-[13px] font-bold mb-1.5">
            {host} · {t.hostLabel}
          </p>
          {description && (
            <p className="evd-bubble-host inline-block max-w-full bg-[var(--app-canvas)] px-4 py-3 text-ink-strong text-[16px] lg:text-[17.5px] leading-[1.7] whitespace-pre-wrap break-words">
              {description}
            </p>
          )}
          {attachmentUrl && (
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex w-fit items-center gap-1.5 h-10 px-4 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand text-[14px] lg:text-[15px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors ${description ? 'mt-2.5' : ''}`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              {t.attachment}
            </a>
          )}
        </div>
      </div>
    </SectionCard>
  )
}
