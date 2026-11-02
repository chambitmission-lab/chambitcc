import { lazyModal } from '../../../../utils/lazyModal'

// 관리자 메뉴(아이콘 세트 포함 18KB)는 관리자에게만 — 엔트리에서 분리.
// MobileMenu(렌더)와 NewHeader(미리 받기)가 같은 lazy 인스턴스를 써야 청크가 하나다.
export const AdminMenu = lazyModal(() => import('./AdminMenu'))

/** 관리 메뉴 청크(AdminMenu + AdminIcons + api/admin)를 미리 받는다 — 메뉴가 열리기 전에.
 *  메뉴 안에서 preload 하면 이미 열린 뒤라, 마지막에 관리 탭을 보고 닫은 관리자는 다음 세션
 *  첫 열기에서 청크 한 왕복만큼 빈 카드를 봤다. NewHeader 가 로그인 뒤 유휴 시간·레일 ⋮ 호버에 부른다 */
export const warmAdminMenu = (): Promise<void> => AdminMenu.preload()
