import type { VerseBookmark } from '../../../../api/bibleBookmark'
import type { GlossaryEntry } from '../../data/bibleGlossary'
import VerseBookmarkModal from '../VerseBookmarkModal'
import VerseNoteSheet from '../VerseNoteSheet'
import WordNoteSheet from '../WordNoteSheet'
import GlossarySheet from '../GlossarySheet'
import type { WordSheetState } from './useWordSelection'

interface VerseSheetsProps {
  verseId: number
  /** "창세기 1:1" 형태 — 모달·시트 제목에 공통으로 쓰인다 */
  verseReference: string
  verseText: string
  bookmark: VerseBookmark | null | undefined

  showBookmarkModal: boolean
  onCloseBookmarkModal: () => void

  wordSheet: WordSheetState | null
  onCloseWordSheet: () => void

  glossaryEntry: GlossaryEntry | null
  onCloseGlossary: () => void

  showNoteSheet: boolean
  onCloseNoteSheet: () => void
  /** 노트 읽기 시트에서 "수정"을 누르면 편집 모달로 전환 */
  onEditNote: () => void
}

/** 절 하나에서 열릴 수 있는 모달·하단 시트 묶음. 열림 상태는 부모가 들고 있다. */
const VerseSheets = ({
  verseId,
  verseReference,
  verseText,
  bookmark,
  showBookmarkModal,
  onCloseBookmarkModal,
  wordSheet,
  onCloseWordSheet,
  glossaryEntry,
  onCloseGlossary,
  showNoteSheet,
  onCloseNoteSheet,
  onEditNote,
}: VerseSheetsProps) => (
  <>
    {/* 북마크/묵상 모달 */}
    {showBookmarkModal && (
      <VerseBookmarkModal
        verseId={verseId}
        verseReference={verseReference}
        verseText={verseText}
        existing={bookmark ?? null}
        onClose={onCloseBookmarkModal}
      />
    )}

    {/* 단어 뜻/메모 시트 - 단어 선택 또는 밑줄 단어 탭으로 열림 */}
    {wordSheet && (
      <WordNoteSheet
        verseId={verseId}
        verseReference={verseReference}
        verseText={verseText}
        initialWord={wordSheet.initialWord}
        charStart={wordSheet.charStart}
        charEnd={wordSheet.charEnd}
        existing={wordSheet.existing}
        onClose={onCloseWordSheet}
      />
    )}

    {/* 인물·지명 사전 시트 — 점선 칩을 탭했을 때 */}
    {glossaryEntry && <GlossarySheet entry={glossaryEntry} onClose={onCloseGlossary} />}

    {/* 묵상 노트 읽기 시트 - 수정 누르면 편집 모달로 전환 */}
    {showNoteSheet && bookmark?.note && (
      <VerseNoteSheet
        verseReference={verseReference}
        verseText={verseText}
        bookmark={bookmark}
        onEdit={onEditNote}
        onClose={onCloseNoteSheet}
      />
    )}
  </>
)

export default VerseSheets
