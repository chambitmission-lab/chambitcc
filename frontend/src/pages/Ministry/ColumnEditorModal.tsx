import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import type { EditorOptions } from '@tiptap/core'
import { BubbleMenu } from '@tiptap/react/menus'
import { NodeSelection } from '@tiptap/pm/state'
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
import { buildColumnExtensions } from './columnEditorExtensions'
import { docToMarkup, markupToDoc } from './columnMarkupConvert'
import { columnPlainText } from './blockFormat'
import { FONT_STEPS, SERIF, formatLetterDate, readingMinutes } from './letterFormat'
import {
  DEFAULT_HIGHLIGHT,
  HIGHLIGHT_COLORS,
  swatchColor,
  type HighlightColor,
  type HighlightOptions,
} from './highlightMarkup'
import { modKey, redoKey } from './editorKeys'
import VerseFinderDialog, { type PickedPassage } from './VerseFinderDialog'
import VerseSuggestCard from './VerseSuggestCard'
import { verseSuggestionKey, type VerseSuggestBridge, type VerseSuggestState } from './verseSuggestion'
import { exitSuggestion } from '@tiptap/suggestion'
import './columnEditor.css'

interface ColumnEditorModalProps {
  language: string
  /** 수정이면 기존 컬럼(id 있음), 새 글이면 초기값만 채운 부분 객체 */
  initial: Partial<Column>
  /** 저장 성공 — 서버가 돌려준 컬럼과 새 글 여부 */
  onSaved: (column: Column, isNew: boolean) => void
  onClose: () => void
}

/* PC 는 한 단계 큰 글자·높은 입력칸 — 노안에도 돋보기 없이 읽히도록 */
const INPUT_CLASS =
  'w-full px-4 py-2.5 lg:py-3 border border-border-light dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-ink-strong text-sm lg:text-[16px] focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors'
const LABEL_CLASS = 'block text-xs lg:text-[14px] font-semibold text-gray-700 dark:text-gray-300 mb-2 tracking-[-0.005em]'
/* DatePicker 트리거 — 이 폼의 다른 입력과 같은 테두리·높이·글자 크기로 맞춘다 */
const DATE_TRIGGER_CLASS = `${INPUT_CLASS} flex items-center justify-between gap-2 text-left`
/** 읽기 화면 표지 틀이 PC 에서 약 600px — 이보다 좁은 원본은 늘어나 흐려진다 */
const COVER_MIN_WIDTH = 800

/** 쓰는 화면 글자 크기(px) — 읽기 화면 설정과는 별개로, 목사님 눈에 맞춰 둔다 */
const EDITOR_FONT_STEPS = [16, 18, 20, 22, 24, 27]
const EDITOR_FONT_KEY = 'ministry_editor_font_px'
const readEditorFont = (): number => {
  try {
    const saved = Number(localStorage.getItem(EDITOR_FONT_KEY))
    if (EDITOR_FONT_STEPS.includes(saved)) return saved
  } catch {
    /* 무시 */
  }
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches ? 22 : 18
}

const isImageFile = (f: File) => /^image\/(jpeg|png|webp)$/.test(f.type)

/**
 * 컬럼 등록/수정 폼 (관리자).
 * 본문은 Tiptap WYSIWYG — 쓰는 모습이 곧 성도님께 보이는 모습이다.
 * 저장은 여전히 블록 마커 문자열(columnMarkupConvert)이라 백엔드·읽기 화면은 그대로다.
 * PC: 가운데 큰 편지지 + 오른쪽 "편지 정보" 패널, 모바일: 정보 → 편지지 한 줄 스크롤.
 */
