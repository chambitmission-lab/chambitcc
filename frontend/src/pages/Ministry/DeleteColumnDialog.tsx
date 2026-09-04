import { useModalBackButton } from '../../hooks/useModalBackButton'

interface DeleteColumnDialogProps {
  language: string
  onConfirm: () => void
  onClose: () => void
}

/** 컬럼 삭제 확인 — 기도 DeleteConfirmModal과 동일 패턴 */
const DeleteColumnDialog = ({ language, onConfirm, onClose }: DeleteColumnDialogProps) => {
  // 모바일 뒤로가기 → 페이지 이탈 대신 이 다이얼로그만 닫기
  useModalBackButton(onClose)

  return (
    <div
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-lg z-[120] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background-light dark:bg-background-dark rounded-3xl p-6 max-w-sm w-full border border-border-light dark:border-border-dark shadow-[0_30px_80px_-20px_rgba(239,68,68,0.25),0_0_0_1px_rgba(255,255,255,0.04)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          {/* 플랫 tint 서클 — 글로우·펄스 없이 기능색(빨강)만 */}
          <div className="w-12 h-12 flex-shrink-0 rounded-full bg-red-500/10 dark:bg-red-500/15 flex items-center justify-center">
            <span className="material-icons-outlined text-red-500 dark:text-red-400 text-xl">warning</span>
          </div>
          <h3 className="text-[18px] font-bold text-ink-strong tracking-[-0.015em]">
            {language === 'ko' ? '컬럼 삭제' : 'Delete Column'}
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-[1.7] mb-6">
          {language === 'ko'
            ? '정말 이 컬럼을 삭제하시겠습니까?\n삭제된 내용은 복구할 수 없습니다.'
            : 'Are you sure you want to delete this column?\nThis cannot be undone.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-surface-light dark:bg-white/[0.05] border border-transparent dark:border-white/[0.08] text-ink-strong rounded-2xl font-semibold text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
          >
            {language === 'ko' ? '취소' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold text-sm shadow-[0_2px_10px_rgba(239,68,68,0.25)] transition-colors"
          >
            {language === 'ko' ? '삭제' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteColumnDialog
