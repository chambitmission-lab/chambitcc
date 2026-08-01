import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useLanguage } from '../../contexts/LanguageContext'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { getColumns, createColumn, updateColumn, deleteColumn } from '../../api/column'
import type { Column, CreateColumnRequest } from '../../types/column'
import andongProfile from '../../assets/andong.png'

// 편지·에세이 톤의 서체 — 성경 읽기 설정과 동일한 스택(이미 index.html에서 로드됨)
// Noto Serif KR은 400/600만 로드되어 있으므로 굵기는 font-semibold(600)까지만 사용
const SERIF = "'Noto Serif KR', 'Nanum Myeongjo', 'Apple SD Gothic Neo', serif"
const PEN = "'Nanum Pen Script', 'Pretendard', cursive"

// 중요한 문구를 하이라이트하는 함수 (상세 화면용) — 파란 링크처럼 보이지 않게
// 형광펜으로 밑줄을 그은 듯한 은은한 마커 스타일
const renderHighlightedText = (text: string) => {
  const parts = text.split(/(\[\[.*?\]\])/g)

  return parts.map((part, index) => {
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const highlightedText = part.slice(2, -2)
      return (
        <span
          key={index}
          className="font-semibold text-ink-strong"
          style={{ background: 'linear-gradient(transparent 55%, var(--marker) 55%)' }}
        >
          {highlightedText}
        </span>
      )
    }
    return part
  })
}

// 하이라이트 태그를 제거하는 함수 (목록 화면용)
const removeHighlightTags = (text: string): string => {
  return text.replace(/\[\[(.*?)\]\]/g, '$1')
}

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // 편지를 열 때마다 읽기 진행 바·관리자 메뉴 초기화
  useEffect(() => {
    setReadProgress(0)
    setShowAdminMenu(false)
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

  const handleHighlight = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)

    if (!selectedText) {
      showToast(language === 'ko' ? '하이라이트할 텍스트를 선택하세요' : 'Please select text to highlight', 'error')
      return
    }

    // 이미 [[]]로 감싸져 있는지 확인
    if (selectedText.startsWith('[[') && selectedText.endsWith(']]')) {
      showToast(language === 'ko' ? '이미 하이라이트된 텍스트입니다' : 'Text is already highlighted', 'error')
      return
    }

    const before = textarea.value.substring(0, start)
    const after = textarea.value.substring(end)
    const newContent = before + '[[' + selectedText + ']]' + after

    setEditingColumn({ ...editingColumn, content: newContent })

    // 커서 위치 조정 (하이라이트된 텍스트 뒤로)
    setTimeout(() => {
      if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(start + selectedText.length + 4, start + selectedText.length + 4)
      }
    }, 0)

    showToast(language === 'ko' ? '하이라이트가 적용되었습니다' : 'Highlight applied', 'success')
  }

  // 상세 모달 스크롤 → 상단 읽기 진행 바
  const handleModalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const max = el.scrollHeight - el.clientHeight
    setReadProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 1)
  }

  // 검색 중에는 피처드 없이 전부 인덱스 행으로
  const featured = !appliedQuery && columns.length > 0 ? columns[0] : null
  const restColumns = featured ? columns.slice(1) : columns

  return (
    <div className="bg-gray-50 dark:bg-background-dark min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        {/* Header — 슬림하게: 제목(세리프)과 액션만 */}
        <div className="sticky top-14 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
          <div className="px-5 py-3.5">
            <div className="flex items-center justify-between">
              <h1
                className="text-[21px] font-semibold text-ink-strong tracking-[-0.01em] leading-[1.2]"
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
          <div className="px-4 pb-8">
            {/* 인트로 — 작성자는 한 분이므로 사진은 여기서 단 한 번만 */}
            {featured && (
              <div className="px-1 pt-6 pb-5 flex items-center gap-4">
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
                onClick={() => setSelectedColumn(featured)}
              >
                {/* 다크모드 표면 그라데이션 — 홈 피드 카드와 동일 문법 */}
                <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none rounded-2xl"></div>

                <div className="relative z-10 p-6">
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
                  </div>
                  <h2
                    className="text-[21px] font-semibold text-ink-strong mb-3 line-clamp-2 tracking-[-0.01em] leading-[1.4]"
                    style={{ fontFamily: SERIF }}
                  >
                    {featured.title}
                  </h2>
                  <p className="text-[15px] text-gray-600 dark:text-gray-300 line-clamp-4 leading-[1.8] tracking-[-0.01em]">
                    {removeHighlightTags(featured.content)}
                  </p>
                </div>
              </article>
            )}

            {/* 지난 편지 — 컴팩트 인덱스 (검색 중에는 결과 전체가 이 형태) */}
            {restColumns.length > 0 && (
              <>
                {!appliedQuery && (
                  <div className="px-1 mt-8 mb-3 text-[13px] font-semibold text-gray-500 dark:text-gray-400 tracking-[-0.005em]">
                    {language === 'ko' ? '지난 편지' : 'Earlier Letters'}
                  </div>
                )}
                <div className={`feed-card rounded-2xl px-5 divide-y divide-border-light dark:divide-white/[0.06] ${appliedQuery ? 'mt-4' : ''}`}>
                  {restColumns.map((column) => (
                    <button
                      key={column.id}
                      className="w-full text-left py-4 group"
                      onClick={() => setSelectedColumn(column)}
                    >
                      <h3
                        className="text-[16px] font-semibold text-ink-strong line-clamp-1 tracking-[-0.01em] leading-[1.4] group-hover:text-[var(--brand)] transition-colors"
                        style={{ fontFamily: SERIF }}
                      >
                        {highlightKeyword(column.title, appliedQuery)}
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
                  ))}
                </div>
              </>
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
              className="bg-background-light dark:bg-background-dark w-full h-full rounded-none md:rounded-3xl md:max-w-md md:h-auto md:max-h-[calc(100dvh-2rem)] overflow-y-auto md:border md:border-border-light md:dark:border-border-dark md:shadow-[0_30px_80px_-20px_var(--brand-glow),0_0_0_1px_rgba(255,255,255,0.04)]"
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
                    className="text-[16.5px] text-gray-700 dark:text-gray-300 leading-[1.95] mb-7"
                    style={{ fontFamily: SERIF }}
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
                    <button
                      type="button"
                      onClick={handleHighlight}
                      className="px-3 py-1 bg-[var(--brand-soft-strong)] text-[var(--brand)] rounded-full text-xs font-semibold hover:bg-[var(--brand-soft)] transition-colors flex items-center gap-1"
                      title={language === 'ko' ? '선택한 텍스트를 하이라이트' : 'Highlight selected text'}
                    >
                      <span className="material-icons-outlined text-sm">highlight</span>
                      <span>{language === 'ko' ? '하이라이트' : 'Highlight'}</span>
                    </button>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={editingColumn.content || ''}
                    onChange={(e) => setEditingColumn({ ...editingColumn, content: e.target.value })}
                    rows={12}
                    className="w-full px-4 py-3 border border-border-light dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-ink-strong text-sm leading-[1.7] resize-none focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
                    placeholder={language === 'ko' ? '컬럼 내용을 입력하세요...\n\n중요한 문구를 선택하고 "하이라이트" 버튼을 누르면 강조 효과가 적용됩니다.' : 'Enter column content...\n\nSelect important text and click "Highlight" button to apply emphasis effect.'}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    💡 {language === 'ko' ? '중요한 문구를 드래그로 선택한 후 "하이라이트" 버튼을 클릭하세요' : 'Select important text and click the "Highlight" button'}
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
    </div>
  )
}

export default Ministry
