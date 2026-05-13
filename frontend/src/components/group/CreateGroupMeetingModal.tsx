// 그룹 관리자가 자기 그룹의 모임을 등록하는 모달
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../locales'
import { createEvent } from '../../api/event'
import { eventKeys } from '../../hooks/useEvents'
import { showToast } from '../../utils/toast'

interface CreateGroupMeetingModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: number
  groupName: string
}

const CreateGroupMeetingModal = ({
  isOpen,
  onClose,
  groupId,
  groupName,
}: CreateGroupMeetingModalProps) => {
  const { language } = useLanguage()
  const t = translations[language]
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDt, setStartDt] = useState('')
  const [endDt, setEndDt] = useState('')
  const [location, setLocation] = useState('')
  const [rsvpDeadline, setRsvpDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleClose = () => {
    if (submitting) return
    setTitle('')
    setDescription('')
    setStartDt('')
    setEndDt('')
    setLocation('')
    setRsvpDeadline('')
    setErrorMsg('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!title.trim() || !startDt || !endDt) return

    setSubmitting(true)
    try {
      await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        category: 'meeting',
        start_datetime: startDt,
        end_datetime: endDt,
        location: location.trim() || undefined,
        repeat_type: 'none',
        is_published: true,
        group_id: groupId,
        rsvp_deadline: rsvpDeadline || null,
      })
      showToast(t.createSuccess, 'success')
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() })
      handleClose()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t.error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-background-light dark:bg-background-dark rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border-light dark:border-border-dark"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t.create} · {groupName}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center"
            aria-label="close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              ⚠️ {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t.eventTitle} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.enterTitle}
              required
              maxLength={200}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t.startDate} *
              </label>
              <input
                type="datetime-local"
                value={startDt}
                onChange={(e) => setStartDt(e.target.value)}
                required
                className="w-full px-2 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t.endDate} *
              </label>
              <input
                type="datetime-local"
                value={endDt}
                onChange={(e) => setEndDt(e.target.value)}
                required
                min={startDt || undefined}
                className="w-full px-2 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t.location}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t.enterLocation}
              maxLength={200}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t.rsvpDeadline}
            </label>
            <input
              type="datetime-local"
              value={rsvpDeadline}
              onChange={(e) => setRsvpDeadline(e.target.value)}
              max={startDt || undefined}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t.description}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.enterDescription}
              rows={3}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-gray-900 dark:text-white resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-gray-300 font-bold text-sm rounded-full border border-border-light dark:border-border-dark disabled:opacity-50"
            >
              {translations[language].cancel}
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !startDt || !endDt}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm rounded-full shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? translations[language].submitting : translations[language].create}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateGroupMeetingModal
