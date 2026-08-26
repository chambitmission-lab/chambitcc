import { useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useEventDetail } from '../../../hooks/useEvents'
import { translations } from '../../../locales'
import { useEventActions } from './hooks/useEventActions'
import { useCommentActions } from './hooks/useCommentActions'
import {
  EventHero,
  QuickActions,
  EventInfo,
  EventDescription,
  AttendeesCard,
  AttendanceSection,
  CommentsSection,
  EventAlbumLinkCard,
} from './components'

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100 transition-colors duration-200 min-h-screen page-stage">
    <div className="max-w-md mx-auto bg-[var(--app-canvas)] shadow-2xl relative border-x border-border-light dark:border-border-dark min-h-screen pb-24 lg:max-w-xl lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0">
      {children}
    </div>
  </div>
)

const EventDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = translations[language]
  const { event, loading, error, refresh } = useEventDetail(Number(id))

  const { handleAttend, handleCancelAttendance } =
    useEventActions(Number(id), refresh, t)

  const {
    comment,
    setComment,
    submitting,
    isLoggedIn: isLoggedInForComments,
    handleSubmitComment,
    handleDeleteComment,
  } = useCommentActions(Number(id), refresh, t)

  const backButton = (
    <div className="px-4 pt-4 pb-3">
      <button
        type="button"
        onClick={() => navigate('/events')}
        className="inline-flex items-center gap-1 h-9 pl-1.5 pr-3 -ml-1.5 rounded-full text-ink-strong text-[14px] font-bold hover:bg-gray-100 dark:hover:bg-white/[0.06] active:scale-[0.97] transition-all"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
        <div className="mx-4 h-48 rounded-3xl bg-gray-100 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] animate-pulse" />
        <div className="flex gap-2 px-4 mt-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex-1 h-10 rounded-xl bg-gray-100 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] animate-pulse" />
          ))}
        </div>
        <div className="px-4 mt-3 flex flex-col gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] animate-pulse" />
          ))}
        </div>
      </Shell>
    )
  }

  if (error || !event) {
    return (
      <Shell>
        {backButton}
        <div className="mx-4 mt-10 rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] p-8 text-center">
          <p className="text-[32px] mb-3" aria-hidden="true">😢</p>
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

      <EventHero event={event} t={t} />
      <QuickActions event={event} t={t} />

      <div className="px-4 mt-3 flex flex-col gap-3">
        <EventInfo event={event} t={t} />

        <EventDescription
          description={event.description}
          attachmentUrl={event.attachment_url}
          t={t}
        />

        {/* 이 일정에 연결된 행사 앨범이 있으면 사진 보기 진입점 노출 */}
        <EventAlbumLinkCard eventId={event.id} />

        <AttendeesCard attendances={event.attendances} t={t} />

        <AttendanceSection
          userAttendanceStatus={event.user_attendance_status ?? undefined}
          onAttend={handleAttend}
          onCancel={handleCancelAttendance}
          rsvpDeadline={event.rsvp_deadline}
          t={t}
        />

        <CommentsSection
          comments={event.comments}
          comment={comment}
          setComment={setComment}
          submitting={submitting}
          isLoggedIn={isLoggedInForComments}
          onSubmit={handleSubmitComment}
          onDelete={handleDeleteComment}
          t={t}
        />
      </div>
    </Shell>
  )
}

export default EventDetail
