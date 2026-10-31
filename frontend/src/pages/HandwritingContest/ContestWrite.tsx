// 필사대회 참여 (/handwriting/:id/write) — ① 구절 고르기 → ② 손글씨로 쓰기 → ③ 한마디·동의 → 출품
// 쓰는 도중 나가도 이 기기에 초안(구절·획)이 남는다 — 다시 들어오면 이어 쓴다.
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useContest, useSubmitEntry } from '../../hooks/useHandwritingContest'
import { isAuthenticated } from '../../utils/auth'
import { redirectAfterLogin } from '../../utils/redirectAfterLogin'
import { safeStorage } from '../../utils/safeStorage'
import { showToast } from '../../utils/toast'
import VersePickerSheet, { type PickedVerse } from '../Bible/PhotoVerse/VersePickerSheet'
import HandwritingSheet from '../Capsule/ink/HandwritingSheet'
import InkThumb from '../Capsule/ink/InkThumb'
import { emptyInkPage, isInkPageEmpty, parseInkPageFile, toInkPageFile, type InkPage } from '../Capsule/ink/inkModel'
import { Spinner, SurveyShell } from '../Survey/surveyUi'
import { CenterNote, QuillIcon } from './contestShared'
import { errorText } from './contestFormat'
import { exportCroppedInkPng } from './inkCard'
import '../Bible/PhotoVerse/styles/verse-sheet.css'
import './contest.css'

const draftKey = (id: number) => `hw-contest-draft-${id}`
const COMMENT_MAX = 200
/** 이보다 긴 구절은 종이 한 장에 빠듯하다 — 귀띔만 한다 */
const LONG_VERSE = 260

interface Draft {
  verse: PickedVerse | null
  page: unknown
  comment: string
}

const loadDraft = (id: number): { verse: PickedVerse | null; page: InkPage; comment: string } => {
  const raw = safeStorage.getJson(draftKey(id)) as Partial<Draft> | undefined
  const verse = raw?.verse && typeof raw.verse.text === 'string' && typeof raw.verse.refLabel === 'string' ? raw.verse : null
  return {
    verse,
    page: (raw?.page ? parseInkPageFile(raw.page) : null) ?? emptyInkPage(),
    comment: typeof raw?.comment === 'string' ? raw.comment.slice(0, COMMENT_MAX) : '',
  }
}

