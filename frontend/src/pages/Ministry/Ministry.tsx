import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useLanguage } from '../../contexts/LanguageContext'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { isAdmin, isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import {
  getColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  toggleColumnAmen,
} from '../../api/column'
import type { Column, CreateColumnRequest } from '../../types/column'
import HighlightPopover from './HighlightPopover'
import {
  DEFAULT_HIGHLIGHT,
  buildHighlightMarkup,
  expandSelectionOverMarkup,
  parseHighlightToken,
  removeHighlightTags,
  renderHighlightedText,
  type HighlightOptions,
} from './highlightMarkup'
import andongProfile from '../../assets/andong.png'

// 편지·에세이 톤의 서체 — 성경 읽기 설정과 동일한 스택(이미 index.html에서 로드됨)
// Noto Serif KR은 400/600만 로드되어 있으므로 굵기는 font-semibold(600)까지만 사용
const SERIF = "'Noto Serif KR', 'Nanum Myeongjo', 'Apple SD Gothic Neo', serif"
const PEN = "'Nanum Pen Script', 'Pretendard', cursive"

// 정규식 메타문자 이스케이프
const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// 검색 키워드를 텍스트에서 하이라이트 (목록 카드용)
const highlightKeyword = (text: string, keyword: string) => {
  const trimmed = keyword.trim()
  if (!trimmed) return text
  const lowerKey = trimmed.toLowerCase()
  const regex = new RegExp(`(${escapeRegex(trimmed)})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    part.toLowerCase() === lowerKey ? (
      <mark
        key={i}
        className="bg-yellow-200 dark:bg-yellow-700/70 text-inherit rounded px-0.5"
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

// "2026-07-26" → "2026년 7월 26일 주일" (교회 맥락이므로 일요일은 '주일'로)
const parseDate = (dateStr: string): Date | null => {
  const m = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!m) return null
  return new Date(+m[1], +m[2] - 1, +m[3])
}

const formatLetterDate = (dateStr: string, language: string): string => {
  const d = parseDate(dateStr)
  if (!d) return dateStr
  if (language === 'ko') {
    const days = ['주일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}`
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// 한국어 평균 묵독 속도(분당 약 500자) 기준 읽기 시간
const readingMinutes = (content: string): number =>
  Math.max(1, Math.round(removeHighlightTags(content).length / 500))

// 최신 글이 7일 이내면 "이번 주 편지" 배지
const isThisWeek = (dateStr: string): boolean => {
  const d = parseDate(dateStr)
  if (!d) return false
  const diff = Date.now() - d.getTime()
  return diff >= 0 && diff < 1000 * 60 * 60 * 24 * 7
}

// 본문의 첫 하이라이트 문장 — 피처드 카드에서 인용구로 노출
const firstHighlight = (content: string): string | null => {
  const m = content.match(/\[\[(.*?)\]\]/)
  // [[문구|yellow|wavy]] 처럼 옵션이 붙어 있으면 문구만
  const text = m?.[1]?.split('|')[0]?.trim()
  return text || null
}

// 본문 글자 크기 3단계 — 어르신 성도가 많은 교회 특성상 필수
const FONT_STEPS = [15.5, 16.5, 18.5]
const FONT_STEP_KEY = 'ministry_font_step'
const loadFontStep = (): number => {
  const n = Number(localStorage.getItem(FONT_STEP_KEY))
  return Number.isInteger(n) && n >= 0 && n < FONT_STEPS.length ? n : 1
}

// "2026년 7월" 단위 아카이브 그룹 라벨
const formatMonthLabel = (dateStr: string, language: string): string => {
  const d = parseDate(dateStr)
  if (!d) return dateStr
  return language === 'ko'
    ? `${d.getFullYear()}년 ${d.getMonth() + 1}월`
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

const Ministry = () => {
  const { language } = useLanguage()
  const isAdminUser = isAdmin()
  const queryClient = useQueryClient()
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingColumn, setEditingColumn] = useState<Partial<Column>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [readProgress, setReadProgress] = useState(0)
  const [fontStep, setFontStep] = useState<number>(loadFontStep)
  // 검색 결과에 흔들리지 않는 전체 편지 목록 (우측 레일 위젯 전용 스냅샷)
  const [allColumns, setAllColumns] = useState<Column[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [highlightOpen, setHighlightOpen] = useState(false)
  const [highlightOpt, setHighlightOpt] = useState<HighlightOptions>(DEFAULT_HIGHLIGHT)
  const [highlightSel, setHighlightSel] = useState<{ start: number; end: number; text: string; existing: boolean } | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const modalScrollRef = useRef<HTMLDivElement>(null)
  // 아멘 요청 진행 중인 편지 (연타로 토글이 꼬이는 것 방지)
  const pendingAmenRef = useRef<Set<number>>(new Set())

  // 모바일 뒤로가기 → 페이지 이탈 대신 열린 모달만 닫기
  useModalBackButton(() => setSelectedColumn(null), !!selectedColumn)
  useModalBackButton(() => { setIsEditing(false); setEditingColumn({}) }, isEditing)
  useModalBackButton(() => setShowDeleteConfirm(false), showDeleteConfirm)

  // 검색어 변경 시 디바운스 — appliedQuery가 바뀌면 아래 쿼리가 자동 실행됨
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedQuery(searchQuery.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // 검색창 열릴 때 자동 포커스
  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus()
    }
  }, [showSearch])

  // 편지를 열거나 다른 편지로 이동할 때마다 진행 바·관리자 메뉴·스크롤 초기화
  useEffect(() => {
    setReadProgress(0)
    setShowAdminMenu(false)
    modalScrollRef.current?.scrollTo({ top: 0 })
  }, [selectedColumn])

  // 칼럼은 주 1건 수준이라 캐시 우선: 재방문 시 캐시를 즉시 보여주고,
  // 30분 지난 경우에만 백그라운드에서 조용히 갱신 (persister로 앱 재시작에도 유지)
  const {
    data: columns = [],
    isPending: loading,
    isError,
  } = useQuery({
    queryKey: ['columns', appliedQuery],
    queryFn: async () => {
      const data = await getColumns(appliedQuery)
      return data.filter(c => c.is_active)
    },
    staleTime: 1000 * 60 * 30,
    refetchOnMount: true, // 전역 기본(false)을 덮어써야 stale 시 백그라운드 갱신이 됨
    placeholderData: keepPreviousData, // 검색어 타이핑 중 스피너 깜빡임 방지
  })

  // 검색 중이 아닐 때의 목록이 곧 전체 편지 — 이때만 스냅샷을 갱신한다 (목록은 최신순)
  useEffect(() => {
    if (appliedQuery) return
    setAllColumns(columns)
  }, [appliedQuery, columns])

  useEffect(() => {
    if (isError) {
      showToast('목양컬럼을 불러오는데 실패했습니다', 'error')
    }
  }, [isError])

  // 관리자 변경 사항을 캐시에 즉시 반영하고, 서버 기준으로 재검증
  const syncColumnsCache = (updater: (prev: Column[]) => Column[]) => {
    queryClient.setQueriesData<Column[]>({ queryKey: ['columns'] }, (prev) =>
      prev ? updater(prev) : prev
    )
    queryClient.invalidateQueries({ queryKey: ['columns'] })
  }

  // 아멘·완독은 캐시만 갱신한다 (invalidate 하면 방금 누른 값이 재조회로 되돌아가 깜빡인다)
  const patchColumnCache = (id: number, patch: Partial<Column>) => {
    queryClient.setQueriesData<Column[]>({ queryKey: ['columns'] }, (prev) =>
      prev ? prev.map(c => (c.id === id ? { ...c, ...patch } : c)) : prev
    )
  }

  const toggleSearch = () => {
    if (showSearch) {
      // 닫을 때 검색어 초기화
      setSearchQuery('')
    }
    setShowSearch(!showSearch)
  }

  const handleAddNew = () => {
    setEditingColumn({
      title: '',
      author: '',
      role: '',
      date: new Date().toISOString().split('T')[0],
      content: '',
      is_active: true
    })
    setIsEditing(true)
  }

  const handleEdit = (column: Column) => {
    setEditingColumn(column)
    setIsEditing(true)
    setShowAdminMenu(false)
    setSelectedColumn(null)
  }

  const handleSave = async () => {
    if (!editingColumn.title || !editingColumn.author || !editingColumn.content) {
      showToast('제목, 작성자, 내용은 필수입니다', 'error')
      return
    }

    try {
      if (editingColumn.id) {
        // 수정
        const updated = await updateColumn(editingColumn.id, editingColumn)
        syncColumnsCache(prev => prev.map(c => c.id === updated.id ? updated : c))
        showToast('목양컬럼이 수정되었습니다', 'success')
      } else {
        // 생성
        const created = await createColumn(editingColumn as CreateColumnRequest)
        syncColumnsCache(prev => [created, ...prev])
        showToast('목양컬럼이 추가되었습니다', 'success')
      }
      setIsEditing(false)
      setEditingColumn({})
    } catch (error) {
      console.error('Failed to save column:', error)
      showToast('저장에 실패했습니다', 'error')
    }
  }

  const handleDelete = async () => {
    if (!selectedColumn?.id) return

    try {
      await deleteColumn(selectedColumn.id)
      syncColumnsCache(prev => prev.filter(c => c.id !== selectedColumn.id))
      showToast('목양컬럼이 삭제되었습니다', 'success')
      setSelectedColumn(null)
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Failed to delete column:', error)
      showToast('삭제에 실패했습니다', 'error')
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditingColumn({})
  }

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
    setEditingColumn((prev) => ({ ...prev, content: newContent }))
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

  // 상세 모달 스크롤 → 상단 읽기 진행 바
  const handleModalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const max = el.scrollHeight - el.clientHeight
    const progress = max > 0 ? Math.min(1, el.scrollTop / max) : 1
    setReadProgress(progress)
  }

  // 아멘 토글 — 낙관적 업데이트 후 서버 확정값으로 동기화
  const handleAmen = async (column: Column) => {
    const id = column.id
    if (id == null) return
    if (!isAuthenticated()) {
      showToast(
        language === 'ko' ? '로그인하면 아멘을 남길 수 있어요' : 'Sign in to leave an Amen',
        'error'
      )
      return
    }
    if (pendingAmenRef.current.has(id)) return
    pendingAmenRef.current.add(id)

    const wasAmened = !!column.is_amened
    patchColumnCache(id, {
      is_amened: !wasAmened,
      amen_count: Math.max(0, (column.amen_count ?? 0) + (wasAmened ? -1 : 1)),
    })

    try {
      const res = await toggleColumnAmen(id)
      patchColumnCache(id, {
        is_amened: res.is_amened,
        amen_count: res.amen_count,
      })
    } catch {
      // 롤백
      patchColumnCache(id, { is_amened: wasAmened, amen_count: column.amen_count ?? 0 })
      showToast(
        language === 'ko' ? '잠시 후 다시 시도해 주세요' : 'Please try again later',
        'error'
      )
    } finally {
      pendingAmenRef.current.delete(id)
    }
  }

  const openColumn = (column: Column) => {
    setSelectedColumn(column)
  }

  const cycleFontSize = () => {
    const next = (fontStep + 1) % FONT_STEPS.length
    setFontStep(next)
    try { localStorage.setItem(FONT_STEP_KEY, String(next)) } catch { /* 무시 */ }
  }

  // 공유 — 카톡 전달을 염두에 두고 편지 전문을 텍스트로
  const handleShareColumn = async () => {
    if (!selectedColumn) return
    const body = removeHighlightTags(selectedColumn.content)
    const signature = language === 'ko' ? `${selectedColumn.author} 드림` : `— ${selectedColumn.author}`
    const text = `${selectedColumn.title}\n${formatLetterDate(selectedColumn.date, language)}\n\n${body}\n\n${signature}`
    if (navigator.share) {
      try {
        // title은 넘기지 않는다 — 카톡 등 대다수 대상이 title+text를 이어 붙여
        // 보내서 이미 text 첫 줄에 있는 제목이 두 번 나온다
        await navigator.share({ text })
      } catch { /* 사용자가 공유 시트를 닫은 경우 */ }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        showToast(language === 'ko' ? '편지 내용이 복사되었습니다' : 'Letter copied to clipboard', 'success')
      } catch {
        showToast(language === 'ko' ? '복사에 실패했습니다' : 'Failed to copy', 'error')
      }
    }
  }

  // 검색 중에는 피처드 없이 전부 인덱스 행으로
  const featured = !appliedQuery && columns.length > 0 ? columns[0] : null
  const restColumns = featured ? columns.slice(1) : columns
  const featuredQuote = featured ? firstHighlight(featured.content) : null

  // 지난 편지 월별 그룹 (목록은 최신순이므로 순서 유지하며 묶기만)
  const monthGroups: { label: string; items: Column[] }[] = []
  if (!appliedQuery) {
    for (const col of restColumns) {
      const label = formatMonthLabel(col.date, language)
      const last = monthGroups[monthGroups.length - 1]
      if (last && last.label === label) last.items.push(col)
      else monthGroups.push({ label, items: [col] })
    }
  }

  // 우측 위젯 '편지함' — 지금까지 쌓인 전체 통수와, 지난 편지에서 밑줄 그은 문장.
  // 검색 중에는 columns가 결과만 담으므로 검색 전 스냅샷(allColumns)을 쓴다.
  // 최신 편지는 피처드 카드에서 이미 인용구로 보여주므로 여기선 제외한다
  const totalLetters = allColumns.length
  const railHighlights = allColumns
    .slice(1)
    .map(c => ({ column: c, quote: firstHighlight(c.content) }))
    .filter((h): h is { column: Column; quote: string } => !!h.quote)
    .slice(0, 3)

  // 상세 하단 이어읽기 — 다음(더 최신)·이전(더 과거) 편지
  const selectedIdx = selectedColumn ? columns.findIndex(c => c.id === selectedColumn.id) : -1
  const newerColumn = selectedIdx > 0 ? columns[selectedIdx - 1] : null
  const olderColumn = selectedIdx >= 0 && selectedIdx < columns.length - 1 ? columns[selectedIdx + 1] : null

  // 아멘 수는 캐시 쪽이 최신이므로, 참여 UI는 목록 캐시의 같은 편지를 본다
  const liveSelected = selectedColumn
    ? columns.find(c => c.id === selectedColumn.id) ?? selectedColumn
    : null

  // 인덱스 행 — 일반 목록과 검색 결과가 공유
  const renderIndexRow = (column: Column) => (
    <button
      key={column.id}
      className="w-full text-left py-4 group"
      onClick={() => openColumn(column)}
    >
      <h3 className="min-w-0">
        <span
          className="text-[16px] font-semibold text-ink-strong line-clamp-1 tracking-[-0.01em] leading-[1.4] group-hover:text-[var(--brand)] transition-colors"
          style={{ fontFamily: SERIF }}
        >
          {highlightKeyword(column.title, appliedQuery)}
        </span>
      </h3>
      <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-1 leading-[1.6] mt-1.5">
        {highlightKeyword(removeHighlightTags(column.content), appliedQuery)}
      </p>
      <div className="text-[11.5px] text-gray-400 dark:text-gray-500 mt-1.5">
        {formatLetterDate(column.date, language)}
        <span className="mx-1.5 opacity-60">·</span>
        {language === 'ko'
          ? `${readingMinutes(column.content)}분`
          : `${readingMinutes(column.content)} min`}
      </div>
    </button>
  )

  return (
    <div className="bg-gray-50 dark:bg-background-dark min-h-screen page-stage">
      {/* lg+: 좁은 폰 프레임을 풀고 본문(편지) + 우측 위젯 레일 2컬럼으로 (/news와 같은 문법).
          좌측 레일 오프셋은 전역 main(App.tsx)이 잡아주므로 여기선 px-5만 둔다 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
      {/* lg+: 셸(배경·테두리·라운드)을 걷어낸다 — 안쪽이 전부 feed-card라 셸까지 두면
          스테이지 → 셸 → 헤더 띠 → 카드로 톤이 다른 층이 겹쳐 "상자 속 상자"가 된다 */}
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:bg-transparent lg:dark:bg-transparent lg:shadow-none lg:border-0 lg:min-h-0">
        {/* Header — 슬림하게: 제목(세리프)과 액션만.
            모바일은 sticky 바, lg+에선 배경·구분선 없는 페이지 타이틀 행으로 */}
        <div className="sticky top-14 lg:static z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark lg:bg-transparent lg:dark:bg-transparent lg:backdrop-blur-none lg:border-0">
          <div className="px-5 py-3.5 lg:px-1 lg:pt-4 lg:pb-5">
            <div className="flex items-center justify-between">
              <h1
                className="text-[21px] lg:text-[26px] font-semibold text-ink-strong tracking-[-0.01em] leading-[1.2]"
                style={{ fontFamily: SERIF }}
              >
                {language === 'ko' ? '목양칼럼' : 'Pastoral Column'}
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSearch}
                  className={`p-2 rounded-full transition-colors ${
                    showSearch
                      ? 'bg-[var(--brand-soft-strong)] text-[var(--brand)]'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-[var(--brand-soft)]'
                  }`}
                  aria-label={language === 'ko' ? '검색' : 'Search'}
                  title={language === 'ko' ? '검색' : 'Search'}
                >
                  <span className="material-icons-outlined text-xl">
                    {showSearch ? 'close' : 'search'}
                  </span>
                </button>
                {isAdminUser && (
                  <button
                    onClick={handleAddNew}
                    className="px-4 py-2 brand-gradient rounded-full font-semibold text-sm shadow-[0_2px_10px_var(--brand-glow)] hover:shadow-[0_4px_16px_var(--brand-glow)] transition-all flex items-center gap-1.5"
                  >
                    <span className="material-icons-outlined text-lg">add</span>
                    <span>{language === 'ko' ? '추가' : 'Add'}</span>
                  </button>
                )}
              </div>
            </div>
            {showSearch && (
              <div className="mt-3 relative">
                <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">
                  search
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'ko' ? '제목 또는 본문에서 검색…' : 'Search title or content…'}
                  className="w-full pl-10 pr-10 py-2.5 border border-border-light dark:border-white/[0.08] rounded-full bg-white dark:bg-white/[0.04] text-ink-strong text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    aria-label={language === 'ko' ? '검색어 지우기' : 'Clear search'}
                  >
                    <span className="material-icons-outlined text-lg">close</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Column List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand)]"></div>
          </div>
        ) : columns.length === 0 ? (
          <div className="text-center py-20 text-gray-600 dark:text-gray-400">
            {appliedQuery
              ? (language === 'ko'
                  ? `"${appliedQuery}" 검색 결과가 없습니다`
                  : `No results for "${appliedQuery}"`)
              : (language === 'ko' ? '등록된 목양컬럼이 없습니다' : 'No columns available')}
          </div>
        ) : (
          <div className="px-4 pb-8 lg:px-0">
            {/* 인트로 — 작성자는 한 분이므로 사진은 여기서 단 한 번만 */}
            {featured && (
              <div className="px-1 pt-6 pb-5 flex items-center gap-4 lg:hidden">
                <img
                  src={andongProfile}
                  alt={featured.author}
                  className="w-14 h-14 rounded-full object-cover ring-1 ring-black/[0.07] dark:ring-white/[0.12] flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-ink-strong text-[15px] tracking-[-0.01em]">
                    {featured.author} {featured.role}
                  </div>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-[1.5] mt-1">
                    {language === 'ko'
                      ? '매주 마음을 담아 성도님들께 띄우는 목회 서신입니다'
                      : 'A weekly letter to our congregation, written with care'}
                  </p>
                </div>
              </div>
            )}

            {/* 피처드 — 최신 편지 한 통을 크게 */}
            {featured && (
              <article
                className="feed-card relative rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:border-[var(--brand-glow)] hover:shadow-[0_8px_24px_-8px_var(--brand-glow)] transition-all duration-200 cursor-pointer"
                onClick={() => openColumn(featured)}
              >
                {/* 다크모드 표면 그라데이션 — 홈 피드 카드와 동일 문법 */}
                <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none rounded-2xl"></div>

                {/* lg+: 2단 분할 대신 한 흐름(배지→날짜→제목→인용→발췌)으로 두고
                    줄 길이만 max-w로 제한 — 폭이 넓어도 "편지 한 통"으로 읽히게 */}
                <div className="relative z-10 p-6 lg:p-9 lg:max-w-[72ch]">
                  <div>
                  {isThisWeek(featured.date) && (
                    <span className="inline-flex items-center px-2.5 py-1 mb-3 rounded-full bg-[var(--brand-soft-strong)] text-[var(--brand)] text-[11px] font-semibold tracking-[-0.005em]">
                      {language === 'ko' ? '이번 주 편지' : "This Week's Letter"}
                    </span>
                  )}
                  <div className="text-[12px] text-gray-500 dark:text-gray-400 mb-2.5">
                    {formatLetterDate(featured.date, language)}
                    <span className="mx-1.5 opacity-60">·</span>
                    {language === 'ko'
                      ? `${readingMinutes(featured.content)}분`
                      : `${readingMinutes(featured.content)} min read`}
                    {/* 아멘은 모인 편지에만 조용히 — 지난 편지 인덱스에는 숫자를 두지 않는다 */}
                    {(featured.amen_count ?? 0) > 0 && (
                      <>
                        <span className="mx-1.5 opacity-60">·</span>
                        <span className="text-brand">🙏 {featured.amen_count}</span>
                      </>
                    )}
                  </div>
                  <h2
                    className="text-[21px] lg:text-[26px] font-semibold text-ink-strong mb-3 lg:mb-5 line-clamp-2 tracking-[-0.01em] leading-[1.4]"
                    style={{ fontFamily: SERIF }}
                  >
                    {featured.title}
                  </h2>
                  </div>

                  <div>
                  {featuredQuote ? (
                    // 목사님이 하이라이트한 문장을 인용구로 — 편지의 핵심 한 줄이 먼저 닿게
                    <>
                      <blockquote
                        className="border-l-2 pl-4 py-0.5"
                        style={{ borderColor: 'var(--brand-muted)' }}
                      >
                        <p
                          className="text-[15.5px] lg:text-[17px] text-ink-strong line-clamp-3 leading-[1.75] tracking-[-0.01em]"
                          style={{ fontFamily: SERIF }}
                        >
                          “{featuredQuote}”
                        </p>
                      </blockquote>
                      <p className="text-[14px] text-gray-600 dark:text-gray-300 line-clamp-2 leading-[1.8] tracking-[-0.01em] mt-3.5">
                        {removeHighlightTags(featured.content)}
                      </p>
                    </>
                  ) : (
                    <p className="text-[15px] text-gray-600 dark:text-gray-300 line-clamp-4 leading-[1.8] tracking-[-0.01em]">
                      {removeHighlightTags(featured.content)}
                    </p>
                  )}
                  </div>
                </div>
              </article>
            )}

            {/* 지난 편지 — 컴팩트 인덱스, 월별 그룹 (검색 중에는 결과 전체가 평면 리스트) */}
            {restColumns.length > 0 && (
              appliedQuery ? (
                <div className="feed-card rounded-2xl px-5 divide-y divide-border-light dark:divide-white/[0.06] mt-4">
                  {restColumns.map(renderIndexRow)}
                </div>
              ) : (
                <>
                  <div className="px-1 mt-8 mb-3 text-[13px] font-semibold text-gray-500 dark:text-gray-400 tracking-[-0.005em]">
                    {language === 'ko' ? '지난 편지' : 'Earlier Letters'}
                  </div>
                  {/* lg+: 넓어진 본문을 세로로만 쓰지 않도록 월 카드를 2열로
                      (한 달치뿐이면 그대로 한 줄) */}
                  <div
                    className={
                      monthGroups.length > 1
                        ? 'lg:grid lg:grid-cols-2 lg:gap-x-5 lg:gap-y-6 lg:items-start'
                        : ''
                    }
                  >
                  {monthGroups.map((group, gi) => (
                    <div key={group.label} id={`ministry-month-${gi}`} className="scroll-mt-20">
                      {/* 한 달치뿐이면 월 라벨은 소음 — 여러 달 쌓였을 때만 */}
                      {monthGroups.length > 1 && (
                        <div className={`px-1 mb-2 text-[12px] font-medium text-gray-400 dark:text-gray-500 lg:mt-0 ${gi > 0 ? 'mt-6' : ''}`}>
                          {group.label}
                        </div>
                      )}
                      <div className="feed-card rounded-2xl px-5 divide-y divide-border-light dark:divide-white/[0.06]">
                        {group.items.map(renderIndexRow)}
                      </div>
                    </div>
                  ))}
                  </div>
                </>
              )
            )}
          </div>
        )}

        {/* Detail Modal — 편지 읽기 화면 */}
        {selectedColumn && (
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-lg z-[110] flex items-stretch md:items-center justify-center p-0 md:p-4"
            onClick={() => setSelectedColumn(null)}
          >
            <div
              ref={modalScrollRef}
              className="bg-background-light dark:bg-background-dark w-full h-full rounded-none md:rounded-3xl md:max-w-md lg:max-w-2xl md:h-auto md:max-h-[calc(100dvh-2rem)] overflow-y-auto md:border md:border-border-light md:dark:border-border-dark md:shadow-[0_30px_80px_-20px_var(--brand-glow),0_0_0_1px_rgba(255,255,255,0.04)]"
              onClick={(e) => e.stopPropagation()}
              onScroll={handleModalScroll}
            >
              {/* 슬림 상단 바 — 읽기 진행 바 + 닫기/관리 메뉴만, 본문을 가리지 않게 */}
              <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md">
                <div
                  className="absolute top-0 left-0 h-[2.5px] bg-[var(--brand)] transition-[width] duration-150 ease-out"
                  style={{ width: `${readProgress * 100}%` }}
                ></div>
                <div className="flex items-center justify-between pl-5 pr-3 h-12">
                  <span className="text-[12px] font-semibold text-gray-400 dark:text-gray-500 tracking-[0.04em]">
                    {language === 'ko' ? '목양칼럼' : 'Pastoral Column'}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={cycleFontSize}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--brand-soft)] transition-colors"
                      aria-label={language === 'ko' ? '글자 크기 조절' : 'Adjust text size'}
                      title={language === 'ko' ? '글자 크기' : 'Text size'}
                    >
                      <span className="material-icons-outlined text-[20px] text-gray-600 dark:text-gray-400">format_size</span>
                    </button>
                    <button
                      onClick={handleShareColumn}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--brand-soft)] transition-colors"
                      aria-label={language === 'ko' ? '공유' : 'Share'}
                      title={language === 'ko' ? '공유' : 'Share'}
                    >
                      <span className="material-icons-outlined text-[19px] text-gray-600 dark:text-gray-400">share</span>
                    </button>
                    {isAdminUser && (
                      <div className="relative">
                        <button
                          onClick={() => setShowAdminMenu(v => !v)}
                          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--brand-soft)] transition-colors"
                          aria-label={language === 'ko' ? '관리' : 'Manage'}
                        >
                          <span className="material-icons-outlined text-[20px] text-gray-600 dark:text-gray-400">more_horiz</span>
                        </button>
                        {showAdminMenu && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowAdminMenu(false)}></div>
                            <div className="absolute right-0 top-10 z-20 w-36 py-1.5 rounded-2xl bg-background-light dark:bg-background-dark border border-border-light dark:border-white/[0.1] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.25)] overflow-hidden">
                              <button
                                onClick={() => handleEdit(selectedColumn)}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-ink-strong flex items-center gap-2.5 hover:bg-[var(--brand-soft)] transition-colors"
                              >
                                <span className="material-icons-outlined text-[18px] text-gray-500 dark:text-gray-400">edit</span>
                                <span>{language === 'ko' ? '수정' : 'Edit'}</span>
                              </button>
                              <button
                                onClick={() => { setShowAdminMenu(false); setShowDeleteConfirm(true) }}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                              >
                                <span className="material-icons-outlined text-[18px]">delete</span>
                                <span>{language === 'ko' ? '삭제' : 'Delete'}</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedColumn(null)}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--brand-soft)] transition-colors"
                      aria-label="닫기"
                    >
                      <span className="material-icons-outlined text-[20px] text-gray-600 dark:text-gray-400">close</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 편지 본문 */}
              <div className="px-6 pt-6 pb-12">
                {/* 오버라인 → 세리프 대제목 → 짧은 악센트 룰 */}
                <div className="text-[12.5px] text-gray-500 dark:text-gray-400">
                  {formatLetterDate(selectedColumn.date, language)}
                  <span className="mx-1.5 opacity-60">·</span>
                  {language === 'ko'
                    ? `${readingMinutes(selectedColumn.content)}분`
                    : `${readingMinutes(selectedColumn.content)} min read`}
                </div>
                <h2
                  className="text-[24px] font-semibold text-ink-strong tracking-[-0.01em] leading-[1.45] mt-3"
                  style={{ fontFamily: SERIF }}
                >
                  {selectedColumn.title}
                </h2>
                <div className="w-8 h-[3px] rounded-full bg-[var(--brand-muted)] opacity-50 mt-6 mb-8"></div>

                {selectedColumn.content.split('\n\n').map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-gray-700 dark:text-gray-300 leading-[1.95] mb-7"
                    style={{ fontFamily: SERIF, fontSize: `${FONT_STEPS[fontStep]}px` }}
                  >
                    {renderHighlightedText(paragraph)}
                  </p>
                ))}

                {/* 서명 — 편지의 맺음 */}
                <div className="mt-12 pt-7 border-t border-border-light dark:border-white/[0.06] flex items-center gap-4">
                  <img
                    src={andongProfile}
                    alt={selectedColumn.author}
                    className="w-12 h-12 rounded-full object-cover ring-1 ring-black/[0.07] dark:ring-white/[0.12] flex-shrink-0"
                  />
                  <div className="min-w-0">
                    {language === 'ko' ? (
                      <div className="text-[26px] leading-none text-ink-strong" style={{ fontFamily: PEN }}>
                        {selectedColumn.author} 드림
                      </div>
                    ) : (
                      <div className="text-[17px] italic leading-none text-ink-strong" style={{ fontFamily: SERIF }}>
                        {selectedColumn.author}
                      </div>
                    )}
                    <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-2">
                      {selectedColumn.role}
                    </div>
                  </div>
                </div>

                {/* 아멘 — 편지를 다 읽고 조용히 화답하는 자리 (좋아요가 아니라 응답) */}
                {liveSelected && (
                  <div className="mt-9 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => void handleAmen(liveSelected)}
                      aria-pressed={!!liveSelected.is_amened}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-semibold border transition-all active:scale-95 ${
                        liveSelected.is_amened
                          ? 'bg-brand border-brand text-white shadow-[0_2px_10px_var(--brand-glow)]'
                          : 'bg-transparent border-gray-300 dark:border-white/[0.15] text-gray-600 dark:text-gray-300 hover:border-brand hover:text-brand'
                      }`}
                    >
                      <span aria-hidden>🙏</span>
                      <span>
                        {language === 'ko'
                          ? (liveSelected.is_amened ? '아멘으로 함께했어요' : '아멘으로 화답하기')
                          : (liveSelected.is_amened ? 'Amen shared' : 'Say Amen')}
                      </span>
                      {(liveSelected.amen_count ?? 0) > 0 && (
                        <span className={liveSelected.is_amened ? 'text-white/90' : 'text-brand'}>
                          {liveSelected.amen_count}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* 이어 읽기 — 편지를 다 읽은 흐름 그대로 다음 글로 */}
                {(olderColumn || newerColumn) && (
                  <div className="mt-10 space-y-3">
                    {olderColumn && (
                      <button
                        onClick={() => openColumn(olderColumn)}
                        className="feed-card w-full rounded-2xl px-5 py-4 text-left group"
                      >
                        <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 tracking-[0.03em]">
                          {language === 'ko' ? '이전 편지' : 'Previous letter'}
                        </div>
                        <div
                          className="text-[15px] font-semibold text-ink-strong line-clamp-1 tracking-[-0.01em] mt-1.5 group-hover:text-[var(--brand)] transition-colors"
                          style={{ fontFamily: SERIF }}
                        >
                          {olderColumn.title}
                        </div>
                        <div className="text-[11.5px] text-gray-400 dark:text-gray-500 mt-1">
                          {formatLetterDate(olderColumn.date, language)}
                        </div>
                      </button>
                    )}
                    {newerColumn && (
                      <button
                        onClick={() => openColumn(newerColumn)}
                        className="feed-card w-full rounded-2xl px-5 py-4 text-left group"
                      >
                        <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 tracking-[0.03em]">
                          {language === 'ko' ? '다음 편지' : 'Next letter'}
                        </div>
                        <div
                          className="text-[15px] font-semibold text-ink-strong line-clamp-1 tracking-[-0.01em] mt-1.5 group-hover:text-[var(--brand)] transition-colors"
                          style={{ fontFamily: SERIF }}
                        >
                          {newerColumn.title}
                        </div>
                        <div className="text-[11.5px] text-gray-400 dark:text-gray-500 mt-1">
                          {formatLetterDate(newerColumn.date, language)}
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditing && (
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-lg z-[110] flex items-stretch md:items-center justify-center p-0 md:p-4"
            onClick={handleCancel}
          >
            <div
              className="bg-background-light dark:bg-background-dark w-full h-full rounded-none md:rounded-3xl md:max-w-md md:h-auto md:max-h-[calc(100dvh-2rem)] overflow-y-auto md:border md:border-border-light md:dark:border-border-dark md:shadow-[0_30px_80px_-20px_var(--brand-glow),0_0_0_1px_rgba(255,255,255,0.04)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-border-light dark:border-border-dark p-5 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-bold text-ink-strong tracking-[-0.015em]">
                    {editingColumn.id ? (language === 'ko' ? '컬럼 수정' : 'Edit Column') : (language === 'ko' ? '컬럼 추가' : 'Add Column')}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--brand-soft)] transition-colors"
                    aria-label="닫기"
                  >
                    <span className="material-icons-outlined text-[20px] text-gray-600 dark:text-gray-400">close</span>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 tracking-[-0.005em]">
                    {language === 'ko' ? '제목' : 'Title'} *
                  </label>
                  <input
                    type="text"
                    value={editingColumn.title || ''}
                    onChange={(e) => setEditingColumn({ ...editingColumn, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border-light dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-ink-strong text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
                    placeholder={language === 'ko' ? '컬럼 제목을 입력하세요' : 'Enter column title'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 tracking-[-0.005em]">
                      {language === 'ko' ? '작성자' : 'Author'} *
                    </label>
                    <input
                      type="text"
                      value={editingColumn.author || ''}
                      onChange={(e) => setEditingColumn({ ...editingColumn, author: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border-light dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-ink-strong text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
                      placeholder={language === 'ko' ? '작성자 이름' : 'Author name'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 tracking-[-0.005em]">
                      {language === 'ko' ? '직책' : 'Role'}
                    </label>
                    <input
                      type="text"
                      value={editingColumn.role || ''}
                      onChange={(e) => setEditingColumn({ ...editingColumn, role: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border-light dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-ink-strong text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
                      placeholder={language === 'ko' ? '담임목사' : 'Senior Pastor'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 tracking-[-0.005em]">
                    {language === 'ko' ? '날짜' : 'Date'}
                  </label>
                  <input
                    type="text"
                    value={editingColumn.date || ''}
                    onChange={(e) => setEditingColumn({ ...editingColumn, date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border-light dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-ink-strong text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
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
                    value={editingColumn.content || ''}
                    onChange={(e) => setEditingColumn({ ...editingColumn, content: e.target.value })}
                    rows={12}
                    className="w-full px-4 py-3 border border-border-light dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-ink-strong text-sm leading-[1.7] resize-none focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
                    placeholder={language === 'ko' ? '컬럼 내용을 입력하세요...\n\n중요한 문구를 선택하고 "하이라이트" 버튼을 누르면 색상·밑줄 스타일을 골라 강조할 수 있습니다.' : 'Enter column content...\n\nSelect important text and click "Highlight" to pick a color and underline style.'}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    💡 {language === 'ko' ? '문구를 드래그한 뒤 "하이라이트"에서 색상·스타일을 고르세요. 이미 강조된 문구를 다시 선택하면 바꾸거나 해제할 수 있어요' : 'Drag text, then pick a color/style in "Highlight". Re-select a highlighted phrase to change or remove it'}
                  </p>
                </div>
              </div>

              <div className="sticky bottom-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-border-light dark:border-border-dark p-4 flex gap-3">
                <button
                  onClick={handleCancel}
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
        )}

        {/* Delete Confirm Modal — 기도 DeleteConfirmModal과 동일 패턴 */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-lg z-[120] flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
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
                {language === 'ko' ? '정말 이 컬럼을 삭제하시겠습니까?\n삭제된 내용은 복구할 수 없습니다.' : 'Are you sure you want to delete this column?\nThis cannot be undone.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 px-4 bg-surface-light dark:bg-white/[0.05] border border-transparent dark:border-white/[0.08] text-ink-strong rounded-2xl font-semibold text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
                >
                  {language === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold text-sm shadow-[0_2px_10px_rgba(239,68,68,0.25)] transition-colors"
                >
                  {language === 'ko' ? '삭제' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 우측 위젯 레일 (lg+) — 편지의 '발신인·편지함·아카이브'.
          새 API 없이 이미 받아둔 목록만 재사용한다 */}
      <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-3 lg:sticky lg:top-[4.5rem]">
        {/* 발신인 — 본문 인트로(lg:hidden)가 이 자리로 옮겨왔다 */}
        {featured && (
          <section className="feed-card rounded-2xl p-5 text-center">
            <img
              src={andongProfile}
              alt={featured.author}
              className="w-16 h-16 rounded-full object-cover mx-auto ring-1 ring-black/[0.07] dark:ring-white/[0.12]"
            />
            <p
              className="mt-3 text-[15px] font-semibold text-ink-strong tracking-[-0.01em]"
              style={{ fontFamily: SERIF }}
            >
              {featured.author} {featured.role}
            </p>
            <p className="mt-1.5 text-[12.5px] text-gray-500 dark:text-gray-400 leading-[1.6]">
              {language === 'ko'
                ? '매주 마음을 담아 성도님들께 띄우는 목회 서신입니다'
                : 'A weekly letter to our congregation, written with care'}
            </p>
          </section>
        )}

        {/* 편지함 — 지금까지 쌓인 편지 통수 */}
        {totalLetters > 0 && (
          <section className="feed-card rounded-2xl p-4">
            <p className="mb-2 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-gray-400">
              {language === 'ko' ? '편지함' : 'Letters'}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[24px] font-semibold text-ink-strong tabular-nums leading-none">
                {totalLetters}
              </span>
              <span className="text-[13px] text-gray-500 dark:text-gray-400">
                {language === 'ko'
                  ? '통의 편지'
                  : totalLetters === 1 ? 'letter' : 'letters'}
              </span>
            </div>
            {railHighlights.length > 0 && (
              <div className="mt-3.5 pt-3.5 border-t border-border-light dark:border-white/[0.08]">
                <p className="mb-2 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-gray-400">
                  {language === 'ko' ? '밑줄 그은 문장' : 'Underlined'}
                </p>
                <div className="flex flex-col gap-1.5 -mx-1">
                  {railHighlights.map(({ column, quote }) => (
                    <button
                      key={column.id}
                      type="button"
                      onClick={() => openColumn(column)}
                      className="px-1 py-1 rounded-lg text-left hover:bg-[var(--brand-soft)] transition-colors group"
                    >
                      <p
                        className="text-[12.5px] text-ink-strong leading-[1.65] line-clamp-2"
                        style={{ fontFamily: SERIF }}
                      >
                        “{quote}”
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1 group-hover:text-[var(--brand)] transition-colors">
                        {column.title}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* 지난 편지 아카이브 — 월 카드로 바로 이동 */}
        {monthGroups.length > 1 && (
          <section className="feed-card rounded-2xl p-4">
            <p className="mb-1.5 text-[11.5px] font-bold tracking-[0.05em] text-gray-500 dark:text-gray-400">
              {language === 'ko' ? '지난 편지' : 'Earlier Letters'}
            </p>
            <div className="flex flex-col -mx-1">
              {monthGroups.map((group, gi) => (
                <button
                  key={group.label}
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(`ministry-month-${gi}`)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-[var(--brand-soft)] transition-colors"
                >
                  <span className="text-[12.5px] font-semibold text-ink-strong truncate">
                    {group.label}
                  </span>
                  <span className="text-[11.5px] tabular-nums text-gray-400 dark:text-gray-500 shrink-0">
                    {group.items.length}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </aside>
      </div>
    </div>
  )
}

export default Ministry
