import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { sendChatbotMessage } from '../../../api/chatbot'
import { getTodayVerse } from '../../../api/dailyVerse'
import type { ChatAction, ChatReply } from '../../../types/chatbot'
import { showToast } from '../../../utils/toast'
import avatarDefault from '../../../components/chatbot/img/default.webp'
import avatarThinking from '../../../components/chatbot/img/thinking.webp'
import avatarJoy from '../../../components/chatbot/img/joy.webp'
import avatarComfort from '../../../components/chatbot/img/comfort.webp'
import avatarPraying from '../../../components/chatbot/img/praying.webp'
import avatarSorry from '../../../components/chatbot/img/sorry.webp'
import avatarTalking from '../../../components/chatbot/img/talking.webp'
import { ChevronRightIcon } from '../../About/icons'
import { Reveal, SectionHeader } from './shared'

// 인터랙티브 데모 — "스마트한 교회"를 글로 주장하지 않고 세 가지를 직접 만져보게 한다.
// ① 참비에게 한 마디(실제 챗봇 API, 비로그인 허용) ② 통독표 도장 체험 ③ 오늘의 말씀 카드

const AVATARS: Record<string, string> = {
  default: avatarDefault, talking: avatarTalking, thinking: avatarThinking,
  joy: avatarJoy, comfort: avatarComfort, sorry: avatarSorry, praying: avatarPraying,
}

const stripMd = (s: string) => s.replace(/^#{1,6}\s*/gm, '').replace(/\*\*(.+?)\*\*/g, '$1').trim()

type Msg = { id: number; role: 'user'; text: string } | { id: number; role: 'bot'; reply: ChatReply }
let nextId = 1

// ── ① 참비 ────────────────────────────────────────────────────────────
const ChambiTry = ({ ko }: { ko: boolean }) => {
  const navigate = useNavigate()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const chips = ko
    ? ['오늘 힘든 날인데 말씀 하나만요', '주일 예배 몇 시예요?', '요한복음 3장 16절', '주차 돼요?']
    : ['Rough day — one verse please', 'What time is Sunday service?', 'John 3:16', 'Is there parking?']

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs, loading])

  const send = useCallback(async (text: string) => {
    const q = text.trim()
    if (!q || loading) return
    setInput('')
    setMsgs((prev) => [...prev, { id: nextId++, role: 'user', text: q }])
    setLoading(true)
    try {
      const res = await sendChatbotMessage(q)
      setMsgs((prev) => [...prev, ...res.replies.map((reply) => ({ id: nextId++, role: 'bot' as const, reply }))])
    } catch {
      setMsgs((prev) => [
        ...prev,
        {
          id: nextId++,
          role: 'bot',
          reply: {
            kind: 'error',
            text: ko ? '잠깐 연결이 끊겼어요. 한 번만 더 물어봐 주세요.' : 'Lost the connection for a second — try once more.',
            verses: [],
            actions: [],
            expression: 'sorry',
          },
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [loading, ko])

  const onAction = (a: ChatAction) => {
    if (a.type === 'link') navigate(a.value)
    else send(a.value)
  }

  return (
    <article className="feed-card rounded-3xl p-5 flex flex-col min-w-0">
      <div className="flex items-center gap-3">
        <img src={avatarDefault} alt="" className="w-11 h-11 rounded-full" draggable={false} />
        <div className="min-w-0">
          <h3 className="text-[17px] font-extrabold tracking-tight text-ink-strong leading-tight">
            {ko ? '참비에게 한 마디' : 'Say hi to Chambi'}
          </h3>
          <p className="text-[12.5px] text-ink-muted">
            {ko ? '우리 교회 말씀 비서. 로그인 없이도 대답해요.' : 'Our Word assistant. No login needed.'}
          </p>
        </div>
      </div>

      <div ref={listRef} className="mt-4 h-[240px] overflow-y-auto rounded-2xl bg-surface-container p-3 flex flex-col gap-2.5 [overflow-wrap:anywhere]">
        {msgs.length === 0 && !loading && (
          <p className="m-auto text-center text-[13px] text-ink-muted px-4 leading-relaxed">
            {ko ? '아래 질문 하나를 눌러보세요.\n진짜 성경 구절로 대답합니다.' : 'Tap a question below.\nIt answers with real scripture.'}
          </p>
        )}
        {msgs.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="self-end max-w-[85%] rounded-2xl rounded-br-md brand-gradient px-3.5 py-2 text-[13.5px] text-white">
              {m.text}
            </div>
          ) : (
            <div key={m.id} className="flex items-start gap-2 max-w-[95%]">
              <img src={AVATARS[m.reply.expression ?? ''] ?? avatarDefault} alt="" className="h-8 w-8 shrink-0 rounded-full mt-0.5" draggable={false} />
              <div className="flex flex-col items-start gap-1.5 min-w-0">
                <div className="rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink">
                  {m.reply.text && <p className="whitespace-pre-line m-0">{m.reply.text}</p>}
                  {m.reply.verses.map((v) => (
                    <blockquote key={v.reference + v.text.slice(0, 8)} className="my-2 border-l-[3px] pl-2.5 py-0.5" style={{ borderColor: 'var(--brand)' }}>
                      <p className="m-0 text-[13px] leading-relaxed text-ink">{v.text}</p>
                      <p className="m-0 mt-1 text-[11.5px] font-semibold text-ink-muted">{v.reference}</p>
                    </blockquote>
                  ))}
                  {m.reply.commentary && (
                    <p className="mt-2 m-0 whitespace-pre-line text-[12.5px] leading-relaxed text-ink-muted line-clamp-4">
                      {stripMd(m.reply.commentary.content)}
                    </p>
                  )}
                </div>
                {m.reply.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.reply.actions.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        onClick={() => onAction(a)}
                        className="rounded-full border px-2.5 py-1 text-[12px] font-medium text-brand hover:opacity-75"
                        style={{ borderColor: 'var(--brand)', background: 'var(--brand-soft)' }}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        {loading && (
          <div className="flex items-start gap-2">
            <img src={avatarThinking} alt="" className="h-8 w-8 shrink-0 rounded-full" draggable={false} />
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-surface px-3.5 py-3">
              {[0, 1, 2].map((i) => (
                <span key={i} className="ld-dot h-1.5 w-1.5 rounded-full bg-ink-muted" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => send(c)}
            className="px-2.5 py-1.5 rounded-full bg-[var(--brand-soft)] text-brand text-[12.5px] font-semibold hover:bg-[var(--brand-soft-strong)] transition-colors"
          >
            {c}
          </button>
        ))}
      </div>
      <form
        className="mt-2.5 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={ko ? '무엇이든 물어보세요' : 'Ask anything'}
          className="flex-1 min-w-0 rounded-full bg-surface-container px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-muted outline-none focus:ring-2 focus:ring-[var(--brand-glow)]"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="brand-gradient rounded-full px-4 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-40"
        >
          {ko ? '보내기' : 'Send'}
        </button>
      </form>
    </article>
  )
}

// ── ② 통독표 도장 ─────────────────────────────────────────────────────
const STAMP_TOTAL = 12
const STAMP_TILTS = [-6, 4, -3, 7, -8, 2, 5, -4, 3, -7, 6, -2]

const StampDemo = ({ ko }: { ko: boolean }) => {
  const navigate = useNavigate()
  const [inked, setInked] = useState<Set<number>>(() => new Set([1, 2, 3]))
  const count = inked.size
  const pct = Math.round((count / STAMP_TOTAL) * 100)

  const toggle = (n: number) => {
    setInked((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })
  }

  const tease =
    count === STAMP_TOTAL
      ? ko ? '창세기 12장 완독! 이 맛에 통독합니다.' : 'Genesis 1–12 done! This is the feeling.'
      : count >= 8
        ? ko ? '거의 다 왔어요. 도장 소리 들리시죠?' : 'Almost there. Hear the stamp?'
        : ko ? '칸을 눌러 도장을 찍어보세요.' : 'Tap a box to stamp it.'

  return (
    <article className="feed-card rounded-3xl p-5 flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] font-extrabold tracking-tight text-ink-strong leading-tight">
            {ko ? '통독표 도장 찍어보기' : 'Try the stamp chart'}
          </h3>
          <p className="text-[12.5px] text-ink-muted">{ko ? '창세기 1~12장 · 체험판' : 'Genesis 1–12 · demo'}</p>
        </div>
        <span className="ld-ticker-num text-[20px] font-extrabold text-brand shrink-0">
          {count}<span className="text-[12px] text-ink-muted font-bold">/{STAMP_TOTAL}</span>
        </span>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-2">
        {Array.from({ length: STAMP_TOTAL }, (_, i) => i + 1).map((n) => {
          const on = inked.has(n)
          return (
            <button
              key={n}
              type="button"
              onClick={() => toggle(n)}
              aria-pressed={on}
              aria-label={ko ? `창세기 ${n}장` : `Genesis ${n}`}
              className={`ld-stamp-cell ${on ? 'is-inked' : ''}`}
              style={{ ['--tilt' as string]: `${STAMP_TILTS[n - 1]}deg` }}
            >
              <span className={on ? 'opacity-30' : ''}>{n}</span>
              {on && (
                <span className="ld-stamp" aria-hidden>
                  <span className="ld-stamp-seal">{ko ? '읽음' : 'READ'}</span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
          <div className="h-full brand-gradient rounded-full transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-[13px] font-semibold text-ink">{tease}</p>
        <p className="mt-1 text-[12.5px] text-ink-muted leading-relaxed">
          {ko
            ? '로그인하면 66권 1,189장이 전부 이렇게 쌓입니다. 진행률·스트릭·완주 칭호까지.'
            : 'Sign in and all 1,189 chapters of 66 books stack up like this — with progress, streaks and titles.'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/bible')}
        className="mt-auto pt-4 inline-flex items-center gap-1 text-[13.5px] font-bold text-brand hover:underline self-start"
      >
        {ko ? '진짜 통독표 보러 가기' : 'See the real chart'}
        <ChevronRightIcon size={15} />
      </button>
    </article>
  )
}

// ── ③ 오늘의 말씀 카드 ────────────────────────────────────────────────
const VerseCardDemo = ({ ko }: { ko: boolean }) => {
  const navigate = useNavigate()
  const { data } = useQuery({
    queryKey: ['daily-verse', 'current'],
    queryFn: getTodayVerse,
    staleTime: 1000 * 60 * 30,
    retry: false,
  })
  const text = data?.verse_text ?? (ko
    ? '여호와는 나의 목자시니 내게 부족함이 없으리로다'
    : 'The Lord is my shepherd; I shall not want.')
  const ref = data?.verse_reference ?? (ko ? '시편 23:1' : 'Psalm 23:1')

  const share = async () => {
    const payload = `${text}\n— ${ref}\n${window.location.origin}`
    try {
      if (navigator.share) {
        await navigator.share({ text: payload })
        return
      }
      await navigator.clipboard.writeText(payload)
      showToast(ko ? '말씀을 복사했어요' : 'Verse copied')
    } catch {
      /* 사용자가 취소 */
    }
  }

  return (
    <article className="feed-card rounded-3xl p-5 flex flex-col">
      <h3 className="text-[17px] font-extrabold tracking-tight text-ink-strong leading-tight">
        {ko ? '오늘의 말씀, 카드로' : "Today's verse, as a card"}
      </h3>
      <p className="text-[12.5px] text-ink-muted">
        {ko ? '매일 아침 한 절. 사진·필터·프레임을 골라 카드로 만들 수 있어요.' : 'One verse every morning. Pick a photo, filter and frame to make it a card.'}
      </p>
      <div className="ld-verse-card relative mt-4 overflow-hidden rounded-2xl brand-gradient px-5 py-7 text-white min-h-[180px] flex flex-col justify-center">
        <p className="relative text-[17px] lg:text-[18px] font-bold leading-relaxed break-keep">“{text}”</p>
        <p className="relative mt-3 text-[12.5px] font-semibold text-white/80">{ref}</p>
        <span className="absolute left-5 bottom-3 text-[10px] font-bold tracking-[0.2em] text-white/55 uppercase">Chambit</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={share}
          className="relative px-4 py-2 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors seal-chip-inverse [--seal-drop:none]"
        >
          {ko ? '이 말씀 나누기' : 'Share this verse'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/bible/photo-verse')}
          className="px-4 py-2 rounded-full ring-1 ring-inset ring-black/[0.08] dark:ring-white/[0.12] text-ink-strong text-[13px] font-bold hover:bg-[var(--brand-soft)] hover:text-brand transition-colors"
        >
          {ko ? '내 말씀 카드 만들기' : 'Make my own card'}
        </button>
      </div>
    </article>
  )
}

const DemoSection = ({ ko }: { ko: boolean }) => (
  <section id="tour" className="mt-16 scroll-mt-20">
    <Reveal>
      <SectionHeader
        kicker={ko ? '직접 써보기' : 'Try it'}
        title={ko ? '말로 하면 안 믿으실까 봐,\n지금 바로 만져보세요' : "Don't take our word for it —\ntry three things right now"}
      />
    </Reveal>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Reveal className="h-full"><ChambiTry ko={ko} /></Reveal>
      <Reveal className="h-full" delay={80}><StampDemo ko={ko} /></Reveal>
      <Reveal className="h-full" delay={160}><VerseCardDemo ko={ko} /></Reveal>
    </div>
  </section>
)

export default DemoSection
