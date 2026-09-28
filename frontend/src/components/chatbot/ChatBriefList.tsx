import type { ChatAction, ChatBriefItem } from '../../types/chatbot'
import {
  BookOpen,
  Confetti,
  EnvelopeSimple,
  Flame,
  HandHeart,
  HandsPraying,
  Hourglass,
  Medal,
  Sparkle,
  type Icon,
} from '../icons/phosphor'

/**
 * 로그인 성도의 "오늘 챙길 것" 목록 — 웰컴 화면(variant="welcome")과 대화 말풍선(variant="bubble")이 함께 쓴다.
 * 백엔드(services/chatbot/personal.py BRIEF_PIPELINE)가 줄을 고르고, 여기서는 icon 키로 라인 아이콘만 입힌다.
 * 링크가 있는 줄은 누르면 그 화면으로 간다(onAction 의 link 흐름 재사용 — 패널 닫기까지 위젯이 맡는다).
 */
const ICONS: Record<string, Icon> = {
  plan: BookOpen,
  streak: Flame,
  capsule: Hourglass,
  letter: EnvelopeSimple,
  intercession: HandsPraying,
  title: Medal,
  birthday: Confetti,
  prayer: HandHeart,
}

type Props = {
  items: ChatBriefItem[]
  onAction: (a: ChatAction) => void
  variant: 'welcome' | 'bubble'
}

const ChatBriefList = ({ items, onAction, variant }: Props) => {
  if (items.length === 0) return null
  return (
    <ul className={`cb-brief cb-brief--${variant} m-0 p-0 list-none`}>
      {items.map((b) => {
        const IconCmp = ICONS[b.icon] ?? Sparkle
        const body = (
          <>
            <span className={`cb-brief-icon is-${b.icon}`}>
              <IconCmp size={variant === 'welcome' ? 18 : 16} weight="duotone" />
            </span>
            <span className="cb-brief-text">{b.text}</span>
            {b.link && (
              <svg width="7" height="11" viewBox="0 0 8 12" fill="none" aria-hidden className="cb-brief-chev">
                <path d="m2 1.5 4 4.5-4 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </>
        )
        return (
          <li key={b.icon + b.text}>
            {b.link ? (
              <button
                type="button"
                className="cb-brief-row"
                onClick={() => onAction({ label: b.text, type: 'link', value: b.link as string })}
              >
                {body}
              </button>
            ) : (
              <div className="cb-brief-row">{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default ChatBriefList
