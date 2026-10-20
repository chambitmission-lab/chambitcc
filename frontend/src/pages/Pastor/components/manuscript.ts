// 설교 원고 공용 규칙 — 원고 쓰기(ManuscriptEditor)와 강단 보기(PastorPulpit)가 같은 계산을 쓴다.
// 모두 규칙 기반(AI 미사용). 예상 시간은 공백을 뺀 글자 수 ÷ 말하는 빠르기.
import { useState } from 'react'
import type { OutlineSection, SermonNote } from '../../../api/pastor'

// ── 말하는 빠르기 ──────────────────────────────────────────
export const PACES = [
  { id: 'slow', label: '천천히', perMin: 230 },
  { id: 'normal', label: '보통', perMin: 270 },
  { id: 'fast', label: '빠르게', perMin: 310 },
] as const
export type PaceId = (typeof PACES)[number]['id']

const PACE_KEY = 'pastor-sermon-pace'

const readPace = (): PaceId => {
  try {
    const v = localStorage.getItem(PACE_KEY)
    return PACES.some(p => p.id === v) ? (v as PaceId) : 'normal'
  } catch {
    return 'normal'
  }
}

/** 기기마다 기억하는 말하는 빠르기 — 원고 쓰기와 강단 보기가 같은 값을 읽는다 */
export const usePace = (): [PaceId, (p: PaceId) => void, number] => {
  const [pace, setPace] = useState<PaceId>(readPace)
  const set = (p: PaceId) => {
    setPace(p)
    try {
      localStorage.setItem(PACE_KEY, p)
    } catch {
      /* 사생활 보호 모드 — 이번 화면에서만 */
    }
  }
  return [pace, set, PACES.find(p => p.id === pace)!.perMin]
}

export const sectionBody = (s: OutlineSection): string => (s.manuscript ?? '').trim()

/** 공백을 뺀 글자 수 */
export const countChars = (text: string): number => text.replace(/\s+/g, '').length

/** 원고 칸 하나의 최대 글자 수(서버와 같다) */
export const MANUSCRIPT_MAX = 20000

/** 원고에 그대로 남아 있는 AI 초안 문단 — 고친 문단은 목사님 글이다(서버도 저장 때 같은 기준으로 정리) */
export const pendingDraftsOf = (s: OutlineSection): string[] => {
  const m = s.manuscript ?? ''
  return (s.ai_drafts ?? []).filter(d => m.includes(d.trim()))
}

export const estimateMinutes = (chars: number, perMin: number): number => (chars ? Math.max(1, Math.round(chars / perMin)) : 0)

// ── 말씀 인용 ─────────────────────────────────────────────
// "/말씀" 넣기가 만드는 꼴: “본문” (요한복음 15:5)
const VERSE_QUOTE_RE = /“([^”]+)”\s*\(([^()]*\d+:\d+[^()]*)\)/g
const VERSE_PARAGRAPH_RE = /^“([\s\S]+)”\s*\(([^()]*\d+:\d+[^()]*)\)$/

export const quotedVerses = (sections: OutlineSection[]): string[] => {
  const out: string[] = []
  for (const s of sections) {
    for (const m of sectionBody(s).matchAll(VERSE_QUOTE_RE)) {
      if (!out.includes(m[2].trim())) out.push(m[2].trim())
    }
  }
  return out
}

// ── 강단 보기 장 나누기 ────────────────────────────────────
export interface Slide {
  sectionIdx: number
  section: string
  kind: 'text' | 'verse' | 'title'
  body: string
  ref?: string
}

const SLIDE_MAX = 200 // 태블릿 한 화면에 큰 글씨로 들어가는 정도 — 넘으면 문장 단위로 나눈다

const chunkParagraph = (p: string): string[] => {
  if (p.length <= SLIDE_MAX) return [p]
  const sentences = p.split(/(?<=[.?!…。])\s+/)
  const out: string[] = []
  let cur = ''
  for (const s of sentences) {
    if (cur && cur.length + s.length + 1 > SLIDE_MAX) {
      out.push(cur)
      cur = s
    } else {
      cur = cur ? `${cur} ${s}` : s
    }
  }
  if (cur) out.push(cur)
  return out
}