const Step = ({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-gray-200/70 dark:border-white/[0.07] bg-white dark:bg-card-dark p-4">
    <div className="flex items-center gap-2 mb-3">
      <span
        className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[12px] font-extrabold ${
          done ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500 dark:bg-white/[0.08] dark:text-white/50'
        }`}
      >
        {n}
      </span>
      <h2 className="text-[14.5px] font-extrabold text-ink-strong tracking-[-0.02em]">{title}</h2>
    </div>
    {children}
  </section>
)

const ContestWrite = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const contestId = Number(id) || 0
  const { data: contest, isLoading } = useContest(contestId)
  const submit = useSubmitEntry(contestId)

  // 대회 화면의 '이 구절로'에서 오면 그 구절로 시작한다 — 이미 써 둔 초안 글씨가 있으면 초안을 지킨다
  const [initial] = useState(() => {
    const draft = loadDraft(contestId)
    const passed = (location.state as { verse?: PickedVerse } | null)?.verse
    const usable = passed && typeof passed.text === 'string' && typeof passed.refLabel === 'string'
    return usable && isInkPageEmpty(draft.page) ? { ...draft, verse: passed } : draft
  })
  const [verse, setVerse] = useState<PickedVerse | null>(initial.verse)
  const [pages, setPages] = useState<InkPage[]>([initial.page])
  const [comment, setComment] = useState(initial.comment)
  const [agree, setAgree] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [writing, setWriting] = useState(false)
  const [guideFolded, setGuideFolded] = useState(false)

  const page = pages[0] ?? emptyInkPage()
  const written = !isInkPageEmpty(page)

  useEffect(() => {
    if (!isAuthenticated()) {
      redirectAfterLogin.set(`/handwriting/${contestId}/write`)
      navigate('/login', { replace: true })
    }
  }, [contestId, navigate])

  // 초안 — 획은 저장 형식(좌표 반올림)으로 줄여 둔다.
  // 시트에서 쓰는 동안은 저장하지 않는다(획마다 직렬화 수십 KB) — 완료로 닫히는 순간 한 번 저장된다
  useEffect(() => {
    if (!contestId || writing) return
    const t = window.setTimeout(() => {
      safeStorage.setJson(draftKey(contestId), { verse, page: toInkPageFile(page), comment } satisfies Draft)
    }, 400)
    return () => window.clearTimeout(t)
  }, [contestId, verse, page, comment, writing])

  const goBack = () => navigate(`/handwriting/${contestId}`)
  const thumbWidth = useMemo(() => Math.min(280, typeof window !== 'undefined' ? window.innerWidth - 80 : 280), [])

  if (isLoading) {
    return (
      <SurveyShell onBack={goBack} title="필사대회 참여">
        <Spinner />
      </SurveyShell>
    )
  }
  if (!contest || contest.phase !== 'open' || contest.my_entry) {
    return (
      <SurveyShell onBack={goBack} title="필사대회 참여">
        <CenterNote
          title={contest?.my_entry ? '이미 작품을 냈어요' : '지금은 출품 기간이 아니에요'}
          hint={contest?.my_entry ? '한 대회에 한 작품씩 낼 수 있어요.\n다시 쓰려면 대회 화면에서 출품을 거둬주세요.' : undefined}
          action={
            <button type="button" onClick={goBack} className="px-5 py-2.5 rounded-2xl bg-brand text-white text-[14px] font-bold">
              대회로 돌아가기
            </button>
          }
        />
      </SurveyShell>
    )
  }

  const handlePick = (picked: PickedVerse) => {
    setVerse(picked)
    setPickerOpen(false)
  }

  const handleSubmit = async () => {
    if (!verse || !written || !agree) return
    try {
      const { png, width, height } = await exportCroppedInkPng(page)
      const ink = new Blob([JSON.stringify(toInkPageFile(page))], { type: 'application/json' })
      await submit.mutateAsync({
        verse_ref: verse.refLabel,
        verse_text: verse.text,
        comment,
        card_consent: agree,
        png,
        ink,
        width,
        height,
      })
      safeStorage.remove(draftKey(contestId))
      showToast('출품했어요! 이제 다른 성도들의 글씨에도 한 표씩 나눠 주세요', 'success')
      navigate(`/handwriting/${contestId}`, { replace: true })
    } catch (e) {
      showToast(errorText(e, '작품을 내지 못했어요'), 'error')
    }
  }

  const guide = verse ? (
    <button
      type="button"
      className={`hw-guide ${guideFolded ? 'hw-guide--folded' : ''}`}
      onClick={() => setGuideFolded((v) => !v)}
      aria-expanded={!guideFolded}
    >
      <p className="hw-guide__text">{verse.text}</p>
      <p className="hw-guide__meta">
        {verse.refLabel} · {guideFolded ? '탭해서 펼치기' : '탭해서 접기'}
      </p>
    </button>
  ) : null

  return (
    <SurveyShell onBack={goBack} title="필사대회 참여">
      <div className="px-4 pt-4 pb-6 space-y-3 lg:px-6 lg:pt-6">
        <p className="text-[13px] leading-relaxed text-ink-muted px-0.5">
          <b className="text-ink-strong">{contest.title}</b> · 마음에 닿는 구절을 골라 또박또박 손으로 써 주세요.
          펜이 있으면 펜으로, 없으면 손가락으로도 쓸 수 있어요.
        </p>

        <Step n={1} title="쓸 구절 고르기" done={!!verse}>
          {verse ? (
            <div>
              <p className="text-[13px] font-extrabold text-brand">{verse.refLabel}</p>
              <p className="mt-1 text-[14px] leading-[1.75] text-ink-strong font-['Noto_Serif_KR',serif]">{verse.text}</p>
              {verse.text.length > LONG_VERSE ? (
                <p className="mt-2 text-[12px] text-amber-600 dark:text-amber-300">
                  긴 구절이에요. 종이 한 장에 다 들어가도록 조금 작게 써 주세요.
                </p>
              ) : null}
              <button type="button" onClick={() => setPickerOpen(true)} className="mt-3 text-[12.5px] font-bold text-ink-muted underline underline-offset-2">
                다른 구절 고르기
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="w-full py-3 rounded-xl bg-[var(--brand-soft)] text-brand text-[14px] font-bold"
            >
              구절 고르기
            </button>
          )}
        </Step>

        <Step n={2} title="손글씨로 쓰기" done={written}>
          {written ? (
            <div className="flex flex-col items-center">
              <button type="button" onClick={() => setWriting(true)} aria-label="이어서 쓰기">
                <InkThumb page={page} width={thumbWidth} className="rounded-xl shadow-sm" frozen={writing} />
              </button>
              <button type="button" onClick={() => setWriting(true)} className="mt-3 text-[13px] font-bold text-brand">
                이어서 쓰기 · 고치기
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setWriting(true)}
              disabled={!verse}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--brand-soft)] text-brand text-[14px] font-bold disabled:opacity-40"
            >
              <QuillIcon size={17} />
              {verse ? '종이 펼치고 쓰기' : '구절을 먼저 골라주세요'}
            </button>
          )}
        </Step>

        <Step n={3} title="한마디 남기고 내기" done={agree}>
          <label className="block text-[12.5px] font-bold text-ink-muted mb-1.5" htmlFor="hw-comment">
            이 구절을 고른 이유 (선택)
          </label>
          <textarea
            id="hw-comment"
            value={comment}
            maxLength={COMMENT_MAX}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="요즘 저를 붙들어 준 말씀이에요"
            className="w-full resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-transparent px-3 py-2.5 text-[14px] text-ink-strong placeholder:text-gray-400 focus:outline-none focus:border-brand"
          />
          <p className="mt-1 text-right text-[11px] text-ink-muted tabular-nums">
            {comment.length}/{COMMENT_MAX}
          </p>

          <label className="mt-2 flex items-start gap-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] px-3 py-3 cursor-pointer select-none">
            <input type="checkbox" className="mt-0.5 w-4 h-4 accent-[var(--brand)] shrink-0" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span className="text-[12.5px] leading-[1.65] text-ink-muted">
              <b className="text-ink-strong">대회 참여에 동의해요 (필수)</b>
              <br />내 글씨가 이름과 함께 갤러리에 공개되고, 입상하면 성도들이 내 글씨로 말씀카드를 만들어 나눌 수 있어요.
              말씀카드 허용은 나중에 대회 화면에서 끌 수 있어요.
            </span>
          </label>
        </Step>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!verse || !written || !agree || submit.isPending}
          className="relative w-full py-3.5 rounded-2xl bg-brand text-white text-[15px] font-bold disabled:opacity-40 seal-chip [--seal-radius:1rem]"
        >
          {submit.isPending ? '내는 중…' : '출품하기'}
        </button>
        <p className="text-center text-[11.5px] text-ink-muted">한 대회에 한 작품만 낼 수 있어요. 다시 쓰려면 출품을 거둔 뒤 새로 내면 돼요.</p>
      </div>

      {pickerOpen ? <VersePickerSheet onPick={handlePick} onClose={() => setPickerOpen(false)} /> : null}
      {writing && verse ? (
        <HandwritingSheet
          pages={pages}
          onChange={setPages}
          onClose={() => setWriting(false)}
          eyebrow="참빛 손글씨 필사대회"
          heading={verse.refLabel}
          guide={guide}
          maxPages={1}
          writtenHint={() => '다 썼으면 완료를 눌러 주세요 · 쓴 글씨는 이 기기에 임시 저장돼요'}
        />
      ) : null}
    </SurveyShell>
  )
}

export default ContestWrite
