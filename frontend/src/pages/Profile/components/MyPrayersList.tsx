import { useLanguage } from '../../../contexts/LanguageContext'
import type { MyPrayer } from '../../../types/profile'
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

interface MyPrayersListProps {
  prayers: MyPrayer[]
  onPrayerClick?: (prayerId: number) => void
}

const MyPrayersList = ({ prayers, onPrayerClick }: MyPrayersListProps) => {
  const { t, language } = useLanguage()

  if (prayers.length === 0) {
    return (
      <NotebookEmpty doodle="pencil" text={t('notebookEmptyPrayers')} hint={t('notebookEmptyPrayersHint')} />
    )
  }

  return (
    <div className="nb-grid">
      {prayers.map((prayer, index) => {
        const look = pickLook(prayer.id, prayer.emotion)
        // 비밀 기도는 감정 색 대신 무지 종이 + 자물쇠(목사님과 함께면 예배당) — 혼자 쓰는 쪽지 느낌
        const privateDoodle = prayer.shared_with_pastor ? 'church' : 'lock'
        return (
          <NotebookCard
            key={prayer.id}
            index={index}
            tone={prayer.is_private ? 'plain' : look.tone}
            onOpen={() => onPrayerClick?.(prayer.id)}
          >
            <div className="nb-date">{notebookDate(prayer.created_at, language)}</div>
            {prayer.title && <h4 className="nb-title">{prayer.title}</h4>}
            {prayer.is_private && (
              <span className="nb-badge">
                {prayer.shared_with_pastor ? t('pastorPrayerBadge') : t('privatePrayerBadge')}
              </span>
            )}
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
                {prayer.is_private ? (
                  <div className="nb-meta-row">{t('privatePrayerStatus')}</div>
                ) : (
                  <div className="nb-meta-row">
                    <HeartRow count={prayer.prayer_count} />
                    {t('notebookPrayingWith').replace('{n}', String(prayer.prayer_count))}
                  </div>
                )}
                <div className="nb-meta-row">
                  {!prayer.is_private && <>{t('myReplies')} {prayer.reply_count} · </>}
                  {getRelativeTime(prayer.created_at)}
                </div>
              </div>
              <Doodle name={prayer.is_private ? privateDoodle : look.doodle} />
            </div>
          </NotebookCard>
        )
      })}
    </div>
  )
}

export default MyPrayersList
