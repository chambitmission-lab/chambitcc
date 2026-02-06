// basename 설정을 중앙에서 관리
// React Router의 basename은 trailing slash 없이 사용
export const getBasename = () => {
  return import.meta.env.PROD ? '/chambitcc' : ''
}

// 일반 경로는 trailing slash 포함
export const getBasePath = () => {
  return import.meta.env.PROD ? '/chambitcc/' : '/'
}
