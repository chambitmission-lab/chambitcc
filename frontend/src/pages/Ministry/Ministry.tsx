import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { showToast } from '../../utils/toast'
import { deleteColumn } from '../../api/column'
import type { Column } from '../../types/column'
import { useColumnAmen, useColumns } from './useColumns'
import { firstHighlight, groupByMonth } from './letterFormat'
import MinistryHeader from './MinistryHeader'
import ColumnFeed from './ColumnFeed'
import ColumnReaderModal from './ColumnReaderModal'
import ColumnEditorModal from './ColumnEditorModal'
import DeleteColumnDialog from './DeleteColumnDialog'
import MinistryRail, { type RailHighlight } from './MinistryRail'
import { can } from '../../utils/access'

/** 새 컬럼 기본값 — 날짜는 오늘 */
const newColumnDraft = (): Partial<Column> => ({
  title: '',
  author: '',
  role: '',
  date: new Date().toISOString().split('T')[0],
  content: '',
  is_active: true,
})

/**
 * 목양칼럼 페이지. 데이터(useColumns)와 열림 상태만 들고,
 * 목록(ColumnFeed)·읽기(ColumnReaderModal)·편집(ColumnEditorModal)·레일(MinistryRail)에 나눠준다.
 */
const Ministry = () => {
  const { language } = useLanguage()
  const isAdminUser = can('content:manage')

  const [appliedQuery, setAppliedQuery] = useState('')
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null)
  // 편집 모달 — null이면 닫힘, 객체면 그 초기값으로 열림(id 있으면 수정)
  const [editorDraft, setEditorDraft] = useState<Partial<Column> | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  // PC: 우측 레일을 타이틀 행 아래(피처드 카드 윗선)에 맞추기 위한 헤더 실측 높이
  const [headerHeight, setHeaderHeight] = useState(0)
  const { columns, allColumns, loading, syncColumnsCache, patchColumnCache } = useColumns(appliedQuery)
  const handleAmen = useColumnAmen(patchColumnCache, language)

  // ── 관리자 동작 ───────────────────────────────────────────────────
  const handleEdit = (column: Column) => {
    setEditorDraft(column)
    setSelectedColumn(null)
  }

  const handleSaved = (saved: Column, isNew: boolean) => {
    syncColumnsCache((prev) => (isNew ? [saved, ...prev] : prev.map((c) => (c.id === saved.id ? saved : c))))
    setEditorDraft(null)
  }

  const handleDelete = async () => {
    if (!selectedColumn?.id) return
    try {
      await deleteColumn(selectedColumn.id)
      syncColumnsCache((prev) => prev.filter((c) => c.id !== selectedColumn.id))
      showToast('목양컬럼이 삭제되었습니다', 'success')
      setSelectedColumn(null)
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Failed to delete column:', error)
      showToast('삭제에 실패했습니다', 'error')
    }
  }

  // ── 파생 데이터 ───────────────────────────────────────────────────
  // 검색 중에는 피처드 없이 전부 인덱스 행으로
  const featured = !appliedQuery && columns.length > 0 ? columns[0] : null
  const restColumns = featured ? columns.slice(1) : columns
  const monthGroups = appliedQuery ? [] : groupByMonth(restColumns, language)

  // 우측 위젯 '편지함' — 지금까지 쌓인 전체 통수와, 지난 편지에서 밑줄 그은 문장.
  // 검색 중에는 columns가 결과만 담으므로 전체 목록(allColumns)을 쓴다.
  // 최신 편지는 피처드 카드에서 이미 인용구로 보여주므로 여기선 제외한다
  const railHighlights: RailHighlight[] = allColumns
    .slice(1)
    .map((c) => ({ column: c, quote: firstHighlight(c.content) }))
    .filter((h): h is RailHighlight => !!h.quote)
    .slice(0, 3)

  // 상세 하단 이어읽기 — 다음(더 최신)·이전(더 과거) 편지
  const selectedIdx = selectedColumn ? columns.findIndex((c) => c.id === selectedColumn.id) : -1
  const newerColumn = selectedIdx > 0 ? columns[selectedIdx - 1] : null
  const olderColumn = selectedIdx >= 0 && selectedIdx < columns.length - 1 ? columns[selectedIdx + 1] : null
  // 아멘 수는 캐시 쪽이 최신이므로, 읽기 화면은 목록 캐시의 같은 편지를 본다
  const liveSelected = selectedColumn ? (columns.find((c) => c.id === selectedColumn.id) ?? selectedColumn) : null

  return (
    <div className="bg-[var(--app-canvas)] dark:bg-background-dark min-h-screen page-stage">
      {/* lg+: 좁은 폰 프레임을 풀고 본문(편지) + 우측 위젯 레일 2컬럼으로 (/news와 같은 문법).
          좌측 레일 오프셋은 전역 main(App.tsx)이 잡아주므로 여기선 px-5만 둔다 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
        {/* lg+: 셸(배경·테두리·라운드)을 걷어낸다 — 안쪽이 전부 feed-card라 셸까지 두면
            스테이지 → 셸 → 헤더 띠 → 카드로 톤이 다른 층이 겹쳐 "상자 속 상자"가 된다 */}
        <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:bg-transparent lg:dark:bg-transparent lg:border-0 lg:min-h-0">
          <MinistryHeader
            language={language}
            isAdminUser={isAdminUser}
            onQueryChange={setAppliedQuery}
            onAddNew={() => setEditorDraft(newColumnDraft())}
            onHeightChange={setHeaderHeight}
          />

          <ColumnFeed
            language={language}
            loading={loading}
            appliedQuery={appliedQuery}
            featured={featured}
            restColumns={restColumns}
            monthGroups={monthGroups}
            onOpen={setSelectedColumn}
          />

          {liveSelected && (
            <ColumnReaderModal
              language={language}
              column={liveSelected}
              newerColumn={newerColumn}
              olderColumn={olderColumn}
              isAdminUser={isAdminUser}
              onClose={() => setSelectedColumn(null)}
              onNavigate={setSelectedColumn}
              onAmen={(c) => void handleAmen(c)}
              onEdit={handleEdit}
              onDeleteRequest={() => setShowDeleteConfirm(true)}
            />
          )}

          {editorDraft && (
            <ColumnEditorModal
              language={language}
              initial={editorDraft}
              onSaved={handleSaved}
              onClose={() => setEditorDraft(null)}
            />
          )}

          {showDeleteConfirm && (
            <DeleteColumnDialog language={language} onConfirm={handleDelete} onClose={() => setShowDeleteConfirm(false)} />
          )}
        </div>

        <MinistryRail
          language={language}
          featured={featured}
          totalLetters={allColumns.length}
          railHighlights={railHighlights}
          monthGroups={monthGroups}
          topOffset={headerHeight}
          onOpen={setSelectedColumn}
        />
      </div>
    </div>
  )
}

export default Ministry
