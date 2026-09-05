/**
 * 역할 → 권한 매핑 (OCP).
 *
 * 화면은 "관리자인가?"(isAdmin) 대신 "무엇을 할 수 있는가?"(can('news:manage'))를 묻는다.
 * 교사·부서장 같은 역할이 생겨도 화면 52곳을 다시 보지 않고 아래 표만 늘리면 된다.
 * 역할 판정 근거는 지금은 세션의 username 하나(백엔드가 role 을 내려주면 getRole 만 바꾼다).
 */
import { sessionStore } from './tokenStore'

export type Role = 'admin' | 'member' | 'guest'

export type Permission =
  | 'admin:access' // 어드민 콘솔 진입·관리 메뉴
  | 'content:manage' // 교회 소개·예배·목양·소식·교육 등 콘텐츠 인라인 편집
  | 'sermons:manage' // 설교 등록·수정·삭제·전문 업로드
  | 'bible:edit' // 성경 본문·해석·개관 편집
  | 'plans:manage' // 성경 읽기 플랜·AI 묵상 편집
  | 'community:moderate' // 기도·감사·댓글 등 타인 게시물 삭제

const ADMIN_PERMISSIONS: readonly Permission[] = [
  'admin:access',
  'content:manage',
  'sermons:manage',
  'bible:edit',
  'plans:manage',
  'community:moderate',
]

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  admin: new Set(ADMIN_PERMISSIONS),
  member: new Set(),
  guest: new Set(),
}

export const getRole = (): Role => {
  const username = sessionStore.get('username')
  if (!username) return 'guest'
  return username === 'admin' ? 'admin' : 'member'
}

/** 현재 사용자가 해당 권한을 가졌는가 — 동기(세션 저장소 기반). 화면 렌더 중 바로 호출해도 된다 */
export const can = (permission: Permission): boolean => ROLE_PERMISSIONS[getRole()].has(permission)
