// 아는 말 — 인텐트 사전 표 + 오른쪽 살펴보기(미리보기·고치기). 위에는 "참비에게 물어보기" 맞춰보기 창.
import { useMemo, useState, type ReactNode } from 'react'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { ChatbotIntent } from '../../../types/chatbot'
import { BotBubble, KeyChip, Switch, UserBubble } from './ChatbotPieces'
import { avatarSorry, avatarTalking, avatarThinking, tone } from './chatbotTheme'
import TeachPanel from './TeachPanel'
import { compact, matchIntent } from './chatbotAdminUtils'

interface Props {
  intents: ChatbotIntent[]
  onSaved: () => void
  onToggle: (it: ChatbotIntent) => void
  onDelete: (it: ChatbotIntent) => void
}

type Pane = { kind: 'view'; id: number } | { kind: 'edit'; id: number } | { kind: 'new' } | null

const isDesktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches

const KnownWords = ({ intents, onSaved, onToggle, onDelete }: Props) => {
  const [pane, setPane] = useState<Pane>(intents[0] ? { kind: 'view', id: intents[0].id } : null)
  const [sheet, setSheet] = useState(false)
  const [ask, setAsk] = useState('')
  const result = useMemo(() => (ask.trim() ? matchIntent(intents, ask) : null), [intents, ask])
  const hitId = result?.kind === 'hit' ? result.intent.id : null

  useModalBackButton(() => setSheet(false), sheet)

  const open = (p: Pane) => {
    setPane(p)
    if (!isDesktop()) setSheet(true)
  }

  const cur = pane && pane.kind !== 'new' ? intents.find((i) => i.id === pane.id) ?? null : null

  const inspector: ReactNode =
    pane?.kind === 'new' ? (
      <TeachPanel
        key="new"
        intents={intents}
        onSaved={() => {
          onSaved()
          setPane(null)
          setSheet(false)
        }}
        onClose={() => {
          setPane(null)
          setSheet(false)
        }}
      />
    ) : pane?.kind === 'edit' && cur ? (
      <TeachPanel
        key={`edit-${cur.id}`}
        intents={intents}
        intent={cur}
        onSaved={() => {
          onSaved()
          setPane({ kind: 'view', id: cur.id })
        }}
        onClose={() => setPane({ kind: 'view', id: cur.id })}
      />
    ) : cur ? (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`m-0 text-[12.5px] font-bold ${tone.sub}`}>살펴보기</p>
            <p className={`m-0 mt-1 text-[22px] font-extrabold break-words ${tone.strong}`}>{cur.name}</p>
            <p className={`m-0 text-[13.5px] ${cur.is_active ? 'text-emerald-600 dark:text-emerald-300' : tone.sub}`}>
              {cur.is_active ? '● 켜져 있어요 — 지금 답하는 중' : '○ 꺼져 있어요 — 답하지 않아요'}
            </p>
          </div>
          <Switch on={cur.is_active} onClick={() => onToggle(cur)} label={`${cur.name} 켜기/끄기`} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cur.keywords.map((k) => (
            <KeyChip key={k}>{k}</KeyChip>
          ))}
        </div>
        <div className={`rounded-2xl ${tone.sunk} p-3.5 space-y-2`}>
          <p className={`m-0 text-[12.5px] font-bold ${tone.sub}`}>성도에게는 이렇게 보여요</p>
          <UserBubble>{ask.trim() && hitId === cur.id ? ask : `${cur.keywords[0] ?? cur.name} 알려 주세요`}</UserBubble>
          <BotBubble avatar={avatarTalking}>{cur.answer}</BotBubble>
          {cur.actions.length > 0 && (
            <div className="pl-10 flex flex-wrap gap-1.5">
              {cur.actions.map((a, i) => (
                <span
                  key={i}
                  title={a.value}
                  className="rounded-full border border-brand dark:border-[#5aa2ff] text-brand dark:text-[#8fc0ff] px-3 py-1 text-[12.5px] font-semibold"
                >
                  {a.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPane({ kind: 'edit', id: cur.id })} className={`${tone.primaryBtn} flex-1 py-3 text-[15px]`}>
            고치기
          </button>
          <button
            onClick={() => onDelete(cur)}
            className="rounded-2xl px-4 text-[14px] font-semibold text-rose-500 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-400/10"
          >
            지우기
          </button>
        </div>
      </div>
    ) : (
      <div className={`rounded-3xl border border-dashed border-gray-300 dark:border-white/15 p-6 text-center ${tone.sub}`}>
        왼쪽에서 말을 고르면 여기서 살펴보고 고쳐요
      </div>
    )

  return (
    <>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:min-h-[620px]">
        <div className={`lg:border-r ${tone.line} min-w-0`}>
          {/* 맞춰보기 */}
          <div className={`p-4 lg:p-5 border-b ${tone.line}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[15px] font-bold ${tone.strong}`}>참비에게 물어보기</span>
              <span className={`text-[12.5px] ${tone.sub}`}>성도처럼 물어보면 어느 답이 나갈지 맞춰 봐요</span>
            </div>
            <div className="flex gap-2">
              <input
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                placeholder="예) 주일에 차 어디 세워요?"
                className={tone.input}
              />
              <button onClick={() => open({ kind: 'new' })} className={`${tone.primaryBtn} shrink-0 px-4 text-[14.5px]`}>
                + 새 말
              </button>
            </div>
            {result && (
              <div className="mt-2.5 flex items-center gap-2 text-[14px]">
                <img
                  src={result.kind === 'hit' ? avatarTalking : result.kind === 'tie' ? avatarThinking : avatarSorry}
                  alt=""
                  className="w-7 h-7 rounded-full"
                />
                {result.kind === 'hit' ? (
                  <span className={tone.body}>
                    <b className={tone.accentText}>{result.intent.name}</b> 답이 나가요 (
                    {result.keys.map((k) => `‘${k}’`).join(', ')})
                  </span>
                ) : result.kind === 'tie' ? (
                  <span className="text-amber-700 dark:text-amber-300">두 답이 똑같이 걸려서 참비가 답하지 않아요 — 키워드를 더 구체적으로</span>
                ) : (
                  <span className={tone.sub}>여기 등록된 답은 없어요 (예배·말씀 같은 기본 안내가 답할 수는 있어요)</span>
                )}
              </div>
            )}
          </div>

          {intents.length === 0 ? (
            <p className={`m-0 py-14 text-center text-[15px] ${tone.sub}`}>
              아직 가르친 말이 없어요.
              <br />
              질문함에서 ‘참비에게 알려 주기’로 시작해 보세요.
            </p>
          ) : (
            <>
              <div
                className={`hidden lg:grid grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_64px_52px] gap-4 px-5 py-3 text-[12.5px] font-bold ${tone.sub} border-b ${tone.line}`}
              >
                <span>이름</span>
                <span>이런 말에 답해요</span>
                <span>버튼</span>
                <span>켜짐</span>
              </div>
              <div className="lg:max-h-[560px] lg:overflow-y-auto">
                {intents.map((it) => {
                  const selected = cur?.id === it.id
                  const hit = hitId === it.id
                  const matched = hit && result?.kind === 'hit' ? result.keys.map(compact) : []
                  return (
                    <div
                      key={it.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => open({ kind: 'view', id: it.id })}
                      onKeyDown={(e) => e.key === 'Enter' && open({ kind: 'view', id: it.id })}
                      className={`cursor-pointer px-5 py-4 border-b ${tone.line} lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_64px_52px] lg:gap-4 lg:items-center transition-colors ${
                        hit
                          ? 'bg-emerald-50 dark:bg-emerald-400/[0.08] shadow-[inset_3px_0_0_#34d399]'
                          : selected
                            ? 'lg:bg-[var(--brand-soft)] lg:dark:bg-white/[0.07] lg:shadow-[inset_3px_0_0_var(--brand)] lg:dark:shadow-[inset_3px_0_0_#5aa2ff]'
                            : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                      } ${it.is_active ? '' : 'opacity-55'}`}
                    >
                      <div className="flex items-center justify-between gap-3 lg:block">
                        <span className={`text-[15.5px] font-bold truncate ${tone.strong}`}>{it.name}</span>
                        <span className="lg:hidden">
                          <Switch on={it.is_active} onClick={() => onToggle(it)} label={`${it.name} 켜기/끄기`} />
                        </span>
                      </div>
                      <div className="mt-2 lg:!mt-0 flex flex-wrap gap-1">
                        {it.keywords.map((k) =>
                          matched.includes(compact(k)) ? (
                            <span key={k} className="rounded-full bg-emerald-500 text-white px-2.5 py-0.5 text-[12.5px] font-semibold">
                              {k}
                            </span>
                          ) : (
                            <KeyChip key={k}>{k}</KeyChip>
                          ),
                        )}
                      </div>
                      <span className={`hidden lg:block text-[13.5px] ${tone.sub}`}>
                        {it.actions.length ? `${it.actions.length}개` : '—'}
                      </span>
                      <span className="hidden lg:block">
                        <Switch on={it.is_active} onClick={() => onToggle(it)} label={`${it.name} 켜기/끄기`} />
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className="hidden lg:block p-5">{inspector}</div>
      </div>

      {sheet && pane && (
        <div className="lg:hidden fixed inset-0 z-[60] flex flex-col bg-black/40" onClick={() => setSheet(false)}>
          <div
            className="mt-auto max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-background-light dark:bg-[#0b1220] p-4 pb-10 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-3">
              <span className="mx-auto h-1.5 w-10 rounded-full bg-gray-300 dark:bg-white/20" />
            </div>
            {inspector}
          </div>
        </div>
      )}
    </>
  )
}

export default KnownWords
