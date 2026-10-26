// 손글씨 말씀카드 (/handwriting/:id/card/:entryId)
// 입상작(작성자 동의)이나 내 작품의 획을 감성 배경 위에 배경에 맞는 잉크색으로 다시 써서 카드로 만든다.
// 남의 글씨로 만든 카드에는 작성자·수상 표기를 늘 남긴다(내 글씨면 끌 수 있다).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useContest, useContestEntry, useContestEntryInk } from '../../hooks/useHandwritingContest'
import { showToast } from '../../utils/toast'
import { BACKGROUNDS, backgroundCss } from '../Bible/PhotoVerse/canvas/backgrounds'
import { shareOrDownload } from '../Bible/Typing/dailyCard'
import { parseInkPageFile } from '../Capsule/ink/inkModel'
import { Spinner, SurveyShell } from '../Survey/surveyUi'
import { CenterNote } from './contestShared'
import { RANK_META, errorText } from './contestFormat'
import { CARD_RATIOS, canvasToPng, drawInkCard, ensureInkCardFonts, type CardRatio } from './inkCard'
import './contest.css'

/** 손글씨가 잘 보이는 배경부터 — 종이·한지·별밤·새벽… */
const BG_ORDER = ['cream', 'hanji', 'midnight', 'dawn', 'sage', 'rose', 'sea', 'ink', 'sunset', 'bokeh', 'lavender']
const CARD_BGS = BG_ORDER.map((id) => BACKGROUNDS.find((b) => b.id === id)).filter((b): b is (typeof BACKGROUNDS)[number] => !!b)

const ContestCard = () => {
  const navigate = useNavigate()
  const params = useParams<{ id: string; entryId: string }>()
  const contestId = Number(params.id) || 0
  const entryId = Number(params.entryId) || 0
  const { data: contest } = useContest(contestId)
  const { data: entry, isLoading, error } = useContestEntry(contestId, entryId)
  const allowed = !!entry?.can_make_card
  const ink = useContestEntryInk(contestId, entryId, allowed && !!entry?.has_ink)
  const page = useMemo(() => (ink.data ? parseInkPageFile(ink.data) : null), [ink.data])

  const [bgId, setBgId] = useState(CARD_BGS[0].id)
  const [ratio, setRatio] = useState<CardRatio>('4:5')
  const [showCredit, setShowCredit] = useState(true)
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const bg = CARD_BGS.find((b) => b.id === bgId) ?? CARD_BGS[0]
  const creditLocked = !!entry && !entry.is_mine
  const credit = useMemo(() => {
    if (!entry || !contest) return null
    if (!showCredit && !creditLocked) return null
    const rank = entry.rank ? ` · ${RANK_META[entry.rank]?.label}` : ''
    return `${contest.title}${rank} · ${entry.author.name}`
  }, [entry, contest, showCredit, creditLocked])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !page || !entry) return
    let cancelled = false
    ;(async () => {
      await ensureInkCardFonts(`${entry.verse_ref}${credit ?? ''}`)
      if (cancelled) return
      await drawInkCard(canvas, { page, bg, ratio, verseRef: entry.verse_ref, credit })
    })().catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [page, entry, bg, ratio, credit])

  const goBack = () => navigate(`/handwriting/${contestId}`)

  const save = async () => {
    const canvas = canvasRef.current
    if (!canvas || !entry) return
    setBusy(true)
    try {
      const blob = await canvasToPng(canvas)
      const result = await shareOrDownload(blob, `참빛-손글씨-${entry.verse_ref.replace(/\s+/g, '')}.png`, `${entry.verse_ref} — ${entry.verse_text}`)
      if (result === 'downloaded') showToast('말씀카드를 저장했어요', 'success')
    } catch (e) {
      showToast(errorText(e, '카드를 만들지 못했어요'), 'error')
    } finally {
      setBusy(false)
    }
  }

  if (isLoading) {
    return (
      <SurveyShell onBack={goBack} title="손글씨 말씀카드">
        <Spinner />
      </SurveyShell>
    )
  }
  if (!entry || !allowed) {
    return (
      <SurveyShell onBack={goBack} title="손글씨 말씀카드">
        <CenterNote
          title={entry ? '이 글씨로는 카드를 만들 수 없어요' : '작품을 찾을 수 없어요'}
          hint={entry ? '말씀카드는 내 작품, 또는 작성자가 동의한 입상작으로 만들 수 있어요.' : errorText(error, '')}
        />
      </SurveyShell>
    )
  }

  const spec = CARD_RATIOS.find((r) => r.id === ratio) ?? CARD_RATIOS[0]

  return (
    <SurveyShell onBack={goBack} title="손글씨 말씀카드">
      <div className="px-4 pt-4 pb-8 lg:px-6 lg:pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6 lg:items-start">
        <div className="flex justify-center">
          {!entry.has_ink || ink.isError ? (
            <CenterNote title="글씨 데이터를 불러오지 못했어요" hint="잠시 후 다시 시도해주세요" />
          ) : !page ? (
            <Spinner />
          ) : (
            <canvas
              ref={canvasRef}
              className="w-full rounded-2xl shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)]"
              style={{ maxWidth: ratio === '9:16' ? 320 : 440, aspectRatio: `${spec.w} / ${spec.h}` }}
              aria-label={`${entry.verse_ref} 손글씨 말씀카드 미리보기`}
            />
          )}
        </div>

        <div className="mt-5 lg:mt-0 space-y-5">
          <div>
            <p className="text-[12.5px] font-bold text-ink-muted mb-2">배경</p>
            <div className="flex flex-wrap gap-2">
              {CARD_BGS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBgId(b.id)}
                  aria-pressed={bgId === b.id}
                  aria-label={b.nameKo}
                  title={b.nameKo}
                  className={`w-10 h-10 rounded-full transition-transform ${bgId === b.id ? 'ring-2 ring-brand ring-offset-2 ring-offset-white dark:ring-offset-[#121212] scale-105' : ''}`}
                  style={{ background: backgroundCss(b) }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[12.5px] font-bold text-ink-muted mb-2">비율</p>
            <div className="flex gap-1.5">
              {CARD_RATIOS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRatio(r.id)}
                  aria-pressed={ratio === r.id}
                  className={`flex-1 py-2 rounded-xl text-[12.5px] font-bold border transition-colors ${
                    ratio === r.id
                      ? 'border-brand bg-[var(--brand-soft)] text-brand'
                      : 'border-gray-200 dark:border-white/10 text-ink-muted'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <label className={`flex items-center gap-2 text-[13px] text-ink-muted select-none ${creditLocked ? 'opacity-70' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              className="w-4 h-4 accent-[var(--brand)]"
              checked={creditLocked || showCredit}
              disabled={creditLocked}
              onChange={(e) => setShowCredit(e.target.checked)}
            />
            대회·작성자 표기 넣기
            {creditLocked ? <span className="text-[11.5px]">(다른 성도의 글씨는 늘 표기해요)</span> : null}
          </label>

          <button
            type="button"
            onClick={save}
            disabled={busy || !page}
            className="relative w-full py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold disabled:opacity-40 seal-chip [--seal-radius:1rem]"
          >
            {busy ? '만드는 중…' : '저장 · 공유하기'}
          </button>
          <p className="text-[12px] leading-relaxed text-ink-muted">
            {entry.author.name}님이 손으로 쓴 <b className="text-ink-strong">{entry.verse_ref}</b> 말씀이에요. 카드는 내 기기에서 만들어져요.
          </p>
        </div>
      </div>
    </SurveyShell>
  )
}

export default ContestCard
