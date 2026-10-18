import { useLanguage } from '../../../contexts/LanguageContext'
import type { MyReply } from '../../../types/profile'
import { getRelativeTime } from '../../../utils/dateUtils'
import ExpandableText from './ExpandableText'
import {
  Doodle,
  NotebookCard,
  NotebookEmpty,
} from './PrayerNotebook'
import { RULED_TEXT, RULED_TOGGLE, notebookDate, pickLook } from './notebookLook'

interface MyRepliesListProps {
  replies: MyReply[]
  onReplyClick?: (prayerId: number) => void
}

const MyRepliesList = ({ replies, onReplyClick }: MyRepliesListProps) => {
  const { t, language } = useLanguage()

  // 익명 표시 이름 — "익명" 대신 마 6:6의 골방 기도자 (피드와 동일, 데이터 값은 그대로 둔다)
  const shownName = (displayName: string) =>
    displayName === '익명' || displayName === 'Anonymous' ? t('anonymousDisplayName') : displayName

  if (replies.length === 0) {
    return (
      <NotebookEmpty doodle="bubble" text={t('notebookEmptyReplies')} hint={t('notebookEmptyRepliesHint')} />
    )
  }

  return (
    <div className="nb-grid">
      {replies.map((reply, index) => {
        // 같은 기도에 남긴 댓글끼리는 같은 종이 색 — 기도 id 로 톤을 고른다
        const look = pickLook(reply.prayer_id)
        return (
          <NotebookCard
            key={reply.id}
            index={index}
            tone={look.tone}
            onOpen={() => onReplyClick?.(reply.prayer_id)}
          >
            <div className="nb-date">{notebookDate(reply.created_at, language)}</div>
            <div className="nb-by truncate">
              {reply.prayer_title
                ? t('notebookOnPrayer').replace('{title}', reply.prayer_title)
                : t('notebookOnPrayerUntitled')}
            </div>
            {/* 내가 건넨 말은 손글씨로 — 쪽지에 적어 건넨 느낌 */}
            <ExpandableText
              text={reply.content}
              lines={3}
              className="mt-1.5"
              textClassName={`${RULED_TEXT} nb-ruled--hand`}
              toggleClassName={RULED_TOGGLE}
            />
            <div className="nb-foot">
              <div className="nb-meta">
                <div className="nb-meta-row">
                  {shownName(reply.display_name)}{t('profileWrittenAs')} · {getRelativeTime(reply.created_at)}
                </div>
              </div>
              <Doodle name="bubble" />
            </div>
          </NotebookCard>
        )
      })}
    </div>
  )
}

export default MyRepliesList
