import { useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useEventDetail } from '../../../hooks/useEvents'
import { translations } from '../../../locales'
import { useEventActions } from './hooks/useEventActions'
import { useCommentActions } from './hooks/useCommentActions'
import {
  EventHero,
  EventInfo,
  EventDescription,
  AttendanceSection,
  CommentsSection,
} from './components'
import './styles/index.css'

const EventDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = translations[language]
  const { event, loading, error, refresh } = useEventDetail(Number(id))

  const { isLoggedIn: isLoggedInForAttendance, handleAttend, handleCancelAttendance } = 
    useEventActions(Number(id), refresh, t)

  const {
    comment,
    setComment,
    submitting,
    isLoggedIn: isLoggedInForComments,
    handleSubmitComment,
    handleDeleteComment,
  } = useCommentActions(Number(id), refresh, t)

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-black min-h-screen">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
          <div className="loading-spinner">
            <p>{t.loading}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="bg-gray-50 dark:bg-black min-h-screen">
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
          <div className="error-message">{error || t.error}</div>
          <button onClick={() => navigate('/events')} className="back-btn">
            {t.back}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        <button onClick={() => navigate('/events')} className="back-btn">
          ← {t.back}
        </button>

        <EventHero
          category={t.categories[event.category]}
          title={event.title}
        />

        <div className="event-detail-content">
          <div className="event-detail-card">
            <EventInfo
              startDate={event.start_datetime}
              endDate={event.end_datetime}
              location={event.location}
              attendanceCount={event.attendance_count}
              views={event.views}
              t={t}
            />

            <EventDescription
              description={event.description}
              attachmentUrl={event.attachment_url}
              t={t}
            />

            <AttendanceSection
              userAttendanceStatus={event.user_attendance_status}
              onAttend={handleAttend}
              onCancel={handleCancelAttendance}
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
        </div>
      </div>
    </div>
  )
}

export default EventDetail
