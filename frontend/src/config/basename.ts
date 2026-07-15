// basename 설정을 중앙에서 관리
// Vite base 설정(import.meta.env.BASE_URL)에서 파생하므로 배포 위치가 바뀌어도 이 파일은 수정 불필요
export const getBasename = () => {
  return import.meta.env.BASE_URL.replace(/\/$/, '')
}

// API 호출 등에서 사용할 전체 경로 (trailing slash 포함)
export const getBasePath = () => {
  return import.meta.env.BASE_URL
}
