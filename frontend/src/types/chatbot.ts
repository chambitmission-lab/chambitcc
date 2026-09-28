// 교회 챗봇 타입 (backend/app/schemas/chatbot.py 와 1:1)

export interface ChatAction {
  label: string
  type: 'link' | 'message'
  value: string
}

export interface ChatVerseCard {
  reference: string
  text: string
  book_number?: number | null
  chapter?: number | null
  verse?: number | null
}

export interface ChatCommentary {
  title?: string | null
  content: string
  scope: string
  category?: string | null
}

export interface ChatPastorLink {
  title: string
  meta?: string | null
  link: string
}

// 담임목사 프로필 카드 — 있으면 text 대신 카드로 그린다(text 는 옛 앱용 글자판)
export interface ChatPastorCard {
  name: string
  role: string
  nickname?: string | null
  photo_url?: string | null
  headline?: string | null
  intro?: string | null
  quote?: string | null
  years_label?: string | null
  education: string[]
  career: string[]
  sermon?: ChatPastorLink | null
  column?: ChatPastorLink | null
}

// 로그인 성도의 오늘 브리핑 한 줄 — icon 키로 라인 아이콘을 고른다 (문장엔 이모지가 없다)
export type ChatBriefIcon =
  | 'plan'
  | 'streak'
  | 'capsule'
  | 'letter'
  | 'intercession'
  | 'title'
  | 'birthday'
  | 'prayer'

export interface ChatBriefItem {
  icon: ChatBriefIcon | string
  text: string
  link?: string | null
}

export interface ChatReply {
  kind: string
  text?: string | null
  verses: ChatVerseCard[]
  commentary?: ChatCommentary | null
  pastor?: ChatPastorCard | null
  // 오늘 브리핑 — 비로그인·해당 없음이면 빈 배열 (옛 서버 응답엔 없을 수 있다)
  brief?: ChatBriefItem[]
  actions: ChatAction[]
  // 아바타 표정: default|talking|thinking|joy|comfort|sorry|praying
  expression?: string | null
}

export interface ChatbotAnswer {
  replies: ChatReply[]
}

// ── 관리자 ────────────────────────────────────────────────────────────

export interface ChatbotUnanswered {
  id: number
  text: string
  ask_count: number
  status: 'open' | 'resolved'
  answer?: string | null
  created_at: string
  updated_at: string
}

export interface ChatbotIntent {
  id: number
  name: string
  keywords: string[]
  answer: string
  actions: ChatAction[]
  is_active: boolean
  order: number
  created_at: string
}

export interface ChatbotIntentCreate {
  name: string
  keywords: string[]
  answer: string
  actions: ChatAction[]
  is_active: boolean
  order: number
}
