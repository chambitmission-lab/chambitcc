// 질문함 — PC 3단(목록 | 그때 대화 | 가르치기), 모바일은 목록 → 아래에서 올라오는 시트.
import { useMemo, useState } from 'react'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { ChatbotIntent, ChatbotUnanswered } from '../../../types/chatbot'
import { BotBubble, StatusPill, UserBubble } from './ChatbotPieces'
import { avatarJoy, avatarSorry, avatarThinking, tone } from './chatbotTheme'
import TeachPanel from './TeachPanel'
import { compact, fmtMD, splitWeakAnswer, suggestKeywords } from './chatbotAdminUtils'

interface Props {
  unanswered: ChatbotUnanswered[]
  intents: ChatbotIntent[]
  onSaved: () => void
  onResolve: (u: ChatbotUnanswered) => void
  onDelete: (u: ChatbotUnanswered) => void
}

type Filter = 'all' | 'open' | 'weak'

const isDesktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches

const QuestionDesk = ({ unanswered, intents, onSaved, onResolve, onDelete }: Props) => {
  const [filter, setFilter] = useState<Filter>('all')
  const [selId, setSelId] = useState<number | null>(null)
  const [sheet, setSheet] = useState(false)

  const waiting = useMemo(
    () =>
      unanswered
        .filter((u) => u.status !== 'resolved')
        .sort((a, b) => b.ask_count - a.ask_count || b.updated_at.localeCompare(a.updated_at)),
    [unanswered],
  )
  const list = filter === 'all' ? waiting : waiting.filter((u) => u.status === filter)
  // 가르친 직후엔 해결로 바뀌어 목록에서 빠지지만, 완료 카드를 보여 주려고 전체에서 찾는다
  const sel = unanswered.find((u) => u.id === selId) ?? list[0] ?? null
  const maxCount = Math.max(1, ...waiting.map((u) => u.ask_count))
  const openN = waiting.filter((u) => u.status === 'open').length
  const weakN = waiting.length - openN

  useModalBackButton(() => setSheet(false), sheet)

  const pick = (u: ChatbotUnanswered) => {
    setSelId(u.id)
    if (!isDesktop()) setSheet(true)
  }

  const goNext = () => {
    const next = waiting.find((u) => u.id !== sel?.id)
    if (next) setSelId(next.id)
    else {
      setSelId(null)
      setSheet(false)
    }
  }

  const similar = useMemo(() => {
    if (!sel) return []
    const keys = suggestKeywords(sel.text).map(compact)
    return unanswered
      .filter((u) => u.id !== sel.id && keys.some((k) => compact(u.text).includes(k)))
      .slice(0, 4)
  }, [sel, unanswered])

  const detail = sel && (
    <div className="flex flex-col gap-5 min-w-0 w-full">
      <div>
        <StatusPill status={sel.status} />
        <h2 className={`m-0 mt-2 text-[22px] lg:text-[26px] font-extrabold leading-snug break-words ${tone.strong}`}>
          “{sel.text}”
        </h2>
        <p className={`m-0 mt-1.5 text-[14px] ${tone.sub}`}>
          처음 {fmtMD(sel.created_at)} · 마지막 {fmtMD(sel.updated_at)} ·{' '}
          <b className={tone.body}>{sel.ask_count}번</b> 물었어요
        </p>
      </div>

      <div className={`rounded-2xl ${tone.sunk} p-4 space-y-2.5`}>
        <p className={`m-0 text-[12.5px] font-bold ${tone.sub}`}>그때 대화</p>
        <UserBubble>{sel.text}</UserBubble>
        {sel.status === 'weak' ? (
          (() => {
            const w = splitWeakAnswer(sel.answer)
            return (
              <>
                <BotBubble avatar={avatarThinking} variant="warn">
                  {w.text ?? '(답 내용이 남아 있지 않아요)'}
                </BotBubble>
                {w.reason && (
                  <p className="m-0 pl-10 text-[13px] text-amber-700 dark:text-amber-300">자신 없었던 까닭: {w.reason}</p>
                )}
              </>
            )
          })()
        ) : sel.status === 'resolved' ? (
          <BotBubble avatar={avatarJoy}>{sel.answer || '이제는 답할 수 있어요!'}</BotBubble>
        ) : (
          <BotBubble avatar={avatarSorry} variant="muted">
            음… 아직 잘 모르겠어요.
          </BotBubble>
        )}
      </div>

      {similar.length > 0 && (
        <div>
          <p className={`m-0 mb-1 text-[12.5px] font-bold ${tone.sub}`}>같은 낱말이 든 질문</p>
          {similar.map((u) => (
            <button
              key={u.id}
              onClick={() => u.status !== 'resolved' && setSelId(u.id)}
              className={`w-full text-left flex items-center gap-2 py-2 border-t ${tone.line} text-[14px] ${tone.body}`}
            >
              <span className="flex-1 truncate">“{u.text}”</span>
              <span className={`text-[12.5px] ${tone.sub}`}>
                {u.status === 'resolved' ? '해결됨' : `${u.ask_count}명`}
              </span>
            </button>
          ))}
        </div>
      )}

      {sel.status !== 'resolved' && (
        <div className="mt-auto flex gap-2 pt-1">
          <button onClick={() => onResolve(sel)} className={tone.ghostBtn}>
            {sel.status === 'weak' ? '괜찮은 답이에요' : '해결로 넘기기'}
          </button>
          <button
            onClick={() => onDelete(sel)}
            className="ml-auto rounded-xl px-4 py-2.5 text-[14px] font-semibold text-rose-500 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-400/10"
          >
            지우기
          </button>
        </div>
      )}
    </div>
  )

  const teach = sel && (
    <TeachPanel key={sel.id} intents={intents} question={sel} onSaved={onSaved} onNext={goNext} />
  )

  return (
    <>
      <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)_420px] lg:min-h-[620px]">
        {/* 목록 */}
        <div className={`lg:border-r ${tone.line} flex flex-col`}>
          <div className={`p-3 flex gap-1 border-b ${tone.line}`}>
            {(
              [
                ['all', '전체', waiting.length],
                ['open', '못 답함', openN],
                ['weak', '애매함', weakN],
              ] as const
            ).map(([k, l, n]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`flex-1 rounded-xl py-2 text-[13.5px] font-bold transition-colors ${
                  filter === k ? 'bg-gray-100 dark:bg-white/10 text-ink-strong dark:text-white' : tone.sub
                }`}
              >
                {l} <span className={k === 'weak' ? 'text-amber-600 dark:text-amber-300' : k === 'open' ? 'text-rose-500 dark:text-rose-300' : ''}>{n}</span>
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <div className="py-14 px-6 text-center">
              <img src={avatarJoy} alt="" className="mx-auto w-20 h-20 rounded-full shadow-lg" />
              <p className={`m-0 mt-3 text-[16px] font-bold ${tone.strong}`}>기다리는 질문이 없어요</p>
              <p className={`m-0 mt-1 text-[14px] ${tone.sub}`}>참비가 들어온 질문에 다 답하고 있어요</p>
            </div>
          ) : (
            <div className="lg:max-h-[640px] lg:overflow-y-auto">
              {list.map((u) => {
                const active = sel?.id === u.id
                return (
                  <button
                    key={u.id}
                    onClick={() => pick(u)}
                    className={`w-full text-left px-5 py-4 border-b ${tone.line} transition-colors ${
                      active
                        ? 'lg:bg-[var(--brand-soft)] lg:dark:bg-white/[0.07] lg:shadow-[inset_3px_0_0_var(--brand)] lg:dark:shadow-[inset_3px_0_0_#5aa2ff]'
                        : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 shrink-0 rounded-full ${u.status === 'weak' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                      <span className={`text-[15px] font-semibold truncate flex-1 ${tone.strong}`}>{u.text}</span>
                    </span>
                    <span className="mt-2 flex items-center gap-2">
                      <span className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                        <span
                          className={`block h-full rounded-full ${tone.accentBg}`}
                          style={{ width: `${(u.ask_count / maxCount) * 100}%` }}
                        />
                      </span>
                      <span className={`text-[13px] font-semibold ${tone.body}`}>{u.ask_count}명</span>
                      <span className={`text-[12.5px] ${tone.sub}`}>{fmtMD(u.updated_at)}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* PC: 그때 대화 + 가르치기 */}
        <div className="hidden lg:flex p-6">{detail}</div>
        <div className={`hidden lg:block border-l ${tone.line} p-4`}>
          {teach ?? (
            <div className={`rounded-3xl border border-dashed border-gray-300 dark:border-white/15 p-6 text-center ${tone.sub}`}>
              왼쪽에서 질문을 고르면 여기서 가르쳐요
            </div>
          )}
        </div>
      </div>

      {/* 모바일 시트 */}
      {sheet && sel && (
        <div className="lg:hidden fixed inset-0 z-[60] flex flex-col bg-black/40" onClick={() => setSheet(false)}>
          <div
            className="mt-auto max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-background-light dark:bg-[#0b1220] p-4 pb-10 space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <span className="mx-auto h-1.5 w-10 rounded-full bg-gray-300 dark:bg-white/20" />
            </div>
            <div className="flex justify-end -mt-4">
              <button onClick={() => setSheet(false)} className={`text-[14px] font-semibold ${tone.sub}`}>
                닫기
              </button>
            </div>
            {detail}
            {teach}
          </div>
        </div>
      )}
    </>
  )
}

export default QuestionDesk
