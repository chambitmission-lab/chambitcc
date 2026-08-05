import type { Translation } from '../../../../locales'

interface EventDescriptionProps {
  description?: string
  attachmentUrl?: string
  t: Translation
}

export const EventDescription = ({
  description,
  attachmentUrl,
  t,
}: EventDescriptionProps) => {
  if (!description && !attachmentUrl) return null

  return (
    <section className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-4">
      <h2 className="text-ink-strong text-[15px] font-bold tracking-[-0.01em] mb-2.5">
        📝 {t.description}
      </h2>

      {description && (
        <p className="text-gray-600 dark:text-white/75 text-[14px] leading-[1.7] whitespace-pre-wrap">
          {description}
        </p>
      )}

      {attachmentUrl && (
        <a
          href={attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand text-[13px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors ${description ? 'mt-3.5' : ''}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          {t.attachment}
        </a>
      )}
    </section>
  )
}
