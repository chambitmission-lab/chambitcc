import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getChatbotGreeting, sendChatbotMessage } from '../../api/chatbot'
import type { ChatAction, ChatReply } from '../../types/chatbot'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { OPEN_CHATBOT_EVENT } from '../command/commandEvents'
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

type Msg = { id: number; role: 'user'; text: string } | { id: number; role: 'bot'; reply: ChatReply }

let nextId = 1

// 해석 본문은 마크다운으로 저장돼 있다 — 채팅 말풍선에서는 제목 기호만 걷어낸다
const stripMd = (s: string) =>
  s.replace(/^#{1,6}\s*/gm, '').replace(/\*\*(.+?)\*\*/g, '$1').trim()

const BotBubble = ({ reply, onAction }: { reply: ChatReply; onAction: (a: ChatAction) => void }) => (
  <div className="flex items-start gap-2 max-w-[92%]">
    <img
      src={avatarFor(reply.expression)}
      alt=""
      className="h-9 w-9 shrink-0 rounded-full mt-0.5"
      draggable={false}
    />
    <div className="flex flex-col items-start gap-1.5 min-w-0">
    <div className="rounded-2xl rounded-bl-md bg-surface-container px-3.5 py-2.5 text-[14px] leading-relaxed text-ink">
      {reply.text && <p className="whitespace-pre-line m-0">{reply.text}</p>}
      {reply.verses.map((v) => (
        <blockquote
          key={v.reference + v.text.slice(0, 8)}
          className="my-2 border-l-[3px] pl-2.5 py-0.5"
          style={{ borderColor: 'var(--brand)' }}
        >
          <p className="m-0 text-[13.5px] leading-relaxed text-ink">{v.text}</p>
          <p className="m-0 mt-1 text-[12px] font-semibold text-ink-muted">{v.reference}</p>
        </blockquote>
      ))}
      {reply.commentary && (
        <div className="mt-2 rounded-lg bg-surface-high px-3 py-2.5">
          <p className="m-0 mb-1 text-[12px] font-bold text-brand">
            📖 {reply.commentary.scope === 'summary' ? '요약 해석' : '절별 해석'}
            {reply.commentary.title ? ` — ${reply.commentary.title}` : ''}
          </p>
          <p className="m-0 whitespace-pre-line text-[13px] leading-relaxed text-ink">
            {stripMd(reply.commentary.content)}
          </p>
        </div>
      )}
    </div>
    {reply.actions.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {reply.actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => onAction(a)}
            className="rounded-full border px-3 py-1 text-[12.5px] font-medium text-brand transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            style={{ borderColor: 'var(--brand)', background: 'var(--brand-soft)' }}
          >
            {a.label}
          </button>
        ))}
      </div>
    )}
    </div>
  </div>
)

const TypingDots = () => (
  <div className="flex items-start gap-2">
    <img src={avatarThinking} alt="" className="h-9 w-9 shrink-0 rounded-full mt-0.5" draggable={false} />
    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-surface-container px-3.5 py-3 w-fit">
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

  // 처음 열 때 한 번만 인사 + 메뉴를 받아온다
  useEffect(() => {
    if (!open || greetedRef.current) return
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
  }, [open, appendReplies])

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

  // 새 메시지·로딩 변화 시 맨 아래로
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs, loading, open])

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
      setMsgs((prev) => [...prev, { id: nextId++, role: 'user', text: trimmed }])
      setInput('')
      setLoading(true)
      try {
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
      {/* 플로팅 버튼 — 모바일에선 하단 독 위, 데스크톱에선 우하단 */}
      {!open && (
        <button
          type="button"
          aria-label="참비 챗봇 열기"
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-[calc(6.25rem+env(safe-area-inset-bottom)+var(--chat-fab-lift,0rem))] lg:bottom-6 lg:right-6 z-[95] h-14 w-14 overflow-hidden rounded-full shadow-lg ring-2 ring-white/25 transition-[bottom,transform] duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand motion-reduce:transition-none"
        >
          <img src={avatarDefault} alt="" className="h-full w-full object-cover" draggable={false} />
        </button>
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
          className="fixed z-[99] left-2 right-2 sm:left-auto sm:right-4 lg:right-6 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-6 sm:w-[380px] h-[min(600px,calc(100dvh-7.5rem))] flex flex-col overflow-hidden rounded-2xl border border-border-light dark:border-border-dark bg-surface shadow-2xl animate-pop-in motion-reduce:animate-none"
        >
          {/* 헤더 */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: 'var(--brand-gradient, var(--brand))' }}
          >
            <div className="flex items-center gap-2.5">
              <img
                src={avatarDefault}
                alt=""
                className="h-10 w-10 rounded-full ring-2 ring-white/30"
                draggable={false}
              />
              <div>
                <p className="m-0 text-[14.5px] font-bold text-white">참비</p>
                <p className="m-0 text-[11.5px] text-white/85">말씀·예배·위로, 무엇이든 물어보세요</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="챗봇 닫기"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* 메시지 목록 */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
            {msgs.map((m) =>
              m.role === 'user' ? (
                <div
                  key={m.id}
                  className="self-end max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[14px] leading-relaxed text-brand-on"
                  style={{ background: 'var(--brand)' }}
                >
                  {m.text}
                </div>
              ) : (
                <BotBubble key={m.id} reply={m.reply} onAction={onAction} />
              ),
            )}
            {loading && <TypingDots />}
          </div>

          {/* 입력창 */}
          <form
            className="flex items-center gap-2 border-t border-border-light dark:border-border-dark px-3 py-2.5"
            onSubmit={(e) => {
              e.preventDefault()
              void send(input)
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="예) 요 3:16 해석, 예배 시간"
              maxLength={300}
              className="flex-1 rounded-full bg-surface-container px-4 py-2 text-[14px] text-ink placeholder:text-ink-muted outline-none border border-transparent transition-[border-color,box-shadow] duration-200 focus:border-[rgba(49,130,246,0.4)] focus:shadow-[0_0_0_3px_var(--brand-soft-strong),0_0_14px_var(--brand-glow)]"
            />
            <button
              type="submit"
              aria-label="보내기"
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-on transition-opacity disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              style={{ background: 'var(--brand)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 8h11M9 3.5L13.5 8 9 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default ChatbotWidget
