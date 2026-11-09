// 약속과 성취 — 구약의 메시아 약속과 신약의 성취를 짝지은 정적 데이터 (백엔드에 저장하지 않는다).
//
// ★ 수록 기준: 신약이 그 구약 본문을 예수님과 "직접" 이어 놓은 곳만 담는다.
//   앱이 스스로 예표를 찾아내 붙이지 않는다 — 신학적으로 무리한 연결을 막기 위해서.
//   (예외는 창 3:15·사 9:6 처럼 신약이 그대로 인용하진 않지만 교회가 오래 이어 읽어 온 두세 곳뿐이고,
//    그런 곳은 point 에 "신약이 그대로 옮기진 않지만"이라고 밝혀 둔다)
//
// 종류(kind) — 구약 본문의 성격으로 나눈다:
//  - prophecy: 직접 예언 — 구약 본문이 앞으로 일어날 일을 말하고, 신약이 그 성취를 밝힌다 (이사야·미가·스가랴 등)
//  - reading:  신약의 해석 — 구약 본문은 예언 형식이 아니지만(시편의 고백 등) 신약이 예수님께 이어 읽는다
//  - type:     상징과 모형 — 구약의 인물·사건을 신약이 예수님을 미리 보여 준 그림으로 설명한다 (유월절 양·놋뱀·요나)
//
// 참조 문자열은 crossRefs 와 같은 "책:장:절" 또는 "책:장:절-끝절"(같은 장 안).
// ★ 따옴표 규칙: point 안의 ‘…’ 는 본문 낱말을 가리킬 때만. 본문 문구 검증은
//   scripts/check-messiah-promises.mjs 가 otMarks·ntMarks 로 한다(로컬 백엔드 필요).

export type PromiseKind = 'prophecy' | 'reading' | 'type'

/** 예수님 이야기의 마디 — 약속 지도(/bible/promises)의 정거장 */
export type PromiseTheme = 'promise' | 'coming' | 'ministry' | 'cross' | 'risen' | 'kingdom'

export interface MessiahPromise {
  /** 고정 키 — 주소(?p=)·저장에 쓰므로 바꾸지 말 것 */
  id: string
  kind: PromiseKind
  theme: PromiseTheme
  /** 짧은 제목 (~10자) — "임마누엘", "은 삼십" */
  title: string
  /** 구약 약속 위치 */
  ot: string
  /** 신약 성취 위치 (1~3곳) */
  nt: readonly string[]
  /** 구약 카드에서 금빛으로 밝힐 본문 문구 (본문 부분 문자열) */
  otMarks: readonly string[]
  /** 신약 카드에서 푸른빛으로 밝힐 본문 문구 — 신약 본문 중 하나 이상에 있어야 한다 */
  ntMarks: readonly string[]
  /** 핵심 포인트 — 해요체 2~3문장. 왜 두 본문이 이어지는지 */
  point: string
}
