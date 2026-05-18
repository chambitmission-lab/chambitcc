// 삭제 확인 모달 컴포넌트
interface DeleteConfirmModalProps {
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

const DeleteConfirmModal = ({ isDeleting, onConfirm, onCancel }: DeleteConfirmModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-lg z-[120] flex items-center justify-center p-4">
      <div className="bg-background-light dark:bg-background-dark rounded-3xl p-6 max-w-sm w-full border border-border-light dark:border-border-dark shadow-[0_30px_80px_-20px_rgba(239,68,68,0.25),0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-3 mb-4">
          {/* 경고 아이콘 — 다른 화면 아바타와 같은 펄스 글로우 패턴, 톤만 빨강 */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-red-400/30 dark:bg-red-500/40 blur-md animate-pulse"></div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-b from-red-400/60 via-red-500/40 to-red-600/25 dark:from-red-400/50 dark:via-red-500/30 dark:to-red-600/20 border-2 border-red-500/70 dark:border-red-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4),inset_0_1px_3px_rgba(255,255,255,0.6)] dark:shadow-[0_0_20px_rgba(239,68,68,0.3),inset_0_1px_3px_rgba(255,255,255,0.25)] relative z-10">
              <span className="material-icons-outlined text-white text-xl">warning</span>
            </div>
          </div>
          <h3 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-[-0.015em]">기도 요청 삭제</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-[1.7] mb-6">
          이 기도 요청을 삭제하시겠습니까?<br />
          삭제된 내용은 복구할 수 없습니다.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 bg-surface-light dark:bg-white/[0.05] border border-transparent dark:border-white/[0.08] text-gray-900 dark:text-white rounded-2xl font-semibold text-sm hover:bg-purple-50 dark:hover:bg-white/[0.08] transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 bg-gradient-to-tr from-red-500 to-rose-500 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-red-500/30 dark:shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
