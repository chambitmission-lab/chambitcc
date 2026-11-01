import { useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useEventDetail } from '../../../hooks/useEvents'
import { translations } from '../../../locales'
import { useEventActions } from './hooks/useEventActions'
import { useCommentActions } from './hooks/useCommentActions'
import {
  EventInvitation,
  EventReplyCard,
  EventTools,
  EventGuideCard,
  EventPlaceCard,
  EventPeopleCard,
  EventThread,
  EventAlbumLinkCard,
  SeatBookingLinkCard,
} from './components'
import './EventDetail.css'

/* C안 "초대장 + 모임 이야기"
 * 모바일: 한 줄(초대장 → 응답 → 도구 → 안내 → 장소 → 참석자 → 이야기)
 * PC(lg): 왼쪽 420px 초대장·응답 스티키(.evd-left) / 오른쪽 안내·장소·참석자·이야기 */
const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="evd-shell bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100 transition-colors duration-200 min-h-screen page-stage">
    <div className="max-w-md mx-auto relative min-h-screen px-4 pb-24 lg:max-w-[1180px] lg:px-8 lg:pb-16">
      {children}
    </div>
  </div>
)

const cardSkeleton = 'rounded-[22px] bg-gray-100 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] animate-pulse'

const EventDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = translations[language]
  const { event, loading, error, refresh } = useEventDetail(Number(id))

  const { handleAttend, handleCancelAttendance } = useEventActions(Number(id), refresh, t)

  const {
    comment,
    setComment,
    submitting,
    isLoggedIn: isLoggedInForComments,
    handleSubmitComment,
    handleDeleteComment,
  } = useCommentActions(Number(id), refresh, t)

  const backButton = (
    <div className="pt-4 pb-3 lg:pt-6 lg:pb-4">
      <button
        type="button"
        onClick={() => navigate('/events')}
        className="inline-flex items-center gap-1 h-10 pl-1.5 pr-3.5 -ml-1.5 rounded-full text-ink-strong text-[15px] lg:text-[16px] font-bold hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-[0.97] transition-all"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t.title}
      </button>
    </div>
  )

  if (loading) {
    return (
      <Shell>
        {backButton}
        <div className="lg:grid lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-9">
          <div>
            <div className="h-[380px] lg:h-[430px] rounded-[28px] bg-[var(--brand-soft-strong)] animate-pulse" />
            <div className={`${cardSkeleton} h-40 mt-3.5`} />
          </div>
          <div className="flex flex-col gap-4 mt-8 lg:mt-0">
            {[0, 1, 2].map(i => (
              <div key={i} className={`${cardSkeleton} h-36`} />
            ))}
          </div>
        </div>
      </Shell>
    )
  }

  if (error || !event) {
    return (
      <Shell>
        {backButton}
        <div className="max-w-md mx-auto mt-10 rounded-[22px] bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] p-8 text-center">
          <p className="text-[32px] mb-6" aria-hidden="true">😢</p>
          <p className="text-gray-500 dark:text-white/55 text-[14px] mb-5">{error || t.error}</p>
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="h-10 px-5 rounded-xl bg-[var(--brand)] text-white text-[13.5px] font-bold hover:bg-[var(--brand-dim)] transition-colors"
          >
            {t.back}
          </button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      {backButton}

      <div className="lg:grid lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-9 lg:items-start">
        <div className="evd-left">
          <EventInvitation event={event} t={t} />
          <EventReplyCard
            userAttendanceStatus={event.user_attendance_status ?? undefined}
            onAttend={handleAttend}
            onCancel={handleCancelAttendance}
            rsvpDeadline={event.rsvp_deadline}
            t={t}
          />
          <EventTools event={event} t={t} />
        </div>

        <div className="flex flex-col gap-4 mt-8 lg:mt-0">
          <EventGuideCard event={event} t={t} />
          <EventPlaceCard
            location={event.location}
            startDatetime={event.start_datetime}
            endDatetime={event.end_datetime}
            t={t}
          />

          {/* 이 일정에 좌석 예약 행사가 연결돼 있으면 예약 진입점 노출 */}
          <SeatBookingLinkCard eventId={event.id} />
          {/* 이 일정에 연결된 행사 앨범이 있으면 사진 보기 진입점 노출 */}
          <EventAlbumLinkCard eventId={event.id} />

          <EventPeopleCard attendances={event.attendances} t={t} />
          <EventThread
            comments={event.comments}
            comment={comment}
            setComment={setComment}
            submitting={submitting}
            isLoggedIn={isLoggedInForComments}
            onSubmit={handleSubmitComment}
            onDelete={handleDeleteComment}
            t={t}
          />

          <p className="flex items-center gap-1.5 px-1 text-gray-400 dark:text-white/40 text-[13px] font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {t.views} {event.views}
          </p>
        </div>
      </div>
    </Shell>
  )
}

export default EventDetail
