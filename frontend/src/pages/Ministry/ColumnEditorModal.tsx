import { useEffect, useRef, useState } from 'react'
import type { Column, CreateColumnRequest } from '../../types/column'
import { createColumn, updateColumn, uploadColumnImage } from '../../api/column'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import DatePicker from '../../components/common/DatePicker'
import { showToast } from '../../utils/toast'
import HighlightPopover from './HighlightPopover'
import ColumnToolbar from './ColumnToolbar'
import ColumnLetter from './ColumnLetter'
import { COLUMN_TEMPLATES } from './columnTemplates'
import { useColumnDraft } from './useColumnDraft'
import { buildImageMarkup, toggleLinePrefix, type LinePrefixKey } from './blockFormat'
import { FONT_STEPS } from './letterFormat'
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
/* DatePicker 트리거 — 이 폼의 다른 입력과 같은 테두리·높이·글자 크기로 맞춘다 */
const DATE_TRIGGER_CLASS = `${INPUT_CLASS} flex items-center justify-between gap-2 text-left`

/** 선택 영역을 그 줄 전체로 넓힌다 — 줄머리 마커는 줄 단위로 붙고 떨어진다 */
const lineRange = (value: string, start: number, end: number) => {
  const s = value.lastIndexOf('\n', start - 1) + 1
  const found = value.indexOf('\n', end)
  return { s, e: found === -1 ? value.length : found }
}

/**
 * 컬럼 등록/수정 폼 (관리자).
 * PC 는 왼쪽 작성 · 오른쪽 미리보기 2단, 모바일은 전체화면 + 탭 전환.
 * 미리보기는 읽기 화면과 같은 ColumnLetter 를 쓰므로 "보이는 그대로" 저장된다.
 */
