import { useEffect, useState } from 'react'
import { showToast } from '../../utils/toast'
import {
  useBookIntro,
  useDeleteBookIntro,
  useUpsertBookIntro,
} from '../../hooks/useBibleBookIntro'
import type { BibleBookIntroUpsertRequest } from '../../types/bibleBookIntro'
import { lazyModal } from '../../utils/lazyModal'
import { preloadBudget, scheduleAfterFirstScreen } from '../../utils/idlePreload'
// 개관 읽기 시트·(관리자) 에디터는 열 때만 — 읽기 화면 청크에서 분리
const BookIntroEditor = lazyModal(() => import('./BookIntroEditor'))
const BookIntroSheet = lazyModal(() => import('./BookIntroSheet'))
import { confirmDialog } from '../../utils/confirmDialog'
import { can } from '../../utils/access'

interface BookIntroCardProps {
  bookNumber: number
  bookNameKo: string
  totalChapters: number
  currentChapter: number
  /** 구조 단락 탭 → 해당 장으로 이동 */
  onJumpToChapter?: (chapter: number) => void
  /** 개관 시트 열림을 바깥이 쥘 때 — 길잡이 시트·1장 안내 줄에서도 같은 시트를 연다 */
  sheetOpen?: boolean
  onSheetOpenChange?: (open: boolean) => void
}

/**
 * 읽기 화면의 '권 개관' 진입점 — 장 머리말(ChapterHead) 첫 줄의 책 이름 "창세기 ›".
 *
 * 예전엔 본문 위 큰 카드 → 한 줄 바였는데, 바도 다른 안내 카드들과 같은 무게로 쌓여
 * 첫 화면을 흐렸다. 지금은 책 이름 자체가 입구고, 실제 개관은 BookIntroSheet(읽기 시트).
 * 개관이 없거나 불러오는 중이면 같은 자리에 책 이름 글자만 둔다(자리가 흔들리지 않게).
 * 관리자는 개관이 없을 때 '개관 추가' 작은 버튼을 보고, 시트 안에서 수정/삭제한다.
 */
const BookIntroCard = ({
  bookNumber,
  bookNameKo,
  totalChapters,
  currentChapter,
  onJumpToChapter,
  sheetOpen: sheetOpenProp,
  onSheetOpenChange,
}: BookIntroCardProps) => {
  const admin = can('bible:edit')
  const { data: intro, isLoading } = useBookIntro(bookNumber)

  const upsertMutation = useUpsertBookIntro()
  const deleteMutation = useDeleteBookIntro()

  const [editorOpen, setEditorOpen] = useState(false)
  const [sheetOpenLocal, setSheetOpenLocal] = useState(false)
  const sheetOpen = sheetOpenProp ?? sheetOpenLocal
  const setSheetOpen = (open: boolean) => {
    setSheetOpenLocal(open)
    onSheetOpenChange?.(open)
  }
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 시트는 lazy 청크(JS+CSS 두 파일)라 첫 탭이 네트워크 왕복만큼 늦게 열렸고, fallback 이
  // null 이라 그동안 아무 반응도 없어 "느리다"로 느껴졌다. 바가 보이는 순간부터 눌릴 수 있으니
  // 본문이 그려진 뒤 유휴 시간에 미리 받아 둔다 — 받아 둔 뒤엔 Suspense 없이 곧장 열린다.
  // 데이터 절약 모드·2G 에선 건너뛰고(아래 hover/touch 워밍이 받쳐 준다), 재방문은 SW 캐시라 공짜다.
  const hasIntro = !!intro
  useEffect(() => {
    if (!hasIntro || preloadBudget() === 'none') return
    return scheduleAfterFirstScreen(() => void BookIntroSheet.preload(), { settleMs: 800, idleTimeoutMs: 4000 })
  }, [hasIntro])
  // 유휴 콜백보다 먼저 손이 가는 경우(PC 호버·모바일 터치 시작은 click 보다 수십~수백 ms 앞선다)
  const warmSheet = () => void BookIntroSheet.preload()

  const handleSave = async (payload: BibleBookIntroUpsertRequest) => {
    try {
      setErrorMessage(null)
      await upsertMutation.mutateAsync({ bookNumber, payload })
      showToast('권 개관이 저장되었습니다', 'success')
      setEditorOpen(false)
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '저장 실패')
    }
  }

  const handleDelete = async () => {
    if (
      !(await confirmDialog({
        title: '권 개관 삭제',
        message: `${bookNameKo} 권 개관을 삭제할까요?`,
        description: '삭제된 내용은 복구할 수 없습니다.',
        confirmText: '삭제',
        icon: 'delete_outline',
      }))
    )
      return
    try {
      await deleteMutation.mutateAsync(bookNumber)
      showToast('권 개관이 삭제되었습니다', 'success')
      setSheetOpen(false)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '삭제 실패', 'error')
    }
  }

  const editor = editorOpen && (
    <BookIntroEditor
      bookNumber={bookNumber}
      bookNameKo={bookNameKo}
      existing={intro ?? null}
      saving={upsertMutation.isPending}
      errorMessage={errorMessage}
      onSave={handleSave}
      onClose={() => setEditorOpen(false)}
    />
  )

  const sheet = sheetOpen && intro && (
    <BookIntroSheet
      intro={intro}
      bookNameKo={bookNameKo}
      totalChapters={totalChapters}
      currentChapter={currentChapter}
      onJumpToChapter={onJumpToChapter}
      admin={admin}
      onEdit={() => {
        setErrorMessage(null)
        setSheetOpen(false)
        setEditorOpen(true)
      }}
      onDelete={handleDelete}
      onClose={() => setSheetOpen(false)}
    />
  )

  if (!intro) {
    return (
      <>
        <span className="chd-book">{bookNameKo}</span>
        {/* 관리자만 — 개관이 아직 없으면 책 이름 옆에 작은 추가 버튼 */}
        {!isLoading && admin && (
          <button
            type="button"
            className="chd-book-add"
            onClick={() => {
              setErrorMessage(null)
              setEditorOpen(true)
            }}
          >
            <span className="material-icons-round" aria-hidden>add</span>
            개관 추가
          </button>
        )}
        {editor}
      </>
    )
  }
  return (
    <>
      <button
        type="button"
        className="chd-book is-link"
        onClick={() => setSheetOpen(true)}
        onPointerEnter={warmSheet}
        onTouchStart={warmSheet}
        onFocus={warmSheet}
        aria-haspopup="dialog"
        aria-label={`${bookNameKo} 개관 보기 — ${intro.one_liner}`}
        title={intro.one_liner}
      >
        {bookNameKo}
        <span className="material-icons-round" aria-hidden>chevron_right</span>
      </button>
      {sheet}
      {editor}
    </>
  )
}

export default BookIntroCard
