// 기도 응답 모달 - 간증 작성/수정
import { useEffect, useState } from 'react'

interface AnswerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (testimony: string) => void
  prayerTitle: string
  /** 수정 모드일 때 기존 간증 텍스트 (없으면 신규 등록 모드) */
  initialTestimony?: string
  /** 등록/수정 진행 중 표시용 */
  isSubmitting?: boolean
}

const AnswerModal = ({
  isOpen,
  onClose,
  onSubmit,
  prayerTitle,
  initialTestimony,
  isSubmitting = false,
}: AnswerModalProps) => {
  const isEditMode = !!initialTestimony
  const [testimony, setTestimony] = useState(initialTestimony ?? '')

  // 모달이 열릴 때마다 initialTestimony 동기화 (다른 prayer로 전환 대응)
  useEffect(() => {
    if (isOpen) {
      setTestimony(initialTestimony ?? '')
    }
  }, [isOpen, initialTestimony])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (testimony.trim() && !isSubmitting) {
      onSubmit(testimony)
      // 성공/실패 처리는 부모에서. 모달 닫기는 부모 책임.
    }
  }

  const canSubmit = testimony.trim().length > 0 && !isSubmitting

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative bg-background-light dark:bg-[#1c1c26] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto overflow-x-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_8px_32px_rgba(168,85,247,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_rgba(168,85,247,0.18),inset_0_1px_0_rgba(255,255,255,0.05)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 다크모드 카드 표면 미세 그라데이션 — 평평한 회색 박스 방지 */}
        <div className="hidden dark:block sticky top-0 left-0 right-0 -z-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
        </div>

        {/* 보랏빛 글로우 — 카드 시스템 액센트 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/15 to-pink-400/10 dark:from-purple-500/15 dark:to-pink-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-purple-400/10 dark:from-pink-500/10 dark:to-purple-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 sticky top-0 backdrop-blur-xl bg-background-light/85 dark:bg-[#1c1c26]/90 border-b border-black/[0.04] dark:border-white/[0.08] px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-[20px] bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">
              auto_awesome
            </span>
            <h2 className="text-[18px] font-bold tracking-[-0.015em] text-gray-900 dark:text-white">
              {isEditMode ? '간증 수정' : '기도 응답 간증'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-500/5 dark:hover:bg-purple-500/10 transition-colors"
          >
            <span className="material-icons-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* 본문 */}
        <div className="relative z-10 p-5 space-y-5">
          <div>
            <label className="block text-[13px] font-semibold text-gray-600 dark:text-white/60 mb-2 tracking-[-0.01em]">
              기도 제목
            </label>
            <div className="px-3.5 py-3 bg-surface-light dark:bg-[#14141c] border border-black/[0.05] dark:border-white/[0.06] rounded-xl text-[14px] leading-[1.5] text-gray-900 dark:text-white/90">
              {prayerTitle}
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-[13px] font-semibold text-gray-600 dark:text-white/60 mb-2 tracking-[-0.01em]">
              <span>
                간증 내용 <span className="text-pink-500 dark:text-pink-400">*</span>
              </span>
              <span className="text-[11px] font-normal tabular-nums text-gray-400 dark:text-white/40">
                {testimony.length} / 500
              </span>
            </label>
            <textarea
              value={testimony}
              onChange={(e) => setTestimony(e.target.value)}
              placeholder={'하나님께서 어떻게 응답하셨는지 나눠주세요.\n\n· 구체적으로 어떤 일이 일어났나요?\n· 언제 응답을 받으셨나요?\n· 어떤 마음이 드셨나요?'}
              rows={8}
              maxLength={500}
              className="w-full px-3.5 py-3 bg-surface-light dark:bg-[#14141c] border border-black/[0.05] dark:border-white/[0.06] rounded-xl text-[14px] leading-[1.6] text-gray-900 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400/60 dark:focus:border-purple-400/50 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-500/25 resize-none transition-colors"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-transparent text-gray-700 dark:text-white/70 font-semibold text-[14px] rounded-full border border-black/[0.08] dark:border-white/[0.10] hover:text-purple-600 dark:hover:text-purple-300 hover:border-purple-400/40 dark:hover:border-purple-400/40 hover:bg-purple-500/5 dark:hover:bg-purple-500/10 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 text-white font-bold text-[14px] rounded-full shadow-lg shadow-purple-500/30 dark:shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-500/40 dark:hover:shadow-purple-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-1.5"
            >
              <span className="material-icons-round text-[16px]">auto_awesome</span>
              {isSubmitting ? '저장 중...' : isEditMode ? '간증 수정' : '응답 등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnswerModal
