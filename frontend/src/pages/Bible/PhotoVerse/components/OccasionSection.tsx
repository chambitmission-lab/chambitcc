import type { Language } from '../../../../locales'
import { GREETING_MAX, OCCASIONS } from '../occasions'
import type { CardOccasion } from '../occasions'
import type { PhotoVerseTexts } from '../texts'

interface OccasionSectionProps {
  t: PhotoVerseTexts
  language: Language
  occasionId: string | null
  occasion: CardOccasion | undefined
  greeting: string
  greetingEditing: boolean
  isLock: boolean
  onStartOccasion: (o: CardOccasion) => void
  onGreetingChange: (v: string) => void
  onGreetingEditing: (editing: boolean) => void
  onNextVerse: () => void
}

/** 상황 · 인사말 — 상황을 고르면 말씀·인사말·룩이 함께 바뀐다. 인사말은 직접 고칠 수 있다 */
const OccasionSection = ({
  t,
  language,
  occasionId,
  occasion,
  greeting,
  greetingEditing,
  isLock,
  onStartOccasion,
  onGreetingChange,
  onGreetingEditing,
  onNextVerse,
}: OccasionSectionProps) => (
  <div className="pv-section">
    <p className="pv-section__title">{t.occasionTitle}</p>
    <div className="pv-occasion-row" role="radiogroup" aria-label={t.occasionTitle}>
      {OCCASIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={occasionId === o.id}
          className={`pv-occasion-chip${occasionId === o.id ? ' pv-occasion-chip--active' : ''}`}
          onClick={() => onStartOccasion(o)}
        >
          <span className="material-icons-round text-[16px]" aria-hidden="true">{o.icon}</span>
          {language === 'ko' ? o.nameKo : o.nameEn}
        </button>
      ))}
    </div>
    <div className="pv-greeting">
      {greetingEditing ? (
        <input
          type="text"
          className="pv-greeting__input"
          value={greeting}
          maxLength={GREETING_MAX}
          placeholder={t.greetingPlaceholder}
          enterKeyHint="done"
          autoFocus
          onChange={(e) => onGreetingChange(e.target.value)}
          onBlur={() => onGreetingEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onGreetingEditing(false)
          }}
        />
      ) : (
        <button type="button" className="pv-greeting__chip" onClick={() => onGreetingEditing(true)}>
          <span className="material-icons-round text-[16px]">draw</span>
          <span className="pv-greeting__text">{greeting.trim() || t.greetingAdd}</span>
        </button>
      )}
      {greeting && !greetingEditing && (
        <button
          type="button"
          className="pv-greeting__remove"
          aria-label={t.greetingRemove}
          onClick={() => onGreetingChange('')}
        >
          <span className="material-icons-round text-[16px]">close</span>
        </button>
      )}
      {occasion && occasion.verses.length > 1 && (
        <button type="button" className="pv-greeting__chip pv-greeting__chip--plain" onClick={onNextVerse}>
          <span className="material-icons-round text-[16px]">autorenew</span>
          {t.otherVerse}
        </button>
      )}
    </div>
    {greeting.trim() && (
      <p className="pv-section__note">{isLock ? t.greetingLockNote : t.greetingHint}</p>
    )}
  </div>
)

export default OccasionSection
