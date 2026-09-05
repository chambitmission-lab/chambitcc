import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sparkle, Check } from '../icons/phosphor'
import { EmojiText } from '../common/EmojiText'
import { getChatbotGreeting, sendChatbotMessage } from '../../api/chatbot'
import { tryGlossaryReply } from './localGlossary'
import type { ChatAction, ChatReply } from '../../types/chatbot'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { OPEN_CHATBOT_EVENT } from '../command/commandEvents'
// 환영 장면은 패널을 열어야 보인다 — lazy 로 분리해 위젯 버튼만 첫 로드에 남긴다
const WelcomeScene = lazy(() => import('./WelcomeScene'))
import { RECOMMENDED } from './recommended'
import { useChatbotHidden, hideChatbot, hideChatbotForever, showChatbot } from './chatbotVisibility'
import './chatbot.css'
import avatarDefault from './img/default.webp'
import avatarTalking from './img/talking.webp'
import avatarThinking from './img/thinking.webp'
import avatarJoy from './img/joy.webp'
import avatarComfort from './img/comfort.webp'
import avatarSorry from './img/sorry.webp'
import avatarPraying from './img/praying.webp'

// 응답의 expression 값 → 양 캐릭터 표정 이미지 (없으면 기본 표정)
const AVATARS: Record<string, string> = {
  default: avatarDefault,
  talking: avatarTalking,
  thinking: avatarThinking,
  joy: avatarJoy,
  comfort: avatarComfort,
  sorry: avatarSorry,
  praying: avatarPraying,
}
const avatarFor = (expression?: string | null) => AVATARS[expression ?? ''] ?? avatarDefault

// 규칙 기반 교회 챗봇 "참빛 말씀비서" — 전역 플로팅 위젯.
// 대화 상태는 이 컴포넌트(항상 마운트)에 남아 패널을 닫아도 유지된다.

type Msg =
  | { id: number; role: 'user'; text: string; at: Date }
  | { id: number; role: 'bot'; reply: ChatReply }

let nextId = 1

// 페이지 스크롤 위치 — html/body에 overflow-x:hidden이 걸려 실제 스크롤러가 body다
const scrollTop = () =>
  window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0

