// 마지막으로 본 장착 칭호 키 — 칭호 응답이 오기 전에 두 가지를 미리 한다.
//   1. 스켈레톤이 커버 배너(16:9) 자리를 같은 높이로 잡는다 (Profile.tsx)
//   2. 커버 배너 이미지를 진입 즉시 받아 둔다 (prefetch.ts) — 예전엔 5개 API 가 전부 끝나
//      본문이 그려진 뒤에야 <img> 요청이 시작돼 데이터 → 이미지가 직렬이었다
// 값은 칭호 키, 장착 칭호가 없으면 '' — 키가 없으면(첫 방문) null
const COVER_KEY = 'profile_cover_key'
// 예전 형식(배너 유무 '1'/'0') — 키를 알아야 이미지를 받을 수 있어 교체했다. 남은 값은 한 번 지운다
const LEGACY_KEY = 'profile_cover_hint'

export const readCoverHintKey = (): string | null => {
  try {
    localStorage.removeItem(LEGACY_KEY)
    return localStorage.getItem(COVER_KEY)
  } catch {
    return null
  }
}

export const writeCoverHintKey = (key: string): void => {
  try {
    localStorage.setItem(COVER_KEY, key)
  } catch {
    /* 저장 불가 환경 — 힌트 없이 동작 */
  }
}
