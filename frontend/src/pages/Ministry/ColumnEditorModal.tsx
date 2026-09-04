import { useRef, useState } from 'react'
import type { Column, CreateColumnRequest } from '../../types/column'
import { createColumn, updateColumn } from '../../api/column'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { showToast } from '../../utils/toast'
import HighlightPopover from './HighlightPopover'
import {
  DEFAULT_HIGHLIGHT,
  buildHighlightMarkup,
  expandSelectionOverMarkup,
  parseHighlightToken,
  type HighlightOptions,
} from './highlightMarkup'

interface ColumnEditorModalProps {
  language: string
  /** 수정이면 기존 컬럼(id 있음), 새 글이면 초기값만 채운 부분 객체 */
  initial: Partial<Column>
  /** 저장 성공 — 서버가 돌려준 컬럼과 새 글 여부 */
  onSaved: (column: Column, isNew: boolean) => void
  onClose: () => void
}

const INPUT_CLASS =
  'w-full px-4 py-2.5 border border-border-light dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-ink-strong text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors'
const LABEL_CLASS = 'block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 tracking-[-0.005em]'

/**
 * 컬럼 등록/수정 폼 (관리자). 폼 상태와 하이라이트 마크업 도구를 안에서 끝내고,
 * 부모에는 저장 결과만 돌려준다.
 */