const ColumnEditorModal = ({ language, initial, onSaved, onClose }: ColumnEditorModalProps) => {
  const ko = language === 'ko'
  const [draft, setDraft] = useState<Partial<Column>>(initial)
  const [mobileTab, setMobileTab] = useState<'write' | 'preview'>('write')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showEn, setShowEn] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // 파일 선택 결과를 표지로 쓸지 본문에 넣을지
  const uploadTargetRef = useRef<'cover' | 'body'>('cover')
  const [highlightOpen, setHighlightOpen] = useState(false)
  const [highlightOpt, setHighlightOpt] = useState<HighlightOptions>(DEFAULT_HIGHLIGHT)
  const [highlightSel, setHighlightSel] = useState<{ start: number; end: number; text: string; existing: boolean } | null>(null)

  const { pendingRestore, dismissRestore, clearDraft } = useColumnDraft(initial, draft)

  // 모바일 뒤로가기 → 페이지 이탈 대신 이 모달만 닫기
  useModalBackButton(onClose)

  const patch = (p: Partial<Column>) => setDraft((prev) => ({ ...prev, ...p }))

  // 본문 상자는 내용만큼 늘어나고, 스크롤은 바깥 칼럼이 맡는다 (긴 글에서 상자 안 스크롤이 없게)
  useEffect(() => {
    const el = textareaRef.current
    // 미리보기 탭으로 숨겨진 동안은 scrollHeight 가 0이라 건드리지 않는다
    if (!el || el.offsetParent === null) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [draft.content, mobileTab])

  const handleSave = async () => {
    if (!draft.title || !draft.author || !draft.content) {
      showToast(ko ? '제목, 작성자, 내용은 필수입니다' : 'Title, author and content are required', 'error')
      return
    }
    if (saving) return
    setSaving(true)
    try {
      if (draft.id) {
        const updated = await updateColumn(draft.id, draft)
        showToast(ko ? '목양컬럼이 수정되었습니다' : 'Column updated', 'success')
        clearDraft()
        onSaved(updated, false)
      } else {
        const created = await createColumn(draft as CreateColumnRequest)
        showToast(ko ? '목양컬럼이 추가되었습니다' : 'Column added', 'success')
        clearDraft()
        onSaved(created, true)
      }
    } catch (error) {
      console.error('Failed to save column:', error)
      showToast(ko ? '저장에 실패했습니다' : 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── 본문 편집 도구 ────────────────────────────────────────────────
  const replaceRange = (start: number, end: number, insert: string, caretOffset: number) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const value = textarea.value
    patch({ content: value.slice(0, start) + insert + value.slice(end) })
    setTimeout(() => {
      const el = textareaRef.current
      if (!el) return
      // preventScroll: 모바일에서 focus가 모달까지 스크롤해 올리는 것 방지
      el.focus({ preventScroll: true })
      const caret = start + caretOffset
      el.setSelectionRange(caret, caret)
    }, 0)
  }

  /** 선택한 줄들에 줄머리 마커를 붙이거나 뗀다 */
  const applyPrefix = (key: LinePrefixKey) => {
    const el = textareaRef.current
    if (!el) return
    const { s, e } = lineRange(el.value, el.selectionStart, el.selectionEnd)
    const next = toggleLinePrefix(el.value.slice(s, e), key)
    replaceRange(s, e, next, next.length)
  }

  /** 커서 자리에 블록 하나를 앞뒤 빈 줄과 함께 끼워 넣는다 */
  const insertBlock = (markup: string) => {
    const el = textareaRef.current
    if (!el) return
    const pos = el.selectionEnd
    const before = el.value.slice(0, pos)
    const after = el.value.slice(pos)
    const lead = !before || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
    const tail = after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n'
    const insert = `${lead}${markup}${tail}`
    replaceRange(pos, pos, insert, lead.length + markup.length + tail.length)
  }

  // 하이라이트 버튼: 선택 영역 확인 → 옵션 팝오버 열기
  const openHighlight = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    const value = textarea.value
    const rawStart = textarea.selectionStart
    const rawEnd = textarea.selectionEnd
    if (rawStart === rawEnd) {
      showToast(ko ? '하이라이트할 텍스트를 선택하세요' : 'Please select text to highlight', 'error')
      return
    }
    // 기존 마커와 겹치면 마커 전체로 확장 → 스타일 교체/해제 가능
    const { start, end, text } = expandSelectionOverMarkup(value, rawStart, rawEnd)
    const slice = value.slice(start, end)
    const existing = /^\[\[[^[\]]*\]\]$/.test(slice)
    if (existing) setHighlightOpt(parseHighlightToken(slice.slice(2, -2)).options)
    setHighlightSel({ start, end, text, existing })
    setHighlightOpen(true)
  }

  const applyHighlight = () => {
    if (!highlightSel) return
    const markup = buildHighlightMarkup(highlightSel.text, highlightOpt)
    replaceRange(highlightSel.start, highlightSel.end, markup, markup.length)
    setHighlightOpen(false)
    setHighlightSel(null)
  }

  const removeHighlight = () => {
    if (!highlightSel) return
    replaceRange(highlightSel.start, highlightSel.end, highlightSel.text, highlightSel.text.length)
    setHighlightOpen(false)
    setHighlightSel(null)
  }

  // ── 사진 ──────────────────────────────────────────────────────────
  const pickImage = (target: 'cover' | 'body') => {
    uploadTargetRef.current = target
    fileRef.current?.click()
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const target = uploadTargetRef.current
    setUploading(true)
    try {
      const url = await uploadColumnImage(file)
      if (target === 'cover') patch({ image: url })
      else insertBlock(buildImageMarkup(url, ''))
      showToast(ko ? '사진을 올렸습니다' : 'Photo uploaded', 'success')
    } catch (error) {
      console.error('Failed to upload column image:', error)
      showToast(ko ? '사진 업로드에 실패했습니다' : 'Failed to upload photo', 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // ── 단축키 ────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!(e.metaKey || e.ctrlKey)) return
    if (e.key === 'Enter') {
      e.preventDefault()
      void handleSave()
    } else if (e.key.toLowerCase() === 'h') {
      e.preventDefault()
      openHighlight()
    }
  }

  // ── 조각 ──────────────────────────────────────────────────────────
  const preview = (
    <div className="bg-[var(--app-canvas)] dark:bg-white/[0.02] h-full overflow-y-auto">
      <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 tracking-[0.04em] px-7 pt-5">
        {ko ? '성도님께 보이는 모습' : 'AS YOUR CONGREGATION SEES IT'}
      </div>
      <div className="p-5 pt-4">
        <div className="bg-background-light dark:bg-background-dark rounded-2xl border border-border-light dark:border-border-dark px-6 py-8">
          <ColumnLetter language={language} column={draft} fontSize={FONT_STEPS[1]} placeholder />
        </div>
      </div>
    </div>
  )

  const form = (
    <div className="h-full overflow-y-auto px-6 py-5">
      {/* 자동 저장본 — 창이 닫혔거나 새로고침된 뒤 이어 쓰기 */}
      {pendingRestore && (
        <div className="mb-5 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] px-4 py-3 flex items-center gap-3">
          <p className="flex-1 text-[13px] text-ink-strong leading-[1.5]">
            {ko ? '작성 중이던 내용이 남아 있어요' : 'You have an unsaved draft'}
          </p>
          <button
            type="button"
            onClick={() => {
              setDraft((prev) => ({ ...prev, ...pendingRestore }))
              dismissRestore()
            }}
            className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[12px] font-semibold"
          >
            {ko ? '이어 쓰기' : 'Restore'}
          </button>
          <button
            type="button"
            onClick={dismissRestore}
            className="px-2 py-1.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400"
          >
            {ko ? '버리기' : 'Discard'}
          </button>
        </div>
      )}

      <div>
        <label className={LABEL_CLASS}>{ko ? '제목' : 'Title'} *</label>
        <input
          type="text"
          value={draft.title || ''}
          onChange={(e) => patch({ title: e.target.value })}
          className={`${INPUT_CLASS} !text-[16px] !font-semibold`}
          placeholder={ko ? '이번 주 편지의 제목' : 'Title of this week’s letter'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label className={LABEL_CLASS}>{ko ? '작성자' : 'Author'} *</label>
          <input
            type="text"
            value={draft.author || ''}
            onChange={(e) => patch({ author: e.target.value })}
            className={INPUT_CLASS}
            placeholder={ko ? '작성자 이름' : 'Author name'}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>{ko ? '직책' : 'Role'}</label>
          <input
            type="text"
            value={draft.role || ''}
            onChange={(e) => patch({ role: e.target.value })}
            className={INPUT_CLASS}
            placeholder={ko ? '담임목사' : 'Senior Pastor'}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label className={LABEL_CLASS}>{ko ? '날짜' : 'Date'}</label>
          {/* 네이티브 date 입력은 09/11/2026·OS 달력이라 앱 공통 DatePicker로 */}
          <DatePicker
            value={draft.date || ''}
            onChange={(date) => patch({ date })}
            className={DATE_TRIGGER_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>{ko ? '표지 사진' : 'Cover photo'}</label>
          <div className="flex items-center gap-2.5">
            {draft.image ? (
              <img src={draft.image} alt="" className="w-16 h-11 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-11 rounded-lg border border-dashed border-border-light dark:border-white/[0.14] flex-shrink-0"></div>
            )}
            <button
              type="button"
              onClick={() => pickImage('cover')}
              disabled={uploading}
              className="px-3 py-2 rounded-lg bg-surface-light dark:bg-white/[0.06] text-[12px] font-semibold text-ink-strong disabled:opacity-50"
            >
              {uploading ? (ko ? '올리는 중…' : 'Uploading…') : draft.image ? (ko ? '변경' : 'Change') : (ko ? '올리기' : 'Upload')}
            </button>
            {draft.image && (
              <button
                type="button"
                onClick={() => patch({ image: '' })}
                className="px-2 py-2 text-[12px] font-semibold text-gray-500 dark:text-gray-400"
              >
                {ko ? '삭제' : 'Remove'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="mt-5">
        <label className={LABEL_CLASS}>{ko ? '내용' : 'Content'} *</label>

        {/* 백지 대신 틀에서 시작 — 목양칼럼은 매주 흐름이 비슷하다 */}
        {!draft.content && (
          <div className="mb-3 flex flex-wrap gap-2">
            {COLUMN_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => patch({ content: t.body })}
                className="px-3 py-2 rounded-xl border border-border-light dark:border-white/[0.1] text-left hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] transition-colors"
              >
                <span className="block text-[12.5px] font-semibold text-ink-strong">{t.label[ko ? 0 : 1]}</span>
                <span className="block text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{t.hint[ko ? 0 : 1]}</span>
              </button>
            ))}
          </div>
        )}

        <ColumnToolbar
          language={language}
          onPrefix={applyPrefix}
          onDivider={() => insertBlock('---')}
          onImage={() => pickImage('body')}
          onHighlight={openHighlight}
          uploading={uploading}
          highlightSlot={
            highlightOpen && highlightSel ? (
              <HighlightPopover
                language={language}
                options={highlightOpt}
                onChange={setHighlightOpt}
                onApply={applyHighlight}
                onRemove={highlightSel.existing ? removeHighlight : undefined}
                onClose={() => setHighlightOpen(false)}
                sampleText={highlightSel.text}
              />
            ) : null
          }
        />

        <textarea
          ref={textareaRef}
          value={draft.content || ''}
          onChange={(e) => patch({ content: e.target.value })}
          rows={14}
          className="w-full px-4 py-3 border border-border-light dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-ink-strong text-sm leading-[1.8] resize-none overflow-hidden focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
          placeholder={
            ko
              ? '편지를 써 주세요…\n\n윗줄 서식 바로 소제목·성구 인용·강조 상자·사진을 넣을 수 있고,\n문구를 드래그한 뒤 형광펜 버튼을 누르면 색과 스타일을 고를 수 있어요.'
              : 'Write your letter…\n\nUse the toolbar above for headings, scripture quotes, callouts and photos.\nSelect text and press the marker button to highlight it.'
          }
        />

        <p className="text-[11.5px] text-gray-500 dark:text-gray-400 mt-2 leading-[1.7]">
          {ko
            ? '## 소제목 · > 성구 인용 · :: 강조 상자 · --- 구분선 — 줄머리에 직접 써도 됩니다'
            : '## heading · > quote · :: callout · --- divider — you can also type these directly'}
        </p>
      </div>

      {/* 영어 번역 — 필요할 때만 펼친다 */}
      <details className="mt-5 group" open={showEn} onToggle={(e) => setShowEn((e.currentTarget as HTMLDetailsElement).open)}>
        <summary className="text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden flex items-center gap-1.5">
          <span className="transition-transform group-open:rotate-90">›</span>
          {ko ? '영어 번역 (선택)' : 'English translation (optional)'}
        </summary>
        <div className="mt-3 space-y-3">
          <input
            type="text"
            value={draft.title_en || ''}
            onChange={(e) => patch({ title_en: e.target.value })}
            className={INPUT_CLASS}
            placeholder={ko ? '영문 제목' : 'English title'}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={draft.author_en || ''}
              onChange={(e) => patch({ author_en: e.target.value })}
              className={INPUT_CLASS}
              placeholder={ko ? '영문 작성자' : 'English author'}
            />
            <input
              type="text"
              value={draft.role_en || ''}
              onChange={(e) => patch({ role_en: e.target.value })}
              className={INPUT_CLASS}
              placeholder={ko ? '영문 직책' : 'English role'}
            />
          </div>
          <textarea
            value={draft.content_en || ''}
            onChange={(e) => patch({ content_en: e.target.value })}
            rows={6}
            className="w-full px-4 py-3 border border-border-light dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-ink-strong text-sm leading-[1.7] resize-none focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
            placeholder={ko ? '영문 본문 (같은 서식 문법을 씁니다)' : 'English content (same formatting syntax)'}
          />
        </div>
      </details>
    </div>
  )

  // 작성 중 실수로 닫히지 않도록 배경 클릭으로는 닫지 않는다(X 버튼·뒤로가기만)
  return (
    <div
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-lg z-[110] flex items-stretch lg:items-center justify-center p-0 lg:p-6"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-background-light dark:bg-background-dark w-full h-full flex flex-col rounded-none lg:rounded-3xl lg:max-w-[1180px] lg:h-[calc(100dvh-3rem)] lg:max-h-[900px] lg:border lg:border-border-light lg:dark:border-border-dark lg:shadow-[0_30px_80px_-20px_var(--brand-glow),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden">
        {/* 머리 — 제목 · (모바일)작성/미리보기 탭 · 닫기 */}
        <div className="flex-shrink-0 border-b border-border-light dark:border-border-dark px-5 py-3.5 flex items-center justify-between gap-3">
          <h2 className="text-[17px] font-bold text-ink-strong tracking-[-0.015em] flex-shrink-0">
            {draft.id ? (ko ? '편지 수정' : 'Edit Letter') : (ko ? '편지 쓰기' : 'Write a Letter')}
          </h2>

          <div className="flex items-center gap-2">
            <div className="lg:hidden flex bg-surface-light dark:bg-white/[0.06] rounded-xl p-0.5">
              {(['write', 'preview'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMobileTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors ${
                    mobileTab === tab ? 'bg-white dark:bg-white/[0.12] text-ink-strong shadow-sm' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {tab === 'write' ? (ko ? '작성' : 'Write') : (ko ? '미리보기' : 'Preview')}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--brand-soft)] transition-colors flex-shrink-0"
              aria-label={ko ? '닫기' : 'Close'}
            >
              <span className="material-icons-outlined text-[20px] text-gray-600 dark:text-gray-400">close</span>
            </button>
          </div>
        </div>

        {/* 몸통 — PC 2단(작성 | 미리보기), 모바일은 탭으로 하나씩 */}
        <div className="flex-1 min-h-0 flex">
          <div className={`flex-1 min-w-0 lg:max-w-[54%] ${mobileTab === 'write' ? '' : 'hidden lg:block'}`}>{form}</div>
          <div className="hidden lg:block w-px bg-border-light dark:bg-border-dark flex-shrink-0"></div>
          <div className={`flex-1 min-w-0 ${mobileTab === 'preview' ? '' : 'hidden lg:block'}`}>{preview}</div>
        </div>

        {/* 발 — 취소 · 저장 */}
        <div className="flex-shrink-0 border-t border-border-light dark:border-border-dark p-4 flex gap-3 lg:justify-end">
          <button
            onClick={onClose}
            className="flex-1 lg:flex-none lg:px-8 py-3 px-4 bg-surface-light dark:bg-white/[0.05] border border-transparent dark:border-white/[0.08] text-ink-strong rounded-2xl font-semibold text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
          >
            {ko ? '취소' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            title={ko ? '⌘ + Enter' : '⌘ + Enter'}
            className="flex-1 lg:flex-none lg:px-10 py-3 px-4 brand-gradient rounded-2xl font-semibold text-sm shadow-[0_2px_10px_var(--brand-glow)] hover:shadow-[0_4px_16px_var(--brand-glow)] disabled:opacity-60 transition-all"
          >
            {saving ? (ko ? '저장 중…' : 'Saving…') : ko ? '저장' : 'Save'}
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  )
}

export default ColumnEditorModal
