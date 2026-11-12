// 다시 꺼내보는 기록 — /growth '말씀 여정 인사이트' 자리(2026-11-12 교체, 시안 /#/dev/growth-rewind?v=ab).
// 위: 그때 오늘 내가 쓴 글(1년·6개월·한 달 전) + 응답을 기다리는 기도. 배경은 예수님과 양이 같은 곳을 바라보는 언덕.
// 아래: 마음에 담아 둔 말씀 — 삽화 없는 한 줄 띠, 눌러야 펼쳐진다.
// '그때 오늘'은 오늘의 교회(/today)와 같은 서버 규칙이고, 응답 등록·'아직 기도 중' 접기도 그쪽 훅을 그대로 쓴다.
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import type { TodayMemory } from '../../../api/todayChurch'
import { growthKeys, useGrowthRewind } from '../../../hooks/useGrowth'
import { useAnswerMemoryPrayer, useStillPraying } from '../../../hooks/useTodayChurch'
import type { GrowthRewind as GrowthRewindData, HeldVerse, WaitingPrayer } from '../../../types/growth'
import { GrowthGlyph, type GrowthGlyphName } from '../../../components/icons/GrowthIcons'
import { ensureFontFamily } from '../../../utils/deferredFonts'
import { lazyModal } from '../../../utils/lazyModal'
import './growthRewind.css'

ensureFontFamily('gowunBatang')

const AnswerModal = lazyModal(() => import('../../../components/prayer/AnswerModal'))

const ART_LIGHT = '/images/home/verse-scene-light.webp'
const ART_DARK = '/images/home/verse-scene-dark.webp'

const OFFSET_LABEL: Record<TodayMemory['offset'], { tab: string; exact: string; near: string }> = {
  year: { tab: '1년 전', exact: '1년 전 오늘', near: '1년 전 이맘때' },
  half: { tab: '6개월 전', exact: '6개월 전 오늘', near: '6개월 전 이맘때' },
  month: { tab: '한 달 전', exact: '한 달 전 오늘', near: '한 달 전 이맘때' },
  first: { tab: '처음', exact: '처음 남기신 기도', near: '처음 남기신 기도' },
}

const KIND_META: Record<TodayMemory['kind'], { label: string; glyph: GrowthGlyphName }> = {
  prayer: { label: '기도', glyph: 'prayer' },
  meditation: { label: '묵상', glyph: 'note' },
  thanks: { label: '감사', glyph: 'thanks' },
  typing: { label: '필사', glyph: 'verses' },
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
/** 'YYYY-MM-DD' → '2025년 11월 12일 수요일' (로컬 날짜로 해석 — UTC 파싱이면 하루 밀린다) */
const longDate = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return `${y}년 ${m}월 ${d}일 ${WEEKDAYS[dt.getDay()]}요일`
}

const cardClass = `
  grw-card relative overflow-hidden rounded-2xl
  bg-white dark:bg-card-dark
  border border-gray-200/70 dark:border-white/[0.06] shadow-sm
  dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)]
`

/* ───────────── 응답을 기다리는 기도 ───────────── */

const WaitingPrayerBox = ({ waiting }: { waiting: WaitingPrayer[] }) => {
  const qc = useQueryClient()
  const answer = useAnswerMemoryPrayer()
  const { isStillPraying, markStillPraying } = useStillPraying()
  const [modalFor, setModalFor] = useState<WaitingPrayer | null>(null)
  // 응답 직후엔 캐시에서 빠져도 도장 찍힌 모습을 이 화면에 남겨 둔다
  const [justAnswered, setJustAnswered] = useState<WaitingPrayer | null>(null)

  const visible = waiting.filter((w) => !isStillPraying(w.id))
  const current = justAnswered ?? visible[0]
  if (!current) return null

  const onSubmit = async (testimony: string) => {
    if (!modalFor) return
    try {
      await answer.mutateAsync({ prayerId: modalFor.id, testimony, prayerCount: modalFor.prayer_count })
      setJustAnswered(modalFor)
      setModalFor(null)
      qc.setQueryData<GrowthRewindData>(growthKeys.rewind, (prev) =>
        prev && {
          ...prev,
          waiting: prev.waiting.filter((w) => w.id !== modalFor.id),
          memories: prev.memories.map((m) =>
            m.kind === 'prayer' && m.id === modalFor.id ? { ...m, is_answered: true } : m,
          ),
        },
      )
      // 발자취·요약에 응답 순간이 생긴다
      void qc.invalidateQueries({ queryKey: growthKeys.summary })
      void qc.invalidateQueries({ queryKey: growthKeys.timeline })
    } catch {
      // onError 토스트 — 모달은 열어 두고 다시 시도하게 한다
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-gray-200/80 dark:border-white/[0.07] bg-gray-50/70 dark:bg-white/[0.03] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold text-gray-500 dark:text-white/50">응답을 기다리는 기도</span>
        {!justAnswered && visible.length > 1 && (
          <span className="text-[11px] text-gray-400 dark:text-white/40">{visible.length}개 중 1</span>
        )}
      </div>
      <div className="mt-2 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-ink-strong leading-snug tracking-[-0.01em] line-clamp-2">
            {current.title || current.text}
          </p>
          <p className="mt-0.5 text-[12px] text-gray-500 dark:text-white/50">
            기도한 지 <b className="text-brand font-bold">{current.days}일</b>
            {current.prayer_count > 0 && <> · 함께 기도한 성도 {current.prayer_count}명</>}
          </p>
        </div>
        {justAnswered && <span className="grw-stamp shrink-0">응답</span>}
      </div>

      {justAnswered ? (
        <p className="grw-fade mt-3 text-[13px] text-gray-700 dark:text-white/75">
          발자취에 응답으로 남겨 두었어요.
        </p>
      ) : (
        <>
          <p className="mt-3 text-[13px] text-gray-700 dark:text-white/75">이 기도, 어떻게 되었나요?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setModalFor(current)}
              className="py-2.5 rounded-xl text-[14px] font-bold border active:scale-[0.98] transition-transform"
              style={{ borderColor: 'var(--grw-gold)', color: 'var(--grw-gold)', background: 'var(--grw-gold-soft)' }}
            >
              응답받았어요
            </button>
            <button
              type="button"
              onClick={() => markStillPraying(current.id)}
              className="py-2.5 rounded-xl text-[14px] font-bold text-gray-600 dark:text-white/70 bg-white dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] active:scale-[0.98] transition-transform"
            >
              계속 기도할게요
            </button>
          </div>
        </>
      )}

      {modalFor && createPortal(
        <AnswerModal
          isOpen
          onClose={() => setModalFor(null)}
          prayerTitle={modalFor.title || modalFor.text}
          isSubmitting={answer.isPending}
          onSubmit={onSubmit}
        />,
        document.body,
      )}
    </div>
  )
}