const ColumnEditorModal = ({ language, initial, onSaved, onClose }: ColumnEditorModalProps) => {
  const [draft, setDraft] = useState<Partial<Column>>(initial)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [highlightOpen, setHighlightOpen] = useState(false)
  const [highlightOpt, setHighlightOpt] = useState<HighlightOptions>(DEFAULT_HIGHLIGHT)
  const [highlightSel, setHighlightSel] = useState<{ start: number; end: number; text: string; existing: boolean } | null>(null)

  // 모바일 뒤로가기 → 페이지 이탈 대신 이 모달만 닫기
  useModalBackButton(onClose)

  const patch = (p: Partial<Column>) => setDraft((prev) => ({ ...prev, ...p }))

  const handleSave = async () => {
    if (!draft.title || !draft.author || !draft.content) {
      showToast('제목, 작성자, 내용은 필수입니다', 'error')
      return
    }
    try {
      if (draft.id) {
        const updated = await updateColumn(draft.id, draft)
        showToast('목양컬럼이 수정되었습니다', 'success')
        onSaved(updated, false)
      } else {
        const created = await createColumn(draft as CreateColumnRequest)
        showToast('목양컬럼이 추가되었습니다', 'success')
        onSaved(created, true)
      }
    } catch (error) {
      console.error('Failed to save column:', error)
      showToast('저장에 실패했습니다', 'error')
    }
  }

  // ── 하이라이트 도구 ───────────────────────────────────────────────
  // 하이라이트 버튼: 선택 영역 확인 → 옵션 팝오버 열기
  const openHighlight = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    const value = textarea.value
    const rawStart = textarea.selectionStart
    const rawEnd = textarea.selectionEnd
    if (rawStart === rawEnd) {
      showToast(language === 'ko' ? '하이라이트할 텍스트를 선택하세요' : 'Please select text to highlight', 'error')
      return
    }
    // 기존 마커와 겹치면 마커 전체로 확장 → 스타일 교체/해제 가능
    const { start, end, text } = expandSelectionOverMarkup(value, rawStart, rawEnd)
    const slice = value.slice(start, end)
    const existing = /^\[\[[^[\]]*\]\]$/.test(slice)
    if (existing) {
      // 기존 옵션을 팝오버 초기값으로
      setHighlightOpt(parseHighlightToken(slice.slice(2, -2)).options)
    }
    setHighlightSel({ start, end, text, existing })
    setHighlightOpen(true)
  }

  const replaceRange = (start: number, end: number, insert: string, caretOffset: number) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const value = textarea.value
    const newContent = value.slice(0, start) + insert + value.slice(end)
    // controlled value가 통째로 바뀌면 브라우저가 textarea 스크롤을 0으로 되돌린다 → 미리 기억
    const scrollTop = textarea.scrollTop
    patch({ content: newContent })
    setTimeout(() => {
      const el = textareaRef.current
      if (!el) return
      // preventScroll: 모바일에서 focus가 모달까지 스크롤해 올리는 것 방지
      el.focus({ preventScroll: true })
      const caret = start + caretOffset
      el.setSelectionRange(caret, caret)
      el.scrollTop = scrollTop
    }, 0)
  }

  const applyHighlight = () => {
    if (!highlightSel) return
    const markup = buildHighlightMarkup(highlightSel.text, highlightOpt)
    replaceRange(highlightSel.start, highlightSel.end, markup, markup.length)
    setHighlightOpen(false)
    setHighlightSel(null)
    showToast(language === 'ko' ? '하이라이트가 적용되었습니다' : 'Highlight applied', 'success')
  }

  const removeHighlight = () => {
    if (!highlightSel) return
    replaceRange(highlightSel.start, highlightSel.end, highlightSel.text, highlightSel.text.length)
    setHighlightOpen(false)
    setHighlightSel(null)
    showToast(language === 'ko' ? '하이라이트를 해제했습니다' : 'Highlight removed', 'success')
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-lg z-[110] flex items-stretch md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-background-light dark:bg-background-dark w-full h-full rounded-none md:rounded-3xl md:max-w-md md:h-auto md:max-h-[calc(100dvh-2rem)] overflow-y-auto md:border md:border-border-light md:dark:border-border-dark md:shadow-[0_30px_80px_-20px_var(--brand-glow),0_0_0_1px_rgba(255,255,255,0.04)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-border-light dark:border-border-dark p-5 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-ink-strong tracking-[-0.015em]">
              {draft.id
                ? language === 'ko' ? '컬럼 수정' : 'Edit Column'
                : language === 'ko' ? '컬럼 추가' : 'Add Column'}
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--brand-soft)] transition-colors"
              aria-label="닫기"
            >
              <span className="material-icons-outlined text-[20px] text-gray-600 dark:text-gray-400">close</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={LABEL_CLASS}>{language === 'ko' ? '제목' : 'Title'} *</label>
            <input
              type="text"
              value={draft.title || ''}
              onChange={(e) => patch({ title: e.target.value })}
              className={INPUT_CLASS}
              placeholder={language === 'ko' ? '컬럼 제목을 입력하세요' : 'Enter column title'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>{language === 'ko' ? '작성자' : 'Author'} *</label>
              <input
                type="text"
                value={draft.author || ''}
                onChange={(e) => patch({ author: e.target.value })}
                className={INPUT_CLASS}
                placeholder={language === 'ko' ? '작성자 이름' : 'Author name'}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>{language === 'ko' ? '직책' : 'Role'}</label>
              <input
                type="text"
                value={draft.role || ''}
                onChange={(e) => patch({ role: e.target.value })}
                className={INPUT_CLASS}
                placeholder={language === 'ko' ? '담임목사' : 'Senior Pastor'}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>{language === 'ko' ? '날짜' : 'Date'}</label>
            <input
              type="text"
              value={draft.date || ''}
              onChange={(e) => patch({ date: e.target.value })}
              className={INPUT_CLASS}
              placeholder="2026-07-26"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-[-0.005em]">
                {language === 'ko' ? '내용' : 'Content'} *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={openHighlight}
                  className="px-3 py-1 bg-[var(--brand-soft-strong)] text-[var(--brand)] rounded-full text-xs font-semibold hover:bg-[var(--brand-soft)] transition-colors flex items-center gap-1"
                  title={language === 'ko' ? '선택한 텍스트를 하이라이트' : 'Highlight selected text'}
                >
                  <span className="material-icons-outlined text-sm">highlight</span>
                  <span>{language === 'ko' ? '하이라이트' : 'Highlight'}</span>
                </button>
                {highlightOpen && highlightSel && (
                  <HighlightPopover
                    language={language}
                    options={highlightOpt}
                    onChange={setHighlightOpt}
                    onApply={applyHighlight}
                    onRemove={highlightSel.existing ? removeHighlight : undefined}
                    onClose={() => setHighlightOpen(false)}
                    sampleText={highlightSel.text}
                  />
                )}
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={draft.content || ''}
              onChange={(e) => patch({ content: e.target.value })}
              rows={12}
              className="w-full px-4 py-3 border border-border-light dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-ink-strong text-sm leading-[1.7] resize-none focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
              placeholder={
                language === 'ko'
                  ? '컬럼 내용을 입력하세요...\n\n중요한 문구를 선택하고 "하이라이트" 버튼을 누르면 색상·밑줄 스타일을 골라 강조할 수 있습니다.'
                  : 'Enter column content...\n\nSelect important text and click "Highlight" to pick a color and underline style.'
              }
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              💡{' '}
              {language === 'ko'
                ? '문구를 드래그한 뒤 "하이라이트"에서 색상·스타일을 고르세요. 이미 강조된 문구를 다시 선택하면 바꾸거나 해제할 수 있어요'
                : 'Drag text, then pick a color/style in "Highlight". Re-select a highlighted phrase to change or remove it'}
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-border-light dark:border-border-dark p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-surface-light dark:bg-white/[0.05] border border-transparent dark:border-white/[0.08] text-ink-strong rounded-2xl font-semibold text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
          >
            {language === 'ko' ? '취소' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 brand-gradient rounded-2xl font-semibold text-sm shadow-[0_2px_10px_var(--brand-glow)] hover:shadow-[0_4px_16px_var(--brand-glow)] transition-all"
          >
            {language === 'ko' ? '저장' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ColumnEditorModal
