/**
 * 날짜·시각 공용 모듈 (2026-11-03 통합).
 *
 *   parse    — API 문자열 → Date (KST 기준). new Date(iso) 직접 호출 대신 이쪽.
 *   calendar — 서울 달력 필드·'YYYY-MM-DD' 키.
 *   format   — 표시 문자열. 새 화면은 서울 고정인 formatMonthDay / formatKstDateTime 을 쓴다.
 *   relative — '방금 전'·'오늘/어제'.
 *   input    — <input type="datetime-local"> 값 조작.
 *
 * utils/dateUtils · kstTime · datetimeParts 는 이 모듈의 재수출 껍데기(임포트 경로 호환용).
 * 테스트: src/utils/date/*.test.ts (npm test)
 */

export * from './parse'
export * from './calendar'
export * from './format'
export * from './relative'
export * from './input'
