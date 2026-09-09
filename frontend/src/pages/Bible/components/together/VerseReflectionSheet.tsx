import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { VerseReflection } from '../../../../api/bibleReflection'
import { UsersIcon } from '../../../../components/icons/ActionIcons'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import { useChapterPresence } from '../../../../hooks/useReadingTogether'
import {
  useCreateReflection,
  useDeleteReflection,
  useToggleReflectionLike,
  useUpdateReflection,
  useVerseReflections,
} from '../../../../hooks/useVerseReflections'
import { can } from '../../../../utils/access'
import { showToast } from '../../../../utils/toast'
import ReflectionCard from './ReflectionCard'

interface VerseReflectionSheetProps {
  verseId: number
  bookNumber: number
  chapter: number
  verse: number
  /** "로마서 8:28" */
  verseReference: string
  verseText: string
  /** 이 절을 지금 함께 읽는 다른 사람 수 (나 제외) */
  liveOthers: number
  onClose: () => void
}

const REFLECTION_MAX = 1000

/**
 * 절 묵상 나눔 하단 시트 — 성경 → 묵상 → 사람 → 대화.
 * 위에서부터: 말씀 본문 → "지금 N명이 함께" 한 줄 → 묵상 남기기 → 성도들의 묵상.
 * 목록 갱신은 훅(useVerseReflections)과 SSE 핸들러(useReadingTogether)가 맡고,
 * 이 컴포넌트는 배치와 사용자 입력만 담당한다.
 */
const VerseReflectionSheet = ({
  verseId,
  bookNumber,
  chapter,
  verse,
  verseReference,
  verseText,
  liveOthers,
  onClose,
}: VerseReflectionSheetProps) => {
  useModalBackButton(onClose)
  const canModerate = can('bible:edit')

  const { data, isLoading, isError } = useVerseReflections(verseId, true)
  // 캐시만 읽는다(enabled:false) — 장 진입 때 VerseList 가 이미 받아 뒀다
  const { data: presence } = useChapterPresence(bookNumber, chapter, false)
  const create = useCreateReflection(verseId)
  const update = useUpdateReflection(verseId)
  const remove = useDeleteReflection(verseId)
  const toggleLike = useToggleReflectionLike(verseId)

  const [draft, setDraft] = useState('')
  const items = data?.items ?? []
  const mine = items.find((r) => r.is_mine)

  const submit = () => {
    const content = draft.trim()
    if (!content || create.isPending) return
    create.mutate(content, {
      onSuccess: () => {
        setDraft('')
        showToast('묵상을 나눴어요', 'success')
      },
      onError: (e) => showToast(e instanceof Error ? e.message : '묵상을 남기지 못했습니다', 'error'),
    })
  }
  const fail = (e: unknown, fallback: string) => showToast(e instanceof Error ? e.message : fallback, 'error')

  const readersToday = presence?.readers_today ?? 0

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 sheet-backdrop sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md sheet-rise max-h-[92vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_var(--brand-glow)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${verseReference} 함께 읽는 성도의 묵상`}
      >
        <div className="hidden dark:block absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--brand-soft)] rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center gap-3 px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand-soft)] text-brand shrink-0">
            <UsersIcon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-brand text-[10.5px] font-bold tracking-[0.1em]">함께 읽는 성도의 묵상</p>
            <h3 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em] truncate">{verseReference}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors shrink-0"
            aria-label="닫기"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        {/* 본문 */}
        <div className="relative z-10 flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <div className="rounded-xl border-l-[3px] border-brand bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-[13.5px] leading-[1.7] text-gray-600 dark:text-white/65">
            {verseText}
          </div>

          {liveOthers > 0 ? (
            <div className="rt-live-line">
              <span className="rt-live-dot" aria-hidden />
              지금 <strong>{liveOthers}명</strong>이 이 말씀을 함께 읽고 있어요
            </div>
          ) : readersToday > 0 ? (
            <div className="rt-live-line">
              <UsersIcon size={14} />
              오늘 <strong>{readersToday}명</strong>의 성도가 이 장을 읽었어요
            </div>
          ) : null}

          {/* 묵상 남기기 — 이미 남겼으면 카드에서 수정하도록 안내 */}
          {mine ? (
            <div className="rt-prompt">
              <div className="rt-prompt__q">이 말씀에 묵상을 남기셨어요</div>
              <div className="rt-prompt__hint">아래 내 카드에서 수정하거나, 다른 성도의 묵상에 공감과 댓글을 남겨 보세요.</div>
            </div>
          ) : (
            <div className="rt-prompt">
              <div className="rt-prompt__q">이 말씀을 읽으며 어떤 생각이 드셨나요?</div>
              <div className="rt-prompt__hint">같은 말씀을 읽는 성도들에게 실명으로 보여요.</div>
              <textarea
                className="rt-textarea"
                value={draft}
                maxLength={REFLECTION_MAX}
                placeholder="짧아도 괜찮아요. 오늘 마음에 남은 한 줄을 적어 보세요."
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="rt-prompt__actions">
                <span className="rt-counter">{draft.length}/{REFLECTION_MAX}</span>
                <button type="button" className="rt-btn-primary" onClick={submit} disabled={!draft.trim() || create.isPending}>
                  {create.isPending ? '남기는 중…' : '묵상 남기기'}
                </button>
              </div>
            </div>
          )}

          {/* 목록 */}
          {isLoading ? (
            <div className="rt-empty">묵상을 불러오는 중…</div>
          ) : isError ? (
            <div className="rt-empty">묵상을 불러오지 못했어요. 잠시 후 다시 열어 주세요.</div>
          ) : items.length === 0 ? (
            <div className="rt-empty">
              아직 이 말씀에 남긴 묵상이 없어요.
              <br />
              첫 묵상을 남기면 함께 읽는 성도들에게 바로 전해져요.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((r: VerseReflection) => (
                <ReflectionCard
                  key={r.id}
                  reflection={r}
                  verseId={verseId}
                  canModerate={canModerate}
                  editPending={update.isPending}
                  onToggleLike={(target) => toggleLike.mutate(target, { onError: (e) => fail(e, '공감하지 못했습니다') })}
                  onEdit={(target, content) =>
                    update.mutate({ id: target.id, content }, { onError: (e) => fail(e, '묵상을 수정하지 못했습니다') })
                  }
                  onDelete={(target) => remove.mutate(target, { onError: (e) => fail(e, '묵상을 삭제하지 못했습니다') })}
                />
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="relative z-10 sticky bottom-0 bg-background-light/95 dark:bg-card-dark/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 py-3 flex items-center gap-2">
          <span className="text-[11.5px] text-gray-500 dark:text-white/45">
            {verse}절 · 묵상 {data?.total ?? 0}
          </span>
          <button
            onClick={onClose}
            className="ml-auto px-5 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default VerseReflectionSheet
