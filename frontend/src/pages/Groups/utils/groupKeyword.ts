// /groups 가사 카드 — 커버의 '한 단어'와 방 색 스타일 (컴포넌트 파일과 분리: fast refresh)
import type { CSSProperties } from 'react'
import type { PrayerGroup } from '../../../types/prayer'
import { roomColor } from '../../../utils/roomColor'

// ── 한 단어 ─────────────────────────────────────────
// 테마(상황별 성구 카테고리) 이름 → 그 상황에 주시는 말씀의 핵심어. 없으면 방 이름을 두 줄로 세운다.
const THEME_WORDS: Array<[RegExp, string]> = [
  [/두려|무서|겁/, '두려워\n말라'],
  [/걱정|염려|근심/, '맡기라'],
  [/불안|초조/, '평안'],
  [/외로|혼자/, '함께\n하리라'],
  [/슬픔|슬플|우울|눈물|상실/, '위로'],
  [/지칠|지침|지쳤|피곤|힘들|낙심/, '쉬게\n하리라'],
  [/감사/, '범사에\n감사'],
  [/기쁨|기쁠|행복/, '기뻐\n하라'],
  [/아플|아픔|질병|병|치유|건강/, '치유'],
  [/용서/, '용서'],
  [/사랑/, '사랑'],
  [/화날|분노|화가/, '온유'],
  [/진로|결정|선택|인도|방향/, '인도\n하심'],
  [/시험|유혹/, '이기라'],
  [/가정|가족|부부|자녀/, '한\n집'],
  [/믿음|의심/, '믿음'],
  [/소망|희망|절망/, '소망'],
  [/찬양|예배/, '찬양'],
  [/새벽/, '새벽'],
]

export const groupKeyword = (g: Pick<PrayerGroup, 'name' | 'theme'>): string => {
  const themeName = g.theme?.name
  if (themeName) {
    const hit = THEME_WORDS.find(([re]) => re.test(themeName))
    if (hit) return hit[1]
  }
  const words = g.name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return `${words[0]}\n${words.slice(1).join(' ')}`
  const w = words[0] ?? ''
  // 한 덩어리 긴 이름(6자+)은 반으로 접어 커버 안에 크게 들어가게
  return w.length >= 6 ? `${w.slice(0, Math.ceil(w.length / 2))}\n${w.slice(Math.ceil(w.length / 2))}` : w
}

// 커버 폭과 글자 수로 글자 크기를 정한다 — 한글 디스플레이 서체는 글자당 약 1em
export const keywordSize = (word: string, w: number) => {
  const lines = word.split('\n')
  const longest = Math.max(1, ...lines.map((l) => l.length))
  return Math.round(Math.min(w * 0.36, (w * 0.82) / longest, (w * 0.62) / lines.length))
}

export const verseRef = (g: PrayerGroup) =>
  g.theme_verse ? `${g.theme_verse.book_name_ko} ${g.theme_verse.chapter}:${g.theme_verse.verse}` : null

type RoomStyle = CSSProperties & { '--rc': string }
export const roomStyle = (g: PrayerGroup): RoomStyle => ({ '--rc': roomColor(g.id) })

