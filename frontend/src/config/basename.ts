// basename 설정을 중앙에서 관리
// Vite base와 일치시키기 위해 trailing slash 포함
export const getBasename = () => {
  return import.meta.env.PROD ? '/chambitcc' : ''
}

// API 호출 등에서 사용할 전체 경로 (trailing slash 포함)
export const getBasePath = () => {
  return import.meta.env.PROD ? '/chambitcc/' : '/'
}
