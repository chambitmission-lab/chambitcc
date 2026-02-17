import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { fetchAllEvents, createEvent, updateEvent, deleteEvent } from '../../api/event'
import { translations } from '../../locales'
import type { Event, CreateEventRequest, EventCategory, RepeatType } from '../../types/event'
import './EventManagement.css'

const EventManagement = () => {
  const { language } = useLanguage()
  const t = translations[language]
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const [formData, setFormData] = useState<CreateEventRequest>({
    title: '',
    description: '',
    category: 'worship',
    start_datetime: '',
    end_datetime: '',
    location: '',
    repeat_type: 'none',
    repeat_end_date: '',
    is_published: true,
  })

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const response = await fetchAllEvents(0, 100)
      if (response.success) {
        setEvents(response.data.items)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : t.error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, formData)
        alert(t.updateSuccess)
      } else {
        await createEvent(formData, file || undefined)
        alert(t.createSuccess)
      }
      resetForm()
      loadEvents()
    } catch (err) {
      alert(err instanceof Error ? err.message : t.error)
    }
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description || '',
      category: event.category,
      start_datetime: event.start_datetime.slice(0, 16),
      end_datetime: event.end_datetime.slice(0, 16),
      location: event.location || '',
      repeat_type: event.repeat_type,
      repeat_end_date: event.repeat_end_date || '',
      is_published: event.is_published,
    })
    setShowForm(true)
  }

  const handleDelete = async (eventId: number) => {
    if (!confirm(t.confirmDelete)) return

    try {
      await deleteEvent(eventId)
      alert(t.deleteSuccess)
      loadEvents()
    } catch (err) {
      alert(err instanceof Error ? err.message : t.error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'worship',
      start_datetime: '',
      end_datetime: '',
      location: '',
      repeat_type: 'none',
      repeat_end_date: '',
      is_published: true,
    })
    setFile(null)
    setEditingEvent(null)
    setShowForm(false)
  }

  const formatDateTime = (datetime: string) => {
    return new Date(datetime).toLocaleString('ko-KR')
  }

  return (
    <div className="event-management">
      <div className="management-header">
        <h1>{t.eventManagement}</h1>
        <button onClick={() => setShowForm(!showForm)} className="create-btn">
          {showForm ? t.cancel : t.create}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="event-form">
          <h2>{editingEvent ? t.edit : t.create}</h2>

          <div className="form-group">
            <label>{t.eventTitle} *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t.enterTitle}
              required
            />
          </div>

          <div className="form-group">
            <label>{t.category} *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as EventCategory })}
              required
            >
              <option value="worship">{t.categories.worship}</option>
              <option value="meeting">{t.categories.meeting}</option>
              <option value="service">{t.categories.service}</option>
              <option value="special">{t.categories.special}</option>
              <option value="education">{t.categories.education}</option>
              <option value="other">{t.categories.other}</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t.startDate} *</label>
              <input
                type="datetime-local"
                value={formData.start_datetime}
                onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>{t.endDate} *</label>
              <input
                type="datetime-local"
                value={formData.end_datetime}
                onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t.location}</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={t.enterLocation}
            />
          </div>

          <div className="form-group">
            <label>{t.description}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t.enterDescription}
              rows={5}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t.repeatType}</label>
              <select
                value={formData.repeat_type}
                onChange={(e) => setFormData({ ...formData, repeat_type: e.target.value as RepeatType })}
              >
                <option value="none">{t.repeat.none}</option>
                <option value="daily">{t.repeat.daily}</option>
                <option value="weekly">{t.repeat.weekly}</option>
                <option value="monthly">{t.repeat.monthly}</option>
              </select>
            </div>

            {formData.repeat_type !== 'none' && (
              <div className="form-group">
                <label>{t.repeatEndDate}</label>
                <input
                  type="date"
                  value={formData.repeat_end_date}
                  onChange={(e) => setFormData({ ...formData, repeat_end_date: e.target.value })}
                />
              </div>
            )}
          </div>

          {!editingEvent && (
            <div className="form-group">
              <label>{t.attachment}</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          )}

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              />
              {t.isPublished}
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              {editingEvent ? t.update : t.create}
            </button>
            <button type="button" onClick={resetForm} className="cancel-btn">
              {t.cancel}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading-spinner">
          <p>{t.loading}</p>
        </div>
      ) : (
        <div className="events-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>{t.category}</th>
                <th>{t.eventTitle}</th>
                <th>{t.startDate}</th>
                <th>{t.location}</th>
                <th>{t.attendanceCount}</th>
                <th>{t.isPublished}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{event.id}</td>
                  <td>
                    <span className={`category-badge category-${event.category}`}>
                      {t.categories[event.category]}
                    </span>
                  </td>
                  <td>{event.title}</td>
                  <td>{formatDateTime(event.start_datetime)}</td>
                  <td>{event.location || '-'}</td>
                  <td>{event.attendance_count}</td>
                  <td>{event.is_published ? '✅' : '❌'}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleEdit(event)} className="edit-btn">
                        {t.edit}
                      </button>
                      <button onClick={() => handleDelete(event.id)} className="delete-btn">
                        {t.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default EventManagement
