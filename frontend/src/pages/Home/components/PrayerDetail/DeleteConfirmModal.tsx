// 삭제 확인 모달 컴포넌트
interface DeleteConfirmModalProps {
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

const DeleteConfirmModal = ({ isDeleting, onConfirm, onCancel }: DeleteConfirmModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-background-light dark:bg-background-dark rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span className="material-icons-outlined text-red-600 dark:text-red-400 text-2xl">warning</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">기도 요청 삭제</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          이 기도 요청을 삭제하시겠습니까?<br />
          삭제된 내용은 복구할 수 없습니다.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-white rounded-xl font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                삭제 중...
              </>
            ) : (
              '삭제'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmModal
