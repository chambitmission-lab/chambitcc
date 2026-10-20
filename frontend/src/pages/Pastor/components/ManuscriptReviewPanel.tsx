// AI 원고 점검 — 원고 쓰기 화면 오른쪽 단 (ManuscriptEditor)
//   서버가 ① 원고 속 “말씀” (책 장:절) 인용을 개역개정과 글자로 대조하고(규칙) ② AI 가 본문 해석·교리·복음의 자리·
//   사실 확인·쉬운 말을 '지적만' 한다. 원고는 고치지 않는다. 지적마다 원고 조각이 붙어 있어 누르면 그 자리로 간다.
//   원고가 바뀌면 결과가 낡았다고 알린다. '확인함'은 이 화면에서만 기억한다.
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { reviewOutline, type OutlineSection, type ReviewFinding, type ReviewKind, type SermonReview } from '../../../api/pastor'
import { showToast } from '../../../utils/toast'

const KIND_META: Record<ReviewKind, { label: string; icon: string; tone: string }> = {
  scripture: { label: '말씀 인용', icon: 'menu_book', tone: 'text-brand' },
  text: { label: '본문 해석', icon: 'travel_explore', tone: 'text-violet-600 dark:text-violet-300' },
  theology: { label: '교리 확인', icon: 'shield', tone: 'text-rose-600 dark:text-rose-300' },
  gospel: { label: '복음의 자리', icon: 'auto_awesome', tone: 'text-amber-600 dark:text-amber-300' },
  fact: { label: '사실 확인', icon: 'fact_check', tone: 'text-emerald-700 dark:text-emerald-300' },
  clarity: { label: '쉬운 말', icon: 'record_voice_over', tone: 'text-gray-600 dark:text-white/65' },
}

const signatureOf = (sections: OutlineSection[]) => sections.map(s => `${s.id}:${(s.manuscript ?? '').length}:${(s.manuscript ?? '').slice(-40)}`).join('|')

/** 원고 칸으로 가서 그 조각을 골라 둔다 */
const jumpTo = (sectionId: string | null, quote: string) => {
  if (!sectionId) return
  const box = document.getElementById(`ms-${sectionId}`)
  box?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const ta = box?.querySelector('textarea')
  if (!ta || !quote) return
  const needle = quote.replace(/…$/, '')
  const at = ta.value.indexOf(needle)
  if (at < 0) return
  window.setTimeout(() => {
    ta.focus({ preventScroll: true })
    ta.setSelectionRange(at, at + needle.length)
  }, 350)
}

