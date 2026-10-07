import { lazy } from 'react'

// 여러 영역 라우트가 함께 쓰는 화면 — lazy 인스턴스를 하나로 두어야
// 영역을 오갈 때(/admin/care ↔ /pastor/care) 같은 화면을 다시 준비(suspend)하지 않는다

// 돌봄 레이더 — 관리자(/admin/care)와 목회자(/pastor/care, scope="pastor")가 같은 모듈을 쓴다
export const CareRadar = lazy(() => import('../pages/Admin/CareRadar'))
