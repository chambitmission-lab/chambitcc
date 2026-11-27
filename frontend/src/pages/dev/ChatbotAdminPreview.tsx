import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import avatarDefault from '../../components/chatbot/img/default.webp'
import avatarSorry from '../../components/chatbot/img/sorry.webp'
import avatarThinking from '../../components/chatbot/img/thinking.webp'
import avatarJoy from '../../components/chatbot/img/joy.webp'
import avatarTalking from '../../components/chatbot/img/talking.webp'
import ChatbotHero from '../Admin/chatbot/ChatbotHero'
import QuestionDesk from '../Admin/chatbot/QuestionDesk'
import RealKnownWords from '../Admin/chatbot/KnownWords'
import RealGrowthLog from '../Admin/chatbot/GrowthLog'
import type { ChatbotIntent, ChatbotUnanswered } from '../../types/chatbot'

/**
 * /#/dev/chatbot-admin — /admin/chatbot 전면 개편 시안.
 *   ?v=a 참비 가르치기 교실 | b 참비의 말 사전 | c 질문함 3단 데스크
 * 표본 데이터만 쓴다(백엔드 없이). "참비에게 물어보기"는 실제 매칭 규칙(키워드 포함)을 흉내 낸다.
 */

type Status = 'open' | 'weak' | 'resolved'
interface Q { id: number; text: string; count: number; date: string; status: Status; answer?: string }
interface Intent { id: number; name: string; keywords: string[]; answer: string; on: boolean; hits: number; actions: { label: string }[] }

const QUESTIONS: Q[] = [
  { id: 1, text: '유아세례 신청은 어떻게 해요?', count: 6, date: '11/26', status: 'open' },
  { id: 2, text: '주일에 차 어디 세워요?', count: 4, date: '11/25', status: 'open' },
  { id: 3, text: '청년부 모임 언제 해?', count: 3, date: '11/24', status: 'weak', answer: '주일 예배는 오전 9시, 11시, 오후 2시에 드립니다.' },
  { id: 4, text: '교회 와이파이 비번 알려줘', count: 2, date: '11/23', status: 'open' },
  { id: 5, text: '목사님 심방 신청하고 싶어요', count: 1, date: '11/22', status: 'weak', answer: '담임목사님은 김OO 목사님이세요.' },
  { id: 6, text: '너는 이름이 뭐야?', count: 4, date: '8/21', status: 'resolved' },
  { id: 7, text: '참빛교회 담임목사님 성함은 뭐야?', count: 1, date: '8/21', status: 'resolved' },
]

const INTENTS: Intent[] = [
  { id: 1, name: '예배 시간', keywords: ['예배 시간', '몇 시', '주일 예배', '수요예배'], answer: '주일 예배는 오전 9시, 11시, 오후 2시에 드립니다.\n수요예배는 저녁 7시 30분이에요.', on: true, hits: 312, actions: [{ label: '예배 안내' }] },
  { id: 2, name: '오시는 길', keywords: ['오시는 길', '위치', '주소', '어떻게 가'], answer: '교회 주소와 버스·지하철 경로는 오시는 길 화면에서 볼 수 있어요.', on: true, hits: 141, actions: [{ label: '오시는 길' }] },
  { id: 3, name: '담임목사 소개', keywords: ['담임목사', '목사님 성함', '목사님 이름'], answer: '담임목사님을 소개해 드릴게요.', on: true, hits: 88, actions: [{ label: '인사말 보기' }] },
  { id: 4, name: '헌금 계좌', keywords: ['헌금 계좌', '계좌번호', '온라인 헌금'], answer: '온라인 헌금 계좌는 소식 > 헌금 탭에 안내되어 있어요.', on: true, hits: 57, actions: [{ label: '헌금 안내' }] },
  { id: 5, name: '새가족 등록', keywords: ['새가족', '등록', '처음 왔'], answer: '처음 오셨군요! 예배 후 1층 새가족실로 오시면 따뜻하게 맞아 드려요.', on: true, hits: 34, actions: [] },
  { id: 6, name: '참비 자기소개', keywords: ['이름이 뭐', '너는 누구'], answer: '저는 참빛교회 안내 양, 참비예요!', on: false, hits: 12, actions: [] },
]

const STATS = { week: 128, answered: 119, learned: INTENTS.length }

const match = (q: string) => {
  const s = q.replace(/\s+/g, '')
  if (!s) return null
  for (const it of INTENTS) {
    if (!it.on) continue
    const k = it.keywords.find((k) => s.includes(k.replace(/\s+/g, '')))
    if (k) return { intent: it, keyword: k }
  }
  return null
}

// 질문에서 키워드 후보 뽑기(시안용) — 조사·어미를 대충 떼고 2글자 이상만
const suggest = (q: string) =>
  q
    .replace(/[?!.~]/g, '')
    .split(/\s+/)
    .map((w) => w.replace(/(은|는|이|가|을|를|에|에서|해요|하고|싶어요|어떻게|언제|알려줘|뭐야|해)$/g, ''))
    .filter((w) => w.length >= 2 && !['어떻게', '언제', '알려줘', '뭐야', '교회'].includes(w))

// ── 공용 조각 ─────────────────────────────────────────────

const Avatar = ({ src, size = 40, ring = true }: { src: string; size?: number; ring?: boolean }) => (
  <img
    src={src}
    alt=""
    width={size}
    height={size}
    className={`shrink-0 rounded-full object-cover ${ring ? 'ring-2 ring-white dark:ring-white/10 shadow-md' : ''}`}
    style={{ width: size, height: size }}
  />
)

const UserBubble = ({ children }: { children: ReactNode }) => (
  <div className="flex justify-end">
    <p className="m-0 max-w-[85%] rounded-2xl rounded-br-md bg-brand text-white px-3.5 py-2 text-[14px] leading-snug">{children}</p>
  </div>
)

const BotBubble = ({ children, avatar = avatarDefault, tone = 'plain' }: { children: ReactNode; avatar?: string; tone?: 'plain' | 'warn' | 'muted' }) => (
  <div className="flex items-end gap-2">
    <Avatar src={avatar} size={30} />
    <div
      className={`max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2 text-[14px] leading-snug whitespace-pre-line ${
        tone === 'warn'
          ? 'bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-400/10 dark:text-amber-100 dark:border-amber-400/25'
          : tone === 'muted'
            ? 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-white/55'
            : 'bg-white text-gray-800 border border-gray-200 dark:bg-white/[0.07] dark:text-white/90 dark:border-white/10'
      }`}
    >
      {children}
    </div>
  </div>
)

const Toggle = ({ on }: { on: boolean }) => (
  <span className={`inline-flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${on ? 'bg-brand' : 'bg-gray-300 dark:bg-white/15'}`}>
    <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
  </span>
)

const KeyChip = ({ children, hot }: { children: ReactNode; hot?: boolean }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold ${
      hot ? 'bg-brand text-white' : 'text-brand bg-[var(--brand-soft)]'
    }`}
  >
    {children}
  </span>
)

const Ring = ({ pct, size = 96 }: { pct: number; size?: number }) => {
  const r = size / 2 - 7
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="7" className="stroke-gray-200 dark:stroke-white/10" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="7" strokeLinecap="round" stroke="var(--brand)" strokeDasharray={`${(c * pct) / 100} ${c}`} />
    </svg>
  )
}

// 참비에게 물어보기 — 모든 시안 공통 테스트 창
const AskTester = ({ compact = false }: { compact?: boolean }) => {
  const [q, setQ] = useState('주일 예배 몇 시에 해요?')
  const m = match(q)
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-card-dark overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
        <span className="text-[14px] font-bold text-ink-strong">참비에게 물어보기</span>
        <span className="text-[12px] text-gray-500 dark:text-white/50">성도처럼 질문해 보고 답을 미리 확인</span>
      </div>
      <div className={`space-y-2.5 px-4 py-3 bg-[var(--app-canvas)] dark:bg-black/20 ${compact ? '' : 'min-h-[150px]'}`}>
        {q.trim() && <UserBubble>{q}</UserBubble>}
        {q.trim() &&
          (m ? (
            <>
              <BotBubble avatar={avatarTalking}>{m.intent.answer}</BotBubble>
              <p className="m-0 pl-10 text-[12.5px] text-gray-600 dark:text-white/60">
                <b className="text-brand">‘{m.keyword}’</b> 키워드로 <b>{m.intent.name}</b> 답이 나가요
              </p>
            </>
          ) : (
            <>
              <BotBubble avatar={avatarSorry} tone="muted">음… 아직 잘 모르겠어요.</BotBubble>
              <p className="m-0 pl-10 text-[12.5px] text-amber-700 dark:text-amber-300">맞는 키워드가 없어 미답변함에 쌓여요</p>
            </>
          ))}
      </div>
      <div className="p-2.5 border-t border-gray-100 dark:border-white/[0.06]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="예) 주차는 어디에 해요?"
          className="w-full rounded-xl bg-gray-100 dark:bg-white/[0.06] px-3.5 py-2.5 text-[14px] text-ink-strong outline-none focus:ring-2 focus:ring-[var(--brand-glow)]"
        />
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] px-3.5 py-2.5 text-[14.5px] text-ink-strong outline-none focus:border-brand'

// 가르치기 폼 + 실시간 말풍선 미리보기
const TeachPanel = ({ q, onClose }: { q: Q | null; onClose?: () => void }) => {
  const [keys, setKeys] = useState<string[]>(q ? suggest(q.text).slice(0, 2) : [])
  const [answer, setAnswer] = useState('')
  const sugg = q ? suggest(q.text).filter((s) => !keys.includes(s)) : []
  return (
    <div className="rounded-3xl bg-white dark:bg-card-dark border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-br from-[var(--brand-soft-strong)] to-transparent">
        <Avatar src={avatarThinking} size={44} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[16px] font-bold text-ink-strong">참비 가르치기</p>
          <p className="m-0 text-[13px] text-gray-600 dark:text-white/60 truncate">
            {q ? `“${q.text}”에 이렇게 답할게요` : '새로 알려 줄 말을 적어 주세요'}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-[13px] text-gray-500 hover:text-ink-strong">
            닫기
          </button>
        )}
      </div>
      <div className="p-5 space-y-4">
        <div>
          <p className="m-0 mb-1.5 text-[13px] font-bold text-ink-strong">이런 말이 들어오면</p>
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 p-2 min-h-[44px]">
            {keys.map((k) => (
              <button key={k} onClick={() => setKeys(keys.filter((x) => x !== k))} className="rounded-full bg-brand text-white px-3 py-1 text-[13px] font-semibold">
                {k} ✕
              </button>
            ))}
            <input
              placeholder="키워드 입력 후 Enter"
              onKeyDown={(e) => {
                const v = (e.target as HTMLInputElement).value.trim()
                if (e.key === 'Enter' && v) {
                  setKeys([...keys, v])
                  ;(e.target as HTMLInputElement).value = ''
                }
              }}
              className="flex-1 min-w-[120px] bg-transparent text-[14px] outline-none text-ink-strong"
            />
          </div>
          {sugg.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[12.5px] text-gray-500 dark:text-white/50">질문에서 찾은 말</span>
              {sugg.map((s) => (
                <button key={s} onClick={() => setKeys([...keys, s])} className="rounded-full border border-dashed border-brand text-brand px-2.5 py-0.5 text-[12.5px] font-semibold hover:bg-[var(--brand-soft)]">
                  + {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="m-0 mb-1.5 text-[13px] font-bold text-ink-strong">참비가 이렇게 답해요</p>
          <textarea rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="예) 유아세례는 매년 부활절·성탄절에 있어요. 교육부서로 신청해 주세요." className={`${inputCls} resize-none`} />
        </div>
        <div className="rounded-2xl bg-[var(--app-canvas)] dark:bg-black/25 p-3.5 space-y-2">
          <p className="m-0 text-[12px] font-bold tracking-wide text-gray-500 dark:text-white/45">성도에게는 이렇게 보여요</p>
          <UserBubble>{q?.text ?? '…'}</UserBubble>
          <BotBubble avatar={avatarJoy}>{answer || <span className="text-gray-400">답변을 적으면 여기 나타나요</span>}</BotBubble>
        </div>
        <button className="w-full rounded-2xl bg-brand hover:bg-brand-dim py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_-8px_var(--brand-glow)]">
          참비에게 알려 주기
        </button>
      </div>
    </div>
  )
}

// ── A. 참비 가르치기 교실 ─────────────────────────────────

const VariantA = () => {
  const open = QUESTIONS.filter((q) => q.status !== 'resolved')
  const [sel, setSel] = useState<Q | null>(open[0])
  const pct = Math.round((STATS.answered / STATS.week) * 100)
  return (
    <div className="space-y-5">
      {/* 히어로 */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#eaf3ff] via-white to-[#fff7e8] dark:from-[#14243f] dark:via-card-dark dark:to-[#2a2214] border border-gray-200/70 dark:border-white/10 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-center gap-5 flex-1">
            <img src={avatarJoy} alt="" className="w-24 h-24 lg:w-28 lg:h-28 rounded-full shadow-xl ring-4 ring-white dark:ring-white/10" />
            <div>
              <p className="m-0 text-[13px] font-bold text-brand">이번 주 참비</p>
              <p className="m-0 mt-1 text-[26px] lg:text-[30px] font-extrabold tracking-tight text-ink-strong leading-tight">
                성도 질문 <span className="text-brand">{STATS.week}</span>개 중 <span className="text-brand">{STATS.answered}</span>개에 답했어요
              </p>
              <p className="m-0 mt-1.5 text-[14.5px] text-gray-600 dark:text-white/65">
                <b className="text-amber-600 dark:text-amber-300">{open.length}가지</b> 질문을 아직 몰라요. 하나씩 알려 주면 다음부터 스스로 답해요.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {[
              { k: '답한 비율', v: `${pct}%` },
              { k: '배운 말', v: `${STATS.learned}` },
              { k: '모르는 말', v: `${open.length}`, warn: true },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl bg-white/80 dark:bg-white/[0.06] border border-white dark:border-white/10 px-5 py-3.5 text-center min-w-[96px] shadow-sm">
                <p className={`m-0 text-[26px] font-extrabold ${s.warn ? 'text-amber-600 dark:text-amber-300' : 'text-ink-strong'}`}>{s.v}</p>
                <p className="m-0 text-[12.5px] text-gray-500 dark:text-white/55">{s.k}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_440px] gap-5 items-start">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="m-0 text-[19px] font-bold text-ink-strong">참비가 대답 못 한 대화</h2>
            <span className="text-[13px] text-gray-500 dark:text-white/50">많이 물은 순</span>
          </div>
          {open.map((q) => {
            const active = sel?.id === q.id
            return (
              <button
                key={q.id}
                onClick={() => setSel(q)}
                className={`block w-full text-left rounded-3xl border p-5 transition-colors ${
                  active
                    ? 'border-brand bg-[var(--brand-soft)] shadow-[0_10px_30px_-14px_var(--brand-glow)]'
                    : 'border-gray-200/80 dark:border-white/10 bg-white dark:bg-card-dark hover:border-[var(--brand-glow)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${q.status === 'weak' ? 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200' : 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200'}`}>
                    {q.status === 'weak' ? '엉뚱하게 답했을지도' : '대답 못 함'}
                  </span>
                  <span className="text-[13px] text-gray-500 dark:text-white/50">{q.count}명이 물었어요 · {q.date}</span>
                </div>
                <div className="space-y-2">
                  <UserBubble>{q.text}</UserBubble>
                  {q.status === 'weak' ? (
                    <BotBubble avatar={avatarThinking} tone="warn">{q.answer}</BotBubble>
                  ) : (
                    <BotBubble avatar={avatarSorry} tone="muted">음… 아직 잘 모르겠어요.</BotBubble>
                  )}
                </div>
              </button>
            )
          })}
          <p className="m-0 pt-1 text-center text-[13px] text-gray-500 dark:text-white/45">해결된 대화 2개 보기</p>
        </div>
        <div className="space-y-4 lg:sticky lg:top-4">
          <TeachPanel key={sel?.id ?? 'new'} q={sel} />
          <AskTester compact />
        </div>
      </div>
    </div>
  )
}

// ── B. 참비의 말 사전 ─────────────────────────────────────

const VariantB = () => {
  const [q, setQ] = useState('')
  const [teach, setTeach] = useState<Q | null>(null)
  const m = useMemo(() => match(q), [q])
  const open = QUESTIONS.filter((x) => x.status !== 'resolved')
  const pct = Math.round((STATS.answered / STATS.week) * 100)
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-[#0f1b33] text-white p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-[#3182f6]/30 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="relative w-[120px] h-[120px] shrink-0">
            <Ring pct={pct} size={120} />
            <img src={avatarDefault} alt="" className="absolute inset-[14px] w-[92px] h-[92px] rounded-full" />
          </div>
          <div className="flex-1">
            <p className="m-0 text-[13px] font-bold text-[#8fc0ff]">참비의 말 사전</p>
            <p className="m-0 mt-1 text-[28px] font-extrabold tracking-tight leading-tight">
              참비는 지금 <span className="text-[#8fc0ff]">{STATS.learned}가지</span> 말을 알아요
            </p>
            <p className="m-0 mt-1 text-[14.5px] text-white/70">이번 주 질문 {pct}%에 답했어요 · 가장 많이 쓴 답은 ‘예배 시간’</p>
          </div>
          <button className="self-start lg:self-center rounded-2xl bg-white text-[#0f1b33] px-5 py-3 text-[15px] font-bold">+ 새 말 가르치기</button>
        </div>
        {/* 물어보기 검색창 */}
        <div className="relative mt-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="성도처럼 물어보세요 — 예) 주차 어디에 해요?"
            className="w-full rounded-2xl bg-white/10 border border-white/15 px-5 py-4 text-[16px] text-white placeholder:text-white/45 outline-none focus:bg-white/15"
          />
          {q.trim() && (
            <p className="m-0 mt-2 text-[14px]">
              {m ? (
                <>
                  → <b className="text-[#8fc0ff]">{m.intent.name}</b> 카드가 답해요 (‘{m.keyword}’)
                </>
              ) : (
                <span className="text-amber-300">→ 아는 말이 없어요. 아래 ‘모르는 말’로 쌓여요</span>
              )}
            </p>
          )}
        </div>
      </section>

      {/* 모르는 말 쪽지 */}
      <section>
        <div className="flex items-center gap-2 px-1 mb-3">
          <img src={avatarSorry} alt="" className="w-8 h-8 rounded-full" />
          <h2 className="m-0 text-[19px] font-bold text-ink-strong">아직 모르는 말</h2>
          <span className="rounded-full bg-amber-100 dark:bg-amber-400/15 text-amber-800 dark:text-amber-200 px-2.5 py-0.5 text-[13px] font-bold">{open.length}</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {open.map((x, i) => (
            <div
              key={x.id}
              className={`shrink-0 w-[240px] rounded-2xl p-4 border shadow-sm ${i % 2 ? 'rotate-[0.6deg]' : '-rotate-[0.6deg]'} ${
                x.status === 'weak'
                  ? 'bg-amber-50 border-amber-200 dark:bg-amber-400/[0.08] dark:border-amber-400/20'
                  : 'bg-[#fffdf5] border-[#f1e7c7] dark:bg-white/[0.05] dark:border-white/10'
              }`}
            >
              <p className="m-0 text-[16px] font-bold text-ink-strong leading-snug min-h-[44px]">“{x.text}”</p>
              <p className="m-0 mt-2 text-[13px] text-gray-500 dark:text-white/55">
                {x.count}명 · {x.status === 'weak' ? '엉뚱한 답 나감' : '대답 못 함'}
              </p>
              <div className="mt-3 flex gap-1.5">
                <button onClick={() => setTeach(x)} className="flex-1 rounded-xl bg-brand text-white py-2 text-[13.5px] font-bold">가르치기</button>
                <button className="rounded-xl border border-gray-200 dark:border-white/15 px-3 text-[13px] text-gray-600 dark:text-white/65">넘기기</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 사전 그리드 */}
      <section>
        <div className="flex items-baseline justify-between px-1 mb-3">
          <h2 className="m-0 text-[19px] font-bold text-ink-strong">참비가 아는 말</h2>
          <span className="text-[13px] text-gray-500 dark:text-white/50">많이 쓴 순</span>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {INTENTS.map((it) => {
            const hit = m?.intent.id === it.id
            return (
              <article
                key={it.id}
                className={`rounded-3xl border p-5 bg-white dark:bg-card-dark transition-all ${
                  hit ? 'border-brand ring-4 ring-[var(--brand-soft-strong)]' : 'border-gray-200/80 dark:border-white/10'
                } ${it.on ? '' : 'opacity-60'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="m-0 text-[18px] font-extrabold text-ink-strong">{it.name}</p>
                    <p className="m-0 text-[13px] text-gray-500 dark:text-white/50">이번 달 {it.hits}번 답함</p>
                  </div>
                  <Toggle on={it.on} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {it.keywords.map((k) => (
                    <KeyChip key={k} hot={hit && m?.keyword === k}>{k}</KeyChip>
                  ))}
                </div>
                <p className="m-0 mt-3 text-[14px] text-gray-600 dark:text-white/65 line-clamp-2 whitespace-pre-line">{it.answer}</p>
                {it.actions.length > 0 && (
                  <div className="mt-3 flex gap-1.5">
                    {it.actions.map((a) => (
                      <span key={a.label} className="rounded-lg border border-gray-200 dark:border-white/15 px-2.5 py-1 text-[12.5px] font-semibold text-gray-700 dark:text-white/75">
                        {a.label} ›
                      </span>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      {teach && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/40 p-0 lg:p-6" onClick={() => setTeach(null)}>
          <div className="w-full max-w-[480px]" onClick={(e) => e.stopPropagation()}>
            <TeachPanel q={teach} onClose={() => setTeach(null)} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── C. 질문함 3단 데스크 ─────────────────────────────────

const VariantC = () => {
  const [filter, setFilter] = useState<Status>('open')
  const list = QUESTIONS.filter((q) => (filter === 'open' ? q.status === 'open' : q.status === filter))
  const [sel, setSel] = useState<Q>(QUESTIONS[0])
  const counts = { open: 0, weak: 0, resolved: 0 } as Record<Status, number>
  QUESTIONS.forEach((q) => counts[q.status]++)
  const tabs: { k: Status; label: string }[] = [
    { k: 'open', label: '못 답함' },
    { k: 'weak', label: '애매함' },
    { k: 'resolved', label: '해결' },
  ]
  const spark = [62, 70, 81, 76, 88, 92, 93]
  return (
    <div className="space-y-4">
      {/* 지표 띠 */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/80 dark:border-white/10 p-4 flex items-center gap-3 col-span-2 lg:col-span-1">
          <img src={avatarJoy} alt="" className="w-12 h-12 rounded-full" />
          <div>
            <p className="m-0 text-[13px] text-gray-500 dark:text-white/50">참비 상태</p>
            <p className="m-0 text-[16px] font-bold text-ink-strong">오늘도 잘 답하는 중</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/80 dark:border-white/10 p-4">
          <p className="m-0 text-[13px] text-gray-500 dark:text-white/50">이번 주 답한 비율</p>
          <div className="flex items-end justify-between">
            <p className="m-0 text-[28px] font-extrabold text-ink-strong">93<span className="text-[16px]">%</span></p>
            <svg width="90" height="32" viewBox="0 0 90 32">
              <polyline fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={spark.map((v, i) => `${i * 15},${32 - ((v - 55) / 40) * 30}`).join(' ')} />
            </svg>
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/80 dark:border-white/10 p-4">
          <p className="m-0 text-[13px] text-gray-500 dark:text-white/50">기다리는 질문</p>
          <p className="m-0 text-[28px] font-extrabold text-amber-600 dark:text-amber-300">{counts.open + counts.weak}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/80 dark:border-white/10 p-4">
          <p className="m-0 text-[13px] text-gray-500 dark:text-white/50">켜진 답변</p>
          <p className="m-0 text-[28px] font-extrabold text-ink-strong">
            {INTENTS.filter((i) => i.on).length}
            <span className="text-[16px] text-gray-400"> / {INTENTS.length}</span>
          </p>
        </div>
      </section>

      <section className="grid lg:grid-cols-[300px_minmax(0,1fr)_400px] rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-card-dark overflow-hidden min-h-[640px]">
        {/* 큐 */}
        <div className="border-r border-gray-100 dark:border-white/[0.06] flex flex-col">
          <div className="p-3 flex gap-1 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.06]">
            {tabs.map((t) => (
              <button
                key={t.k}
                onClick={() => setFilter(t.k)}
                className={`flex-1 rounded-xl py-2 text-[13.5px] font-bold ${filter === t.k ? 'bg-white dark:bg-white/10 text-ink-strong shadow-sm' : 'text-gray-500 dark:text-white/50'}`}
              >
                {t.label} <span className={t.k === 'resolved' ? '' : 'text-brand'}>{counts[t.k]}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {list.map((q) => (
              <button
                key={q.id}
                onClick={() => setSel(q)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-100 dark:border-white/[0.05] flex gap-3 ${sel.id === q.id ? 'bg-[var(--brand-soft)] shadow-[inset_3px_0_0_var(--brand)]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'}`}
              >
                <span className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 grid place-items-center text-[13px] font-extrabold text-ink-strong">{q.count}</span>
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-semibold text-ink-strong truncate">{q.text}</span>
                  <span className="block text-[12.5px] text-gray-500 dark:text-white/50">{q.date} · {q.count}명이 물음</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 상세 */}
        <div className="p-6 flex flex-col gap-5 bg-[var(--app-canvas)] dark:bg-black/10">
          <div>
            <p className="m-0 text-[13px] font-bold text-gray-500 dark:text-white/50">{sel.date} 처음 · {sel.count}명이 물었어요</p>
            <h2 className="m-0 mt-1 text-[24px] font-extrabold text-ink-strong leading-snug">“{sel.text}”</h2>
          </div>
          <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/80 dark:border-white/10 p-4 space-y-2.5">
            <p className="m-0 text-[12px] font-bold text-gray-500 dark:text-white/45">그때 대화</p>
            <UserBubble>{sel.text}</UserBubble>
            {sel.status === 'weak' ? (
              <BotBubble avatar={avatarThinking} tone="warn">{sel.answer}</BotBubble>
            ) : sel.status === 'resolved' ? (
              <BotBubble avatar={avatarJoy}>이제는 답할 수 있어요!</BotBubble>
            ) : (
              <BotBubble avatar={avatarSorry} tone="muted">음… 아직 잘 모르겠어요.</BotBubble>
            )}
          </div>
          <div className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/80 dark:border-white/10 p-4">
            <p className="m-0 mb-2 text-[12px] font-bold text-gray-500 dark:text-white/45">비슷한 질문</p>
            {['유아세례 언제 해요', '아기 세례 받으려면'].map((s) => (
              <p key={s} className="m-0 py-1.5 text-[14px] text-gray-700 dark:text-white/75 border-t first:border-t-0 border-gray-100 dark:border-white/[0.06]">“{s}”</p>
            ))}
          </div>
          <div className="mt-auto flex gap-2">
            <button className="rounded-xl border border-gray-200 dark:border-white/15 px-4 py-2.5 text-[14px] font-semibold text-gray-700 dark:text-white/75">기존 답에 붙이기</button>
            <button className="rounded-xl border border-gray-200 dark:border-white/15 px-4 py-2.5 text-[14px] font-semibold text-gray-700 dark:text-white/75">괜찮은 답이에요</button>
            <button className="ml-auto rounded-xl px-4 py-2.5 text-[14px] font-semibold text-rose-500">지우기</button>
          </div>
        </div>

        {/* 가르치기 */}
        <div className="border-l border-gray-100 dark:border-white/[0.06] p-4">
          <TeachPanel key={sel.id} q={sel} />
        </div>
      </section>

      <AskTester />
    </div>
  )
}

// ── C 업그레이드 공용 ────────────────────────────────────

const WEEK = [
  { d: '목', ok: 15, weak: 1, miss: 1 },
  { d: '금', ok: 12, weak: 2, miss: 2 },
  { d: '토', ok: 9, weak: 0, miss: 1 },
  { d: '일', ok: 38, weak: 2, miss: 2 },
  { d: '월', ok: 11, weak: 1, miss: 1 },
  { d: '화', ok: 14, weak: 0, miss: 1 },
  { d: '수', ok: 20, weak: 1, miss: 0 },
]

const CLUSTERS: { topic: string; ids: number[]; hint?: string }[] = [
  { topic: '세례·성례', ids: [1] },
  { topic: '교회 시설', ids: [2, 4], hint: '‘오시는 길’과 가까워요' },
  { topic: '모임·심방', ids: [3, 5], hint: '‘예배 시간’이 잘못 답했어요' },
]

const ASK_LOG: Record<number, string[]> = {
  1: ['11/20', '11/22', '11/22', '11/24', '11/26', '11/26'],
  2: ['11/22', '11/22', '11/25', '11/25'],
  3: ['11/23', '11/24', '11/24'],
  4: ['11/21', '11/23'],
  5: ['11/22'],
}

const RECENT_BY_INTENT: Record<number, string[]> = {
  1: ['주일 예배 몇 시에요', '수요예배 몇 시부터야', '2부 예배 시간'],
  2: ['교회 주소 알려줘', '버스로 어떻게 가요'],
  3: ['담임목사님 성함', '목사님 이름이 뭐예요'],
  4: ['헌금 계좌번호 알려줘'],
  5: ['처음 왔는데 등록 어떻게 해요'],
  6: [],
}

const GROWTH = [
  { date: '11/19', name: '헌금 계좌', from: '“온라인 헌금 어떻게 해요?”', answered: 21 },
  { date: '11/12', name: '새가족 등록', from: '“처음 왔는데 뭐 해야 돼요?”', answered: 34 },
  { date: '10/30', name: '오시는 길', from: '“교회 주소가 어디야?”', answered: 141 },
]

const conflictOf = (k: string) => {
  const s = k.replace(/\s+/g, '')
  if (s.length < 2) return null
  return INTENTS.find((it) => it.keywords.some((x) => x.replace(/\s+/g, '').includes(s) || s.includes(x.replace(/\s+/g, '')))) ?? null
}

const WeekBars = ({ dark = false }: { dark?: boolean }) => {
  const max = Math.max(...WEEK.map((w) => w.ok + w.weak + w.miss))
  return (
    <div className="flex items-end gap-2 h-[92px]">
      {WEEK.map((w) => {
        const t = w.ok + w.weak + w.miss
        return (
          <div key={w.d} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end rounded-md overflow-hidden" style={{ height: `${(t / max) * 70}px` }}>
              <div className="bg-rose-400" style={{ flex: w.miss }} />
              <div className="bg-amber-400" style={{ flex: w.weak }} />
              <div className={dark ? 'bg-[#5aa2ff]' : 'bg-brand'} style={{ flex: w.ok }} />
            </div>
            <span className={`text-[11.5px] ${dark ? 'text-white/50' : 'text-gray-500 dark:text-white/50'}`}>{w.d}</span>
          </div>
        )
      })}
    </div>
  )
}

// 업그레이드 가르치기 패널 — 새 답/기존 답에 붙이기, 키워드 겹침 경고, 기다리는 사람 수
const SmartTeach = ({ q, dark = false, onDone }: { q: Q; dark?: boolean; onDone?: () => void }) => {
  const [mode, setMode] = useState<'new' | 'attach'>(q.status === 'weak' ? 'attach' : 'new')
  const [keys, setKeys] = useState<string[]>(suggest(q.text).slice(0, 2))
  const [answer, setAnswer] = useState('')
  const [target, setTarget] = useState(INTENTS[4].id)
  const [done, setDone] = useState(false)
  const sugg = suggest(q.text).filter((s) => !keys.includes(s))
  const tgt = INTENTS.find((i) => i.id === target)!
  const card = dark ? 'bg-[#121c30] border-white/10 text-white' : 'bg-white dark:bg-card-dark border-gray-200 dark:border-white/10'
  const sub = dark ? 'text-white/55' : 'text-gray-500 dark:text-white/50'
  const field = dark
    ? 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[14.5px] text-white outline-none focus:border-[#5aa2ff]'
    : inputCls

  if (done)
    return (
      <div className={`rounded-3xl border p-6 text-center ${card}`}>
        <img src={avatarJoy} alt="" className="mx-auto w-24 h-24 rounded-full shadow-xl" />
        <p className="m-0 mt-4 text-[20px] font-extrabold">참비가 배웠어요!</p>
        <p className={`m-0 mt-1 text-[14.5px] ${sub}`}>
          이 질문을 한 <b className="text-brand">{q.count}명</b>이 다음부터 바로 답을 받아요
        </p>
        <button onClick={() => { setDone(false); onDone?.() }} className="mt-5 w-full rounded-2xl bg-brand py-3 text-[15px] font-bold text-white">
          다음 질문 보기 →
        </button>
      </div>
    )

  return (
    <div className={`rounded-3xl border shadow-xl overflow-hidden ${card}`}>
      <div className="px-5 pt-5">
        <div className="flex items-center gap-3">
          <Avatar src={avatarThinking} size={42} />
          <div className="min-w-0">
            <p className="m-0 text-[16px] font-bold">참비 가르치기</p>
            <p className={`m-0 text-[13px] ${sub}`}>
              <b className="text-amber-500">{q.count}명</b>이 이 답을 기다려요
            </p>
          </div>
        </div>
        <div className={`mt-4 grid grid-cols-2 gap-1 rounded-2xl p-1 ${dark ? 'bg-white/[0.06]' : 'bg-gray-100 dark:bg-white/[0.06]'}`}>
          {(
            [
              ['new', '새 답 만들기'],
              ['attach', '기존 답에 붙이기'],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setMode(k)}
              className={`rounded-xl py-2 text-[13.5px] font-bold ${mode === k ? (dark ? 'bg-white/15 text-white' : 'bg-white dark:bg-white/15 text-ink-strong shadow-sm') : sub}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5 space-y-4">
        {mode === 'attach' && (
          <div>
            <p className="m-0 mb-1.5 text-[13px] font-bold">어느 답에 붙일까요</p>
            <select value={target} onChange={(e) => setTarget(+e.target.value)} className={field}>
              {INTENTS.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <p className="m-0 mb-1.5 text-[13px] font-bold">이런 말이 들어오면</p>
          <div className={`flex flex-wrap gap-1.5 rounded-xl border p-2 min-h-[44px] ${dark ? 'border-white/10' : 'border-gray-200 dark:border-white/10'}`}>
            {keys.map((k) => {
              const c = conflictOf(k)
              const bad = c && !(mode === 'attach' && c.id === target)
              return (
                <button key={k} onClick={() => setKeys(keys.filter((x) => x !== k))} className={`rounded-full px-3 py-1 text-[13px] font-semibold ${bad ? 'bg-amber-400 text-amber-950' : 'bg-brand text-white'}`}>
                  {k} ✕
                </button>
              )
            })}
            <input
              placeholder="키워드 + Enter"
              onKeyDown={(e) => {
                const v = (e.target as HTMLInputElement).value.trim()
                if (e.key === 'Enter' && v) {
                  setKeys([...keys, v])
                  ;(e.target as HTMLInputElement).value = ''
                }
              }}
              className="flex-1 min-w-[110px] bg-transparent text-[14px] outline-none"
            />
          </div>
          {keys.map((k) => {
            const c = conflictOf(k)
            if (!c || (mode === 'attach' && c.id === target)) return null
            return (
              <p key={k} className="m-0 mt-1.5 text-[12.5px] text-amber-600 dark:text-amber-300">
                ‘{k}’는 이미 <b>{c.name}</b>이 쓰고 있어요 — 둘이 부딪힐 수 있어요
              </p>
            )
          })}
          {sugg.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={`text-[12.5px] ${sub}`}>질문에서 찾은 말</span>
              {sugg.map((s) => (
                <button key={s} onClick={() => setKeys([...keys, s])} className="rounded-full border border-dashed border-brand text-brand px-2.5 py-0.5 text-[12.5px] font-semibold">
                  + {s}
                </button>
              ))}
            </div>
          )}
        </div>
        {mode === 'new' && (
          <div>
            <p className="m-0 mb-1.5 text-[13px] font-bold">참비가 이렇게 답해요</p>
            <textarea rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="예) 유아세례는 부활절·성탄절에 있어요. 교육부서로 신청해 주세요." className={`${field} resize-none`} />
            <div className="mt-2 flex gap-1.5">
              <span className={`rounded-lg border border-dashed px-2.5 py-1 text-[12.5px] ${dark ? 'border-white/20 text-white/60' : 'border-gray-300 text-gray-500 dark:border-white/20 dark:text-white/55'}`}>+ 이동 버튼</span>
            </div>
          </div>
        )}
        <div className={`rounded-2xl p-3.5 space-y-2 ${dark ? 'bg-black/30' : 'bg-[var(--app-canvas)] dark:bg-black/25'}`}>
          <p className={`m-0 text-[12px] font-bold ${sub}`}>성도에게는 이렇게 보여요</p>
          <UserBubble>{q.text}</UserBubble>
          <BotBubble avatar={avatarJoy}>
            {mode === 'attach' ? tgt.answer : answer || <span className="text-gray-400">답변을 적으면 여기 나타나요</span>}
          </BotBubble>
        </div>
        <button onClick={() => setDone(true)} className="w-full rounded-2xl bg-brand hover:bg-brand-dim py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_-8px_var(--brand-glow)]">
          {mode === 'attach' ? `‘${tgt.name}’에 붙이기` : '참비에게 알려 주기'}
        </button>
      </div>
    </div>
  )
}

const DeskTabs = ({ tab, setTab, dark = false }: { tab: string; setTab: (t: string) => void; dark?: boolean }) => (
  <div className="flex gap-6">
    {[
      ['q', '질문함', 5],
      ['k', '아는 말', 6],
      ['g', '성장 기록', null],
    ].map(([k, l, n]) => (
      <button
        key={k as string}
        onClick={() => setTab(k as string)}
        className={`relative pb-3 text-[16px] font-bold ${tab === k ? (dark ? 'text-white' : 'text-ink-strong') : dark ? 'text-white/45' : 'text-gray-400 dark:text-white/40'}`}
      >
        {l}
        {n != null && <span className={`ml-1.5 text-[14px] ${k === 'q' ? 'text-amber-500' : ''}`}>{n}</span>}
        {tab === k && <span className={`absolute left-0 right-0 -bottom-px h-[3px] rounded-full ${dark ? 'bg-[#5aa2ff]' : 'bg-brand'}`} />}
      </button>
    ))}
  </div>
)

// 아는 말 표 + 오른쪽 살펴보기 — C1·C3 공용
const KnownWords = ({ dark = false }: { dark?: boolean }) => {
  const [sel, setSel] = useState(INTENTS[0])
  const max = Math.max(...INTENTS.map((i) => i.hits))
  const line = dark ? 'border-white/[0.07]' : 'border-gray-100 dark:border-white/[0.06]'
  const sub = dark ? 'text-white/50' : 'text-gray-500 dark:text-white/50'
  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] min-h-[560px]">
      <div className={`border-r ${line}`}>
        <div className={`grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_150px_56px] gap-4 px-5 py-3 text-[12.5px] font-bold ${sub} border-b ${line}`}>
          <span>이름</span>
          <span>이런 말에 답해요</span>
          <span>이번 달 답한 횟수</span>
          <span>켜짐</span>
        </div>
        {INTENTS.map((it) => (
          <button
            key={it.id}
            onClick={() => setSel(it)}
            className={`w-full text-left grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_150px_56px] gap-4 items-center px-5 py-4 border-b ${line} ${
              sel.id === it.id ? (dark ? 'bg-white/[0.06] shadow-[inset_3px_0_0_#5aa2ff]' : 'bg-[var(--brand-soft)] shadow-[inset_3px_0_0_var(--brand)]') : ''
            } ${it.on ? '' : 'opacity-55'}`}
          >
            <span className="text-[15px] font-bold truncate">{it.name}</span>
            <span className="flex flex-wrap gap-1">
              {it.keywords.slice(0, 3).map((k) => (
                <KeyChip key={k}>{k}</KeyChip>
              ))}
              {it.keywords.length > 3 && <span className={`text-[12.5px] ${sub}`}>+{it.keywords.length - 3}</span>}
            </span>
            <span className="flex items-center gap-2">
              <span className={`h-2 flex-1 rounded-full overflow-hidden ${dark ? 'bg-white/10' : 'bg-gray-100 dark:bg-white/10'}`}>
                <span className="block h-full rounded-full bg-brand" style={{ width: `${(it.hits / max) * 100}%` }} />
              </span>
              <span className="w-9 text-right text-[13px] font-bold">{it.hits}</span>
            </span>
            <Toggle on={it.on} />
          </button>
        ))}
      </div>
      <div className="p-5 space-y-4">
        <div>
          <p className={`m-0 text-[12.5px] font-bold ${sub}`}>살펴보기</p>
          <p className="m-0 mt-1 text-[22px] font-extrabold">{sel.name}</p>
          <p className={`m-0 text-[13px] ${sub}`}>이번 달 {sel.hits}번 답했어요</p>
        </div>
        <div className={`rounded-2xl p-3.5 space-y-2 ${dark ? 'bg-black/30' : 'bg-[var(--app-canvas)] dark:bg-black/25'}`}>
          <UserBubble>{RECENT_BY_INTENT[sel.id][0] ?? sel.keywords[0]}</UserBubble>
          <BotBubble avatar={avatarTalking}>{sel.answer}</BotBubble>
          {sel.actions.length > 0 && (
            <div className="pl-10 flex gap-1.5">
              {sel.actions.map((a) => (
                <span key={a.label} className="rounded-full border border-brand text-brand px-3 py-1 text-[12.5px] font-semibold">{a.label}</span>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className={`m-0 mb-1.5 text-[12.5px] font-bold ${sub}`}>최근 이 답을 받은 질문</p>
          {(RECENT_BY_INTENT[sel.id].length ? RECENT_BY_INTENT[sel.id] : ['아직 없어요']).map((r) => (
            <p key={r} className={`m-0 py-2 text-[14px] border-t ${line}`}>“{r}”</p>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="flex-1 rounded-xl bg-brand py-2.5 text-[14px] font-bold text-white">고치기</button>
          <button className={`rounded-xl border px-4 text-[14px] font-semibold ${dark ? 'border-white/15' : 'border-gray-200 dark:border-white/15'}`}>{sel.on ? '끄기' : '켜기'}</button>
        </div>
      </div>
    </div>
  )
}

const GrowthLog = ({ dark = false }: { dark?: boolean }) => (
  <div className="p-6 grid lg:grid-cols-[280px_minmax(0,1fr)] gap-8">
    <div className="text-center">
      <img src={avatarJoy} alt="" className="mx-auto w-28 h-28 rounded-full shadow-xl" />
      <p className="m-0 mt-4 text-[22px] font-extrabold">참비가 자란 기록</p>
      <p className={`m-0 mt-1 text-[14px] ${dark ? 'text-white/55' : 'text-gray-500 dark:text-white/55'}`}>
        8월부터 <b className="text-brand">6가지</b> 말을 배웠어요
      </p>
    </div>
    <ol className="m-0 p-0 list-none relative">
      <span className={`absolute left-[7px] top-2 bottom-2 w-[2px] ${dark ? 'bg-white/10' : 'bg-gray-200 dark:bg-white/10'}`} />
      {GROWTH.map((g) => (
        <li key={g.name} className="relative pl-8 pb-6">
          <span className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-brand ring-4 ring-[var(--brand-soft-strong)]" />
          <p className={`m-0 text-[13px] font-bold ${dark ? 'text-white/50' : 'text-gray-500 dark:text-white/50'}`}>{g.date}</p>
          <p className="m-0 mt-0.5 text-[17px] font-bold">‘{g.name}’을 배웠어요</p>
          <p className={`m-0 mt-0.5 text-[14px] ${dark ? 'text-white/60' : 'text-gray-600 dark:text-white/60'}`}>
            {g.from}에서 시작 · 그 뒤로 <b className="text-brand">{g.answered}번</b> 답했어요
          </p>
        </li>
      ))}
    </ol>
  </div>
)

// ── C1. 참비 관제실(다크) ─────────────────────────────────

const VariantC1 = () => {
  const [tab, setTab] = useState('q')
  const queue = QUESTIONS.filter((q) => q.status !== 'resolved').sort((a, b) => b.count - a.count)
  const [sel, setSel] = useState(queue[0])
  const maxC = queue[0].count
  return (
    <div className="rounded-[28px] bg-[#0b1220] text-white p-5 lg:p-6 space-y-5 shadow-2xl">
      {/* 상단: 참비 상태 + 주간 막대 */}
      <section className="grid lg:grid-cols-[minmax(0,1fr)_420px] gap-5">
        <div className="rounded-3xl bg-gradient-to-br from-[#16264a] to-[#0f1830] border border-white/10 p-6 flex items-center gap-5">
          <div className="relative">
            <img src={avatarJoy} alt="" className="w-20 h-20 rounded-full ring-4 ring-[#5aa2ff]/40" />
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 ring-4 ring-[#16264a]" />
          </div>
          <div className="flex-1">
            <p className="m-0 text-[13px] font-bold text-emerald-300">● 지금 답하는 중 · 오늘 질문 23개</p>
            <p className="m-0 mt-1 text-[26px] font-extrabold leading-tight">
              이번 주 <span className="text-[#8fc0ff]">93%</span>에 답했어요
            </p>
            <p className="m-0 mt-1 text-[14px] text-white/60">지난주보다 5% 올랐어요 · 가르쳐 줄 질문 5개</p>
          </div>
        </div>
        <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="m-0 text-[14px] font-bold">요일별 질문</p>
            <span className="flex gap-3 text-[12px] text-white/60">
              <span><i className="inline-block w-2 h-2 rounded-full bg-[#5aa2ff] mr-1" />답함</span>
              <span><i className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />애매</span>
              <span><i className="inline-block w-2 h-2 rounded-full bg-rose-400 mr-1" />못 답함</span>
            </span>
          </div>
          <WeekBars dark />
        </div>
      </section>

      <section className="rounded-3xl bg-white/[0.03] border border-white/10 overflow-hidden">
        <div className="px-6 pt-5 border-b border-white/10">
          <DeskTabs tab={tab} setTab={setTab} dark />
        </div>
        {tab === 'k' ? (
          <KnownWords dark />
        ) : tab === 'g' ? (
          <GrowthLog dark />
        ) : (
          <div className="grid lg:grid-cols-[320px_minmax(0,1fr)_400px] min-h-[620px]">
            <div className="border-r border-white/10">
              {queue.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setSel(q)}
                  className={`w-full text-left px-5 py-4 border-b border-white/[0.06] ${sel.id === q.id ? 'bg-white/[0.07] shadow-[inset_3px_0_0_#5aa2ff]' : 'hover:bg-white/[0.03]'}`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${q.status === 'weak' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                    <span className="text-[14.5px] font-semibold truncate flex-1">{q.text}</span>
                  </span>
                  <span className="mt-2 flex items-center gap-2">
                    <span className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                      <span className="block h-full rounded-full bg-[#5aa2ff]" style={{ width: `${(q.count / maxC) * 100}%` }} />
                    </span>
                    <span className="text-[12.5px] text-white/55">{q.count}명</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div>
                <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${sel.status === 'weak' ? 'bg-amber-400/15 text-amber-200' : 'bg-rose-400/15 text-rose-200'}`}>
                  {sel.status === 'weak' ? '엉뚱하게 답했을지도' : '대답 못 함'}
                </span>
                <h2 className="m-0 mt-2 text-[26px] font-extrabold leading-snug">“{sel.text}”</h2>
              </div>
              <div>
                <p className="m-0 mb-2 text-[12.5px] font-bold text-white/50">물은 날</p>
                <div className="flex gap-1.5 flex-wrap">
                  {ASK_LOG[sel.id].map((d, i) => (
                    <span key={i} className="rounded-lg bg-white/[0.06] border border-white/10 px-2.5 py-1 text-[12.5px] text-white/80">{d}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-black/30 p-4 space-y-2.5">
                <p className="m-0 text-[12.5px] font-bold text-white/50">그때 대화</p>
                <UserBubble>{sel.text}</UserBubble>
                {sel.status === 'weak' ? (
                  <BotBubble avatar={avatarThinking} tone="warn">{sel.answer}</BotBubble>
                ) : (
                  <BotBubble avatar={avatarSorry} tone="muted">음… 아직 잘 모르겠어요.</BotBubble>
                )}
              </div>
              <div className="mt-auto flex gap-2">
                <button className="rounded-xl border border-white/15 px-4 py-2.5 text-[14px] font-semibold">괜찮은 답이에요</button>
                <button className="ml-auto rounded-xl px-4 py-2.5 text-[14px] font-semibold text-rose-300">지우기</button>
              </div>
            </div>
            <div className="border-l border-white/10 p-4">
              <SmartTeach key={sel.id} q={sel} dark />
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

// ── C2. 주제별 묶음 + 참비 코치 ──────────────────────────

const VariantC2 = () => {
  const [sel, setSel] = useState(QUESTIONS[0])
  const [doneIds, setDoneIds] = useState<number[]>([])
  const total = 5
  const coach =
    sel.id === 2 || sel.id === 4
      ? { name: '오시는 길', why: '‘교회 시설’ 질문은 보통 오시는 길 화면에서 답이 돼요' }
      : sel.id === 3 || sel.id === 5
        ? { name: '예배 시간', why: '지금은 ‘예배 시간’ 답이 나갔어요. 새 답이 필요해 보여요', warn: true }
        : null
  return (
    <div className="space-y-4">
      {/* 오늘 정리 진행 */}
      <section className="rounded-3xl bg-white dark:bg-card-dark border border-gray-200/80 dark:border-white/10 p-5 flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex items-center gap-4 flex-1">
          <img src={doneIds.length === total ? avatarJoy : avatarDefault} alt="" className="w-14 h-14 rounded-full shadow-md" />
          <div className="flex-1">
            <p className="m-0 text-[18px] font-extrabold text-ink-strong">
              오늘 정리 <span className="text-brand">{doneIds.length}</span> / {total}
            </p>
            <div className="mt-2 h-2.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(doneIds.length / total) * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="flex gap-6 lg:border-l lg:pl-6 border-gray-100 dark:border-white/10">
          {[
            ['이번 주 답한 비율', '93%'],
            ['기다리는 사람', '16명'],
            ['아는 말', '6'],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="m-0 text-[12.5px] text-gray-500 dark:text-white/50">{k}</p>
              <p className="m-0 text-[22px] font-extrabold text-ink-strong">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid lg:grid-cols-[320px_minmax(0,1fr)_400px] rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-card-dark overflow-hidden min-h-[640px]">
        <div className="border-r border-gray-100 dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.02]">
          {CLUSTERS.map((c) => (
            <div key={c.topic}>
              <div className="px-5 pt-4 pb-2 flex items-baseline justify-between">
                <span className="text-[13px] font-extrabold text-ink-strong">{c.topic}</span>
                <span className="text-[12px] text-gray-500 dark:text-white/50">
                  {c.ids.reduce((s, id) => s + QUESTIONS.find((q) => q.id === id)!.count, 0)}명
                </span>
              </div>
              {c.ids.map((id) => {
                const q = QUESTIONS.find((x) => x.id === id)!
                const done = doneIds.includes(id)
                return (
                  <button
                    key={id}
                    onClick={() => setSel(q)}
                    className={`mx-2 mb-1 w-[calc(100%-16px)] text-left rounded-2xl px-3.5 py-3 flex items-center gap-3 ${
                      sel.id === id ? 'bg-white dark:bg-white/10 shadow-md ring-1 ring-[var(--brand-glow)]' : 'hover:bg-white/70 dark:hover:bg-white/[0.04]'
                    } ${done ? 'opacity-50' : ''}`}
                  >
                    <span className={`shrink-0 w-2 h-2 rounded-full ${done ? 'bg-emerald-400' : q.status === 'weak' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[14.5px] font-semibold text-ink-strong truncate ${done ? 'line-through' : ''}`}>{q.text}</span>
                      <span className="block text-[12.5px] text-gray-500 dark:text-white/50">{q.count}명 · {q.date}</span>
                    </span>
                  </button>
                )
              })}
              {c.hint && <p className="m-0 px-5 pb-2 text-[12px] text-brand">↳ {c.hint}</p>}
            </div>
          ))}
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div>
            <p className="m-0 text-[13px] font-bold text-gray-500 dark:text-white/50">{sel.date}부터 {sel.count}명이 물었어요</p>
            <h2 className="m-0 mt-1 text-[26px] font-extrabold text-ink-strong leading-snug">“{sel.text}”</h2>
          </div>
          {/* 참비 코치 */}
          <div className={`rounded-2xl p-4 flex gap-3 border ${coach?.warn ? 'bg-amber-50 border-amber-200 dark:bg-amber-400/[0.08] dark:border-amber-400/25' : 'bg-[var(--brand-soft)] border-[var(--brand-glow)]'}`}>
            <img src={avatarTalking} alt="" className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1">
              <p className="m-0 text-[14px] font-bold text-ink-strong">참비 생각</p>
              <p className="m-0 mt-0.5 text-[14px] text-gray-700 dark:text-white/75 leading-relaxed">
                {coach ? coach.why : '처음 보는 주제예요. 새 답을 만들어 주시면 좋겠어요.'}
              </p>
              {coach && !coach.warn && (
                <button className="mt-2 rounded-xl bg-brand text-white px-3.5 py-1.5 text-[13px] font-bold">‘{coach.name}’에 키워드만 붙이기</button>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 p-4 space-y-2.5">
            <p className="m-0 text-[12.5px] font-bold text-gray-500 dark:text-white/45">그때 대화</p>
            <UserBubble>{sel.text}</UserBubble>
            {sel.status === 'weak' ? (
              <BotBubble avatar={avatarThinking} tone="warn">{sel.answer}</BotBubble>
            ) : (
              <BotBubble avatar={avatarSorry} tone="muted">음… 아직 잘 모르겠어요.</BotBubble>
            )}
          </div>
          <div className="mt-auto flex items-center gap-2 rounded-2xl bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-[12.5px] text-gray-500 dark:text-white/50">
            <kbd className="rounded-md border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-1.5 font-sans">↑↓</kbd> 이동
            <kbd className="ml-2 rounded-md border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-1.5 font-sans">Enter</kbd> 알려 주기
            <kbd className="ml-2 rounded-md border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 px-1.5 font-sans">G</kbd> 괜찮은 답
            <span className="ml-auto text-rose-500 font-semibold">지우기</span>
          </div>
        </div>

        <div className="border-l border-gray-100 dark:border-white/[0.06] p-4">
          <SmartTeach
            key={sel.id}
            q={sel}
            onDone={() => {
              const next = [...doneIds, sel.id]
              setDoneIds(next)
              const n = QUESTIONS.find((q) => q.status !== 'resolved' && !next.includes(q.id))
              if (n) setSel(n)
            }}
          />
        </div>
      </section>
    </div>
  )
}

// ── C3. 한 데스크 — 왼쪽 레일 + 아는 말 관리 ────────────

const VariantC3 = () => {
  const [tab, setTab] = useState('q')
  const queue = QUESTIONS.filter((q) => q.status !== 'resolved')
  const [sel, setSel] = useState(queue[0])
  const nav = [
    ['q', '질문함', '5', avatarSorry],
    ['k', '아는 말', '6', avatarTalking],
    ['g', '성장 기록', '', avatarJoy],
  ] as const
  return (
    <section className="grid lg:grid-cols-[230px_minmax(0,1fr)] rounded-[28px] border border-gray-200/80 dark:border-white/10 bg-white dark:bg-card-dark overflow-hidden shadow-xl min-h-[720px]">
      {/* 왼쪽 레일 */}
      <aside className="bg-gradient-to-b from-[#eaf3ff] to-white dark:from-[#14243f] dark:to-card-dark border-r border-gray-100 dark:border-white/[0.06] p-4 flex flex-col gap-1">
        <div className="flex items-center gap-3 px-2 pb-5 pt-2">
          <img src={avatarDefault} alt="" className="w-11 h-11 rounded-full shadow-md" />
          <div>
            <p className="m-0 text-[16px] font-extrabold text-ink-strong">참비</p>
            <p className="m-0 text-[12px] text-emerald-600 dark:text-emerald-300 font-semibold">● 답하는 중</p>
          </div>
        </div>
        {nav.map(([k, l, n, img]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left ${tab === k ? 'bg-white dark:bg-white/10 shadow-md' : 'hover:bg-white/60 dark:hover:bg-white/[0.04]'}`}
          >
            <img src={img} alt="" className="w-8 h-8 rounded-full" />
            <span className="flex-1 text-[15px] font-bold text-ink-strong">{l}</span>
            {n && <span className={`text-[13px] font-extrabold ${k === 'q' ? 'text-amber-600 dark:text-amber-300' : 'text-gray-400'}`}>{n}</span>}
          </button>
        ))}
        <div className="mt-auto rounded-2xl bg-white/80 dark:bg-white/[0.05] border border-white dark:border-white/10 p-4">
          <p className="m-0 text-[12.5px] text-gray-500 dark:text-white/50">이번 주 답한 비율</p>
          <p className="m-0 text-[28px] font-extrabold text-ink-strong">93%</p>
          <WeekBars />
        </div>
      </aside>

      <div className="min-w-0">
        {tab === 'k' ? (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.06]">
              <div>
                <h2 className="m-0 text-[22px] font-extrabold text-ink-strong">참비가 아는 말</h2>
                <p className="m-0 text-[13.5px] text-gray-500 dark:text-white/50">많이 답한 순 · 줄을 누르면 오른쪽에서 살펴봐요</p>
              </div>
              <button className="rounded-xl bg-brand text-white px-4 py-2.5 text-[14px] font-bold">+ 새 말</button>
            </div>
            <KnownWords />
          </>
        ) : tab === 'g' ? (
          <GrowthLog />
        ) : (
          <div className="grid xl:grid-cols-[minmax(0,1fr)_400px] min-h-[720px]">
            <div className="p-6 space-y-5">
              <div className="flex items-baseline justify-between">
                <h2 className="m-0 text-[22px] font-extrabold text-ink-strong">가르쳐 줄 질문</h2>
                <span className="text-[13px] text-gray-500 dark:text-white/50">많이 물은 순 · 해결 2개 숨김</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {queue.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setSel(q)}
                    className={`text-left rounded-2xl border p-4 ${sel.id === q.id ? 'border-brand bg-[var(--brand-soft)] shadow-[0_10px_28px_-14px_var(--brand-glow)]' : 'border-gray-200/80 dark:border-white/10 hover:border-[var(--brand-glow)]'}`}
                  >
                    <span className="flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-bold ${q.status === 'weak' ? 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200' : 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200'}`}>
                        {q.status === 'weak' ? '애매한 답' : '못 답함'}
                      </span>
                      <span className="text-[22px] font-extrabold text-ink-strong">
                        {q.count}
                        <span className="text-[12px] font-semibold text-gray-500 dark:text-white/50">명</span>
                      </span>
                    </span>
                    <span className="mt-2 block text-[15.5px] font-bold text-ink-strong leading-snug">“{q.text}”</span>
                    <span className="mt-1 block text-[12.5px] text-gray-500 dark:text-white/50">처음 {q.date}</span>
                  </button>
                ))}
              </div>
              <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 p-4 space-y-2.5">
                <p className="m-0 text-[12.5px] font-bold text-gray-500 dark:text-white/45">“{sel.text}” — 그때 대화</p>
                <UserBubble>{sel.text}</UserBubble>
                {sel.status === 'weak' ? (
                  <BotBubble avatar={avatarThinking} tone="warn">{sel.answer}</BotBubble>
                ) : (
                  <BotBubble avatar={avatarSorry} tone="muted">음… 아직 잘 모르겠어요.</BotBubble>
                )}
              </div>
            </div>
            <div className="border-l border-gray-100 dark:border-white/[0.06] p-4 bg-gray-50/50 dark:bg-white/[0.01]">
              <SmartTeach key={sel.id} q={sel} />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ── 적용본: 실제 /admin/chatbot 컴포넌트를 표본 데이터로 ─────────────
const dayAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString()
const REAL_Q: ChatbotUnanswered[] = QUESTIONS.map((q, i) => ({
  id: q.id,
  text: q.text,
  ask_count: q.count,
  status: q.status,
  answer: q.status === 'weak' ? `[시간표 전체 폴백] ${q.answer}` : q.status === 'resolved' ? '저는 참빛교회 안내 양, 참비예요!' : null,
  created_at: dayAgo(i),
  updated_at: dayAgo(Math.max(0, i - 1)),
}))
const REAL_I: ChatbotIntent[] = INTENTS.map((it) => ({
  id: it.id,
  name: it.name,
  keywords: it.keywords,
  answer: it.answer,
  actions: it.actions.map((a) => ({ label: a.label, type: 'link' as const, value: '/worship' })),
  is_active: it.on,
  order: 0,
  created_at: dayAgo(30),
}))
const VariantReal = () => {
  const [tab, setTab] = useState<'q' | 'k' | 'g'>('q')
  const noop = () => undefined
  return (
    <div className="space-y-4">
      <ChatbotHero unanswered={REAL_Q} intents={REAL_I} />
      <section className="rounded-3xl bg-white dark:bg-[#0f1830] border border-gray-200/80 dark:border-white/10 overflow-hidden">
        <div className="px-6 pt-4 flex gap-6 border-b border-gray-100 dark:border-white/[0.07]">
          {(['q', 'k', 'g'] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={`pb-3 text-[16px] font-bold ${tab === k ? 'text-ink-strong dark:text-white' : 'text-gray-400'}`}>
              {k === 'q' ? '질문함' : k === 'k' ? '아는 말' : '성장 기록'}
            </button>
          ))}
        </div>
        {tab === 'q' ? (
          <QuestionDesk unanswered={REAL_Q} intents={REAL_I} onSaved={noop} onResolve={noop} onDelete={noop} />
        ) : tab === 'k' ? (
          <RealKnownWords intents={REAL_I} onSaved={noop} onToggle={noop} onDelete={noop} />
        ) : (
          <RealGrowthLog unanswered={REAL_Q} intents={REAL_I} capLabel={(n) => `${n}`} onDelete={noop} />
        )}
      </section>
    </div>
  )
}

// ── 껍데기 ───────────────────────────────────────────────

const VARIANTS = [
  { k: 'real', label: '적용본(실제 컴포넌트)', C: VariantReal },
  { k: 'c1', label: 'C1 참비 관제실(다크)', C: VariantC1 },
  { k: 'c2', label: 'C2 주제별 묶음+참비 생각', C: VariantC2 },
  { k: 'c3', label: 'C3 왼쪽 레일 한 데스크', C: VariantC3 },
  { k: 'c', label: 'C 원안', C: VariantC },
  { k: 'a', label: 'A 가르치기 교실', C: VariantA },
  { k: 'b', label: 'B 말 사전', C: VariantB },
] as const

const ChatbotAdminPreview = () => {
  const [sp, setSp] = useSearchParams()
  const v = VARIANTS.find((x) => x.k === sp.get('v')) ?? VARIANTS[0]
  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="sticky top-0 z-40 flex flex-wrap gap-2 px-4 py-2 bg-black/80 backdrop-blur">
        {VARIANTS.map((x) => (
          <button
            key={x.k}
            onClick={() => setSp({ v: x.k })}
            className={`rounded-full px-3 py-1 text-[12.5px] font-bold ${x.k === v.k ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[20px] font-extrabold tracking-tight text-ink-strong">참비 관리</span>
          <span className="text-[13px] text-gray-500 dark:text-white/50">성도들이 묻는 말을 참비에게 알려 주는 곳</span>
        </div>
        <v.C />
      </div>
    </div>
  )
}

export default ChatbotAdminPreview
