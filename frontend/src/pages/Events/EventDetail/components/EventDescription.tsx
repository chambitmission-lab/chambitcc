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
    <>
      {description && (
        <div className="event-description">
          <div className="section-badge">📝 {t.description}</div>
          <div className="description-card">
            <p>{description}</p>
          </div>
        </div>
      )}

      {attachmentUrl && (
        <div className="event-attachment">
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="attachment-link"
          >
            <span className="attachment-icon">📎</span>
            {t.attachment}
          </a>
        </div>
      )}
    </>
  )
}
