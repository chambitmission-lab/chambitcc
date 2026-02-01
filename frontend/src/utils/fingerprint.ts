// 브라우저 Fingerprint 생성 유틸리티
export const generateFingerprint = async (): Promise<string> => {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform,
  ]

  const fingerprint = components.join('|')
  
  // Base64 인코딩
  return btoa(fingerprint)
}

// 로컬 스토리지에 fingerprint 저장/조회
const FINGERPRINT_KEY = 'user_fingerprint'

export const getStoredFingerprint = (): string | null => {
  return localStorage.getItem(FINGERPRINT_KEY)
}

export const storeFingerprint = (fingerprint: string): void => {
  localStorage.setItem(FINGERPRINT_KEY, fingerprint)
}

export const getOrCreateFingerprint = async (): Promise<string> => {
  let fingerprint = getStoredFingerprint()
  
  if (!fingerprint) {
    fingerprint = await generateFingerprint()
    storeFingerprint(fingerprint)
  }
  
  return fingerprint
}
