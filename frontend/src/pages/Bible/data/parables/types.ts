/** 예수님의 비유(/bible/parables) — 초보자용 비유 도감 데이터 형식 */

/** 도감 주제 — 목록 묶음·삽화 색이 이 값을 따른다 */
export type ParableTopic = 'heart' | 'kingdom' | 'prayer' | 'neighbor' | 'life' | 'ready'

/** 삽화(선화 아이콘) 종류 — components/parables/ParableArt.tsx 와 짝 */
export type ParableArtKind =
  | 'sheep'
  | 'coin'
  | 'embrace'
  | 'grapes'
  | 'debt'
  | 'sprout'
  | 'wheat'
  | 'tree'
  | 'bread'
  | 'chest'
  | 'pearl'
  | 'net'
  | 'door'
  | 'scale'
  | 'hands'
  | 'helper'
  | 'barn'
  | 'table'
  | 'chair'
  | 'house'
  | 'pair'
  | 'fig'
  | 'tower'
  | 'wineskin'
  | 'lamp'
  | 'talent'
  | 'flock'
  | 'key'
  | 'robe'

/** 본문 속 눌러 볼 낱말 — text 는 quote 본문(개역개정)에 그대로 있는 부분 문자열 */
export interface ParableMark {
  text: string
  /** 눌렀을 때 아래에 뜨는 풀이 (해요체 1~2문장) */
  meaning: string
}

export interface Parable {
  /** 영문 kebab id — 주소(?p=)·읽음 기록 키 */
  id: string
  /** 비유 이름 ('잃은 양') */
  title: string
  /** 목록 카드 한 줄 (16자 안팎) */
  gist: string
  /** 시트 맨 위 한 문장 요약 */
  summary: string
  topic: ParableTopic
  art: ParableArtKind
  /** 비유 전체 범위 'b:c:v-to' — '성경에서 읽기' 목적지 */
  passage: string
  /** 시트에 인용하는 핵심 절 'b:c:v' 또는 'b:c:v-to' (1~3절) */
  quote: string
  /** quote 본문 안 눌러 볼 낱말 2~4개 */
  marks: ParableMark[]
  /** 듣는 사람 (짧게, '바리새인·서기관') */
  audience: string
  /** 계기 (짧게) */
  trigger: string
  /** 누구에게, 왜 하셨나 (2~3문장) */
  context: string
  /** 그때 사람들이 놀란 이유 (2~3문장) */
  shock: string
  /** 오늘 나에게 — 질문 하나 */
  ask: string
  /** 같은 비유가 실린 다른 복음서 'b:c:v-to' */
  parallels?: string[]
}
