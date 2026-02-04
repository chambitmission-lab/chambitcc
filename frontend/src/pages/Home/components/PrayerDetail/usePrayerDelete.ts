// 기도 삭제 로직을 처리하는 커스텀 훅
import { useState } from 'react'
import { deletePrayer } from '../../../../api/prayer'
import { showToast } from '../../../../utils/toast'

export const usePrayerDelete = (prayerId: number, onClose: () => void, onDelete?: () => void) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (isDeleting) return

    try {
      setIsDeleting(true)
      const result = await deletePrayer(prayerId)
      showToast(result.message || '기도 요청이 삭제되었습니다', 'success')
      onClose()
      onDelete?.()
    } catch (err: any) {
      console.error('기도 요청 삭제 실패:', err)
      showToast(err.message || '기도 요청 삭제에 실패했습니다', 'error')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return {
    showDeleteConfirm,
    isDeleting,
    setShowDeleteConfirm,
    handleDelete,
  }
}