const ManuscriptReviewPanel = ({
  outlineId,
  sections,
  flush,
}: {
  outlineId: number
  sections: OutlineSection[]
  /** 점검 전에 입력 중인 원고를 먼저 저장 — 서버는 저장된 원고를 읽는다 */
  flush?: () => Promise<unknown>
}) => {
  const [result, setResult] = useState<{ data: SermonReview; sig: string } | null>(null)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const review = useMutation({
    mutationFn: async () => {
      await flush?.()
      return { data: await reviewOutline(outlineId), sig: signatureOf(sections) }
    },
    onSuccess: r => {
      setResult(r)
      setChecked(new Set())
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })
  const labels = Object.fromEntries(sections.map(s => [s.id, s.label]))
  const stale = result && result.sig !== signatureOf(sections)

  const toggle = (key: string) =>
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const all: ReviewFinding[] = result ? [...result.data.scripture, ...result.data.findings] : []

  return (
    <div id="ms-review" className="scroll-mt-24 rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="flex items-center gap-1.5 text-[13.5px] lg:text-[15px] font-bold text-ink-strong">
          <span className="material-icons-outlined text-[18px] text-brand">rate_review</span>
          AI 원고 점검
        </h2>
        <span className="text-[12px] text-gray-500 dark:text-white/50">지적만 · 원고는 그대로</span>
      </div>

      {!result ? (
        <div className="space-y-2.5">
          <p className="text-[12.5px] lg:text-[13.5px] leading-relaxed text-gray-600 dark:text-white/65">
            인용한 말씀을 개역개정과 대조하고, 본문 해석·교리(개혁주의)·복음의 자리·사실 확인이 필요한 예화와 통계·어려운 말을 짚어 드립니다.
          </p>
          <button
            type="button"
            disabled={review.isPending}
            onClick={() => review.mutate()}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand text-white text-[14px] font-bold disabled:opacity-60"
          >
            <span className={`material-icons-outlined text-[18px] ${review.isPending ? 'animate-spin' : ''}`}>
              {review.isPending ? 'autorenew' : 'rate_review'}
            </span>
            {review.isPending ? '원고를 읽는 중… (30초쯤)' : '원고 점검 받기'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {stale && (
            <p className="rounded-lg px-2.5 py-1.5 bg-gray-100 dark:bg-white/[0.06] text-[12px] lg:text-[13px] text-gray-600 dark:text-white/65">
              점검 뒤 원고가 바뀌었습니다. 다시 점검하면 새 원고로 봅니다.
            </p>
          )}
          <p className="flex items-center gap-1.5 text-[12.5px] lg:text-[13.5px] font-semibold text-ink-strong">
            <span className="material-icons-outlined text-[17px] text-brand">menu_book</span>
            {result.data.quotes_checked === 0
              ? '“말씀” (책 장:절) 꼴의 인용이 없어 대조하지 않았습니다'
              : result.data.scripture.length === 0
                ? `인용한 말씀 ${result.data.quotes_checked}곳 — 모두 개역개정과 같습니다`
                : `인용한 말씀 ${result.data.quotes_checked}곳 중 ${result.data.scripture.length}곳 확인 필요`}
          </p>

          {all.length === 0 ? (
            <p className="text-[12.5px] lg:text-[13.5px] text-gray-600 dark:text-white/60">짚을 곳을 찾지 못했습니다.</p>
          ) : (
            <ul className="space-y-2">
              {all.map((f, i) => {
                const key = `${f.kind}-${f.id ?? i}-${f.quote}`
                const meta = KIND_META[f.kind]
                const done = checked.has(key)
                return (
                  <li
                    key={key}
                    className={`rounded-xl px-3 py-2.5 border ${
                      done ? 'opacity-50 border-gray-100 dark:border-white/[0.05]' : 'bg-gray-50 dark:bg-white/[0.03] border-gray-100 dark:border-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`material-icons-outlined text-[16px] ${meta.tone}`}>{meta.icon}</span>
                      <span className={`shrink-0 whitespace-nowrap text-[12px] lg:text-[13px] font-bold ${meta.tone}`}>{meta.label}</span>
                      {f.section && labels[f.section] && (
                        <span className="min-w-0 truncate text-[11.5px] lg:text-[12.5px] text-gray-500 dark:text-white/50">· {labels[f.section]}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        aria-pressed={done}
                        className="ml-auto shrink-0 whitespace-nowrap inline-flex items-center gap-0.5 text-[11.5px] lg:text-[12.5px] font-bold text-gray-500 dark:text-white/50 hover:text-brand"
                      >
                        <span className="material-icons-outlined text-[15px]">{done ? 'check_box' : 'check_box_outline_blank'}</span>
                        확인함
                      </button>
                    </div>
                    {f.quote && (
                      <button
                        type="button"
                        onClick={() => jumpTo(f.section, f.quote)}
                        title="원고에서 이 자리로 가기"
                        className="mt-1 block w-full text-left text-[12.5px] lg:text-[13.5px] leading-relaxed text-gray-700 dark:text-white/75 underline decoration-dotted underline-offset-4 decoration-gray-300 hover:decoration-brand"
                      >
                        {f.quote.startsWith('“') ? f.quote : `“${f.quote}”`}
                      </button>
                    )}
                    <p className="mt-1 text-[12.5px] lg:text-[13.5px] leading-relaxed text-gray-600 dark:text-white/65">{f.comment}</p>
                    {f.expected && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-[12px] lg:text-[13px] font-bold text-brand">개역개정 본문 보기</summary>
                        <p className="mt-1 text-[12.5px] lg:text-[13.5px] leading-relaxed text-gray-700 dark:text-white/75">{f.expected}</p>
                      </details>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {(result.data.gospel_note || result.data.strengths.length > 0) && (
            <div className="rounded-xl px-3 py-2.5 bg-[var(--brand-soft)] space-y-1">
              {result.data.gospel_note && (
                <p className="text-[12.5px] lg:text-[13.5px] leading-relaxed text-ink-strong">
                  <b className="mr-1">복음의 흐름</b>
                  {result.data.gospel_note}
                </p>
              )}
              {result.data.strengths.map(t => (
                <p key={t} className="text-[12.5px] lg:text-[13.5px] leading-relaxed text-gray-700 dark:text-white/75">
                  <b className="mr-1 text-brand">잘된 점</b>
                  {t}
                </p>
              ))}
            </div>
          )}
          {result.data.filtered > 0 && (
            <p className="text-[12px] text-amber-800 dark:text-amber-300">이단 표현이 섞인 지적 {result.data.filtered}개는 자동으로 뺐습니다.</p>
          )}

          <div className="flex items-center gap-2">
            <p className="flex-1 text-[11.5px] lg:text-[12.5px] leading-relaxed text-gray-500 dark:text-white/50">
              AI 의견은 참고용입니다. 판단은 목사님께 있습니다.
            </p>
            <button
              type="button"
              disabled={review.isPending}
              onClick={() => review.mutate()}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10 text-[12.5px] font-bold text-gray-600 dark:text-white/65 hover:text-brand disabled:opacity-40"
            >
              <span className={`material-icons-outlined text-[16px] ${review.isPending ? 'animate-spin' : ''}`}>refresh</span>
              {review.isPending ? '점검 중…' : '다시 점검'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManuscriptReviewPanel
