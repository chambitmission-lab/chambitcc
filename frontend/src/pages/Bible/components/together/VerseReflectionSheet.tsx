import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { VerseReflection } from '../../../../api/bibleReflection'
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
import { safeSessionStorage } from '../../../../utils/safeStorage'
import { showToast } from '../../../../utils/toast'
import ReflectionCard from './ReflectionCard'
import ReflectionComposer, { type ReflectionComposerHandle } from './ReflectionComposer'
import RtAvatar from './RtAvatar'
import RtCandle from './RtCandle'
import { SheetGrabber } from '../../../../components/common/SheetGrabber'

interface VerseReflectionSheetProps {
  verseId: number
  bookNumber: number
  chapter: number
  verse: number
  /** "로마서 8:28" */
  verseReference: string
  verseText: string
  /** 이 장을 지금 함께 읽는 다른 사람 수 (나 제외) */
  chapterOthers: number
  /** 내가 장 카운트에 들어있는지 — 들어있으면 '나를 포함해 N명' */
  meCounted: boolean
  onClose: () => void
}

const draftKey = (verseId: number) => `rt-draft:${verseId}`
/** 초안 저장은 타이핑 뒤 잠깐 모아서 — 글자마다 sessionStorage 를 두드리지 않는다(닫힐 땐 바로 비운다) */
const DRAFT_WRITE_DELAY_MS = 150

const writeDraft = (key: string, value: string) => {
  if (value) safeSessionStorage.set(key, value)
  else safeSessionStorage.remove(key)
}

const fail = (e: unknown, fallback: string) => showToast(e instanceof Error ? e.message : fallback, 'error')

/** 말씀을 어절로 나눈다 — 앞뒤 문장부호는 인용할 때 떼어 낸다 */
const toWords = (text: string) =>
  text.split(/(\s+)/).map((raw) => ({ raw, word: raw.replace(/^[\s"'“”‘’(「『[]+|[\s"'“”‘’)」』\].,!?;:·…]+$/g, '') }))

/**
 * 절 묵상 나눔 시트 — "말씀에서 켜진 빛을 서로 나눈다".
 * 위에서부터: 말씀(명조, 어절을 누르면 인용) → 생각 열쇠가 붙은 작성 카드 → 성도들의 묵상.
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
  chapterOthers,
  meCounted,
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

  // 초안은 절마다 세션에 붙잡아 둔다 — 시트를 실수로 닫아도 쓰던 글이 남는다
  const [draft, setDraftState] = useState(() => safeSessionStorage.get(draftKey(verseId)) ?? '')
  // 상태는 바로(입력이 즉시 비친다), 저장은 모아서. 아직 안 쓴 초안은 닫힐 때(언마운트) 바로 쓴다
  const pendingDraft = useRef<{ key: string; value: string } | null>(null)
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flushDraft = useCallback(() => {
    if (draftTimer.current) {
      clearTimeout(draftTimer.current)
      draftTimer.current = null
    }
    const pending = pendingDraft.current
    if (!pending) return
    pendingDraft.current = null
    writeDraft(pending.key, pending.value)
  }, [])
  const setDraft = useCallback(
    (next: string) => {
      setDraftState(next)
      pendingDraft.current = { key: draftKey(verseId), value: next }
      if (draftTimer.current) clearTimeout(draftTimer.current)
      draftTimer.current = setTimeout(flushDraft, DRAFT_WRITE_DELAY_MS)
    },
    [verseId, flushDraft],
  )
  useEffect(() => flushDraft, [flushDraft])
  const [activeKey, setActiveKey] = useState<number | null>(null)
  const [freshId, setFreshId] = useState<number | null>(null)
  const composerRef = useRef<ReflectionComposerHandle>(null)

  const items = useMemo(() => data?.items ?? [], [data])
  const total = data?.total ?? 0
  const mine = items.find((r) => r.is_mine)
  const canCompose = !mine && !isLoading
  const words = useMemo(() => toWords(verseText), [verseText])

  // 이 말씀을 나눈 얼굴들 — 같은 사람이 여러 번 나오지 않게
  const faces = useMemo(() => {
    const seen = new Set<number>()
    return items.filter((r) => (seen.has(r.author.id) ? false : (seen.add(r.author.id), true))).slice(0, 4)
  }, [items])

  const submit = () => {
    const content = draft.trim()
    if (!content || create.isPending) return
    create.mutate(content, {
      onSuccess: (created) => {
        setDraft('')
        setActiveKey(null)
        setFreshId(created.id)
        showToast('묵상이 성도들에게 전해졌어요', 'success')
      },
      onError: (e) => showToast(e instanceof Error ? e.message : '묵상을 남기지 못했습니다', 'error'),
    })
  }
  // memo 된 ReflectionCard 가 받는 콜백 — mutate 는 react-query 가 안정된 참조로 준다
  const { mutate: likeMutate } = toggleLike
  const { mutate: updateMutate } = update
  const { mutate: removeMutate } = remove
  const handleToggleLike = useCallback(
    (target: VerseReflection) => likeMutate(target, { onError: (e) => fail(e, '아멘을 남기지 못했습니다') }),
    [likeMutate],
  )
  const handleEdit = useCallback(
    (target: VerseReflection, content: string) =>
      updateMutate({ id: target.id, content }, { onError: (e) => fail(e, '묵상을 수정하지 못했습니다') }),
    [updateMutate],
  )
  const handleDelete = useCallback(
    (target: VerseReflection) => removeMutate(target, { onError: (e) => fail(e, '묵상을 삭제하지 못했습니다') }),
    [removeMutate],
  )

  const readersToday = presence?.readers_today ?? 0
  const meReadToday = presence?.me_read_today === true
  const todayOthers = Math.max(0, readersToday - (meReadToday ? 1 : 0))
  const presenceLine =
    chapterOthers > 0
      ? { live: true, text: meCounted ? `지금 나 포함 ${chapterOthers + 1}명이 이 장을 읽는 중` : `지금 ${chapterOthers}명이 이 장을 읽는 중` }
      : todayOthers > 0
        ? { live: false, text: meReadToday ? `오늘 나 포함 ${todayOthers + 1}명이 이 장을 읽었어요` : `오늘 ${todayOthers}명이 이 장을 읽었어요` }
        : null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 sheet-backdrop sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="rt-sheet pc-scale-sheet relative w-full sm:max-w-[480px] sheet-rise max-h-[92vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${verseReference} 함께 읽는 성도의 묵상`}
      >
        {/* 말씀에서 번지는 빛 — 참빛의 첫 장면 */}
        <div className="rt-sheet__glow" aria-hidden />

        {/* 헤더 */}
        <div className="relative z-10 flex items-start gap-3 px-5 pt-5 pb-3">
          <SheetGrabber onClose={onClose} className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div className="min-w-0 flex-1">
            <h3 className="text-ink-strong text-[19px] font-bold tracking-[-0.03em] truncate">{verseReference}</h3>
            {presenceLine ? (
              <p className={`rt-sheet__presence ${presenceLine.live ? 'rt-sheet__presence--live' : ''}`}>
                {presenceLine.live && <span className="rt-live-dot" aria-hidden />}
                {presenceLine.text}
              </p>
            ) : (
              <p className="rt-sheet__presence">함께 읽는 성도의 묵상</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="-mr-1.5 w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
            aria-label="닫기"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        {/* 본문 — 모바일은 한 줄기 스크롤, PC(lg+)는 왼쪽 쓰기 / 오른쪽 성도들의 묵상이 각자 스크롤한다 */}
        <div className="rt-sheet__body relative z-10 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
          <div className="rt-sheet__write">
            {/* 말씀 — 어절을 누르면 묵상에 인용된다 */}
            <figure className="rt-verse">
              <blockquote className="rt-verse__text">
                {words.map(({ raw, word }, i) =>
                  !word || !canCompose ? (
                    <span key={i}>{raw}</span>
                  ) : (
                    <button
                      key={i}
                      type="button"
                      className={`rt-verse__word ${draft.includes(`“${word}”`) ? 'rt-verse__word--on' : ''}`}
                      onClick={() => composerRef.current?.append(`“${word}”`)}
                    >
                      {raw}
                    </button>
                  ),
                )}
              </blockquote>
              <figcaption className="rt-verse__cap">
                <span>{verse}절</span>
                {canCompose && <span className="rt-verse__hint">단어를 누르면 묵상에 담겨요</span>}
              </figcaption>
            </figure>

            {/* 작성 — 이미 나눴으면 짧은 확인만 */}
            {mine ? (
              <div className="rt-done">
                <span className="rt-done__mark" aria-hidden>
                  <span className="material-icons-round text-[16px]">check</span>
                </span>
                <div className="min-w-0">
                  <p className="rt-done__title">이 말씀에 묵상을 나눴어요</p>
                  <p className="rt-done__sub">다른 성도의 묵상에 아멘과 따뜻한 한마디를 건네 보세요</p>
                </div>
              </div>
            ) : (
              !isLoading && (
                <ReflectionComposer
                  ref={composerRef}
                  draft={draft}
                  onDraftChange={setDraft}
                  activeKey={activeKey}
                  onActiveKeyChange={setActiveKey}
                  pending={create.isPending}
                  onSubmit={submit}
                />
              )
            )}
          </div>

          <div className="rt-sheet__others">
            {/* 성도들의 묵상 */}
            {isLoading ? (
              <div className="rt-skeleton" aria-label="묵상을 불러오는 중">
                <span /><span /><span />
              </div>
            ) : isError ? (
              <div className="rt-empty">묵상을 불러오지 못했어요. 잠시 후 다시 열어 주세요.</div>
            ) : items.length === 0 ? (
              <div className="rt-empty">
                <RtCandle lit={draft.trim().length > 0} />
                {draft.trim() ? (
                  <>
                    <p className="rt-empty__title">쓰는 동안 불이 붙었어요</p>
                    <p>나누면 이 말씀의 첫 빛이 돼요.</p>
                  </>
                ) : (
                  <>
                    <p className="rt-empty__title">아직 이 말씀에 켜진 빛이 없어요</p>
                    <p>한 줄을 쓰기 시작하면 촛불이 켜져요.</p>
                  </>
                )}
              </div>
            ) : (
              <section className="rt-feed" aria-label="성도들의 묵상">
                <header className="rt-feed__head">
                  <span className="rt-faces" aria-hidden>
                    {faces.map((r) => (
                      <RtAvatar key={r.author.id} author={r.author} small />
                    ))}
                  </span>
                  <span>
                    <strong>{total}개</strong>의 묵상이 켜졌어요
                  </span>
                </header>
                <div className="space-y-2.5">
                  {items.map((r: VerseReflection) => (
                    <ReflectionCard
                      key={r.id}
                      reflection={r}
                      verseId={verseId}
                      fresh={r.id === freshId}
                      canModerate={canModerate}
                      editPending={update.isPending}
                      onToggleLike={handleToggleLike}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default VerseReflectionSheet