/* ───────────── 다시 꺼내보는 기록 (A) ───────────── */

const RewindCard = ({
  data,
  loadedDates,
  onJumpToDay,
}: {
  data: GrowthRewindData
  loadedDates: Set<string>
  onJumpToDay: (date: string) => void
}) => {
  const { memories, waiting } = data
  const [idx, setIdx] = useState(0)
  const m = memories[Math.min(idx, memories.length - 1)] as TodayMemory | undefined
  const offset = m ? OFFSET_LABEL[m.offset] : null
  const kind = m ? KIND_META[m.kind] : null

  return (
    <div className="px-4 pt-5">
      <h3 className="text-[14px] font-bold text-ink-strong mb-3 flex items-center gap-2 tracking-[-0.01em]">
        <GrowthGlyph name="days" size={20} className="text-brand" />
        다시 꺼내보는 기록
      </h3>
      <div className={cardClass}>
        <div className="relative">
          <div className="grw-art" aria-hidden="true">
            <img src={ART_LIGHT} alt="" className="dark:hidden" loading="lazy" decoding="async" />
            <img src={ART_DARK} alt="" className="hidden dark:block" loading="lazy" decoding="async" />
          </div>
          <div className="grw-glow" aria-hidden="true" />
          {m && offset && (
            <span className="absolute left-4 top-3.5 rounded-full bg-white/85 dark:bg-black/35 backdrop-blur px-2.5 py-1 text-[12px] font-bold text-brand">
              {m.exact ? offset.exact : offset.near}
            </span>
          )}
        </div>

        <div className="relative px-4 pb-4 -mt-5">
          {m && kind ? (
            <div key={`${m.kind}-${m.id}`} className="grw-fade">
              <div className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-white/50">
                <GrowthGlyph name={kind.glyph} size={14} className="text-brand" />
                <span className="font-bold text-gray-700 dark:text-white/75">{kind.label}</span>
                {(m.title || m.reference) && <span className="truncate">· {m.title || m.reference}</span>}
              </div>
              <p className="grw-letter mt-2 text-[16px] leading-[1.8] whitespace-pre-line line-clamp-6">{m.text}</p>
              <p className="mt-2 text-[11px] text-gray-400 dark:text-white/40">
                {longDate(m.date)}
                {m.kind === 'typing' && m.verse_count ? ` · ${m.verse_count}절 따라 썼어요` : ''}
              </p>
              {m.kind === 'prayer' && m.is_answered && (
                <p
                  className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold"
                  style={{ color: 'var(--grw-gold)', background: 'var(--grw-gold-soft)' }}
                >
                  <GrowthGlyph name="answered" size={13} /> 응답받은 기도예요
                </p>
              )}
            </div>
          ) : (
            <p className="pt-7 text-[13px] leading-relaxed text-gray-600 dark:text-white/65">
              기록이 쌓이면 한 달 전, 1년 전 오늘 남기신 기도와 감사를 이 자리에서 다시 만나실 수 있어요.
            </p>
          )}
          {m?.offset === 'first' && (
            <p className="mt-3 text-[13px] leading-relaxed text-gray-600 dark:text-white/65">
              기록이 쌓이면 한 달 전, 1년 전 오늘의 글도 이 자리에서 다시 만나실 수 있어요.
            </p>
          )}

          {/* 기억 고르기 — 이동 없이 제자리 전환 */}
          {memories.length > 1 && (
            <div className="mt-3.5 flex gap-1.5" role="tablist" aria-label="다시 볼 기록">
              {memories.map((it, i) => (
                <button
                  key={`${it.offset}-${it.kind}-${it.id}`}
                  type="button"
                  role="tab"
                  aria-selected={i === idx}
                  onClick={() => setIdx(i)}
                  className={`text-[12px] px-3 py-1 rounded-full border ${
                    i === idx
                      ? 'bg-[var(--brand-soft)] text-brand border-[var(--brand-soft-strong)] font-bold'
                      : 'font-medium text-gray-500 dark:text-white/55 border-gray-200 dark:border-white/[0.08]'
                  }`}
                >
                  {OFFSET_LABEL[it.offset].tab}
                </button>
              ))}
            </div>
          )}

          <WaitingPrayerBox waiting={waiting} />

          {/* 발자취에 그날이 실려 있을 때만 — 1년 전 같은 먼 날은 아직 안 불러왔다 */}
          {m && loadedDates.has(m.date) && (
            <button
              type="button"
              onClick={() => onJumpToDay(m.date)}
              className="mt-3.5 w-full text-center text-[13px] font-bold text-brand py-1"
            >
              그날의 발자취 보기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ───────────── 마음에 담아 둔 말씀 (B, 얇은 띠) ───────────── */

const heldTags = (v: HeldVerse) => {
  const tags: string[] = []
  if (v.highlight) tags.push('밑줄')
  if (v.note) tags.push('묵상 노트')
  if (v.favorite) tags.push('즐겨찾기')
  if (v.meditations > 0) tags.push(`묵상 ${v.meditations}번`)
  return tags
}

const sinceLabel = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return `${y}년 ${m}월 ${d}일에 처음 담으셨어요`
}

const MyVerseStrip = ({ verses }: { verses: HeldVerse[] }) => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [top, ...rest] = verses
  if (!top) return null
  const meta = [...heldTags(top), top.since ? sinceLabel(top.since) : null].filter(Boolean).join(' · ')

  return (
    <div className="px-4 pt-3">
      <div className={cardClass}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="w-full text-left px-4 py-3.5 flex items-start gap-3"
        >
          <span className="shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center text-brand bg-[var(--brand-soft)]">
            <GrowthGlyph name="book" size={19} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] text-gray-500 dark:text-white/50">
              마음에 담아 둔 말씀 · <b className="text-brand">{top.reference}</b>
            </span>
            <span className={`grw-letter block mt-1 text-[15px] leading-[1.65] font-bold ${open ? '' : 'line-clamp-2'}`}>
              {top.text}
            </span>
            {meta && <span className="block mt-1 text-[11px] text-gray-400 dark:text-white/40">{meta}</span>}
          </span>
          <span
            className={`material-icons-outlined text-xl text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            expand_more
          </span>
        </button>
        {open && (
          <div className="grw-fade px-4 pb-4 -mt-1">
            {rest.length > 0 && (
              <div className="divide-y divide-gray-100 dark:divide-white/[0.06] border-t border-gray-100 dark:border-white/[0.06]">
                <div className="pt-2.5 pb-1 text-[12px] font-bold text-gray-500 dark:text-white/50">함께 담아 두신 말씀</div>
                {rest.map((v) => (
                  <div key={v.reference} className="py-2.5 flex items-baseline gap-2">
                    <span className="shrink-0 min-w-[76px] text-[12px] font-bold text-ink-strong">{v.reference}</span>
                    <span className="flex-1 min-w-0 truncate text-[13px] text-gray-600 dark:text-white/65">{v.text}</span>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() =>
                navigate('/bible/photo-verse', { state: { presetVerse: { text: top.text, refLabel: top.reference } } })
              }
              className="mt-2 w-full py-2.5 rounded-full text-[14px] font-bold text-brand bg-[var(--brand-soft)] active:scale-[0.99] transition-transform"
            >
              말씀 카드로 간직하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ───────────── 묶음 ───────────── */

const GrowthRewind = ({
  loadedDates,
  onJumpToDay,
}: {
  loadedDates: Set<string>
  onJumpToDay: (date: string) => void
}) => {
  const { data, isLoading, error } = useGrowthRewind()

  // 로딩 중엔 자리만 잡는 얇은 스켈레톤 — 아래 통계 카드가 튀지 않게
  if (isLoading) {
    return (
      <div className="px-4 pt-5">
        <div className="h-60 rounded-2xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />
      </div>
    )
  }
  // 보조 카드 — 실패해도 여정 화면 자체를 막지 않는다
  if (error || !data) return null

  return (
    <>
      <RewindCard data={data} loadedDates={loadedDates} onJumpToDay={onJumpToDay} />
      <MyVerseStrip verses={data.verses} />
    </>
  )
}

export default GrowthRewind
