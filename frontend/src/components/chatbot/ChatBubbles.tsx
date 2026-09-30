// 참비 대화 말풍선 조각 — 봇 답변 본문 파서·말풍선·대기 표시·첫 오픈 스켈레톤.
// 상태 없는 표시 전용이라 ChatbotWidget 본체에서 분리했다.
import { useState } from 'react'
import { EmojiText } from '../common/EmojiText'
import type { ChatAction, ChatReply } from '../../types/chatbot'
import { nextQuip } from './waitQuips'
import ChatCommentaryBlock from './ChatCommentaryBlock'
import ChatPastorCard from './ChatPastorCard'
import ChatBriefList from './ChatBriefList'
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

export const BotBubble = ({
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
        {/* 담임목사 카드가 오면 글자판(text)은 옛 앱용이라 그리지 않는다 */}
        {reply.pastor ? (
          <ChatPastorCard card={reply.pastor} onAction={onAction} />
        ) : (
          reply.text && <BotText text={reply.text} />
        )}
        {reply.brief && reply.brief.length > 0 && (
          <ChatBriefList items={reply.brief} onAction={onAction} variant="bubble" />
        )}
        {reply.verses.map((v) => (
          <blockquote key={v.reference + v.text.slice(0, 8)} className="cb-verse-quote">
            <p className="cb-verse-text m-0 text-[13.5px] leading-relaxed text-ink">{v.text}</p>
            <p className="cb-verse-ref m-0 mt-1.5 text-[12px] font-bold text-brand">{v.reference}</p>
          </blockquote>
        ))}
        {reply.commentary && (
          <ChatCommentaryBlock
            commentary={reply.commentary}
            scripture={reply.verses[0]?.text}
          />
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

// 답변 대기 — 점 세 개 옆에 참비 상황극 한 줄(C안). 문구는 항상 렌더하되 opacity 만 지연 페이드라
// 늦게 드러나도 말풍선 높이가 변하지 않는다(맨 아래 스크롤 유지).
export const TypingDots = () => {
  const [quip] = useState(() => nextQuip('think'))
  return (
    <div className="flex items-start gap-2.5">
      <BotAvatar src={avatarThinking} />
      <div className="cb-msg cb-typing w-fit" aria-label="참비가 답을 찾고 있어요">
        <span className="cb-typing-dots" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-ink-muted animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
        <span className="cb-think-quip" aria-hidden>
          참비가 {quip}
        </span>
      </div>
    </div>
  )
}

// 첫 오픈 스켈레톤 — 인사 API·WelcomeScene 청크가 오는 동안 웰컴 화면과 같은 골격(히어로·3열 카드·스트립)을
// 먼저 그린다. 전에는 이 구간이 빈 패널 + 점 세 개라 실제보다 훨씬 길게 느껴졌다.
export const WelcomeSkeleton = () => {
  const [quip] = useState(() => nextQuip('wake'))
  return (
  <div className="cb-welcome cb-welcome-skel" aria-busy="true" aria-label="참비가 준비하고 있어요">
    {/* 히어로 — 회색 블록 대신 "참비를 깨우는 중" 상황극(A안). 인사 두 줄 자리에 라벨+문구, 참비 원판 자리에 자는 참비 */}
    <section className="cb-hero">
      <div className="cb-hero-copy cb-wake" aria-hidden>
        <span className="cb-wake-label">참비를 깨우는 중</span>
        <p className="cb-wake-text">{quip}</p>
        <span className="cb-wake-dots">
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="cb-hero-art" aria-hidden>
        <span className="cb-orb" />
        <img src={avatarThinking} alt="" className="cb-chambi cb-chambi-asleep" draggable={false} />
        <span className="cb-zz">
          <i>z</i>
          <i>z</i>
          <i>Z</i>
        </span>
      </div>
      <span className="cb-skel cb-skel-pill" />
    </section>
    <span className="cb-skel mt-4 mb-2.5 h-3.5 w-[44%]" />
    <div className="cb-grid" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="cb-card pointer-events-none">
          <span className="cb-skel h-[38px] w-[38px] !rounded-[12px]" />
          <span className="cb-skel mt-2.5 h-3 w-[70%]" />
          <span className="cb-skel mt-1.5 h-2.5 w-[88%]" />
        </div>
      ))}
    </div>
    <div className="cb-together pointer-events-none" aria-hidden>
      <span className="cb-skel h-9 w-9 !rounded-full" />
      <span className="flex flex-1 flex-col gap-1.5">
        <span className="cb-skel h-3 w-[38%]" />
        <span className="cb-skel h-2.5 w-[74%]" />
      </span>
    </div>
  </div>
  )
}
