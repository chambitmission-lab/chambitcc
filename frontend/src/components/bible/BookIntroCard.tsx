import { useState } from 'react'
import { Markdown } from '../../utils/markdown'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import {
  useBookIntro,
  useDeleteBookIntro,
  useUpsertBookIntro,
} from '../../hooks/useBibleBookIntro'
import type { BibleBookIntroUpsertRequest } from '../../types/bibleBookIntro'
import BookIntroEditor from './BookIntroEditor'

interface BookIntroCardProps {
  bookNumber: number
  bookNameKo: string
}

/**
 * 책 진입 시 장 목록 위에 보이는 '권 개관' Hero 카드.
 * - 교인: 책 전체가 무엇을 말하는지 큰 그림을 자연스럽게 노출
 * - 관리자: 개관 추가/수정/삭제 (+ AI 초안)
 * 개관이 없고 관리자가 아니면 아무것도 렌더하지 않는다.
 */
const BookIntroCard = ({ bookNumber, bookNameKo }: BookIntroCardProps) => {
  const admin = isAdmin()
  const { data: intro, isLoading } = useBookIntro(bookNumber)

  const upsertMutation = useUpsertBookIntro()
  const deleteMutation = useDeleteBookIntro()

  const [editorOpen, setEditorOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
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
    if (!confirm(`${bookNameKo} 권 개관을 삭제할까요?`)) return
    try {
      await deleteMutation.mutateAsync(bookNumber)
      showToast('권 개관이 삭제되었습니다', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '삭제 실패', 'error')
    }
  }

  // 로딩 중이거나, 개관도 없고 관리자도 아니면 카드 자체를 숨긴다
  if (isLoading) return null
  if (!intro && !admin) return null

  // 관리자인데 개관이 아직 없는 경우 — 추가 유도 슬림 배너
  if (!intro) {
    return (
      <>
        <div className="mx-4 mt-3 mb-2 rounded-2xl border border-dashed border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] px-4 py-3.5 flex items-center gap-3">
          <span className="material-icons-round text-brand text-[22px]">
            auto_stories
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-bold text-gray-800 dark:text-white/85">
              {bookNameKo} 권 개관이 아직 없어요
            </p>
            <p className="text-[11.5px] text-gray-500 dark:text-white/50">
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

        {editorOpen && (
          <BookIntroEditor
            bookNumber={bookNumber}
            bookNameKo={bookNameKo}
            existing={null}
            saving={upsertMutation.isPending}
            errorMessage={errorMessage}
            onSave={handleSave}
            onClose={() => setEditorOpen(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <section className="relative mx-4 mt-3 mb-2 rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] bg-surface-light dark:bg-card-dark shadow-[0_6px_24px_-12px_var(--brand-glow)]">
        {/* 표면 그라데이션 + 글로우 */}
        <div className="hidden dark:block absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
        <div className="absolute -top-6 -right-6 w-36 h-36 bg-[var(--brand-soft)] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 px-5 pt-5 pb-4">
          {/* 엠블럼 + 라벨 + 제목 */}
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[var(--brand-soft)] text-brand shrink-0">
              <span className="material-icons-round text-[24px]">menu_book</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">
                Book Intro
              </p>
              <h3 className="text-[20px] font-bold tracking-[-0.02em] leading-tight text-brand">
                {bookNameKo}
              </h3>
              <p className="mt-0.5 text-[14px] font-semibold leading-snug text-gray-700 dark:text-white/80">
                {intro.one_liner}
              </p>
            </div>
          </div>

          {/* 메타 chip (주제 / 저자·시대) */}
          {(intro.theme || intro.author_period) && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {intro.theme && (
                <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-[var(--brand-soft)] text-brand">
                  <span className="material-icons-round text-[14px]">label</span>
                  {intro.theme}
                </span>
              )}
              {intro.author_period && (
                <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/65">
                  <span className="material-icons-round text-[14px]">history_edu</span>
                  {intro.author_period}
                </span>
              )}
            </div>
          )}

          {/* 개관 본문 — 접힘 상태에선 클램프 */}
          <div
            className={`mt-3.5 text-[14px] leading-[1.75] text-gray-700 dark:text-white/80 ${
              expanded ? '' : 'line-clamp-3'
            }`}
          >
            <Markdown source={intro.overview} />
          </div>

          {/* 펼쳤을 때만 보이는 핵심 장 + 그리스도 연결 */}
          {expanded && (
            <>
              {intro.key_chapters && (
                <div className="mt-3.5 rounded-2xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] px-3.5 py-3">
                  <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-brand mb-1">
                    <span className="material-icons-round text-[15px]">bookmark</span>
                    핵심 장
                  </p>
                  <p className="text-[13.5px] leading-relaxed text-gray-700 dark:text-white/80">
                    {intro.key_chapters}
                  </p>
                </div>
              )}

              {intro.christ_connection && (
                <div className="mt-3 rounded-2xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] px-3.5 py-3">
                  <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-brand mb-1">
                    <span className="material-icons-round text-[15px]">auto_awesome</span>
                    그리스도와의 연결
                  </p>
                  <div className="text-[13.5px] leading-[1.7] text-gray-700 dark:text-white/80">
                    <Markdown source={intro.christ_connection} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* 더보기 / 접기 */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-brand hover:text-[var(--brand-dim)] transition-colors"
          >
            {expanded ? '접기' : '더보기'}
            <span className="material-icons-round text-[18px]">
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {/* 관리자: 수정 / 삭제 */}
          {admin && (
            <div className="flex gap-1.5 justify-end mt-2 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
              <button
                onClick={() => {
                  setErrorMessage(null)
                  setEditorOpen(true)
                }}
                className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-[12px] font-bold bg-[var(--brand-soft)] text-brand border border-[var(--brand-soft-strong)] hover:bg-[var(--brand-soft-strong)] transition-colors"
              >
                <span className="material-icons-round text-[15px]">edit</span>
                수정
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-[12px] font-bold bg-red-500/8 dark:bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/20 dark:border-red-400/30 hover:bg-red-500/15 dark:hover:bg-red-500/20 transition-colors"
              >
                <span className="material-icons-round text-[15px]">delete_outline</span>
                삭제
              </button>
            </div>
          )}
        </div>
      </section>

      {editorOpen && (
        <BookIntroEditor
          bookNumber={bookNumber}
          bookNameKo={bookNameKo}
          existing={intro}
          saving={upsertMutation.isPending}
          errorMessage={errorMessage}
          onSave={handleSave}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </>
  )
}

export default BookIntroCard
