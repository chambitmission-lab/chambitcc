import { useLanguage } from '../../../contexts/LanguageContext'
import type { PrayingFor } from '../../../types/profile'
import { getRelativeTime } from '../../../utils/dateUtils'
import ExpandableText from './ExpandableText'
import {
  AnsweredStamp,
  Doodle,
  HeartRow,
  NotebookCard,
  NotebookEmpty,
} from './PrayerNotebook'
import { RULED_TEXT, RULED_TOGGLE, notebookDate, pickLook, stampDate } from './notebookLook'

interface PrayingForListProps {
  prayers: PrayingFor[]
  onPrayerClick?: (prayerId: number) => void
}

const PrayingForList = ({ prayers, onPrayerClick }: PrayingForListProps) => {
  const { t, language } = useLanguage()

  // 익명 표시 이름 — "익명" 대신 마 6:6의 골방 기도자 (피드와 동일, 데이터 값은 그대로 둔다)
  const shownName = (displayName: string) =>
    displayName === '익명' || displayName === 'Anonymous' ? t('anonymousDisplayName') : displayName

  if (prayers.length === 0) {
    return (
      <NotebookEmpty doodle="heart" text={t('notebookEmptyPraying')} hint={t('notebookEmptyPrayingHint')} />
    )
  }

  return (
    <div className="nb-grid">
      {prayers.map((prayer, index) => {
        const look = pickLook(prayer.id, prayer.emotion)
        return (
          <NotebookCard
            key={prayer.id}
            index={index}
            tone={look.tone}
            onOpen={() => onPrayerClick?.(prayer.id)}
          >
            {/* 날짜 줄은 '내가 함께 기도한 날' — 이 탭의 기록은 그날의 내 발걸음이다 */}
            <div className="nb-date">{notebookDate(prayer.prayed_at, language)}</div>
            <div className="nb-by">
              {t('notebookPrayerOf').replace('{name}', shownName(prayer.display_name))}
            </div>
            {prayer.title && <h4 className="nb-title">{prayer.title}</h4>}
            <ExpandableText
              text={prayer.content}
              lines={3}
              className="mt-1.5"
              textClassName={RULED_TEXT}
              toggleClassName={RULED_TOGGLE}
            />
            {prayer.is_answered && (
              <AnsweredStamp label={t('notebookAnswered')} date={stampDate(prayer.answered_at)} />
            )}
            <div className="nb-foot">
              <div className="nb-meta">
                <div className="nb-meta-row">
                  <HeartRow count={prayer.prayer_count} />
                  {t('notebookPrayingWith').replace('{n}', String(prayer.prayer_count))}
                </div>
                <div className="nb-meta-row">
                  {getRelativeTime(prayer.prayed_at)} {t('profilePrayedAt')}
                </div>
              </div>
              <Doodle name={look.doodle} />
            </div>
          </NotebookCard>
        )
      })}
    </div>
  )
}

export default PrayingForList
