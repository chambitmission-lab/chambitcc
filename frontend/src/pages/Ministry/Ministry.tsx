import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useLanguage } from '../../contexts/LanguageContext'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { getColumns, createColumn, updateColumn, deleteColumn } from '../../api/column'
import type { Column } from '../../types/column'
import andongProfile from '../../assets/andong.png'

// 중요한 문구를 하이라이트하는 함수 (상세 화면용)
const renderHighlightedText = (text: string) => {
  // [[텍스트]] 형식을 찾아서 빛나는 효과 적용
  const parts = text.split(/(\[\[.*?\]\])/g)
  
  return parts.map((part, index) => {
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const highlightedText = part.slice(2, -2)
      return (
        <span key={index} className="font-bold text-[var(--brand)]">
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
        const created = await createColumn(editingColumn as any)
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

  return (
    <div className="bg-gray-50 dark:bg-background-dark min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        {/* Header */}
        <div className="sticky top-14 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[22px] font-bold text-gray-900 dark:text-white flex items-center gap-2 tracking-[-0.015em] leading-[1.2]">
                  <span>✍️</span>
                  <span>{language === 'ko' ? '목양칼럼' : 'Pastoral Column'}</span>
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {language === 'ko' ? '담임목사의 목회 이야기' : "Pastor's Ministry Stories"}
                </p>
              </div>
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
                  className="w-full pl-10 pr-10 py-2.5 border border-border-light dark:border-white/[0.08] rounded-full bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
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
          <div className="p-4 space-y-4">
          {columns.map((column) => (
            <article
              key={column.id}
              className="feed-card relative rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:border-[var(--brand-glow)] hover:shadow-[0_8px_24px_-8px_var(--brand-glow)] transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedColumn(column)}
            >
              {/* 다크모드 표면 그라데이션 — 홈 피드 카드와 동일 문법 */}
              <div className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none rounded-2xl"></div>

              {/* Author Info — 1px 헤어라인 + 숨 쉬는 브랜드 블루 후광 */}
              <div className="relative z-10 p-4 flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-1 rounded-full bg-[var(--brand-glow)] blur-md animate-pulse pointer-events-none"></div>
                  <img
                    src={andongProfile}
                    alt={column.author}
                    className="relative w-10 h-10 rounded-full object-cover ring-1 ring-black/[0.07] dark:ring-white/[0.12]"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm leading-none mb-1">
                    {column.author} {column.role}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    {column.date}
                  </div>
                </div>
              </div>

              {/* Content Preview */}
              <div className="relative z-10 px-4 pb-5">
                <h2 className="text-[20px] font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 tracking-[-0.015em] leading-[1.3]">
                  {highlightKeyword(column.title, appliedQuery)}
                </h2>
                <p className="text-[15px] text-gray-600 dark:text-gray-300 line-clamp-3 leading-[1.7] tracking-[-0.01em]">
                  {highlightKeyword(removeHighlightTags(column.content), appliedQuery)}
                </p>
              </div>
            </article>
          ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedColumn && (
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-lg z-[110] flex items-stretch md:items-center justify-center p-0 md:p-4"
            onClick={() => setSelectedColumn(null)}
          >
            <div
              className="bg-background-light dark:bg-background-dark w-full h-full rounded-none md:rounded-3xl md:max-w-md md:h-auto md:max-h-[calc(100dvh-2rem)] overflow-y-auto md:border md:border-border-light md:dark:border-border-dark md:shadow-[0_30px_80px_-20px_var(--brand-glow),0_0_0_1px_rgba(255,255,255,0.04)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-border-light dark:border-border-dark p-5 z-10">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {/* 작성자 아바타 — 1px 헤어라인 + 숨 쉬는 브랜드 블루 후광 */}
                    <div className="relative flex-shrink-0">
                      <div className="absolute -inset-1 rounded-full bg-[var(--brand-glow)] blur-md animate-pulse pointer-events-none"></div>
                      <img
                        src={andongProfile}
                        alt={selectedColumn.author}
                        className="relative w-10 h-10 rounded-full object-cover ring-1 ring-black/[0.07] dark:ring-white/[0.12]"
                      />
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white leading-none mb-1">
                        {selectedColumn.author} {selectedColumn.role}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {selectedColumn.date}
                      </div>
                    </div>
                  </div>
                  {/* 닫기 버튼 — 다른 모달과 동일한 표준 패턴 */}
                  <button
                    onClick={() => setSelectedColumn(null)}
                    className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-[var(--brand-soft)] transition-colors"
                    aria-label="닫기"
                  >
                    <span className="material-icons-outlined text-[20px] text-gray-600 dark:text-gray-400">close</span>
                  </button>
                </div>
                {/* 제목 — 플랫 스틸 블루(--brand-muted), 그라데이션·글로우 없이 은은한 강조 */}
                <h2 className="text-[22px] font-bold text-[var(--brand-muted)] tracking-[-0.015em] leading-[1.3]">
                  {selectedColumn.title}
                </h2>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {selectedColumn.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-[15px] text-gray-700 dark:text-gray-300 leading-[1.75] tracking-[-0.01em] mb-4">
                      {renderHighlightedText(paragraph)}
                    </p>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              {isAdminUser && (
                <div className="sticky bottom-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-border-light dark:border-border-dark p-4 flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(selectedColumn)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-surface-light dark:bg-white/[0.05] border border-transparent dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] transition-colors"
                  >
                    <span className="material-icons-outlined text-lg">edit</span>
                    <span className="text-sm font-semibold">{language === 'ko' ? '수정' : 'Edit'}</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-surface-light dark:bg-white/[0.05] border border-transparent dark:border-white/[0.08] text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <span className="material-icons-outlined text-lg">delete</span>
                    <span className="text-sm font-semibold">{language === 'ko' ? '삭제' : 'Delete'}</span>
                  </button>
                </div>
              )}
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
                  <h2 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-[-0.015em]">
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
                    className="w-full px-4 py-2.5 border border-border-light dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
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
                      className="w-full px-4 py-2.5 border border-border-light dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
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
                      className="w-full px-4 py-2.5 border border-border-light dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
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
                    className="w-full px-4 py-2.5 border border-border-light dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
                    placeholder="2026.02"
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
                    className="w-full px-4 py-3 border border-border-light dark:border-white/[0.08] rounded-xl bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white text-sm leading-[1.7] resize-none focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-glow)] transition-colors"
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
                  className="flex-1 py-3 px-4 bg-surface-light dark:bg-white/[0.05] border border-transparent dark:border-white/[0.08] text-gray-900 dark:text-white rounded-2xl font-semibold text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
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
                <h3 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-[-0.015em]">
                  {language === 'ko' ? '컬럼 삭제' : 'Delete Column'}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-[1.7] mb-6">
                {language === 'ko' ? '정말 이 컬럼을 삭제하시겠습니까?\n삭제된 내용은 복구할 수 없습니다.' : 'Are you sure you want to delete this column?\nThis cannot be undone.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 px-4 bg-surface-light dark:bg-white/[0.05] border border-transparent dark:border-white/[0.08] text-gray-900 dark:text-white rounded-2xl font-semibold text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors"
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