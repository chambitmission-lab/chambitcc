export type TimeOfDay = 'morning' | 'afternoon' | 'evening'

export type EmotionTag =
  | 'weary'
  | 'joyful'
  | 'anxious'
  | 'grateful'
  | 'lonely'
  | 'peaceful'

export interface MeditationPassage {
  label: string
  book_number: number
  chapter: number
  verse_start: number
  verse_end: number
  theme: string | null
}

export interface MeditationVerse {
  reference: string
  text: string
  book_number: number
  chapter: number
  verse: number
}

export interface MeditationContext {
  time_of_day: TimeOfDay | null
  emotion: EmotionTag | null
  selected_at: string
}

export interface MeditationCard {
  plan_name: string
  plan_code: string
  day_number: number
  total_days: number
  season: string | null
  passage: MeditationPassage
  verse: MeditationVerse
  meditation_question: string
  redemptive_note: string | null
  context: MeditationContext
}