// 해석 본문은 마크다운으로 저장돼 있다 — 채팅 말풍선에서는 제목 기호만 걷어낸다
const stripMd = (s: string) =>
  s.replace(/^#{1,6}\s*/gm, '').replace(/\*\*(.+?)\*\*/g, '$1').trim()

/** 사용자 메시지 옆에 붙는 시각 — "오후 8:30" */
const timeLabel = (d: Date) => {
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m}`
}

// 이모지로 시작하는 짧은 첫 줄(예: "⛪ 예배 안내")은 제목으로 승격한다
const EMOJI_HEAD = /^[\p{Extended_Pictographic}☀-➿]️?\s*\S/u
const isTitleLine = (line: string, index: number) => index === 0 && line.length <= 24 && EMOJI_HEAD.test(line)
// "[주일 예배]" — 섹션 라벨
const SECTION = /^\[(.+)\]$/
// 가운뎃점 "·" = 라벨-값 표 ("· 주일낮예배 1부 — 오전 7:30 (오렌엘 홀)")
const ROW = /^·\s*(.+?)\s+[—–-]\s+(.+?)(?:\s*\((.+)\))?$/
// 불릿 "•" = 인물 목록 ("• 암논 — 다윗의 맏아들") — 이름이 주인공이라 표와 강조가 반대다
const PERSON = /^•\s*(.+?)(?:\s+[—–-]\s+(.+))?$/

type Block =
  | { t: 'title'; text: string }
  | { t: 'section'; text: string }
  | { t: 'rows'; rows: { name: string; time: string; loc?: string }[] }
  | { t: 'people'; people: { name: string; desc?: string }[] }
  | { t: 'para'; text: string }

/** 백엔드 플레인 텍스트를 제목·섹션·시간표·문단 블록으로 해체 (형식이 안 맞으면 전부 문단) */
const parseBotText = (text: string): Block[] => {
  const blocks: Block[] = []
  const lines = text.split('\n')
  let para: string[] = []
  const flush = () => {
    if (para.length) blocks.push({ t: 'para', text: para.join('\n') })
    para = []
  }
  lines.forEach((raw, i) => {
    const line = raw.trim()
    if (!line) { flush(); return }
    if (isTitleLine(line, i)) { flush(); blocks.push({ t: 'title', text: line }); return }
    const sec = line.match(SECTION)
    if (sec) { flush(); blocks.push({ t: 'section', text: sec[1] }); return }
    const row = line.match(ROW)
    if (row) {
      flush()
      const last = blocks[blocks.length - 1]
      const r = { name: row[1], time: row[2], loc: row[3] }
      if (last?.t === 'rows') last.rows.push(r)
      else blocks.push({ t: 'rows', rows: [r] })
      return
    }
    const person = line.match(PERSON)
    if (person) {
      flush()
      const last = blocks[blocks.length - 1]
      const p = { name: person[1], desc: person[2] }
      if (last?.t === 'people') last.people.push(p)
      else blocks.push({ t: 'people', people: [p] })
      return
    }
    para.push(line)
  })
  flush()
  return blocks
}

const BotText = ({ text }: { text: string }) => (
  <>
    {parseBotText(text).map((b, i) => {
      if (b.t === 'title') return <p key={i} className="cb-msg-title m-0"><EmojiText text={b.text} size={18} /></p>
      if (b.t === 'section') return <p key={i} className="cb-msg-section m-0">{b.text}</p>
      if (b.t === 'rows')
        return (
          <div key={i} className="cb-msg-table">
            {b.rows.map((r, j) => (
              <div key={j} className="cb-msg-row">
                <span className="cb-msg-dot" aria-hidden />
                <span className="cb-msg-name">{r.name}</span>
                <span className="cb-msg-time">{r.time}</span>
                {r.loc && <span className="cb-msg-loc">({r.loc})</span>}
              </div>
            ))}
          </div>
        )
      if (b.t === 'people')
        return (
          <div key={i} className="cb-msg-people">
            {b.people.map((p, j) => (
              <div key={j} className="cb-msg-person">
                <span className="cb-msg-dot" aria-hidden />
                <span className="cb-person-name">{p.name}</span>
                {p.desc && <span className="cb-person-desc">{p.desc}</span>}
              </div>
            ))}
          </div>
        )
      return <p key={i} className="cb-msg-para m-0"><EmojiText text={b.text} /></p>
    })}
  </>
)

const BotAvatar = ({ src }: { src: string }) => (
  <span className="cb-avatar shrink-0">
    <img src={src} alt="" draggable={false} />
  </span>
)

const BotBubble = ({
  reply,
  onAction,
}: {
  reply: ChatReply
  onAction: (a: ChatAction) => void
}) => (
  <div className="flex items-start gap-2.5 max-w-[94%]">
    <BotAvatar src={avatarFor(reply.expression)} />
    <div className="flex flex-col items-start gap-2 min-w-0">
      <div className="cb-msg">
        {reply.text && <BotText text={reply.text} />}
        {reply.verses.map((v) => (
          <blockquote key={v.reference + v.text.slice(0, 8)} className="cb-verse-quote">
            <p className="m-0 text-[13.5px] leading-relaxed text-ink">{v.text}</p>
            <p className="m-0 mt-1.5 text-[12px] font-bold text-brand">{v.reference}</p>
          </blockquote>
        ))}
        {reply.commentary && (
          <div className="cb-commentary">
            <p className="m-0 mb-1 text-[12px] font-bold text-brand">
              <EmojiText text="📖" size={14} />{' '}
              {reply.commentary.scope === 'summary' ? '요약 해석' : '절별 해석'}
              {reply.commentary.title ? ` — ${reply.commentary.title}` : ''}
            </p>
            <p className="m-0 whitespace-pre-line text-[13px] leading-relaxed text-ink">
              {stripMd(reply.commentary.content)}
            </p>
          </div>
        )}
        {reply.kind !== 'greeting' && reply.kind !== 'help' && reply.kind !== 'fallback' && (
          <div className="cb-msg-foot">
            <span className="cb-msg-foot-text">
              <EmojiText text="💜" size={14} /> 도움이 되었길 바라요
            </span>
          </div>
        )}
      </div>
      {reply.actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {reply.actions.map((a) => (
            <button key={a.label} type="button" onClick={() => onAction(a)} className="cb-action">
              <EmojiText text={a.label} size={16} />
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
)

const TypingDots = () => (
  <div className="flex items-start gap-2.5">
    <BotAvatar src={avatarThinking} />
    <div className="cb-msg flex items-center gap-1 !py-3.5 w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-ink-muted animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  </div>
)

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const greetedRef = useRef(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // 인증 화면에서는 위젯을 숨긴다
  const hidden = ['/login', '/register'].includes(location.pathname)

  const appendReplies = useCallback((replies: ChatReply[]) => {
    setMsgs((prev) => [
      ...prev,
      ...replies.map((reply) => ({ id: nextId++, role: 'bot' as const, reply })),
    ])
  }, [])

  // 인사 + 메뉴 — 처음 열 때, 그리고 "새로 시작"에서 다시 받아온다
  const loadGreeting = useCallback(() => {
    greetedRef.current = true
    setLoading(true)
    getChatbotGreeting()
      .then((res) => appendReplies(res.replies))
      .catch(() =>
        appendReplies([
          {
            kind: 'fallback',
            text: '지금은 연결이 원활하지 않아요 🙏 잠시 후 다시 열어주세요.',
            verses: [],
            actions: [],
            expression: 'sorry',
          },
        ]),
      )
      .finally(() => setLoading(false))
  }, [appendReplies])

  useEffect(() => {
    if (!open || greetedRef.current) return
    loadGreeting()
  }, [open, loadGreeting])

  // 외부(⌘K 팔레트 등)에서 "참비에게 물어보기" — 패널을 열고, 인사가 끝나면 질문을 보낸다
  const pendingRef = useRef<string | null>(null)
  useEffect(() => {
    const onOpen = (e: Event) => {
      const message = (e as CustomEvent<{ message?: string }>).detail?.message?.trim()
      if (message) pendingRef.current = message
      setOpen(true)
    }
    window.addEventListener(OPEN_CHATBOT_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_CHATBOT_EVENT, onOpen)
  }, [])

  // 모바일에서 아래로 스크롤하는 동안 FAB을 오른쪽으로 접어둔다 — 읽는 화면을 가리지 않게.
  // 위로 올리거나 최상단이면 다시 나온다. PC(lg+)는 코너 위젯이라 항상 노출.
  // 이 앱의 실제 스크롤러는 window가 아니라 body(ScrollRestoration 주석 참고)라
  // scroll은 document에서 capture로 받고 위치도 body/html 기준으로 읽는다.
  const [tucked, setTucked] = useState(false)
  useEffect(() => {
    setTucked(false)
    if (open) return
    let last = scrollTop()
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const y = scrollTop()
        const delta = y - last
        if (Math.abs(delta) < 6) return
        last = y
        setTucked(y > 140 && delta > 0)
      })
    }
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true })
      if (raf) cancelAnimationFrame(raf)
    }
  }, [open, location.pathname])

  // FAB 숨기기 — 롱프레스(모바일)/hover(PC)로 × 배지를 꺼내 누른다.
  // 기본은 이번 방문만 숨김이라 새로고침하면 참비가 다시 나온다(chatbotVisibility 참고).
  const fabHidden = useChatbotHidden()
  const [peek, setPeek] = useState(false)      // × 배지 노출
  const [snack, setSnack] = useState(false)    // 숨긴 직후 되돌리기 스낵바
  const pressRef = useRef<number | null>(null)
  const longPressedRef = useRef(false)

  // 롱프레스 0.45초 → × 배지. 손을 떼면 타이머만 정리하고 배지는 남긴다.
  const startPress = useCallback(() => {
    longPressedRef.current = false
    pressRef.current = window.setTimeout(() => {
      longPressedRef.current = true
      setPeek(true)
    }, 450)
  }, [])
  const endPress = useCallback(() => {
    if (pressRef.current) window.clearTimeout(pressRef.current)
    pressRef.current = null
  }, [])
  useEffect(() => () => endPress(), [endPress])

  // 배지를 꺼낸 채 방치하면 4초 뒤 다시 접는다 (모바일에는 hover-out 이 없다)
  useEffect(() => {
    if (!peek) return
    const t = window.setTimeout(() => setPeek(false), 4000)
    return () => window.clearTimeout(t)
  }, [peek])

  // 스낵바는 7초 뒤 스스로 사라진다 — 그대로 두면 "이번 방문만 숨김"이 유지된다
  useEffect(() => {
    if (!snack) return
    const t = window.setTimeout(() => setSnack(false), 7000)
    return () => window.clearTimeout(t)
  }, [snack])

  const dismissFab = useCallback(() => {
    setPeek(false)
    hideChatbot()
    setSnack(true)
  }, [])

  // 인사 한 통만 있고 아직 대화가 없으면 = 환영 화면
  const welcomeReply =
    msgs.length === 1 && msgs[0].role === 'bot' && msgs[0].reply.actions.length >= 2
      ? msgs[0].reply
      : null

  // 새 메시지·로딩 변화 시 맨 아래로 (환영 화면은 씬이 보이도록 맨 위)
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = welcomeReply ? 0 : el.scrollHeight
  }, [msgs, loading, open, welcomeReply])

  // 새로 시작 — 대화를 비우고 인사(웰컴 화면)부터 다시 받는다
  const restart = useCallback(() => {
    if (loading) return
    setMsgs([])
    loadGreeting()
  }, [loading, loadGreeting])

  // 뒤로가기(안드로이드/브라우저)는 앱 종료·페이지 이동 대신 패널만 닫는다
  useModalBackButton(() => setOpen(false), open)

  // Escape로 닫기
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return
      setMsgs((prev) => [...prev, { id: nextId++, role: 'user', text: trimmed, at: new Date() }])
      setInput('')
      setLoading(true)
      try {
        // 성경 사전이 답할 수 있는 질문("바리새인이 뭐야")은 서버 왕복 없이 바로 답한다
        const local = await tryGlossaryReply(trimmed)
        if (local) {
          appendReplies([local])
          return
        }
        const res = await sendChatbotMessage(trimmed)
        appendReplies(res.replies)
      } catch {
        appendReplies([
          {
            kind: 'fallback',
            text: '메시지를 전달하지 못했어요 🙏 네트워크를 확인하고 다시 시도해 주세요.',
            verses: [],
            actions: [],
            expression: 'sorry',
          },
        ])
      } finally {
        setLoading(false)
        inputRef.current?.focus()
      }
    },
    [loading, appendReplies],
  )

  // 보류된 외부 질문은 인사(greeting) 로딩이 끝난 뒤 보낸다
  useEffect(() => {
    if (!open || loading || !pendingRef.current) return
    const msg = pendingRef.current
    pendingRef.current = null
    void send(msg)
  }, [open, loading, send])

  const onAction = useCallback(
    (a: ChatAction) => {
      if (a.type === 'link') {
        setOpen(false)
        navigate(a.value)
      } else {
        void send(a.value)
      }
    },
    [navigate, send],
  )

  if (hidden) return null

  return (
    <>
      {/* 플로팅 버튼 — 모바일에선 하단 독 위, 데스크톱에선 우하단.
          롱프레스(모바일)/hover(PC)로 × 배지가 나오고, 누르면 이번 방문 동안 숨긴다 */}
      {!open && !fabHidden && (
        <div
          className={`cb-fab-wrap fixed right-4 bottom-[calc(6.25rem+env(safe-area-inset-bottom)+var(--chat-fab-lift,0rem))] lg:bottom-6 lg:right-6 z-[95] transition-[bottom,transform,opacity] duration-300 motion-reduce:transition-none ${
            tucked ? 'translate-x-[130%] opacity-0 pointer-events-none' : ''
          } lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto ${peek ? 'is-peek' : ''}`}
        >
          <button
            type="button"
            aria-label="참비 챗봇 열기"
            onClick={() => {
              // 롱프레스로 배지를 꺼낸 직후의 클릭은 패널을 열지 않는다
              if (longPressedRef.current) {
                longPressedRef.current = false
                return
              }
              setOpen(true)
            }}
            onPointerDown={startPress}
            onPointerUp={endPress}
            onPointerLeave={endPress}
            onPointerCancel={endPress}
            onContextMenu={(e) => e.preventDefault()}
            className="cb-fab block h-14 w-14 overflow-hidden rounded-full shadow-lg ring-2 ring-white/25 transition-transform duration-200 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand motion-reduce:transition-none"
          >
            <img src={avatarDefault} alt="" className="h-full w-full object-cover" draggable={false} />
          </button>

          <button
            type="button"
            aria-label="참비 숨기기"
            title="숨기기"
            onClick={dismissFab}
            className="cb-fab-x focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* 숨긴 직후 스낵바 — 되돌리기 / 계속 숨기기(기기 영구) */}
      {snack && (
        <div className="cb-snack" role="status">
          <div className="cb-snack-text">
            <strong>참비를 숨겼어요</strong>
            <span>새로고침하면 다시 나와요</span>
          </div>
          <div className="cb-snack-actions">
            <button
              type="button"
              className="cb-snack-btn"
              onClick={() => {
                hideChatbotForever()
                setSnack(false)
              }}
            >
              계속 숨기기
            </button>
            <button
              type="button"
              className="cb-snack-btn is-primary"
              onClick={() => {
                showChatbot()
                setSnack(false)
              }}
            >
              되돌리기
            </button>
          </div>
        </div>
      )}

      {/* 뒤 배경 딤+블러 — 해석 패널과 같은 문법. 탭하면 닫힌다.
          PC(lg+)는 코너 위젯이라 화면 전체를 어둡게 하지 않는다 */}
      {open && (
        <div
          className="fixed inset-0 z-[98] bg-black/55 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 채팅 패널 */}
      {open && (
        <div
          role="dialog"
          aria-label="참비"
          className="fixed z-[99] left-2 right-2 sm:left-auto sm:right-4 lg:right-6 bottom-[calc(6.75rem+env(safe-area-inset-bottom))] lg:bottom-6 sm:w-[380px] h-[min(600px,calc(100dvh-8.5rem))] flex flex-col overflow-hidden rounded-2xl border border-border-light dark:border-border-dark bg-surface shadow-2xl animate-pop-in motion-reduce:animate-none"
        >
          {/* 헤더 — 웰컴 화면에선 배경과 한 덩어리(투명), 대화 중엔 흰 크롬 */}
          <div
            className={`flex items-center justify-between px-3.5 py-3 ${
              welcomeReply ? 'cb-header-welcome' : 'cb-header-welcome cb-header-chat'
            }`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="cb-spark" aria-hidden>
                <Sparkle size={20} weight="duotone" />
              </span>
              <p className="cb-title m-0">참비</p>
              <span className="cb-online">온라인</span>
            </div>
            <div className="flex items-center gap-1.5">
              {!welcomeReply && (
                <button
                  type="button"
                  aria-label="대화 새로 시작"
                  title="새로 시작"
                  onClick={restart}
                  className="cb-hbtn focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M13.6 2.6v3.2h-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                aria-label="챗봇 닫기"
                onClick={() => setOpen(false)}
                className="cb-hbtn focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2.5 2.5l11 11M13.5 2.5l-11 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* 메시지 목록 */}
          <div
            ref={listRef}
            className={`flex-1 overflow-y-auto flex flex-col ${welcomeReply ? '' : 'cb-chat gap-3.5 px-3.5 py-4'}`}
          >
            {welcomeReply ? (
              <Suspense fallback={null}>
                <WelcomeScene reply={welcomeReply} onAction={onAction} onAsk={(q) => void send(q)} />
              </Suspense>
            ) : (
              msgs.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="self-end flex items-end gap-2 max-w-[88%]">
                    <span className="cb-user-meta">
                      {timeLabel(m.at)} <Check size={12} weight="bold" />
                    </span>
                    <div className="cb-user-msg">{m.text}</div>
                  </div>
                ) : (
                  <BotBubble
                    key={m.id}
                    reply={m.reply}
                    onAction={onAction}
                  />
                ),
              )
            )}
            {loading && <div className={welcomeReply ? 'px-3 py-3' : ''}><TypingDots /></div>}
          </div>

          {/* 입력창 */}
          <form
            className={`cb-inputbar flex items-center gap-2 px-3 py-2.5 ${welcomeReply ? 'is-welcome' : ''}`}
            onSubmit={(e) => {
              e.preventDefault()
              void send(input)
            }}
          >
            <span className="cb-spark cb-spark-input" aria-hidden>
              <Sparkle size={18} weight="duotone" />
            </span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="궁금한 것을 물어보세요..."
              maxLength={300}
              // min-w-0 필수: input 은 size 속성(기본 20자) 기준 고유 폭이 있어 min-width:auto 로는
              // 좁은 화면에서 줄어들지 않는다 → 행이 넘쳐 전송 버튼이 패널(overflow-hidden) 밖으로 잘렸다
              className="min-w-0 flex-1 rounded-full bg-surface-container px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-muted outline-none border border-transparent transition-[border-color,box-shadow] duration-200 focus:border-[rgba(49,130,246,0.4)] focus:shadow-[0_0_0_3px_var(--brand-soft-strong),0_0_14px_var(--brand-glow)]"
            />
            <button
              type="submit"
              aria-label="보내기"
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-on shadow-[0_3px_10px_var(--brand-soft-strong)] transition-opacity disabled:opacity-40 disabled:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              style={{ background: 'var(--brand)' }}
            >
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d="M17.5 10 3.2 3.6a.4.4 0 0 0-.55.5L4.6 10l-1.95 5.9a.4.4 0 0 0 .55.5Z"
                  fill="currentColor"
                />
                <path d="M4.6 10h6.6" stroke="var(--brand)" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </form>
          {welcomeReply && (
            <div className="cb-chips">
              {RECOMMENDED.map((q) => (
                <button key={q} type="button" className="cb-chip" onClick={() => void send(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default ChatbotWidget
