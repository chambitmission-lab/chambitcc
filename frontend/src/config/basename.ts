// basename 설정을 중앙에서 관리
export const getBasename = () => {
  return import.meta.env.PROD ? '/chambitcc' : ''
}

export const getBasePath = () => {
  return import.meta.env.PROD ? '/chambitcc/' : '/'
}
