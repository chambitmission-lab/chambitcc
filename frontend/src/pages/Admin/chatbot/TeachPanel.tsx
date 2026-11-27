// 참비 가르치기 — 미답변 질문을 새 답으로 만들거나 기존 답에 키워드만 붙인다.
// 질문 없이 열면 "새 말", intent 를 넘기면 그 답 고치기. 저장 뒤 서버 반영은 부모가 다시 불러온다.
import { useMemo, useState, type KeyboardEvent } from 'react'
import { showToast } from '../../../utils/toast'
import {
  createChatbotIntent,
  updateChatbotIntent,
  updateChatbotUnanswered,
} from '../../../api/chatbot'
import type { ChatAction, ChatbotIntent, ChatbotUnanswered } from '../../../types/chatbot'
import { Avatar, BotBubble, UserBubble } from './ChatbotPieces'
import { avatarJoy, avatarThinking, avatarTalking, tone } from './chatbotTheme'
import { VAGUE_WORDS, compact, keywordConflict, suggestKeywords } from './chatbotAdminUtils'

interface Props {
  intents: ChatbotIntent[]
  question?: ChatbotUnanswered | null
  intent?: ChatbotIntent | null
  onSaved: () => void
  onNext?: () => void
  onClose?: () => void
}

type Mode = 'new' | 'attach'

