import { useState, type ReactNode } from 'react'
import { Markdown } from '../../utils/markdown'
import { generateBookIntroDraft } from '../../api/bibleBookIntro'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import type {
  BibleBookIntro,
  BibleBookIntroUpsertRequest,
} from '../../types/bibleBookIntro'

interface BookIntroEditorProps {
  bookNumber: number
  bookNameKo: string
  existing?: BibleBookIntro | null
  saving?: boolean
  errorMessage?: string | null
  onSave: (payload: BibleBookIntroUpsertRequest) => void
  onClose: () => void
}

const BookIntroEditor = ({
  bookNumber,
  bookNameKo,
  existing,
  saving,
  errorMessage,
  onSave,
  onClose,
}: BookIntroEditorProps) => {
  const [oneLiner, setOneLiner] = useState(existing?.one_liner ?? '')
  const [theme, setTheme] = useState(existing?.theme ?? '')
  const [authorPeriod, setAuthorPeriod] = useState(existing?.author_period ?? '')
  const [keyChapters, setKeyChapters] = useState(existing?.key_chapters ?? '')
  const [overview, setOverview] = useState(existing?.overview ?? '')
  const [christConnection, setChristConnection] = useState(
    existing?.christ_connection ?? '',
  )
  const [showPreview, setShowPreview] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // 뒤로가기로 이 에디터만 먼저 닫히도록 처리
  useModalBackButton(onClose)

  const isEditing = !!existing
  const canSubmit = !!oneLiner.trim() && !!overview.trim() && !saving

  const handleGenerateAI = async () => {
    if (aiLoading || saving) return
    if (
      (oneLiner.trim() || overview.trim()) &&
      !window.confirm('현재 작성한 개관을 AI 초안으로 교체할까요?')
    ) {
      return
    }
    setAiError(null)
    setAiLoading(true)
    try {
      const draft = await generateBookIntroDraft({ book_number: bookNumber })
      setOneLiner(draft.one_liner)
      setTheme(draft.theme ?? '')
      setAuthorPeriod(draft.author_period ?? '')
      setKeyChapters(draft.key_chapters ?? '')
      setOverview(draft.overview)
      setChristConnection(draft.christ_connection ?? '')
      setShowPreview(false)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI 초안 생성에 실패했습니다')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!oneLiner.trim() || !overview.trim()) return
    onSave({
      one_liner: oneLiner.trim(),
      theme: theme.trim() || undefined,
      author_period: authorPeriod.trim() || undefined,
      key_chapters: keyChapters.trim() || undefined,
      overview: overview.trim(),
      christ_connection: christConnection.trim() || undefined,
    })
  }

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14.5px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors'

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[94vh] sm:max-h-[90vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_rgba(168,85,247,0.18)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 카드 표면 그라데이션 + 글로우 */}
        <div className="hidden dark:block absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400/15 to-pink-400/10 dark:from-purple-500/15 dark:to-pink-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-purple-400/10 dark:from-pink-500/10 dark:to-purple-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div>
            <p className="text-purple-600/80 dark:text-purple-300/80 text-[10.5px] font-bold tracking-[0.12em] uppercase">
              Admin · {bookNameKo}
            </p>
            <h2 className="text-gray-900 dark:text-white text-[17px] font-bold tracking-[-0.015em]">
              {isEditing ? '권 개관 수정' : '권 개관 추가'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
            aria-label="닫기"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        {/* 본문 */}
        <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-5 py-5 space-y-5">
            {/* AI 초안 생성 */}
            <div>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={aiLoading || saving}
                className={[
                  'w-full inline-flex items-center justify-center gap-1.5 h-12 rounded-xl text-[14px] font-bold transition-all',
                  aiLoading
                    ? 'bg-gray-100 dark:bg-white/[0.05] text-gray-400 dark:text-white/40 cursor-wait'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_8px_24px_-8px_rgba(168,85,247,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(168,85,247,0.7)] disabled:opacity-40',
                ].join(' ')}
              >
                <span className={`material-icons-round text-[19px] ${aiLoading ? 'animate-pulse' : ''}`}>
                  auto_awesome
                </span>
                {aiLoading ? 'AI가 개관을 작성하고 있어요…' : `AI로 ${bookNameKo} 개관 초안 생성`}
              </button>
              <p className="mt-1.5 text-[11.5px] text-gray-500 dark:text-white/45 leading-[1.5]">
                고신 개혁주의·구속사적 노선으로 초안을 만들어 아래 항목을 채웁니다. 검토·수정 후 저장하세요.
              </p>
              {aiError && (
                <div className="mt-2 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 text-red-600 dark:text-red-300 text-[12.5px] font-medium">
                  {aiError}
                </div>
              )}
            </div>

            {/* 한 줄 부제 */}
            <FieldGroup label="한 줄 부제" required>
              <input
                type="text"
                maxLength={200}
                value={oneLiner}
                onChange={(e) => setOneLiner(e.target.value)}
                placeholder="예) 거룩하신 하나님께 나아가는 예배 매뉴얼"
                className={inputClass}
                required
              />
            </FieldGroup>

            {/* 주제 */}
            <FieldGroup label="주제 (선택)">
              <input
                type="text"
                maxLength={200}
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="예) 하나님의 거룩하심과 예배"
                className={inputClass}
              />
            </FieldGroup>

            {/* 저자 · 시대 */}
            <FieldGroup label="저자 · 시대 (선택)">
              <input
                type="text"
                maxLength={200}
                value={authorPeriod}
                onChange={(e) => setAuthorPeriod(e.target.value)}
                placeholder="예) 모세 / 출애굽 광야 시대"
                className={inputClass}
              />
            </FieldGroup>

            {/* 핵심 장 */}
            <FieldGroup label="핵심 장 (선택)">
              <input
                type="text"
                maxLength={300}
                value={keyChapters}
                onChange={(e) => setKeyChapters(e.target.value)}
                placeholder="예) 16장 속죄일, 19장 성결법"
                className={inputClass}
              />
            </FieldGroup>

            {/* 개관 본문 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">
                    개관 본문 (마크다운 지원)
                  </p>
                  <span className="text-pink-500 text-[12px] font-bold">*</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview((v) => !v)}
                  className="inline-flex items-center px-3 h-7 rounded-full bg-purple-500/8 dark:bg-purple-500/12 text-purple-700 dark:text-purple-300 text-[11.5px] font-bold border border-purple-500/20 dark:border-purple-500/25 hover:bg-purple-500/15 dark:hover:bg-purple-500/20 transition-colors"
                >
                  {showPreview ? '편집' : '미리보기'}
                </button>
              </div>

              {showPreview ? (
                <div className="min-h-[180px] px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03]">
                  {overview.trim() ? (
                    <Markdown source={overview} />
                  ) : (
                    <span className="text-gray-400 dark:text-white/35 text-[13px]">
                      미리보기할 내용이 없습니다
                    </span>
                  )}
                </div>
              ) : (
                <textarea
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  rows={12}
                  required
                  placeholder={`이 책이 무엇을 다루는지, 어떻게 흘러가는지 풀어주세요.\n\n**핵심 단어**는 굵게\n\n- 구조/흐름 요점\n\n> 한 줄 적용`}
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors resize-y min-h-[180px] font-mono text-[13.5px] leading-[1.6]"
                />
              )}
            </div>

            {/* 그리스도와의 연결 */}
            <FieldGroup label="그리스도와의 연결 (선택, 마크다운)">
              <textarea
                value={christConnection}
                onChange={(e) => setChristConnection(e.target.value)}
                rows={4}
                placeholder="이 책이 예수 그리스도와 복음을 어떻게 가리키는지 (구속사적 연결)"
                className="w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors resize-y min-h-[90px] font-mono text-[13.5px] leading-[1.6]"
              />
            </FieldGroup>

            {errorMessage && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 text-red-600 dark:text-red-300 text-[12.5px] font-medium">
                {errorMessage}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="sticky bottom-0 bg-background-light/95 dark:bg-card-dark/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 py-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="ml-auto inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_rgba(168,85,247,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(168,85,247,0.7)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <span className="material-icons-round text-[18px]">
                {saving ? 'hourglass_empty' : 'check'}
              </span>
              {saving ? '저장 중...' : isEditing ? '수정 저장' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface FieldGroupProps {
  label: string
  required?: boolean
  children: ReactNode
}

const FieldGroup = ({ label, required, children }: FieldGroupProps) => (
  <div>
    <div className="flex items-center gap-1 mb-2">
      <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">
        {label}
      </p>
      {required && <span className="text-pink-500 text-[12px] font-bold">*</span>}
    </div>
    {children}
  </div>
)

export default BookIntroEditor
