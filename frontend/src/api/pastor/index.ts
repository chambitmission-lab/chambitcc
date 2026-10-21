// Pastor API — 목회자 영역(/pastor). 서버가 is_pastor 로 지킨다 (관리자라도 목회자가 아니면 403)
//
// 한 파일 1,100줄이 도메인 12개를 안고 있어 폴더로 나눴다. 임포트 경로('../api/pastor')는 그대로다.
// 화면 라벨·아이콘(VISIT_KIND_LABEL 등)은 API 가 아니라 pages/Pastor/labels.ts 에 있다.
export * from './home'
export * from './roster'
export * from './situations'
export * from './assistant'
export * from './report'
export * from './agenda'
export * from './sermonPrep'
export * from './notes'
export * from './outlines'
export * from './study'
export * from './echo'
export * from './ai'
export * from './studio'
