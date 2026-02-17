import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useEventDetail } from '../../hooks/useEvents'
import { attendEvent, cancelAttendance, createEventComment, deleteEventComment } from '../../api/event'
import { translations } from '../../locales'
import type { AttendanceStatus } from '../../types/event'
import './EventDetail.css'

const EventDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = translations[language]
  const { event, loading, error, refresh } = useEventDetail(Number(id))
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isLoggedIn = !!localStorage.getItem('access_token')

  const handleAttend = async (status: AttendanceStatus) => {
    if (!isLoggedIn) {
      alert(t.loginRequired)
      navigate('/login')
      return
    }

    try {
      await attendEvent(Number(id), { status })
      alert(t.attendSuccess)
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : t.error)
    }
  }

  const handleCancelAttendance = async () => {
    if (!isLoggedIn) return

    try {
      await cancelAttendance(Number(id))
      alert(t.cancelSuccess)
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : t.error)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoggedIn) {
      alert(t.loginRequired)
      navigate('/login')
      return
    }

    if (!comment.trim()) return

    try {
      setSubmitting(true)
      await createEventComment(Number(id), { content: comment })
      setComment('')
      alert(t.commentSuccess)
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : t.error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm(t.confirmDeleteComment)) return

    try {
      await deleteEventComment(commentId)
      alert(t.commentDeleteSuccess)
      refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : t.error)
    }
  }

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="event-detail-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{t.loading}</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="event-detail-page">
        <div className="error-message">{error || t.error}</div>
        <button onClick={() => navigate('/events')} className="back-btn">
          {t.back}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        <button onClick={() => navigate('/events')} className="back-btn">
          ← {t.back}
        </button>

        {/* Hero Section */}
        <div className="event-detail-hero">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <div className="hero-badge">
              {t.categories[event.category]}
            </div>
            <h1 className="hero-title">{event.title}</h1>
          </div>
        </div>

        <div className="event-detail-content">
          <div className="event-detail-card">

            <div className="event-info-section">
              <div className="section-badge">📋 일정 정보</div>
              <div className="info-grid">
                <div className="info-card">
                  <span className="info-icon">📅</span>
                  <div>
                    <div className="info-label">{t.startDate}</div>
                    <div className="info-value">{formatDateTime(event.start_datetime)}</div>
                  </div>
                </div>
                <div className="info-card">
                  <span className="info-icon">🏁</span>
                  <div>
                    <div className="info-label">{t.endDate}</div>
                    <div className="info-value">{formatDateTime(event.end_datetime)}</div>
                  </div>
                </div>
                {event.location && (
                  <div className="info-card">
                    <span className="info-icon">📍</span>
                    <div>
                      <div className="info-label">{t.location}</div>
                      <div className="info-value">{event.location}</div>
                    </div>
                  </div>
                )}
                <div className="info-card">
                  <span className="info-icon">👥</span>
                  <div>
                    <div className="info-label">{t.attendanceCount}</div>
                    <div className="info-value">{event.attendance_count}명</div>
                  </div>
                </div>
                <div className="info-card">
                  <span className="info-icon">👁️</span>
                  <div>
                    <div className="info-label">{t.views}</div>
                    <div className="info-value">{event.views}</div>
                  </div>
                </div>
              </div>
            </div>

            {event.description && (
              <div className="event-description">
                <div className="section-badge">📝 {t.description}</div>
                <div className="description-card">
                  <p>{event.description}</p>
                </div>
              </div>
            )}

            {event.attachment_url && (
              <div className="event-attachment">
                <a href={event.attachment_url} target="_blank" rel="noopener noreferrer" className="attachment-link">
                  <span className="attachment-icon">📎</span>
                  {t.attachment}
                </a>
              </div>
            )}

            <div className="attendance-section">
              <div className="section-badge">✋ {t.attend}</div>
              {event.user_attendance_status ? (
                <div className="attendance-current">
                  <div className="current-status-card">
                    <span className="status-icon">✓</span>
                    <p>현재 상태: {t.attendanceStatus[event.user_attendance_status]}</p>
                  </div>
                  <button onClick={handleCancelAttendance} className="cancel-btn">
                    {t.cancelAttendance}
                  </button>
                </div>
              ) : (
                <div className="attendance-buttons">
                  <button onClick={() => handleAttend('attending')} className="attend-btn attending">
                    <span className="btn-icon">✓</span>
                    {t.attendanceStatus.attending}
                  </button>
                  <button onClick={() => handleAttend('maybe')} className="attend-btn maybe">
                    <span className="btn-icon">?</span>
                    {t.attendanceStatus.maybe}
                  </button>
                  <button onClick={() => handleAttend('not_attending')} className="attend-btn not-attending">
                    <span className="btn-icon">✗</span>
                    {t.attendanceStatus.not_attending}
                  </button>
                </div>
              )}
            </div>

            <div className="comments-section">
              <div className="section-badge">💬 {t.comments} ({event.comments?.length || 0})</div>
              
              {isLoggedIn && (
                <form onSubmit={handleSubmitComment} className="comment-form">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t.writeComment}
                    rows={3}
                  />
                  <button type="submit" disabled={submitting || !comment.trim()} className="submit-btn">
                    {submitting ? t.submitting : t.submit}
                  </button>
                </form>
              )}

              <div className="comments-list">
                {event.comments?.map((c) => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-header">
                      <span className="comment-author">👤 {c.user_name}</span>
                      <span className="comment-date">
                        {new Date(c.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <p className="comment-content">{c.content}</p>
                    {isLoggedIn && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="delete-comment-btn"
                      >
                        {t.deleteComment}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetail
