// 예수님 말씀(붉은 글씨) 데이터 타입.
// 생성 데이터다 — 손으로 고치지 말고 scripts/gen-jesus-words/run.sh 로 다시 만든다
// (자동 정렬이 틀린 절은 그 폴더의 override.json 에 구절 문자열로 지정).
//
// 장 하나의 항목 목록:
//  - '3' / '6-8'          → 그 절(들) 전체가 예수님 말씀
//  - [절, 시작, 끝]        → 그 절의 어절(공백으로 나눈 낱말) [시작, 끝) 구간만
//                           (어절 위치라 관리자가 본문 글자를 조금 고쳐도 크게 어긋나지 않는다)
export type JesusWordsItem = string | readonly [verse: number, from: number, to: number]

/** 장 번호 → 항목 목록 */
export type BookJesusWords = Record<number, readonly JesusWordsItem[]>
