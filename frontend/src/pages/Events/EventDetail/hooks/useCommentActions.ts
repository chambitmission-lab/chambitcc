import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createEventComment, deleteEventComment } from '../../../../api/event'

export const useCommentActions = (eventId: number, refresh: () => void, t: any) => {
  const navigate = useNavigate()
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isLoggedIn = !!localStorage.getItem('access_token')

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
      await createEventComment(eventId, { content: comment })
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

  return {
    comment,
    setComment,
    submitting,
    isLoggedIn,
    handleSubmitComment,
    handleDeleteComment,
  }
}
