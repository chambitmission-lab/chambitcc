// ── 관리자 AI 묵상 수정 모달 (slide-up) ──
import { useEffect, useState } from 'react'
import type { PlanReflection } from '../../../../types/biblePlan'
import { normalizeReflection } from '../reflectionText'

const ReflectionEditModal = ({
  dayNumber,
  initial,
  onClose,
  onSave,
}: {
  dayNumber: number
  initial: PlanReflection
  onClose: () => void
  onSave: (reflection: string, questions: string[]) => Promise<void>
}) => {
  const [reflection, setReflection] = useState(() => normalizeReflection(initial.reflection))
  const [questions, setQuestions] = useState<string[]>(() =>
    (initial.questions ?? []).map((q) => normalizeReflection(q)),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, saving])

  const updateQuestion = (i: number, value: string) =>
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? value : q)))
  const removeQuestion = (i: number) =>
    setQuestions((prev) => prev.filter((_, idx) => idx !== i))
  const addQuestion = () =>
    setQuestions((prev) => (prev.length >= 3 ? prev : [...prev, '']))

  const handleSave = async () => {
    const body = reflection.trim()
    if (!body) {
      setError('묵상 내용을 입력해주세요')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(
        body,
        questions.map((q) => q.trim()).filter(Boolean),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />
      <div className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-[#1c1c26] border-t border-x border-gray-200 dark:border-white/[0.08] shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.4)]">
        {/* 핸들바 */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#1c1c26]/95 backdrop-blur-sm pt-2.5 pb-3 px-5 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="mx-auto w-10 h-1 rounded-full bg-gray-300 dark:bg-white/15 mb-3" />
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-[20px] font-bold tracking-[-0.015em] text-gray-900 dark:text-white">
                AI 묵상 수정
              </h3>
              <p className="text-[12px] text-gray-500 dark:text-white/50 mt-0.5">
                {dayNumber}일차 · {initial.reference}
              </p>
            </div>
            <button
              type="button"
              onClick={() => !saving && onClose()}
              aria-label="닫기"
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 dark:text-white/45 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* 묵상 본문 */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 dark:text-white/55 mb-1.5">
              묵상 본문
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={9}
              placeholder="묵상 내용을 입력하세요"
              className="w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13.5px] leading-[1.7] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors resize-y"
            />
            <p className="text-[11px] text-gray-400 dark:text-white/35 mt-1">
              줄바꿈은 Enter 로 입력하세요. HTML 태그는 자동으로 정리됩니다.
            </p>
          </div>

          {/* 묵상 질문 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-semibold text-gray-500 dark:text-white/55">
                묵상 질문 ({questions.length}/3)
              </label>
              {questions.length < 3 && (
                <button
                  type="button"
                  onClick={addQuestion}
                  className="text-[12px] font-semibold text-purple-600 dark:text-purple-300 hover:underline"
                >
                  + 질문 추가
                </button>
              )}
            </div>
            <div className="space-y-2">
              {questions.length === 0 && (
                <p className="text-[12px] text-gray-400 dark:text-white/35">
                  등록된 질문이 없습니다.
                </p>
              )}
              {questions.map((q, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="shrink-0 text-[12px] font-bold text-purple-500 dark:text-purple-300/80 w-7">
                    Q{i + 1}
                  </span>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => updateQuestion(i, e.target.value)}
                    placeholder="묵상 질문"
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    aria-label="질문 삭제"
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-[12.5px] text-red-500 dark:text-red-300">{error}</p>
          )}
        </div>

        {/* 하단 액션 */}
        <div className="sticky bottom-0 bg-white/95 dark:bg-[#1c1c26]/95 backdrop-blur-sm px-5 py-3.5 border-t border-gray-100 dark:border-white/[0.06] flex gap-2.5">
          <button
            type="button"
            onClick={() => !saving && onClose()}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-white/80 text-[14px] font-semibold border border-gray-200 dark:border-white/[0.08] disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-[1.4] py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[14px] font-bold shadow-[0_8px_24px_-8px_rgba(168,85,247,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(168,85,247,0.7)] transition-all disabled:opacity-50"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReflectionEditModal
