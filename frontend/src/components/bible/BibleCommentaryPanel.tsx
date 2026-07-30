import { useMemo, useState } from 'react'
import {
  useChapterCommentaries,
  useCreateCommentary,
  useDeleteCommentary,
  useUpdateCommentary,
} from '../../hooks/useBibleCommentary'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import type {
  BibleCommentary,
  BibleCommentaryCreateRequest,
} from '../../types/bibleCommentary'
import BibleCommentaryEditor from './BibleCommentaryEditor'
import BibleCommentaryItem from './BibleCommentaryItem'
import { genreStyle } from './bookGenre'

interface BibleCommentaryPanelProps {
  bookNumber: number
  chapter: number
  bookNameKo: string
  /** 패널이 열려있을 때 표시할 절 번호 (이 절을 포함하는 해석만 보여줌). null 이면 장 전체 */
  focusVerse: number | null
  totalVerses?: number
  /** 절 번호 → 본문. 해석 위에 실제 말씀을 띄우는 데 쓴다 */
  verseTexts?: Map<number, string>
  onClose: () => void
}

const BibleCommentaryPanel = ({
  bookNumber,
  chapter,
  bookNameKo,
  focusVerse,
  totalVerses,
  verseTexts,
  onClose,
}: BibleCommentaryPanelProps) => {
  const admin = isAdmin()
  const { data, isLoading } = useChapterCommentaries(bookNumber, chapter)

  const createMutation = useCreateCommentary()
  const updateMutation = useUpdateCommentary()
  const deleteMutation = useDeleteCommentary()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<BibleCommentary | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 모바일/브라우저 뒤로가기로 홈까지 나가버리지 않고 이 패널만 닫히도록 처리
  useModalBackButton(onClose)

  const { summaries, verses, total } = useMemo(() => {
    const all = data?.items ?? []
    const filtered =
      focusVerse == null
        ? all
        : all.filter(
            (c) => c.verse_start <= focusVerse && c.verse_end >= focusVerse,
          )
    return {
      summaries: filtered.filter((c) => c.scope === 'summary'),
      verses: filtered.filter((c) => c.scope !== 'summary'),
      total: filtered.length,
    }
  }, [data, focusVerse])

  const headerLabel =
    focusVerse != null
      ? `${bookNameKo} ${chapter}:${focusVerse}`
      : `${bookNameKo} ${chapter}장`

  /** 해석이 덮는 절 범위의 본문을 이어 붙인다 — 해석 위에 띄울 "읽는 말씀" */
  const scriptureFor = (c: BibleCommentary): string | null => {
    if (!verseTexts?.size) return null
    const parts: string[] = []
    for (let v = c.verse_start; v <= c.verse_end; v += 1) {
      const text = verseTexts.get(v)?.trim()
      if (text) parts.push(text)
    }
    return parts.length > 0 ? parts.join(' ') : null
  }

  const handleCreateClick = () => {
    setEditing(null)
    setErrorMessage(null)
    setEditorOpen(true)
  }

  const handleEditClick = (c: BibleCommentary) => {
    setEditing(c)
    setErrorMessage(null)
    setEditorOpen(true)
  }

  const handleDelete = async (c: BibleCommentary) => {
    if (!confirm(`이 해석을 삭제할까요?\n${c.title || c.content.slice(0, 30)}`)) {
      return
    }
    try {
      await deleteMutation.mutateAsync({
        id: c.id,
        bookNumber: c.book_number,
        chapter: c.chapter,
      })
      showToast('해석이 삭제되었습니다', 'success')
    } catch (e) {
      const msg = e instanceof Error ? e.message : '삭제 실패'
      showToast(msg, 'error')
    }
  }

  const handleSave = async (payload: BibleCommentaryCreateRequest) => {
    try {
      setErrorMessage(null)
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          payload: {
            verse_start: payload.verse_start,
            verse_end: payload.verse_end,
            title: payload.title,
            category: payload.category,
            content: payload.content,
          },
        })
        showToast('해석이 수정되었습니다', 'success')
      } else {
        await createMutation.mutateAsync(payload)
        showToast('해석이 추가되었습니다', 'success')
      }
      setEditorOpen(false)
      setEditing(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '저장 실패'
      setErrorMessage(msg)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-[2px] z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
        onClick={onClose}
        role="presentation"
      >
        <section
          className="relative w-full sm:max-w-[560px] bg-surface-container rounded-t-[28px] sm:rounded-[28px] overflow-hidden border-t sm:border border-[var(--card-border)] shadow-[0_-16px_48px_rgba(0,0,0,0.35)] flex flex-col"
          style={{ ...genreStyle(bookNumber), maxHeight: 'calc(var(--vvh, 100dvh) * 0.92)' }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`${headerLabel} 말씀 해석`}
        >
          {/* 헤더 — 색은 책 장르 액센트 하나로 통일해서 권 개관 시트와 같은 결로 읽힌다 */}
          <div className="relative shrink-0 flex items-center gap-3 px-5 pt-5 pb-3.5 border-b border-[var(--card-border)]">
            <div className="w-9 h-1 rounded-full bg-[var(--text-muted)]/40 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
            <div className="min-w-0 flex-1">
              <p
                className="text-[11px] font-bold tracking-[0.14em]"
                style={{ color: 'var(--genre)' }}
              >
                말씀 해석
              </p>
              <h3 className="text-ink-strong text-[19px] font-bold tracking-[-0.025em] truncate">
                {headerLabel}
              </h3>
            </div>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="w-9 h-9 rounded-full flex items-center justify-center text-ink-muted hover:bg-[var(--surface-inset)] transition-colors shrink-0"
            >
              <span className="material-icons-round text-[20px]">close</span>
            </button>
          </div>

          {/* 본문 */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
            {isLoading && (
              <div className="text-center py-10 text-ink-muted">
                <span className="material-icons-round animate-spin text-[28px]">refresh</span>
                <p className="mt-2 text-[13.5px]">해석 불러오는 중...</p>
              </div>
            )}

            {!isLoading && total === 0 && (
              <div className="text-center py-12 px-4 text-ink-muted">
                <span className="material-icons-round text-[40px] opacity-40">auto_stories</span>
                <p className="mt-2 text-[15px] text-ink">아직 등록된 해석이 없습니다</p>
                {admin && (
                  <p className="mt-1 text-[13px]">
                    아래 버튼으로 첫 해석을 추가해보세요
                  </p>
                )}
              </div>
            )}

            {!isLoading && summaries.length > 0 && (
              <section>
                <SectionLabel text="요약 해석" count={summaries.length} />
                <div className="divide-y divide-[var(--card-border)]">
                  {summaries.map((c) => (
                    <BibleCommentaryItem
                      key={c.id}
                      commentary={c}
                      isAdmin={admin}
                      scriptureText={scriptureFor(c)}
                      onEdit={handleEditClick}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )}

            {!isLoading && verses.length > 0 && (
              <section>
                <SectionLabel text="절별 해석" count={verses.length} />
                <div className="divide-y divide-[var(--card-border)]">
                  {verses.map((c) => (
                    <BibleCommentaryItem
                      key={c.id}
                      commentary={c}
                      isAdmin={admin}
                      scriptureText={scriptureFor(c)}
                      onEdit={handleEditClick}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* 관리자: 해석 추가 */}
          {admin && (
            <div className="shrink-0 px-6 py-3 border-t border-[var(--card-border)] bg-surface-container">
              <button
                onClick={handleCreateClick}
                className="w-full inline-flex items-center justify-center gap-1.5 h-12 rounded-xl bg-brand text-white text-[14px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] hover:shadow-[0_10px_28px_-6px_var(--brand-glow)] transition-all"
              >
                <span className="material-icons-round text-[19px]">add</span>
                해석 추가
              </button>
            </div>
          )}
        </section>
      </div>

      {editorOpen && (
        <BibleCommentaryEditor
          bookNumber={bookNumber}
          chapter={chapter}
          totalVerses={totalVerses}
          initialVerseStart={focusVerse ?? 1}
          initialVerseEnd={focusVerse ?? 1}
          existing={editing}
          saving={createMutation.isPending || updateMutation.isPending}
          errorMessage={errorMessage}
          onSave={handleSave}
          onClose={() => {
            setEditorOpen(false)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

interface SectionLabelProps {
  text: string
  count: number
}

/** 요약/절별 해석 그룹을 구분하는 규칙선 머리글 — 아이콘 칩 대신 지면 구분자로 */
const SectionLabel = ({ text, count }: SectionLabelProps) => (
  <div className="flex items-center gap-2.5 pt-6 pb-1">
    <span className="text-[12px] font-bold tracking-[0.08em] text-ink-strong shrink-0">
      {text}
    </span>
    <span className="text-[11.5px] text-ink-muted tabular-nums shrink-0">{count}</span>
    <span className="flex-1 h-px" style={{ background: 'var(--genre-line)' }} />
  </div>
)

export default BibleCommentaryPanel
