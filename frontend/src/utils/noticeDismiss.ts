/**
 * 팝업 공지 "안 보기" 상태 — 사용자 로컬(기기) 설정.
 *
 * 서버에 저장하지 않는 이유: 비로그인 방문자도 팝업을 보고 닫을 수 있어야 하고,
 * "이 기기에서 그만 보기"는 계정 설정이라기보다 브라우저 설정에 가깝다.
 *
 * 공지가 수정되면(updated_at 변경) 다시 보여준다 — 내용이 바뀐 공지를
 * 예전에 닫았다는 이유로 계속 숨기면 정작 중요한 변경을 놓친다.
 */
const STORAGE_KEY = 'notice_dismiss_v1'
/** '확인'으로 닫은 공지 — 앱을 닫을 때까지만 유지(홈을 오갈 때 다시 뜨지 않게) */
const SESSION_KEY = 'notice_seen_session_v1'

type DismissEntry = {
  /** 숨김 만료 시각(ms). 'forever'면 영구 숨김 */
  until: number | 'forever'
  /** 닫을 당시 공지의 updated_at — 공지가 수정되면 다시 노출 */
  ver?: string
}

type DismissMap = Record<string, DismissEntry>

const readMap = (): DismissMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as DismissMap) : {}
  } catch {
    return {}
  }
}

const writeMap = (map: DismissMap) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // 시크릿 모드 등 저장 실패 — 이번 세션에만 숨겨지고 다음 진입 때 다시 뜬다
  }
}

/** 내일 0시(로컬) — "오늘 하루 안 보기"의 만료 시점 */
const nextMidnight = (): number => {
  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return tomorrow.getTime()
}

/** 만료된 항목 정리 (저장소가 무한정 커지지 않게) */
const prune = (map: DismissMap): DismissMap => {
  const now = Date.now()
  const next: DismissMap = {}
  Object.entries(map).forEach(([id, entry]) => {
    if (entry.until === 'forever' || entry.until > now) next[id] = entry
  })
  return next
}

/** 이번 세션에 '확인'으로 닫은 공지 목록 (sessionStorage) */
const readSession = (): Record<string, string> => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * '확인'/닫기 — 앱을 닫을 때까지만 숨긴다.
 * 홈과 다른 탭을 오갈 때 팝업이 매번 다시 뜨는 걸 막되, 앱을 새로 열면 다시 보여
 * 놓친 공지가 묻히지 않게 한다.
 */
export const markNoticeSeenThisSession = (id: number, updatedAt?: string | null) => {
  try {
    const map = readSession()
    map[String(id)] = updatedAt ?? ''
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(map))
  } catch {
    // 저장 실패 — 이번 이동에서만 숨겨진다
  }
}

/** 이 공지를 지금 숨겨야 하는가 */
export const isNoticeDismissed = (id: number, updatedAt?: string | null): boolean => {
  const seen = readSession()[String(id)]
  // 세션 중 확인함 — 단, 그 뒤 공지가 수정됐으면 다시 보여준다
  if (seen !== undefined && (!seen || !updatedAt || seen === updatedAt)) return true

  const entry = readMap()[String(id)]
  if (!entry) return false
  // 닫은 뒤 공지가 수정됐으면 숨김을 무효화한다
  if (entry.ver && updatedAt && entry.ver !== updatedAt) return false
  if (entry.until === 'forever') return true
  return entry.until > Date.now()
}

/** 오늘 하루(다음 날 0시까지) 숨기기 */
export const dismissNoticeForToday = (id: number, updatedAt?: string | null) => {
  const map = prune(readMap())
  map[String(id)] = { until: nextMidnight(), ver: updatedAt ?? undefined }
  writeMap(map)
}

/** 이 공지 다시 보지 않기 (영구) */
export const dismissNoticeForever = (id: number, updatedAt?: string | null) => {
  const map = prune(readMap())
  map[String(id)] = { until: 'forever', ver: updatedAt ?? undefined }
  writeMap(map)
}

/**
 * '다시 안 보기'로 영구 숨긴 공지인가.
 *
 * 홈 상단 배너는 '확인'·'오늘 하루'로 닫은 공지는 계속 보여주되(다시 열 경로가 필요),
 * 영구히 안 보겠다고 한 공지는 배너에서도 빼야 한다.
 * 수정된 공지는 숨김을 무효화하는 규칙을 isNoticeDismissed 와 똑같이 적용한다.
 */
export const isNoticeDismissedForever = (id: number, updatedAt?: string | null): boolean => {
  const entry = readMap()[String(id)]
  if (!entry || entry.until !== 'forever') return false
  if (entry.ver && updatedAt && entry.ver !== updatedAt) return false
  return true
}
