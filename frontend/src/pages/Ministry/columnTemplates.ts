// 편지 템플릿 — 목양칼럼은 매주 흐름이 비슷하므로, 백지보다 틀을 고르는 편이 빠르다.
// 본문은 새 블록 문법(## 소제목 / > 인용 / :: 콜아웃 / --- 구분)을 그대로 쓴다.

export interface ColumnTemplate {
  id: string
  label: [ko: string, en: string]
  /** 칩에 붙는 한 줄 설명 */
  hint: [ko: string, en: string]
  body: string
}

export const COLUMN_TEMPLATES: ColumnTemplate[] = [
  {
    id: 'sunday',
    label: ['주일 편지', 'Sunday Letter'],
    hint: ['인사 · 말씀 · 적용 · 기도', 'Greeting · Word · Life · Prayer'],
    body: `사랑하는 성도 여러분께,

한 주간 평안하셨는지요.

> 여호와는 나의 목자시니 내게 부족함이 없으리로다
> — 시편 23:1

## 이 말씀 앞에서

(오늘 붙든 말씀을 함께 묵상해 주세요)

## 우리의 삶으로

[[말씀은 읽는 것으로 끝나지 않습니다]] — 한 주간 이 말씀을 품고 살아가는 성도님들이 되시기를 바랍니다.

---

:: 이번 주 함께 기도해 주세요
:: 성도님들의 가정과 일터 위에
:: 다음 주일 예배를 준비하는 마음 위에`,
  },
  {
    id: 'season',
    label: ['절기 편지', 'Seasonal Letter'],
    hint: ['성탄 · 부활 · 감사절', 'Christmas · Easter · Thanksgiving'],
    body: `사랑하는 성도 여러분께,

## 우리가 기억하는 날

(이 절기가 우리에게 무엇인지 적어 주세요)

> 말씀이 육신이 되어 우리 가운데 거하시매
> — 요한복음 1:14

## 올해의 이 절기는

---

:: 함께하는 자리
:: 일시 ·
:: 장소 ·`,
  },
  {
    id: 'news',
    label: ['소식 편지', 'News Letter'],
    hint: ['심방 · 사진 · 감사', 'Visits · Photos · Thanks'],
    body: `사랑하는 성도 여러분께,

지난 한 주 교회에 있었던 일들을 나눕니다.

## 함께한 자리

(사진 버튼으로 그날의 사진을 넣어 보세요)

- 
- 

## 감사한 일

[[작은 일에도 하나님의 손길이 있었습니다]]

:: 다음 주 안내
:: `,
  },
]