/** 원고 → 강단 장. 빈 줄이 장의 경계, 말씀 인용만 있는 문단은 말씀 카드. 원고가 빈 칸은 개요 글을 쓴다 */
export const buildSlides = (sections: OutlineSection[]): Slide[] => {
  const slides: Slide[] = []
  sections.forEach((s, sectionIdx) => {
    const source = sectionBody(s) || s.text.trim()
    const paragraphs = source
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean)
    if (!paragraphs.length) {
      slides.push({ sectionIdx, section: s.label, kind: 'title', body: s.label })
      return
    }
    for (const p of paragraphs) {
      const verse = p.match(VERSE_PARAGRAPH_RE)
      if (verse) {
        slides.push({ sectionIdx, section: s.label, kind: 'verse', body: verse[1].trim(), ref: verse[2].trim() })
        continue
      }
      for (const chunk of chunkParagraph(p)) slides.push({ sectionIdx, section: s.label, kind: 'text', body: chunk })
    }
  })
  return slides
}

// ── 참고용 점검 ───────────────────────────────────────────
export interface Check {
  id: string
  label: string
  done: boolean
  hint: string
}

const CHRIST_RE = /예수|그리스도|주님|십자가|복음|구속|구원/g
const EXHORT_RE = /합시다|하십시오|하시기 바랍니다|않겠습니까|살아갑시다|드립시다|나아갑시다/g

export const checkManuscript = (sections: OutlineSection[], perMin: number): Check[] => {
  const all = sections.map(sectionBody).join('\n')
  const christ = all.match(CHRIST_RE)?.length ?? 0
  const quotes = quotedVerses(sections)
  const exhort = all.match(EXHORT_RE)?.length ?? 0
  const applySection = sections.find(s => /적용|결론|맺/.test(s.label) && countChars(sectionBody(s)) >= 150)
  const empty = sections.filter(s => !sectionBody(s)).map(s => s.label)
  const chars = sections.map(s => countChars(sectionBody(s)))
  const total = chars.reduce((a, b) => a + b, 0)
  const heaviest = total ? Math.max(...chars) / total : 0
  const heavyLabel = sections[chars.indexOf(Math.max(...chars))]?.label

  return [
    {
      id: 'christ',
      label: '그리스도께로 이어지는가',
      done: christ >= 3,
      hint: christ ? `예수·그리스도·십자가·복음 ${christ}번` : '아직 그리스도를 가리키는 말이 없어요',
    },
    {
      id: 'verse',
      label: '본문 말씀을 직접 읽어 주는가',
      done: quotes.length > 0,
      hint: quotes.length ? `인용 ${quotes.length}곳` : '"/요 15:5" 처럼 넣으면 강단 보기에서 말씀 카드로 보여요',
    },
    {
      id: 'apply',
      label: '적용 — 성도가 할 일로 맺는가',
      done: !!applySection || exhort >= 2,
      hint: applySection ? `'${applySection.label}' 칸` : exhort ? `권면 ${exhort}번` : '적용·결론 칸이 아직 짧아요',
    },
    {
      id: 'balance',
      label: '칸마다 시간이 고르게',
      done: total > 0 && heaviest <= 0.55,
      hint: !total
        ? '원고를 쓰면 계산해요'
        : heaviest > 0.55
          ? `'${heavyLabel}'에 ${Math.round(heaviest * 100)}% 몰려 있어요`
          : `가장 긴 칸 약 ${estimateMinutes(Math.max(...chars), perMin)}분`,
    },
    {
      id: 'filled',
      label: '빈 칸 없이',
      done: empty.length === 0,
      hint: empty.length ? `아직 비어 있음: ${empty.join(', ')}` : '모든 칸을 썼어요',
    },
  ]
}

/** 이미 다른 설교에 쓴 예화·메모 — 원고에 붙여 둔 것 중에서 */
export const reusedNotes = (sections: OutlineSection[], notes: Record<number, SermonNote>): SermonNote[] => {
  const seen = new Set<number>()
  const out: SermonNote[] = []
  for (const s of sections)
    for (const id of s.note_ids) {
      const n = notes[id]
      if (n?.used_on && !seen.has(id)) {
        seen.add(id)
        out.push(n)
      }
    }
  return out
}
