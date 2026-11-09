// 디지털 주보 PC 편집기 — 섹션 목차(왼쪽 목차·본문 data-desk-section 공용)

export type SectionId = 'basic' | 'worship' | 'announcements' | 'extras' | 'groups' | 'schedule'
export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'basic', label: '기본 정보' },
  { id: 'worship', label: '주일오전예배' },
  { id: 'announcements', label: '교회 소식' },
  { id: 'extras', label: '추가 안내' },
  { id: 'groups', label: '구역 보고' },
  { id: 'schedule', label: '이번 주 일정' },
]

