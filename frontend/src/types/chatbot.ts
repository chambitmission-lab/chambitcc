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

export interface ChatReply {
  kind: string
  text?: string | null
  verses: ChatVerseCard[]
  commentary?: ChatCommentary | null
  actions: ChatAction[]
}

export interface ChatbotAnswer {
  replies: ChatReply[]
}
