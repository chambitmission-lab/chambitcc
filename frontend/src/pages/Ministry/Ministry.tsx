import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { getColumns, createColumn, updateColumn, deleteColumn } from '../../api/column'
import type { Column } from '../../types/column'
import './Ministry.css'

// 중요한 문구를 하이라이트하는 함수 (상세 화면용)
const renderHighlightedText = (text: string) => {
  // [[텍스트]] 형식을 찾아서 빛나는 효과 적용
  const parts = text.split(/(\[\[.*?\]\])/g)
  
  return parts.map((part, index) => {
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const highlightedText = part.slice(2, -2)
      return (
        <span
          key={index}
          className="font-bold text-purple-600 dark:text-purple-400"
          style={{
            textShadow: '0 0 15px rgba(168, 85, 247, 0.8), 0 0 25px rgba(168, 85, 247, 0.5)',
          }}
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

const Ministry = () => {
  const { language } = useLanguage()
  const isAdminUser = isAdmin()
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingColumn, setEditingColumn] = useState<Partial<Column>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadColumns()
  }, [])

  const loadColumns = async () => {
    try {
      setLoading(true)
      const data = await getColumns()
      setColumns(data.filter(c => c.is_active))
    } catch (error) {
      console.error('Failed to load columns:', error)
      showToast('목양컬럼을 불러오는데 실패했습니다', 'error')
    } finally {
      setLoading(false)
    }
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
        setColumns(prev => prev.map(c => c.id === updated.id ? updated : c))
        showToast('목양컬럼이 수정되었습니다', 'success')
      } else {
        // 생성
        const created = await createColumn(editingColumn as any)
        setColumns(prev => [created, ...prev])
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
      setColumns(prev => prev.filter(c => c.id !== selectedColumn.id))
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
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl border-x border-border-light dark:border-border-dark min-h-screen">
        {/* Header */}
        <div className="sticky top-14 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>✍️</span>
                  <span>{language === 'ko' ? '목양칼럼' : 'Pastoral Column'}</span>
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {language === 'ko' ? '담임목사의 목회 이야기' : "Pastor's Ministry Stories"}
                </p>
              </div>
              {isAdminUser && (
                <button
                  onClick={handleAddNew}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <span className="material-icons-outlined text-xl">add</span>
                  <span>{language === 'ko' ? '추가' : 'Add'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Column List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : columns.length === 0 ? (
          <div className="text-center py-20 text-gray-600 dark:text-gray-400">
            {language === 'ko' ? '등록된 목양컬럼이 없습니다' : 'No columns available'}
          </div>
        ) : (
          <div className="p-4 space-y-4">
          {columns.map((column) => (
            <article
              key={column.id}
              className="bg-white dark:bg-surface-dark rounded-2xl overflow-hidden shadow-sm border border-border-light dark:border-border-dark hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedColumn(column)}
            >
              {/* Author Info */}
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {column.author[0]}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    {column.author} {column.role}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {column.date}
                  </div>
                </div>
              </div>

              {/* Content Preview */}
              <div className="px-4 pb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {column.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                  {removeHighlightTags(column.content)}
                </p>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <button className="flex items-center gap-1 text-sm hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  <span className="material-icons-outlined text-xl">favorite_border</span>
                  <span>{language === 'ko' ? '좋아요' : 'Like'}</span>
                </button>
                <button className="flex items-center gap-1 text-sm hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  <span className="material-icons-outlined text-xl">chat_bubble_outline</span>
                  <span>{language === 'ko' ? '댓글' : 'Comment'}</span>
                </button>
                <button className="flex items-center gap-1 text-sm hover:text-purple-600 dark:hover:text-purple-400 transition-colors ml-auto">
                  <span className="material-icons-outlined text-xl">bookmark_border</span>
                </button>
              </div>
            </article>
          ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedColumn && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedColumn(null)}
          >
            <div 
              className="bg-white dark:bg-surface-dark rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark p-4 z-10">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {selectedColumn.author[0]}
                    </div>
                    <div>
                      <div 
                        className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-slate-300 via-white to-slate-300 dark:from-slate-200 dark:via-white dark:to-slate-200 text-sm"
                        style={{
                          filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 20px rgba(226, 232, 240, 0.4))',
                        }}
                      >
                        {selectedColumn.author} {selectedColumn.role}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedColumn.date}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedColumn(null)}
                    className="relative text-cyan-400 hover:text-cyan-300 dark:text-cyan-300 dark:hover:text-cyan-200 transition-all flex-shrink-0"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.8)) drop-shadow(0 0 12px rgba(34, 211, 238, 0.6))',
                    }}
                  >
                    <span className="absolute inset-0 bg-cyan-400/30 dark:bg-cyan-300/30 blur-xl animate-pulse"></span>
                    <span className="material-icons-outlined text-2xl relative z-10">close</span>
                  </button>
                </div>
                <h2 
                  className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-400 dark:via-pink-400 dark:to-purple-400"
                  style={{
                    textShadow: '0 0 30px rgba(168, 85, 247, 0.3)',
                    filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))',
                  }}
                >
                  {selectedColumn.title}
                </h2>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {selectedColumn.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      {renderHighlightedText(paragraph)}
                    </p>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="sticky bottom-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-sm border-t border-border-light dark:border-border-dark p-4 flex items-center gap-4">
                {isAdminUser ? (
                  <>
                    <button 
                      onClick={() => handleEdit(selectedColumn)}
                      className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      <span className="material-icons-outlined text-2xl">edit</span>
                      <span className="text-sm font-medium">{language === 'ko' ? '수정' : 'Edit'}</span>
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <span className="material-icons-outlined text-2xl">delete</span>
                      <span className="text-sm font-medium">{language === 'ko' ? '삭제' : 'Delete'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      <span className="material-icons-outlined text-2xl">favorite_border</span>
                      <span className="text-sm font-medium">{language === 'ko' ? '좋아요' : 'Like'}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      <span className="material-icons-outlined text-2xl">chat_bubble_outline</span>
                      <span className="text-sm font-medium">{language === 'ko' ? '댓글' : 'Comment'}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors ml-auto">
                      <span className="material-icons-outlined text-2xl">share</span>
                      <span className="text-sm font-medium">{language === 'ko' ? '공유' : 'Share'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditing && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancel}
          >
            <div 
              className="bg-white dark:bg-surface-dark rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark p-4 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingColumn.id ? (language === 'ko' ? '컬럼 수정' : 'Edit Column') : (language === 'ko' ? '컬럼 추가' : 'Add Column')}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <span className="material-icons-outlined text-2xl">close</span>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ko' ? '제목' : 'Title'} *
                  </label>
                  <input
                    type="text"
                    value={editingColumn.title || ''}
                    onChange={(e) => setEditingColumn({ ...editingColumn, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder={language === 'ko' ? '컬럼 제목을 입력하세요' : 'Enter column title'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ko' ? '작성자' : 'Author'} *
                    </label>
                    <input
                      type="text"
                      value={editingColumn.author || ''}
                      onChange={(e) => setEditingColumn({ ...editingColumn, author: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder={language === 'ko' ? '작성자 이름' : 'Author name'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'ko' ? '직책' : 'Role'}
                    </label>
                    <input
                      type="text"
                      value={editingColumn.role || ''}
                      onChange={(e) => setEditingColumn({ ...editingColumn, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder={language === 'ko' ? '담임목사' : 'Senior Pastor'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'ko' ? '날짜' : 'Date'}
                  </label>
                  <input
                    type="text"
                    value={editingColumn.date || ''}
                    onChange={(e) => setEditingColumn({ ...editingColumn, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="2026.02"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {language === 'ko' ? '내용' : 'Content'} *
                    </label>
                    <button
                      type="button"
                      onClick={handleHighlight}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors flex items-center gap-1"
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    placeholder={language === 'ko' ? '컬럼 내용을 입력하세요...\n\n중요한 문구를 선택하고 "하이라이트" 버튼을 누르면 강조 효과가 적용됩니다.' : 'Enter column content...\n\nSelect important text and click "Highlight" button to apply emphasis effect.'}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    💡 {language === 'ko' ? '중요한 문구를 드래그로 선택한 후 "하이라이트" 버튼을 클릭하세요' : 'Select important text and click the "Highlight" button'}
                  </p>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-sm border-t border-border-light dark:border-border-dark p-4 flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {language === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  {language === 'ko' ? '저장' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {showDeleteConfirm && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div 
              className="bg-white dark:bg-surface-dark rounded-2xl max-w-sm w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {language === 'ko' ? '컬럼 삭제' : 'Delete Column'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {language === 'ko' ? '정말 이 컬럼을 삭제하시겠습니까?' : 'Are you sure you want to delete this column?'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {language === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
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