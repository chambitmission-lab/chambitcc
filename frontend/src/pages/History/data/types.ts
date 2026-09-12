// 참빛교회 발자취 — 기록 데이터의 타입 정의.
// 원문 기록은 events*.ts 에, 연대 메타는 decades.ts 에 있다.

export interface HistoryEvent {
  d: string // 시작일 YYYY-MM-DD
  d2?: string // 종료일 (기간 행사)
  text: string // 원문 기록
  icon?: string // 마일스톤 아이콘 (있으면 주요 순간)
  title?: string // 마일스톤 카드 제목
}

export interface DecadeMeta {
  key: string
  label: string
  period: string
  title: string
  copy: string
}
