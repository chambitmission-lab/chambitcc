import { useEffect, useState, type ReactNode } from 'react'
import { Markdown } from '../../utils/markdown'
import { generateCommentaryDraft } from '../../api/bibleCommentary'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import {
  COMMENTARY_CATEGORIES,
  type BibleCommentary,
  type BibleCommentaryCreateRequest,
  type BibleCommentaryScope,
} from '../../types/bibleCommentary'

interface BibleCommentaryEditorProps {
  bookNumber: number
  chapter: number
  totalVerses?: number
  initialVerseStart: number
  initialVerseEnd?: number
  existing?: BibleCommentary | null
  saving?: boolean
  errorMessage?: string | null
  onSave: (payload: BibleCommentaryCreateRequest) => void
  onClose: () => void
}

const CATEGORY_EMOJI: Record<string, string> = {
  신학적: '✝️',
  역사적: '📜',
  원어: '🔤',
  적용: '🌱',
  묵상: '🕊️',
}

/** JSON 문자열 이스케이프(\n, \t, \" 등)를 실제 문자로 되돌린다. */
const unescapeJsonString = (s: string): string =>
  s
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')

/**
 * 붙여넣기한 텍스트를 본문에 맞게 정리한다.
 * - AI가 뱉은 JSON({ title, content, category }) 통째면 content만 추출
 * - JSON에서 복사해 \n 이 글자 그대로 들어온 content면 실제 줄바꿈으로 변환
 * 정리할 게 없으면 null 을 반환(기본 붙여넣기 동작 유지).
 */
const normalizePastedCommentary = (
  raw: string,
): { content: string; title?: string; category?: string } | null => {
  const trimmed = raw.trim()

  // 1) JSON 객체 통째로 붙여넣은 경우
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed)
      if (obj && typeof obj.content === 'string') {
        return {
          content: obj.content.trim(),
          title: typeof obj.title === 'string' ? obj.title.trim() : undefined,
          category:
            typeof obj.category === 'string' ? obj.category.trim() : undefined,
        }
      }
    } catch {
      // JSON 파싱 실패 시 아래로 진행
    }
  }

  // 2) content 값만 복사했는데 \n 이 글자 그대로 들어온 경우
  if (raw.includes('\\n')) {
    let text = unescapeJsonString(raw).trim()
    if (text.startsWith('"') && text.endsWith('"')) {
      text = text.slice(1, -1)
    }
    return { content: text }
  }

  return null
}

