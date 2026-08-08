import { useState } from 'react'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import {
  useBookIntro,
  useDeleteBookIntro,
  useUpsertBookIntro,
} from '../../hooks/useBibleBookIntro'
import type { BibleBookIntroUpsertRequest } from '../../types/bibleBookIntro'
import { getBookGenre, genreStyle } from './bookGenre'
import BookIntroEditor from './BookIntroEditor'
import BookIntroSheet from './BookIntroSheet'
import { confirmDialog } from '../../utils/confirmDialog'

interface BookIntroCardProps {
  bookNumber: number
  bookNameKo: string
  totalChapters: number
  currentChapter: number
  /** 구조 단락 탭 → 해당 장으로 이동 */
  onJumpToChapter?: (chapter: number) => void
}

/**
 * 읽기 화면의 '권 개관' 진입점 — 한 줄짜리 슬림 바.
 *
 * 예전에는 본문 위에 큰 카드로 펼쳐져 있어서, 성경을 읽으러 온 사람이
 * 매번 텍스트 벽을 넘어가야 했다. 지금은 바만 남기고 실제 개관은
 * BookIntroSheet(읽기 시트)로 분리한다 — 본문이 먼저, 소개는 원할 때.
 *
 * 관리자는 개관이 없을 때 추가 유도 배너를 보고, 시트 안에서 수정/삭제한다.
 * 개관이 없고 관리자가 아니면 아무것도 렌더하지 않는다.
 */
const BookIntroCard = ({
  bookNumber,
  bookNameKo,
  totalChapters,
  currentChapter,
  onJumpToChapter,
}: BookIntroCardProps) => {
  const admin = isAdmin()
  const { data: intro, isLoading } = useBookIntro(bookNumber)

  const upsertMutation = useUpsertBookIntro()
  const deleteMutation = useDeleteBookIntro()

  const [editorOpen, setEditorOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

  // 로딩 중이거나, 개관도 없고 관리자도 아니면 아무것도 보여주지 않는다
  if (isLoading) return null
  if (!intro && !admin) return null

  // 관리자인데 개관이 아직 없는 경우 — 추가 유도 슬림 배너
  if (!intro) {
    return (
      <>
        <div className="mx-4 mt-3 mb-2 rounded-2xl border border-dashed border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] px-4 py-3.5 flex items-center gap-3">
          <span className="material-icons-round text-brand text-[22px]">auto_stories</span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-bold text-ink-strong">
              {bookNameKo} 권 개관이 아직 없어요
            </p>
            <p className="text-[11.5px] text-ink-muted">
              교인들이 이 책의 큰 그림을 잡도록 개관을 추가해보세요
            </p>
          </div>
          <button
            onClick={() => {
              setErrorMessage(null)
              setEditorOpen(true)
            }}
            className="shrink-0 inline-flex items-center gap-1 px-3 h-9 rounded-full bg-brand text-white text-[12.5px] font-bold shadow-[0_6px_18px_-6px_var(--brand-glow)]"
          >
            <span className="material-icons-round text-[16px]">add</span>
            추가
          </button>
        </div>
        {editor}
      </>
    )
  }

  const genre = getBookGenre(bookNumber)

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        style={genreStyle(bookNumber)}
        aria-haspopup="dialog"
        className="w-full mt-3 mb-2 px-4 text-left"
      >
        <span
          className="flex items-center gap-3 rounded-2xl px-3.5 py-3 border transition-colors active:scale-[0.995]"
          style={{
            background: 'var(--genre-soft)',
            borderColor: 'var(--genre-line)',
          }}
        >
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            /* 바 배경도 tint라서, 아이콘 칩은 한 단계 진하게 섞어야 형태가 살아난다 */
            style={{
              background: 'color-mix(in srgb, var(--genre) 16%, transparent)',
              color: 'var(--genre)',
            }}
          >
            <span className="material-icons-round text-[19px]">{genre.icon}</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-bold text-ink-strong leading-tight">
              {bookNameKo}는 어떤 책인가요?
            </span>
            <span className="block mt-0.5 text-[12px] text-ink-muted leading-snug truncate">
              {intro.one_liner}
            </span>
          </span>
          <span
            className="material-icons-round text-[20px] shrink-0"
            style={{ color: 'var(--genre)' }}
          >
            chevron_right
          </span>
        </span>
      </button>

      {sheetOpen && (
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
      )}

      {editor}
    </>
  )
}

export default BookIntroCard