const TeachPanel = ({ intents, question, intent, onSaved, onNext, onClose }: Props) => {
  const editing = !!intent
  const [mode, setMode] = useState<Mode>('new')
  const [name, setName] = useState(intent?.name ?? (question ? question.text.slice(0, 40) : ''))
  const [keys, setKeys] = useState<string[]>(
    intent?.keywords ?? (question ? suggestKeywords(question.text).slice(0, 2) : []),
  )
  const [draft, setDraft] = useState('')
  const [answer, setAnswer] = useState(intent?.answer ?? '')
  const [actions, setActions] = useState<ChatAction[]>(intent?.actions ?? [])
  const [active, setActive] = useState(intent?.is_active ?? true)
  const [target, setTarget] = useState<number | null>(intents[0]?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const targetIntent = intents.find((i) => i.id === target) ?? null
  const exceptId = editing ? intent!.id : mode === 'attach' ? target : null
  const suggestions = useMemo(
    () => (question ? suggestKeywords(question.text).filter((s) => !keys.some((k) => compact(k) === compact(s))) : []),
    [question, keys],
  )

  const addKey = (raw: string) => {
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (!parts.length) return
    setKeys((prev) => [...prev, ...parts.filter((p) => !prev.some((k) => compact(k) === compact(p)))])
    setDraft('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addKey(draft)
    } else if (e.key === 'Backspace' && !draft && keys.length) {
      setKeys(keys.slice(0, -1))
    }
  }

  const warnings = keys
    .map((k) => {
      if (VAGUE_WORDS.includes(compact(k)) || compact(k).length < 2)
        return { k, text: `‘${k}’는 아무 질문에나 들어가는 말이라 엉뚱한 답이 나갈 수 있어요` }
      const c = keywordConflict(intents, k, exceptId)
      return c ? { k, text: `‘${k}’는 이미 ‘${c.name}’이 쓰고 있어요 — 같은 질문에 둘이 걸리면 참비가 답하지 않아요` } : null
    })
    .filter(Boolean) as { k: string; text: string }[]

  const save = async () => {
    const allKeys = draft.trim() ? [...keys, draft.trim()] : keys
    if (allKeys.length === 0) return showToast('키워드를 하나 이상 넣어 주세요', 'error')
    setSaving(true)
    try {
      if (!editing && mode === 'attach') {
        if (!targetIntent) return showToast('붙일 답을 골라 주세요', 'error')
        const merged = [...targetIntent.keywords]
        allKeys.forEach((k) => {
          if (!merged.some((m) => compact(m) === compact(k))) merged.push(k)
        })
        await updateChatbotIntent(targetIntent.id, { keywords: merged })
        if (question)
          await updateChatbotUnanswered(question.id, { status: 'resolved', answer: targetIntent.answer }).catch(() => undefined)
      } else {
        if (!name.trim() || !answer.trim()) return showToast('이름과 답변을 적어 주세요', 'error')
        const payload = {
          name: name.trim(),
          keywords: allKeys,
          answer: answer.trim(),
          actions: actions.filter((a) => a.label.trim() && a.value.trim()),
          is_active: active,
          order: intent?.order ?? 0,
        }
        if (editing) {
          await updateChatbotIntent(intent!.id, payload)
        } else {
          await createChatbotIntent(payload)
          if (question)
            await updateChatbotUnanswered(question.id, { status: 'resolved', answer: payload.answer }).catch(() => undefined)
        }
      }
      if (question) setDone(true)
      else showToast(editing ? '답을 고쳤어요' : '참비가 새 말을 배웠어요', 'success')
      onSaved()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '저장에 실패했습니다', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (done && question)
    return (
      <div className={`rounded-3xl ${tone.panel} p-6 text-center shadow-xl`}>
        <img src={avatarJoy} alt="" className="mx-auto w-24 h-24 rounded-full shadow-xl" />
        <p className={`m-0 mt-4 text-[21px] font-extrabold ${tone.strong}`}>참비가 배웠어요!</p>
        <p className={`m-0 mt-1.5 text-[15px] ${tone.body}`}>
          “{question.text}”
          <br />
          이렇게 물은 <b className={tone.accentText}>{question.ask_count}명</b>이 다음부터 바로 답을 받아요
        </p>
        {onNext && (
          <button onClick={onNext} className={`${tone.primaryBtn} mt-5 w-full py-3.5 text-[15px]`}>
            다음 질문 보기 →
          </button>
        )}
      </div>
    )

  const previewAnswer = !editing && mode === 'attach' ? targetIntent?.answer : answer
  const previewActions = !editing && mode === 'attach' ? targetIntent?.actions ?? [] : actions

  return (
    <div className={`rounded-3xl ${tone.panel} shadow-xl overflow-hidden`}>
      <div className="px-5 pt-5">
        <div className="flex items-center gap-3">
          <Avatar src={avatarThinking} size={42} />
          <div className="min-w-0 flex-1">
            <p className={`m-0 text-[17px] font-bold ${tone.strong}`}>
              {editing ? '답 고치기' : question ? '참비 가르치기' : '새 말 가르치기'}
            </p>
            <p className={`m-0 text-[13.5px] ${tone.sub} truncate`}>
              {question ? (
                <>
                  <b className="text-amber-600 dark:text-amber-300">{question.ask_count}명</b>이 이 답을 기다려요
                </>
              ) : editing ? (
                intent!.name
              ) : (
                '성도들이 물을 만한 말을 미리 알려 주세요'
              )}
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className={`text-[14px] font-semibold ${tone.sub} hover:text-ink-strong`}>
              닫기
            </button>
          )}
        </div>
        {!editing && intents.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl p-1 bg-gray-100 dark:bg-white/[0.06]">
            {(
              [
                ['new', '새 답 만들기'],
                ['attach', '기존 답에 붙이기'],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setMode(k)}
                className={`rounded-xl py-2 text-[14px] font-bold transition-colors ${
                  mode === k ? 'bg-white dark:bg-white/15 text-ink-strong dark:text-white shadow-sm' : tone.sub
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {!editing && mode === 'attach' && (
          <label className="block">
            <span className={`block mb-1.5 text-[13.5px] font-bold ${tone.strong}`}>어느 답에 붙일까요</span>
            <select value={target ?? ''} onChange={(e) => setTarget(Number(e.target.value))} className={tone.input}>
              {intents.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                  {i.is_active ? '' : ' (꺼짐)'}
                </option>
              ))}
            </select>
          </label>
        )}

        {(editing || mode === 'new') && (
          <label className="block">
            <span className={`block mb-1.5 text-[13.5px] font-bold ${tone.strong}`}>이름 (관리용)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예) 주차 안내" className={tone.input} />
          </label>
        )}

        <div>
          <p className={`m-0 mb-1.5 text-[13.5px] font-bold ${tone.strong}`}>
            {mode === 'attach' && !editing ? '이런 말도 알아듣게' : '이런 말이 들어오면'}
          </p>
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-2 min-h-[46px] focus-within:border-brand dark:focus-within:border-[#5aa2ff]">
            {keys.map((k) => {
              const bad = warnings.some((w) => w.k === k)
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKeys(keys.filter((x) => x !== k))}
                  aria-label={`${k} 빼기`}
                  className={`rounded-full px-3 py-1 text-[13.5px] font-semibold ${
                    bad ? 'bg-amber-400 text-amber-950' : 'bg-brand dark:bg-[#5aa2ff] text-white dark:text-[#0b1220]'
                  }`}
                >
                  {k} ✕
                </button>
              )
            })}
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => draft.trim() && addKey(draft)}
              placeholder={keys.length ? '더 넣기' : '키워드 입력 후 Enter'}
              className="flex-1 min-w-[120px] bg-transparent text-[15px] outline-none text-ink-strong dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35"
            />
          </div>
          {warnings.map((w) => (
            <p key={w.k} className="m-0 mt-1.5 text-[13px] leading-snug text-amber-700 dark:text-amber-300">
              {w.text}
            </p>
          ))}
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={`text-[13px] ${tone.sub}`}>질문에서 찾은 말</span>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addKey(s)}
                  className="rounded-full border border-dashed border-brand dark:border-[#5aa2ff] text-brand dark:text-[#8fc0ff] px-2.5 py-0.5 text-[13px] font-semibold hover:bg-[var(--brand-soft)] dark:hover:bg-[#5aa2ff]/10"
                >
                  + {s}
                </button>
              ))}
            </div>
          )}
          <p className={`m-0 mt-2 text-[12.5px] ${tone.sub}`}>
            질문 속에 키워드가 그대로 들어 있으면 답해요 · 띄어쓰기는 달라도 괜찮아요 · ‘목사님 성함’처럼 대상과 붙여 주세요
          </p>
        </div>

        {(editing || mode === 'new') && (
          <>
            <label className="block">
              <span className={`block mb-1.5 text-[13.5px] font-bold ${tone.strong}`}>참비가 이렇게 답해요</span>
              <textarea
                rows={4}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="예) 주일에는 교회 앞 공영주차장을 쓸 수 있어요."
                className={`${tone.input} resize-y`}
              />
            </label>

            <div className="space-y-2">
              <span className={`block text-[13.5px] font-bold ${tone.strong}`}>
                답 아래 버튼 <span className={`font-normal ${tone.sub}`}>(선택 · 최대 3개)</span>
              </span>
              {actions.map((a, idx) => (
                <div key={idx} className="flex gap-1.5 items-center">
                  <input
                    value={a.label}
                    onChange={(e) => setActions(actions.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))}
                    placeholder="버튼 글자"
                    className={`${tone.input} !w-24 shrink-0 !px-2.5 !py-2 !text-[14px]`}
                  />
                  <select
                    value={a.type}
                    onChange={(e) =>
                      setActions(actions.map((x, i) => (i === idx ? { ...x, type: e.target.value as ChatAction['type'] } : x)))
                    }
                    className={`${tone.input} !w-auto shrink-0 !px-2 !py-2 !text-[14px]`}
                  >
                    <option value="link">화면 이동</option>
                    <option value="message">이어 묻기</option>
                  </select>
                  <input
                    value={a.value}
                    onChange={(e) => setActions(actions.map((x, i) => (i === idx ? { ...x, value: e.target.value } : x)))}
                    placeholder={a.type === 'link' ? '/visit' : '예배 시간 알려줘'}
                    className={`${tone.input} flex-1 min-w-0 !px-2.5 !py-2 !text-[14px]`}
                  />
                  <button
                    type="button"
                    aria-label="버튼 빼기"
                    onClick={() => setActions(actions.filter((_, i) => i !== idx))}
                    className="px-1.5 text-rose-400 hover:text-rose-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {actions.length < 3 && (
                <button
                  type="button"
                  onClick={() => setActions([...actions, { label: '', type: 'link', value: '' }])}
                  className={`rounded-lg border border-dashed border-gray-300 dark:border-white/20 px-3 py-1.5 text-[13px] ${tone.sub} hover:border-brand hover:text-brand`}
                >
                  + 버튼 추가
                </button>
              )}
            </div>

            <label className={`flex items-center gap-2 text-[14px] ${tone.body}`}>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 accent-[var(--brand)]"
              />
              바로 켜기 (끄면 저장만 해 두고 답하지 않아요)
            </label>
          </>
        )}

        <div className={`rounded-2xl ${tone.sunk} p-3.5 space-y-2`}>
          <p className={`m-0 text-[12.5px] font-bold ${tone.sub}`}>성도에게는 이렇게 보여요</p>
          <UserBubble>{question?.text ?? (keys[0] ? `${keys[0]} 알려 주세요` : '…')}</UserBubble>
          <BotBubble avatar={avatarTalking}>
            {previewAnswer || <span className="text-gray-400 dark:text-white/40">답변을 적으면 여기 나타나요</span>}
          </BotBubble>
          {previewActions.filter((a) => a.label.trim()).length > 0 && (
            <div className="pl-10 flex flex-wrap gap-1.5">
              {previewActions
                .filter((a) => a.label.trim())
                .map((a, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-brand dark:border-[#5aa2ff] text-brand dark:text-[#8fc0ff] px-3 py-1 text-[12.5px] font-semibold"
                  >
                    {a.label}
                  </span>
                ))}
            </div>
          )}
        </div>

        <button onClick={() => void save()} disabled={saving} className={`${tone.primaryBtn} w-full py-3.5 text-[15.5px]`}>
          {saving
            ? '저장 중…'
            : editing
              ? '고친 내용 저장'
              : mode === 'attach'
                ? `‘${targetIntent?.name ?? ''}’에 붙이기`
                : '참비에게 알려 주기'}
        </button>
      </div>
    </div>
  )
}

export default TeachPanel
