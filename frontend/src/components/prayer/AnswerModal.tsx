// 기도 응답 모달 - 간증 작성/수정
import { useEffect, useState } from 'react'
import { useModalBackButton } from '../../hooks/useModalBackButton'

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

  // 뒤로가기 → 모달만 닫기
  useModalBackButton(onClose, isOpen)

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
        className="relative rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto overflow-x-hidden"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="relative z-10 sticky top-0 backdrop-blur-xl px-5 py-3.5 flex items-center justify-between"
          style={{
            background: 'color-mix(in srgb, var(--surface-container) 90%, transparent)',
            borderBottom: '1px solid var(--card-border)',
          }}
        >
          <div className="flex items-center gap-2">
            {/* 응답(✨)은 브랜드 블루로 덮지 않는 앰버 액센트 유지 */}
            <span className="material-icons-round text-[20px]" style={{ color: 'var(--amber-icon)' }}>
              auto_awesome
            </span>
            <h2 className="text-[18px] font-bold tracking-[-0.015em]" style={{ color: 'var(--text-strong)' }}>
              {isEditMode ? '간증 수정' : '기도 응답 간증'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="material-icons-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* 본문 */}
        <div className="relative z-10 p-5 space-y-5">
          {prayerTitle.trim() && (
            <div>
              <label
                className="block text-[13px] font-semibold mb-2 tracking-[-0.01em]"
                style={{ color: 'var(--text-muted)' }}
              >
                기도 제목
              </label>
              <div
                className="px-3.5 py-3 rounded-xl text-[14px] leading-[1.5]"
                style={{
                  background: 'var(--surface-inset)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-body)',
                }}
              >
                {prayerTitle}
              </div>
            </div>
          )}

          <div>
            <label
              className="flex items-center justify-between text-[13px] font-semibold mb-2 tracking-[-0.01em]"
              style={{ color: 'var(--text-muted)' }}
            >
              <span>
                간증 내용 <span style={{ color: 'var(--brand)' }}>*</span>
              </span>
              <span className="text-[11px] font-normal tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {testimony.length} / 500
              </span>
            </label>
            <textarea
              value={testimony}
              onChange={(e) => setTestimony(e.target.value)}
              placeholder={'하나님께서 어떻게 응답하셨는지 나눠주세요.\n\n· 구체적으로 어떤 일이 일어났나요?\n· 언제 응답을 받으셨나요?\n· 어떤 마음이 드셨나요?'}
              rows={8}
              maxLength={500}
              className="w-full px-3.5 py-3 rounded-xl text-[14px] leading-[1.6] resize-none transition-colors focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] placeholder:text-[var(--text-muted)]"
              style={{
                background: 'var(--surface-inset)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-body)',
              }}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-transparent font-semibold text-[14px] rounded-full transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] hover:border-[var(--brand)]"
              style={{ color: 'var(--text-body)', border: '1px solid var(--card-border)' }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 px-4 py-2.5 font-bold text-[14px] rounded-full transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              style={{
                background: 'var(--brand)',
                color: 'var(--on-brand)',
                boxShadow: '0 4px 14px var(--brand-glow)',
              }}
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