const BibleCommentaryEditor = ({
  bookNumber,
  chapter,
  totalVerses,
  initialVerseStart,
  initialVerseEnd,
  existing,
  saving,
  errorMessage,
  onSave,
  onClose,
}: BibleCommentaryEditorProps) => {
  const [scope, setScope] = useState<BibleCommentaryScope>(
    existing?.scope ?? 'verse',
  )
  const [verseStart, setVerseStart] = useState<number>(
    existing?.verse_start ?? initialVerseStart,
  )
  const [verseEnd, setVerseEnd] = useState<number>(
    existing?.verse_end ?? initialVerseEnd ?? initialVerseStart,
  )
  const isVerseScope = scope === 'verse'
  const [title, setTitle] = useState<string>(existing?.title ?? '')
  const [category, setCategory] = useState<string>(existing?.category ?? '')
  const [content, setContent] = useState<string>(existing?.content ?? '')
  const [showPreview, setShowPreview] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    // 절별 해석은 단일 절만 가리킨다 → 끝 절을 시작 절에 고정
    if (isVerseScope && verseEnd !== verseStart) {
      setVerseEnd(verseStart)
    } else if (verseEnd < verseStart) {
      setVerseEnd(verseStart)
    }
  }, [verseStart, verseEnd, isVerseScope])

  // 뒤로가기로 이 에디터(추가/수정 폼)만 먼저 닫히도록 처리
  useModalBackButton(onClose)

  const isEditing = !!existing
  const canSubmit = !!content.trim() && !saving

  const handleGenerateAI = async () => {
    if (aiLoading || saving) return
    if (
      content.trim() &&
      !window.confirm('현재 작성한 본문을 AI 초안으로 교체할까요?')
    ) {
      return
    }
    setAiError(null)
    setAiLoading(true)
    try {
      const draft = await generateCommentaryDraft({
        book_number: bookNumber,
        chapter,
        verse_start: verseStart,
        verse_end: verseEnd,
        category: category || undefined,
      })
      setContent(draft.content)
      if (draft.title) setTitle(draft.title)
      if (draft.category) setCategory(draft.category)
      setShowPreview(false)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI 초안 생성에 실패했습니다')
    } finally {
      setAiLoading(false)
    }
  }

  const handleContentPaste = (
    e: React.ClipboardEvent<HTMLTextAreaElement>,
  ) => {
    const pasted = e.clipboardData.getData('text')
    const normalized = normalizePastedCommentary(pasted)
    if (!normalized) return // 정리할 게 없으면 기본 붙여넣기 그대로

    e.preventDefault()
    const el = e.currentTarget
    const start = el.selectionStart ?? content.length
    const end = el.selectionEnd ?? content.length
    setContent(content.slice(0, start) + normalized.content + content.slice(end))
    // 제목/카테고리는 비어 있을 때만 보조로 채움 (사용자가 고른 값은 유지)
    if (normalized.title && !title.trim()) setTitle(normalized.title)
    if (normalized.category && !category) setCategory(normalized.category)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    onSave({
      book_number: bookNumber,
      chapter,
      verse_start: verseStart,
      verse_end: isVerseScope ? verseStart : verseEnd,
      title: title.trim() || undefined,
      category: category || undefined,
      content: content.trim(),
      scope,
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
              Admin
            </p>
            <h2 className="text-gray-900 dark:text-white text-[17px] font-bold tracking-[-0.015em]">
              {isEditing ? '해석 수정' : '해석 추가'}
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
            {/* 해석 종류 (절별 / 요약) */}
            <FieldGroup label="해석 종류" required>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: 'verse', icon: 'format_list_numbered', label: '절별 해석', desc: '한 절에 다는 해석' },
                    { value: 'summary', icon: 'auto_stories', label: '요약 해석', desc: '여러 절을 묶어 요약' },
                  ] as const
                ).map((opt) => {
                  const active = scope === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setScope(opt.value)}
                      className={[
                        'flex flex-col items-start gap-0.5 px-3.5 py-2.5 rounded-xl text-left transition-all border',
                        active
                          ? 'bg-gradient-to-br from-purple-500/15 to-pink-500/10 border-purple-400/50 dark:border-purple-400/50'
                          : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06]',
                      ].join(' ')}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`material-icons-round text-[18px] ${active ? 'text-purple-600 dark:text-purple-300' : 'text-gray-400 dark:text-white/40'}`}>
                          {opt.icon}
                        </span>
                        <span className={`text-[13.5px] font-bold ${active ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-white/65'}`}>
                          {opt.label}
                        </span>
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-white/40">
                        {opt.desc}
                      </span>
                    </button>
                  )
                })}
              </div>
            </FieldGroup>

            {/* 절 범위 */}
            <FieldGroup label={isVerseScope ? '절 번호' : '절 범위'} required>
              <div className={isVerseScope ? '' : 'grid grid-cols-2 gap-2'}>
                <label className="block">
                  <span className="block text-[10.5px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-white/45 mb-1">
                    {isVerseScope ? '절' : '시작'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={totalVerses}
                    value={verseStart}
                    onChange={(e) => setVerseStart(Math.max(1, parseInt(e.target.value) || 1))}
                    className={inputClass}
                    required
                  />
                </label>
                {!isVerseScope && (
                  <label className="block">
                    <span className="block text-[10.5px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-white/45 mb-1">
                      끝
                    </span>
                    <input
                      type="number"
                      min={verseStart}
                      max={totalVerses}
                      value={verseEnd}
                      onChange={(e) => setVerseEnd(Math.max(verseStart, parseInt(e.target.value) || verseStart))}
                      className={inputClass}
                      required
                    />
                  </label>
                )}
              </div>
            </FieldGroup>

            {/* 제목 */}
            <FieldGroup label="제목 (선택)">
              <input
                type="text"
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예) 창조의 시작 — 만물의 근원"
                className={inputClass}
              />
            </FieldGroup>

            {/* 카테고리 pill (토글) */}
            <FieldGroup label="카테고리 (선택)">
              <div className="flex gap-1.5 flex-wrap">
                {COMMENTARY_CATEGORIES.map((c) => {
                  const active = category === c
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(active ? '' : c)}
                      className={[
                        'inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full text-[12.5px] font-bold transition-all',
                        active
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_4px_14px_-4px_rgba(168,85,247,0.55)]'
                          : 'bg-gray-50 dark:bg-white/[0.03] text-gray-700 dark:text-white/70 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06]',
                      ].join(' ')}
                    >
                      <span className="text-[14px]">{CATEGORY_EMOJI[c]}</span>
                      {c}
                    </button>
                  )
                })}
              </div>
            </FieldGroup>

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
                {aiLoading ? 'AI가 해석을 작성하고 있어요…' : 'AI로 해석 초안 생성'}
              </button>
              <p className="mt-1.5 text-[11.5px] text-gray-500 dark:text-white/45 leading-[1.5]">
                선택한 절{category ? ` · ${category} 관점` : ''}으로 초안을 만들어 아래 본문에
                채웁니다. 검토·수정 후 저장하세요.
              </p>
              {aiError && (
                <div className="mt-2 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 text-red-600 dark:text-red-300 text-[12.5px] font-medium">
                  {aiError}
                </div>
              )}
            </div>

            {/* 본문 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">
                    본문 (마크다운 지원)
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
                <div className="min-h-[200px] px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03]">
                  {content.trim() ? (
                    <Markdown source={content} />
                  ) : (
                    <span className="text-gray-400 dark:text-white/35 text-[13px]">
                      미리보기할 내용이 없습니다
                    </span>
                  )}
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={handleContentPaste}
                  rows={12}
                  required
                  placeholder={`# 제목\n\n**핵심 단어**, *원어 분석*\n\n- 요점 1\n- 요점 2\n\n> 적용 묵상`}
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors resize-y min-h-[200px] font-mono text-[13.5px] leading-[1.6]"
                />
              )}
              <p className="mt-1.5 text-[11px] text-gray-400 dark:text-white/35">
                지원: # 제목 / **굵게** / *기울임* / - 리스트 / &gt; 인용 / 빈 줄로 문단
              </p>
              <p className="mt-1 text-[11px] text-gray-400 dark:text-white/35">
                💡 AI가 준 content(또는 JSON 통째)를 그대로 붙여넣으면 줄바꿈·기호가
                자동으로 정리됩니다.
              </p>
            </div>

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

export default BibleCommentaryEditor
