import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createEventComment, deleteEventComment } from '../../../../api/event'
import type { Translation } from '../../../../locales'
import { confirmDialog } from '../../../../utils/confirmDialog'
import { showToast } from '../../../../utils/toast'
import { tokenStore } from '../../../../utils/tokenStore'

export const useCommentActions = (eventId: number, refresh: () => void, t: Translation) => {
  const navigate = useNavigate()
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isLoggedIn = !!tokenStore.getAccess()

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoggedIn) {
      showToast(t.loginRequired, 'error')
      navigate('/login')
      return
    }

    if (!comment.trim()) return

    try {
      setSubmitting(true)
      await createEventComment(eventId, { content: comment })
      setComment('')
      showToast(t.commentSuccess, 'success')
      refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.error, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (
      !(await confirmDialog({
        title: t.confirmDeleteCommentTitle,
        message: t.confirmDeleteComment,
        confirmText: t.confirmDeleteCommentAction,
        icon: 'delete_outline',
      }))
    )
      return

    try {
      await deleteEventComment(commentId)
      showToast(t.commentDeleteSuccess, 'success')
      refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.error, 'error')
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