const ColumnEditorModal = ({ language, initial, onSaved, onClose }: ColumnEditorModalProps) => {
  const ko = language === 'ko'
  const [draft, setDraft] = useState<Partial<Column>>(initial)
  const [view, setView] = useState<'write' | 'preview'>('write')
  // 말풍선 메뉴의 shouldShow 는 플러그인에 한 번 등록되므로 최신 값을 ref 로 읽는다
  const viewRef = useRef(view)
  viewRef.current = view
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  // 표지는 틀을 꽉 채워 보여주므로 원본이 작으면 늘어나 흐려진다 — 올린 직후 알려 준다
  const [smallCoverWidth, setSmallCoverWidth] = useState<number | null>(null)
  const [showEn, setShowEn] = useState(false)
  const [fontPx, setFontPx] = useState(readEditorFont)
  const fileRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null)
  // 파일 선택 결과를 표지로 쓸지 본문에 넣을지
  const uploadTargetRef = useRef<'cover' | 'body'>('cover')
  const [highlight, setHighlight] = useState<{ anchor: 'toolbar' | 'bubble'; existing: boolean; text: string } | null>(null)
  const [highlightOpt, setHighlightOpt] = useState<HighlightOptions>(DEFAULT_HIGHLIGHT)
  const [verseOpen, setVerseOpen] = useState(false)
  // 입력 중 성구 제안 — 확장(플러그인)과 React 카드 사이 다리. Tab 은 준비된 말씀이 있을 때만 가로챈다
  const [verseSuggest, setVerseSuggest] = useState<VerseSuggestState | null>(null)
  const readyPassageRef = useRef<PickedPassage | null>(null)
  const verseBridge = useRef<VerseSuggestBridge | null>(null)

  const { pendingRestore, dismissRestore, clearDraft, savedAt } = useColumnDraft(initial, draft)

  // 모바일 뒤로가기 → 페이지 이탈 대신 이 모달만 닫기
  useModalBackButton(onClose)

  const patch = (p: Partial<Column>) => setDraft((prev) => ({ ...prev, ...p }))

  // 붙여넣기·끌어놓기 사진은 에디터 옵션 안에서 올리므로 최신 함수를 ref 로 건넨다
  const uploadIntoBodyRef = useRef<(files: File[]) => void>(() => {})

  const placeholder = ko
    ? '사랑하는 성도 여러분께,\n\n여기에 편지를 써 주세요. 위 서식 바로 소제목·성구 인용·강조 상자·사진을 넣고,\n문구를 드래그하면 형광펜 색을 바로 고를 수 있습니다.'
    : 'Dear church family,\n\nWrite your letter here. Use the toolbar for headings, quotes, callouts and photos,\nand select text to highlight it.'

  const extensions = useMemo(() => buildColumnExtensions(placeholder, verseBridge), [placeholder])

  // useEditor 는 옵션 객체가 바뀔 때마다 setOptions(→ view.updateState)를 다시 부르므로
  // 매 렌더 새로 만들어지는 content·editorProps 는 처음 한 번만 만든다(핸들러는 ref 로 최신 값을 본다)
  const [initialDoc] = useState(() => markupToDoc(initial.content || ''))
  const editorProps = useMemo<EditorOptions['editorProps']>(
    () => ({
      attributes: {
        spellcheck: 'false',
        'aria-label': ko ? '편지 본문' : 'Letter body',
      },
      // 사진 파일 붙여넣기 → 업로드해 본문에. 서식 없는 글은 마커 문법으로 읽어 들인다
      // (예전 편지를 복사해 붙이면 소제목·인용이 그대로 살아난다)
      handlePaste: (_view, event) => {
        const data = event.clipboardData
        if (!data) return false
        const images = Array.from(data.files).filter(isImageFile)
        if (images.length) {
          uploadIntoBodyRef.current(images)
          return true
        }
        const html = data.getData('text/html')
        const text = data.getData('text/plain')
        if (!html && text && /\n|^(##|>|::|---|!\(|[-*] |\d+[.)] |->)|\[\[|\*\*|\+\+|~~/m.test(text)) {
          const parsed = markupToDoc(text).content ?? []
          editorRef.current?.chain().focus().insertContent(parsed).run()
          return true
        }
        return false
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) return false
        const images = Array.from(event.dataTransfer?.files ?? []).filter(isImageFile)
        if (!images.length) return false
        event.preventDefault()
        uploadIntoBodyRef.current(images)
        return true
      },
    }),
    [ko],
  )

  const editor = useEditor({
    extensions,
    content: initialDoc,
    editorProps,
    onUpdate: ({ editor: e }) => patch({ content: docToMarkup(e.state.doc) }),
  })
  const editorRef = useRef<Editor | null>(editor)
  editorRef.current = editor

  /** 템플릿·자동 저장본 복구처럼 본문을 통째로 바꿀 때 */
  const replaceBody = (content: string) => {
    editor?.commands.setContent(markupToDoc(content), { emitUpdate: false })
    patch({ content })
  }

  // 제목 칸은 내용만큼 늘어난다(긴 제목도 한눈에)
  useEffect(() => {
    const el = titleRef.current
    if (!el || el.offsetParent === null) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [draft.title, fontPx, view])

  const changeFont = (dir: -1 | 1) => {
    const i = EDITOR_FONT_STEPS.indexOf(fontPx)
    const next = EDITOR_FONT_STEPS[Math.min(EDITOR_FONT_STEPS.length - 1, Math.max(0, i + dir))]
    setFontPx(next)
    try {
      localStorage.setItem(EDITOR_FONT_KEY, String(next))
    } catch {
      /* 무시 */
    }
  }

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

  // ── 형광펜 ────────────────────────────────────────────────────────
  const openHighlight = (anchor: 'toolbar' | 'bubble') => {
    if (!editor) return
    const existing = editor.isActive('columnHighlight')
    // 커서만 강조 문구 안에 있으면 그 문구 전체를 고친다
    if (existing) editor.chain().focus().extendMarkRange('columnHighlight').run()
    const { from, to, empty } = editor.state.selection
    if (empty) {
      showToast(ko ? '형광펜을 칠할 문구를 먼저 드래그해 주세요' : 'Please select text to highlight', 'error')
      return
    }
    setHighlightOpt(existing ? ({ ...DEFAULT_HIGHLIGHT, ...editor.getAttributes('columnHighlight') } as HighlightOptions) : DEFAULT_HIGHLIGHT)
    setHighlight({ anchor, existing, text: editor.state.doc.textBetween(from, to, ' ') })
  }

  const applyHighlight = (opt: HighlightOptions = highlightOpt) => {
    editor?.chain().focus().extendMarkRange('columnHighlight').setMark('columnHighlight', { ...opt }).run()
    setHighlight(null)
  }

  const removeHighlight = () => {
    editor?.chain().focus().extendMarkRange('columnHighlight').unsetMark('columnHighlight').run()
    setHighlight(null)
  }

  /** 말풍선 메뉴의 색 동그라미 — 누르면 바로 칠한다(기존 강조면 스타일은 유지하고 색만) */
  const quickHighlight = (color: HighlightColor) => {
    if (!editor) return
    const current = editor.isActive('columnHighlight')
      ? ({ ...DEFAULT_HIGHLIGHT, ...editor.getAttributes('columnHighlight') } as HighlightOptions)
      : DEFAULT_HIGHLIGHT
    applyHighlight({ ...current, color })
  }

  const highlightPopover = (anchor: 'toolbar' | 'bubble') =>
    highlight?.anchor === anchor ? (
      <HighlightPopover
        language={language}
        options={highlightOpt}
        onChange={setHighlightOpt}
        onApply={() => applyHighlight()}
        onRemove={highlight.existing ? removeHighlight : undefined}
        onClose={() => setHighlight(null)}
        sampleText={highlight.text}
      />
    ) : null

  // ── 성구 ──────────────────────────────────────────────────────────
  /** 성구 찾기 창에서 고른 말씀 — 인용 상자(마지막 줄 출처) 또는 문장 안 “말씀” (출처) */
  const insertPassage = ({ text, cite }: PickedPassage, mode: 'quote' | 'inline') => {
    const chain = editorRef.current?.chain().focus()
    if (!chain) return
    if (mode === 'quote') {
      chain
        .insertContent({
          type: 'blockquote',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text }] },
            { type: 'paragraph', content: [{ type: 'text', text: `— ${cite}` }] },
          ],
        })
        .scrollIntoView()
        .run()
    } else {
      chain.insertContent({ type: 'text', text: `“${text}” (${cite})` }).scrollIntoView().run()
    }
    setVerseOpen(false)
    showToast(ko ? `${cite} 말씀을 넣었습니다` : `Inserted ${cite}`, 'success')
  }

  /** 입력 중 제안 카드에서 — 친 성구 표기를 말씀으로 바꿔 넣는다 */
  const acceptSuggest = (passage: PickedPassage, mode: 'inline' | 'quote') => {
    const e = editorRef.current
    const s = verseSuggest
    if (!e || !s) return
    if (mode === 'inline') {
      // 뒤에 한 칸 띄워 두면 바로 이어 쓸 수 있다
      e.chain().focus().insertContentAt(s.range, { type: 'text', text: `“${passage.text}” (${passage.cite}) ` }).run()
    } else {
      e.chain()
        .focus()
        .deleteRange(s.range)
        .insertContent({
          type: 'blockquote',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: passage.text }] },
            { type: 'paragraph', content: [{ type: 'text', text: `— ${passage.cite}` }] },
          ],
        })
        .scrollIntoView()
        .run()
    }
    setVerseSuggest(null)
  }
  const acceptSuggestRef = useRef(acceptSuggest)
  acceptSuggestRef.current = acceptSuggest
  verseBridge.current = {
    update: setVerseSuggest,
    accept: () => {
      const passage = readyPassageRef.current
      if (!passage) return false
      acceptSuggestRef.current(passage, 'inline')
      return true
    },
  }
  const onSuggestReady = useCallback((p: PickedPassage | null) => {
    readyPassageRef.current = p
  }, [])

  // ── 사진 ──────────────────────────────────────────────────────────
  const pickImage = (target: 'cover' | 'body') => {
    uploadTargetRef.current = target
    fileRef.current?.click()
  }

  const uploadIntoBody = async (files: File[]) => {
    setUploading(true)
    try {
      for (const file of files) {
        const url = await uploadColumnImage(file)
        editorRef.current?.chain().focus().insertColumnImage({ src: url }).run()
      }
      showToast(ko ? '사진을 넣었습니다' : 'Photo inserted', 'success')
    } catch (error) {
      console.error('Failed to upload column image:', error)
      showToast(ko ? '사진 업로드에 실패했습니다' : 'Failed to upload photo', 'error')
    } finally {
      setUploading(false)
    }
  }
  uploadIntoBodyRef.current = (files) => void uploadIntoBody(files)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const target = uploadTargetRef.current
    if (fileRef.current) fileRef.current.value = ''
    if (target === 'body') return uploadIntoBody([file])
    setUploading(true)
    try {
      patch({ image: await uploadColumnImage(file) })
      showToast(ko ? '표지 사진을 올렸습니다' : 'Cover uploaded', 'success')
    } catch (error) {
      console.error('Failed to upload column image:', error)
      showToast(ko ? '사진 업로드에 실패했습니다' : 'Failed to upload photo', 'error')
    } finally {
      setUploading(false)
    }
  }

  // ── 단축키 ────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!(e.metaKey || e.ctrlKey)) return
    const key = e.key.toLowerCase()
    // ⌘S 는 브라우저 "페이지 저장" 대신 편지 저장 — PC 에서 손에 익은 저장 키
    // 한글 입력 상태면 e.key 가 'ㄴ'·'ㅗ'로 들어오는 브라우저가 있어 물리 키(e.code)도 본다
    if (e.key === 'Enter' || (!e.shiftKey && (key === 's' || e.code === 'KeyS'))) {
      e.preventDefault()
      void handleSave()
    } else if (key === 'h' || e.code === 'KeyH') {
      e.preventDefault()
      openHighlight('toolbar')
    }
  }

  // ── 상태줄 수치 ───────────────────────────────────────────────────
  const plainLength = useMemo(() => columnPlainText(draft.content || '').replace(/\s/g, '').length, [draft.content])
  const minutes = draft.content ? readingMinutes(draft.content) : 0
  const savedLabel = savedAt
    ? savedAt.toLocaleTimeString(ko ? 'ko-KR' : 'en-US', { hour: 'numeric', minute: '2-digit' })
    : null

  // ── 조각 ──────────────────────────────────────────────────────────
  const fontControl = (
    <div className="flex items-center gap-1 rounded-xl bg-surface-light dark:bg-white/[0.06] p-1" role="group" aria-label={ko ? '글자 크기' : 'Text size'}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => changeFont(-1)}
        disabled={fontPx === EDITOR_FONT_STEPS[0]}
        className="h-10 px-3 rounded-lg text-[15px] font-bold text-ink-strong hover:bg-white dark:hover:bg-white/[0.1] disabled:opacity-35 transition-colors"
        aria-label={ko ? '글자 작게' : 'Smaller text'}
      >
        가<span className="text-[12px] align-top">−</span>
      </button>
      <span className="min-w-[44px] text-center text-[14px] font-semibold tabular-nums text-gray-600 dark:text-gray-300">{fontPx}</span>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => changeFont(1)}
        disabled={fontPx === EDITOR_FONT_STEPS[EDITOR_FONT_STEPS.length - 1]}
        className="h-10 px-3 rounded-lg text-[19px] font-bold text-ink-strong hover:bg-white dark:hover:bg-white/[0.1] disabled:opacity-35 transition-colors"
        aria-label={ko ? '글자 크게' : 'Larger text'}
      >
        가<span className="text-[13px] align-top">+</span>
      </button>
    </div>
  )

  const restoreBanner = pendingRestore && (
    <div className="mb-6 rounded-2xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] px-4 lg:px-5 py-3 lg:py-4 flex items-center gap-3">
      <p className="flex-1 text-[13px] lg:text-[16px] text-ink-strong leading-[1.5]">
        {ko ? '작성 중이던 내용이 남아 있어요' : 'You have an unsaved draft'}
      </p>
      <button
        type="button"
        onClick={() => {
          setDraft((prev) => ({ ...prev, ...pendingRestore }))
          if (pendingRestore.content !== undefined) replaceBody(pendingRestore.content)
          dismissRestore()
        }}
        className="px-3 lg:px-4 py-1.5 lg:py-2.5 rounded-lg lg:rounded-xl bg-[var(--brand)] text-white text-[12px] lg:text-[15px] font-semibold"
      >
        {ko ? '이어 쓰기' : 'Restore'}
      </button>
      <button
        type="button"
        onClick={dismissRestore}
        className="px-2 lg:px-3 py-1.5 lg:py-2.5 text-[12px] lg:text-[15px] font-semibold text-gray-500 dark:text-gray-400"
      >
        {ko ? '버리기' : 'Discard'}
      </button>
    </div>
  )

  // 편지지 — 흰 크롬(머리·서식 바·정보 패널) / 회색 캔버스 / 흰 종이 3층으로 종이가 떠 보이게.
  // 날짜 오버라인·세리프 대제목·악센트 룰·본문까지 읽기 화면과 같은 순서
  const paper = (
    <div
      className="ce-editor bg-[var(--surface-container)] lg:rounded-[28px] lg:border lg:border-black/[0.05] lg:dark:border-white/[0.06] lg:shadow-[0_1px_3px_rgba(15,23,42,0.05),0_12px_40px_-16px_rgba(15,23,42,0.14)] lg:dark:shadow-none px-5 py-6 lg:px-16 lg:py-14"
      style={{ ['--ce-fs' as string]: `${fontPx}px` }}
    >
      {restoreBanner}

      <div className="text-gray-500 dark:text-gray-400" style={{ fontSize: `${Math.max(13, fontPx * 0.68)}px` }}>
        {draft.date ? formatLetterDate(draft.date, language) : ''}
        {minutes > 0 && (
          <>
            <span className="mx-1.5 opacity-60">·</span>
            {ko ? `${minutes}분 분량` : `${minutes} min read`}
          </>
        )}
      </div>
      <textarea
        ref={titleRef}
        rows={1}
        value={draft.title || ''}
        onChange={(e) => patch({ title: e.target.value.replace(/\n/g, ' ') })}
        onKeyDown={(e) => {
          // 제목에서 엔터 → 본문으로 내려간다
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && !(e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            editor?.commands.focus('start')
          }
        }}
        placeholder={ko ? '이번 주 편지의 제목' : 'Title of this week’s letter'}
        aria-label={ko ? '제목' : 'Title'}
        className="block w-full mt-3 bg-transparent resize-none overflow-hidden border-none outline-none p-0 font-semibold text-ink-strong placeholder:text-gray-400 dark:placeholder:text-gray-600 tracking-[-0.015em] leading-[1.4] break-keep"
        style={{ fontFamily: SERIF, fontSize: `${Math.round(fontPx * 1.45)}px` }}
      />
      <div className="w-10 h-[3px] rounded-full bg-[var(--brand-muted)] opacity-50 mt-6 mb-9"></div>

      {/* 백지 대신 틀에서 시작 — 목양칼럼은 매주 흐름이 비슷하다 */}
      {!draft.content && (
        <div className="mb-8">
          <p className="text-[12px] lg:text-[14px] font-semibold text-gray-500 dark:text-gray-400 mb-2.5">
            {ko ? '틀에서 시작하기' : 'Start from a template'}
          </p>
          <div className="flex flex-wrap gap-2 lg:gap-3">
            {COLUMN_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => replaceBody(t.body)}
                className="px-3.5 lg:px-5 py-2.5 lg:py-3.5 rounded-xl lg:rounded-2xl border border-border-light dark:border-white/[0.1] text-left hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] transition-colors"
              >
                <span className="block text-[13px] lg:text-[16px] font-semibold text-ink-strong">{t.label[ko ? 0 : 1]}</span>
                <span className="block text-[11px] lg:text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 lg:mt-1">{t.hint[ko ? 0 : 1]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  )

  const preview = (
    <div className="px-4 py-5 lg:px-10 lg:py-10">
      {/* 미리보기 중임을 크게 알린다 — 여기서는 글이 고쳐지지 않으므로 돌아가는 길도 바로 옆에 */}
      <div className="max-w-[720px] mx-auto mb-4 lg:mb-6 flex items-center gap-3 rounded-2xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] px-4 lg:px-5 py-3 lg:py-4">
        <svg viewBox="0 0 20 20" fill="none" stroke="var(--brand)" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0">
          <path d="M1.8 10S4.8 4.5 10 4.5 18.2 10 18.2 10 15.2 15.5 10 15.5 1.8 10 1.8 10z" />
          <circle cx="10" cy="10" r="2.6" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] lg:text-[17px] font-bold text-ink-strong">{ko ? '미리보기 중입니다' : 'Previewing'}</p>
          <p className="text-[12px] lg:text-[14px] text-gray-600 dark:text-gray-300 mt-0.5">
            {ko ? '성도님께 보이는 모습이에요. 여기서는 글을 고칠 수 없습니다.' : 'This is what your congregation will see. Editing is off here.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setView('write')}
          className="flex-shrink-0 px-3.5 lg:px-5 py-2 lg:py-3 rounded-xl bg-[var(--brand)] text-white text-[13px] lg:text-[16px] font-bold shadow-[0_2px_8px_var(--brand-glow)]"
        >
          {ko ? '작성으로 돌아가기' : 'Back to writing'}
        </button>
      </div>
      <div className="max-w-[720px] mx-auto bg-[var(--surface-container)] rounded-2xl lg:rounded-[28px] border border-border-light dark:border-border-dark px-6 py-8 lg:px-12 lg:py-12">
        <ColumnLetter language={language} column={draft} fontSize={FONT_STEPS[1]} placeholder />
      </div>
    </div>
  )

  // 편지 정보 — PC 는 오른쪽 패널, 모바일은 편지지 위
  const meta = (
    <div className="px-5 py-5 lg:px-7 lg:py-7 space-y-4 lg:space-y-5">
      <p className="hidden lg:block text-[15px] font-bold text-ink-strong tracking-[-0.015em]">{ko ? '편지 정보' : 'Letter details'}</p>

      <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-5">
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

      <div>
        <label className={LABEL_CLASS}>{ko ? '날짜' : 'Date'}</label>
        {/* 네이티브 date 입력은 09/11/2026·OS 달력이라 앱 공통 DatePicker로 */}
        <DatePicker value={draft.date || ''} onChange={(date) => patch({ date })} className={DATE_TRIGGER_CLASS} />
      </div>

      <div>
        <label className={LABEL_CLASS}>{ko ? '표지 사진' : 'Cover photo'}</label>
        <div className="flex lg:flex-col items-center lg:items-stretch gap-2.5 lg:gap-3">
          {draft.image ? (
            <img
              src={draft.image}
              alt=""
              onLoad={(e) => {
                const { naturalWidth } = e.currentTarget
                setSmallCoverWidth(naturalWidth < COVER_MIN_WIDTH ? naturalWidth : null)
              }}
              className="w-16 h-11 lg:w-full lg:h-auto lg:aspect-[16/9] rounded-lg lg:rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <button
              type="button"
              onClick={() => pickImage('cover')}
              disabled={uploading}
              className="w-16 h-11 lg:w-full lg:h-auto lg:aspect-[16/9] rounded-lg lg:rounded-xl border border-dashed border-border-light dark:border-white/[0.14] flex-shrink-0 lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-1.5 text-gray-500 dark:text-gray-400 hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
              aria-label={ko ? '표지 사진 올리기' : 'Upload cover photo'}
            >
              <span className="hidden lg:block text-[15px] font-semibold">{ko ? '+ 표지 사진 올리기' : '+ Upload cover'}</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => pickImage('cover')}
              disabled={uploading}
              className={`px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg lg:rounded-xl bg-surface-light dark:bg-white/[0.06] text-[12px] lg:text-[14px] font-semibold text-ink-strong disabled:opacity-50 ${draft.image ? '' : 'lg:hidden'}`}
            >
              {uploading ? (ko ? '올리는 중…' : 'Uploading…') : draft.image ? (ko ? '변경' : 'Change') : ko ? '올리기' : 'Upload'}
            </button>
            {draft.image && (
              <button
                type="button"
                onClick={() => patch({ image: '' })}
                className="px-2 py-2 text-[12px] lg:text-[14px] font-semibold text-gray-500 dark:text-gray-400"
              >
                {ko ? '삭제' : 'Remove'}
              </button>
            )}
          </div>
        </div>
        {draft.image && smallCoverWidth ? (
          <p className="mt-1.5 text-[11.5px] lg:text-[13px] leading-[1.5] font-semibold text-red-500 dark:text-red-400">
            {ko
              ? `사진이 작아요(폭 ${smallCoverWidth}px) — 늘어나 흐리게 보일 수 있습니다. 폭 1200px 이상을 권합니다`
              : `This photo is small (${smallCoverWidth}px wide) and may look blurry. Use one at least 1200px wide`}
          </p>
        ) : (
          <p className="mt-1.5 text-[11.5px] lg:text-[13px] leading-[1.5] text-gray-500 dark:text-gray-400">
            {ko ? '가로로 긴 사진, 폭 1200px 이상이면 가장 선명합니다' : 'Best with a landscape photo at least 1200px wide'}
          </p>
        )}
      </div>

      {/* 영어 번역 — 필요할 때만 펼친다 */}
      <details className="group pt-1" open={showEn} onToggle={(e) => setShowEn((e.currentTarget as HTMLDetailsElement).open)}>
        <summary className="text-xs lg:text-[14px] font-semibold text-gray-500 dark:text-gray-400 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden flex items-center gap-1.5">
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
            rows={8}
            className={`${INPUT_CLASS} leading-[1.7] resize-y`}
            placeholder={ko ? '영문 본문 (## 소제목 · > 인용 · :: 강조 상자 · **굵게** · _기울임_ 문법)' : 'English content (## heading · > quote · :: callout · --- divider)'}
          />
        </div>
      </details>

      {/* 쓰기 도움말 — PC 에서만, 키보드로 쓰는 분을 위한 요약 */}
      <div className="hidden lg:block rounded-2xl bg-surface-light dark:bg-white/[0.04] px-5 py-4">
        <p className="text-[14px] font-bold text-ink-strong mb-2.5">{ko ? '쓰기 도움말' : 'Writing tips'}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13.5px] leading-[1.5]">
          {(ko
            ? [
                ['Enter', '한 줄 아래로'],
                ['Enter 두 번', '새 문단 (간격 띄우기)'],
                ['## + 띄어쓰기', '소제목'],
                ['> + 띄어쓰기', '인용·성구'],
                [':: + 띄어쓰기', '강조 상자'],
                ['- / 1. + 띄어쓰기', '목록'],
                ['---', '구분선'],
                ['빌 4:7 → Tab', '성구를 치면 그 말씀으로 바꿔 넣기'],
                [`${modKey('B')} ${modKey('I')} ${modKey('U')}`, '굵게 · 기울임 · 밑줄'],
                [modKey('H'), '형광펜'],
                [`${modKey('Z')} / ${redoKey}`, '되돌리기 / 다시'],
                [modKey('S'), '저장'],
              ]
            : [
                ['Enter', 'Line break'],
                ['Enter twice', 'New paragraph'],
                ['## + space', 'Heading'],
                ['> + space', 'Quote'],
                [':: + space', 'Callout'],
                ['- / 1. + space', 'List'],
                ['---', 'Divider'],
                ['빌 4:7 → Tab', 'Type a reference, press Tab to insert the verse'],
                [`${modKey('B')} ${modKey('I')} ${modKey('U')}`, 'Bold · Italic · Underline'],
                [modKey('H'), 'Highlight'],
                [`${modKey('Z')} / ${redoKey}`, 'Undo / Redo'],
                [modKey('S'), 'Save'],
              ]
          ).map(([k, v]) => (
            <div key={k} className="contents">
              <dt>
                <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-white/[0.08] border border-border-light dark:border-white/[0.1] font-sans text-[12.5px] font-semibold text-ink-strong whitespace-nowrap">
                  {k}
                </kbd>
              </dt>
              <dd className="text-gray-600 dark:text-gray-300">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[12.5px] leading-[1.6] text-gray-500 dark:text-gray-400">
          {ko ? '인용의 마지막 줄을 "— 시편 23:1" 처럼 쓰면 출처로 작게 표시됩니다.' : 'End a quote with "— Psalm 23:1" to show it as the citation.'}
        </p>
      </div>
    </div>
  )

  // 작성 중 실수로 닫히지 않도록 배경 클릭으로는 닫지 않는다(X 버튼·뒤로가기만)
  return (
    <div
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-lg z-[110] flex items-stretch justify-center p-0 lg:p-4"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-[var(--surface-container)] w-full h-full flex flex-col rounded-none lg:rounded-3xl lg:max-w-[1680px] lg:border lg:border-border-light lg:dark:border-border-dark lg:shadow-[0_30px_80px_-20px_var(--brand-glow),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden">
        {/* 머리 — 제목 · 작성/미리보기 · 닫기 */}
        <div className="flex-shrink-0 border-b border-border-light dark:border-border-dark px-5 lg:px-7 py-3.5 lg:py-4 flex items-center justify-between gap-3">
          <h2 className="text-[17px] lg:text-[20px] font-bold text-ink-strong tracking-[-0.015em] flex-shrink-0">
            {draft.id ? (ko ? '편지 수정' : 'Edit Letter') : ko ? '편지 쓰기' : 'Write a Letter'}
          </h2>

          <div className="flex items-center gap-2 lg:gap-3">
            <div className="flex bg-surface-light dark:bg-white/[0.06] rounded-xl p-0.5 lg:p-1">
              {(['write', 'preview'] as const).map((tab) => {
                const on = view === tab
                return (
                  <button
                    key={tab}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setView(tab)
                      setHighlight(null)
                    }}
                    // 지금 모드가 한눈에 — 켜진 쪽은 브랜드색으로 꽉 채우고 아이콘을 붙인다(노안에도 색·모양 두 겹으로 구분)
                    className={`inline-flex items-center gap-1.5 px-3 lg:px-5 py-1.5 lg:py-2.5 rounded-lg lg:rounded-xl text-[13px] lg:text-[16px] font-bold transition-colors ${
                      on
                        ? 'bg-[var(--brand)] text-white shadow-[0_2px_8px_var(--brand-glow)]'
                        : 'text-gray-500 dark:text-gray-400 hover:text-ink-strong'
                    }`}
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4 lg:w-[18px] lg:h-[18px]">
                      {tab === 'write' ? (
                        <path d="M12.8 3.9l3.3 3.3L7.3 16H4v-3.3z" />
                      ) : (
                        <>
                          <path d="M1.8 10S4.8 4.5 10 4.5 18.2 10 18.2 10 15.2 15.5 10 15.5 1.8 10 1.8 10z" />
                          <circle cx="10" cy="10" r="2.6" />
                        </>
                      )}
                    </svg>
                    {tab === 'write' ? (ko ? '작성' : 'Write') : ko ? '미리보기' : 'Preview'}
                  </button>
                )
              })}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 lg:w-11 lg:h-11 flex items-center justify-center rounded-full hover:bg-[var(--brand-soft)] transition-colors flex-shrink-0"
              aria-label={ko ? '닫기' : 'Close'}
            >
              <span className="material-icons-outlined text-[20px] lg:text-[24px] text-gray-600 dark:text-gray-400">close</span>
            </button>
          </div>
        </div>

        {/* 서식 바 — 작성 중에만. 팝오버 기준점(relative)은 가로 스크롤 바깥에 둔다 */}
        {editor && view === 'write' && (
          <div className="relative flex-shrink-0 border-b border-border-light dark:border-border-dark px-3 lg:px-6 py-1.5 lg:py-2.5 bg-[var(--surface-container)] z-20">
            <ColumnToolbar
              language={language}
              editor={editor}
              onImage={() => pickImage('body')}
              onHighlight={() => openHighlight('toolbar')}
              onVerse={() => {
                setHighlight(null)
                setVerseOpen(true)
              }}
              uploading={uploading}
              highlightSlot={highlightPopover('toolbar')}
              trailing={fontControl}
            />
          </div>
        )}

        {/* 몸통 — PC: 편지지(가운데) | 편지 정보(오른쪽), 모바일: 정보 → 편지지 한 줄 스크롤 */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
          <div
            ref={setScrollEl}
            className="lg:flex-1 lg:min-w-0 lg:overflow-y-auto bg-[var(--app-canvas)] order-2 lg:order-1"
          >
            {/* 편집기는 미리보기 동안에도 마운트해 둔다(되돌리기 기록·커서 유지) */}
            <div className={`lg:max-w-[880px] lg:mx-auto lg:px-8 lg:py-10 ${view === 'write' ? '' : 'hidden'}`}>{paper}</div>
            {view === 'preview' && preview}
          </div>
          <aside
            className={`order-1 lg:order-2 lg:w-[380px] xl:w-[400px] flex-shrink-0 lg:overflow-y-auto border-b lg:border-b-0 lg:border-l border-border-light dark:border-border-dark ${
              view === 'preview' ? 'hidden lg:block' : ''
            }`}
          >
            {meta}
          </aside>
        </div>

        {/* 발 — (PC)상태줄 · 취소 · 저장 */}
        <div className="flex-shrink-0 border-t border-border-light dark:border-border-dark p-4 lg:px-7 flex items-center gap-3 lg:justify-end">
          <div className="hidden lg:flex items-center gap-2 mr-auto text-[14px] text-gray-500 dark:text-gray-400 tabular-nums">
            <span>{ko ? `${plainLength.toLocaleString()}자` : `${plainLength.toLocaleString()} chars`}</span>
            {minutes > 0 && (
              <>
                <span className="opacity-50">·</span>
                <span>{ko ? `읽는 데 약 ${minutes}분` : `~${minutes} min read`}</span>
              </>
            )}
            {savedLabel && (
              <>
                <span className="opacity-50">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {ko ? `${savedLabel} 이 기기에 임시 저장됨` : `Draft kept on this device at ${savedLabel}`}
                </span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-1 lg:flex-none lg:px-8 py-3 lg:py-3.5 px-4 bg-surface-light dark:bg-white/[0.05] border border-transparent dark:border-white/[0.08] text-ink-strong rounded-2xl font-semibold text-sm lg:text-[16px] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
          >
            {ko ? '취소' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            title={`${modKey('S')} / ${modKey('Enter')}`}
            className="flex-1 lg:flex-none lg:px-12 py-3 lg:py-3.5 px-4 brand-gradient rounded-2xl font-semibold text-sm lg:text-[16px] shadow-[0_2px_10px_var(--brand-glow)] hover:shadow-[0_4px_16px_var(--brand-glow)] disabled:opacity-60 transition-all"
          >
            {saving ? (ko ? '저장 중…' : 'Saving…') : ko ? '저장하기' : 'Save'}
          </button>
        </div>
      </div>

      {/* 말풍선 메뉴 — 문구를 드래그하면 그 위에 형광펜 색이 바로 뜬다 */}
      {editor && (
        <BubbleMenu
          editor={editor}
          options={{ placement: 'top', strategy: 'fixed', scrollTarget: scrollEl ?? undefined }}
          shouldShow={({ view: pmView, state, from, to }) =>
            viewRef.current === 'write' && pmView.hasFocus() && from !== to && !(state.selection instanceof NodeSelection)
          }
          className="z-[120]"
        >
          <HighlightBubble
            editor={editor}
            ko={ko}
            onQuick={quickHighlight}
            onMore={() => openHighlight('bubble')}
            onRemove={removeHighlight}
            popover={highlightPopover('bubble')}
          />
        </BubbleMenu>
      )}

      {verseSuggest && view === 'write' && (
        <VerseSuggestCard
          ko={ko}
          suggest={verseSuggest}
          onReady={onSuggestReady}
          onInline={(p) => acceptSuggest(p, 'inline')}
          onQuote={(p) => acceptSuggest(p, 'quote')}
          onDismiss={() => editor && exitSuggestion(editor.view, verseSuggestionKey)}
        />
      )}

      {verseOpen && <VerseFinderDialog language={language} onInsert={insertPassage} onClose={() => setVerseOpen(false)} />}

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

interface HighlightBubbleProps {
  editor: Editor
  ko: boolean
  onQuick: (color: HighlightColor) => void
  onMore: () => void
  onRemove: () => void
  popover: React.ReactNode
}

/** 선택 문구 위 말풍선 — 굵게·기울임·밑줄·취소선 · 형광펜 색 6개 · 모양 고르기 · 지우기 */
const HighlightBubble = ({ editor, ko, onQuick, onMore, onRemove, popover }: HighlightBubbleProps) => {
  const { active, bold, italic, underline, strike } = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      active: e.isActive('columnHighlight') ? (e.getAttributes('columnHighlight').color as HighlightColor) : null,
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
    }),
  })

  // 글자 서식 — 드래그한 자리에서 바로 (서식 바까지 눈을 옮기지 않게)
  const formats = [
    { key: 'bold', on: bold, label: 'B', title: ko ? '굵게' : 'Bold', cls: 'font-extrabold', run: () => editor.chain().focus().toggleBold().run() },
    { key: 'italic', on: italic, label: 'I', title: ko ? '기울임' : 'Italic', cls: 'italic font-serif', run: () => editor.chain().focus().toggleItalic().run() },
    { key: 'underline', on: underline, label: 'U', title: ko ? '밑줄' : 'Underline', cls: 'underline underline-offset-2', run: () => editor.chain().focus().toggleUnderline().run() },
    { key: 'strike', on: strike, label: 'S', title: ko ? '취소선' : 'Strikethrough', cls: 'line-through', run: () => editor.chain().focus().toggleStrike().run() },
  ]

  return (
    <div className="relative" onMouseDown={(e) => e.preventDefault()}>
      <div className="flex items-center gap-1.5 rounded-2xl border border-border-light dark:border-white/[0.1] bg-white dark:bg-[#1c1c1c] shadow-[0_12px_32px_rgba(0,0,0,0.16)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] px-2.5 py-2">
        {formats.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={f.run}
            title={f.title}
            aria-label={f.title}
            aria-pressed={f.on}
            className={`w-9 h-9 rounded-xl text-[17px] ${f.cls} transition-colors ${
              f.on ? 'bg-[var(--brand)] text-white' : 'text-ink-strong hover:bg-[var(--brand-soft)]'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="w-px h-6 bg-border-light dark:bg-white/[0.1] mx-1"></span>
        <span className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 pl-1 pr-1.5">{ko ? '형광펜' : 'Marker'}</span>
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onQuick(c)}
            aria-label={c}
            aria-pressed={active === c}
            className={`w-8 h-8 rounded-full transition-transform ${
              active === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#1c1c1c] ring-[var(--brand)]' : 'hover:scale-110'
            }`}
            style={{ background: swatchColor(c) }}
          />
        ))}
        <span className="w-px h-6 bg-border-light dark:bg-white/[0.1] mx-1"></span>
        <button
          type="button"
          onClick={onMore}
          className="h-9 px-3 rounded-xl text-[14px] font-semibold text-ink-strong hover:bg-[var(--brand-soft)] transition-colors"
        >
          {ko ? '모양' : 'Style'}
        </button>
        {active && (
          <button
            type="button"
            onClick={onRemove}
            className="h-9 px-3 rounded-xl text-[14px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
          >
            {ko ? '지우기' : 'Clear'}
          </button>
        )}
      </div>
      {popover}
    </div>
  )
}

export default ColumnEditorModal
