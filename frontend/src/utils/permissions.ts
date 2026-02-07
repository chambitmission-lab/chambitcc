// 권한 관리 유틸리티

// 전역 싱글톤: 스트림 캐싱 및 중복 요청 완전 차단
let cachedStream: MediaStream | null = null
let isRequestingPermission = false
let permissionRequestPromise: Promise<{
  granted: boolean
  stream?: MediaStream
  error?: string
}> | null = null
let lastRequestTimestamp = 0
const MIN_REQUEST_INTERVAL = 500 // 최소 500ms 간격

/**
 * 캐시된 스트림 정리
 */
export const clearCachedStream = () => {
  if (cachedStream) {
    cachedStream.getTracks().forEach(track => track.stop())
    cachedStream = null
  }
}

/**
 * 마이크 권한 요청 및 스트림 획득
 * 
 * ✅ 핵심 원칙:
 * 1. getUserMedia()만 사용 (permissions.query() 사용 안 함)
 * 2. 스트림 전역 캐싱으로 중복 요청 방지
 * 3. 반드시 유저 액션(버튼 클릭)에서만 호출
 * 
 * 모바일에서 permissions.query()는 권한 프롬프트를 트리거할 수 있으므로
 * getUserMedia()만 직접 호출하여 정확히 1번만 권한을 요청합니다.
 */
export const requestMicrophonePermission = async (): Promise<{
  granted: boolean
  stream?: MediaStream
  error?: string
}> => {
  const now = Date.now()
  
  // 1. 이미 캐시된 스트림이 있고 활성 상태면 재사용
  if (cachedStream && cachedStream.active) {
    console.log('[Permissions] Reusing cached stream')
    return {
      granted: true,
      stream: cachedStream
    }
  }
  
  // 2. 이미 권한 요청 중이면 같은 Promise 반환
  if (isRequestingPermission && permissionRequestPromise) {
    console.log('[Permissions] Already requesting, returning existing promise')
    return permissionRequestPromise
  }
  
  // 3. 디바운스: 최근 요청 후 너무 빠르면 무시
  if (now - lastRequestTimestamp < MIN_REQUEST_INTERVAL) {
    console.log('[Permissions] Request too soon (debounce)')
    return {
      granted: false,
      error: '잠시 후 다시 시도해주세요.'
    }
  }
  
  lastRequestTimestamp = now
  isRequestingPermission = true
  
  permissionRequestPromise = (async () => {
    try {
      console.log('[Permissions] Requesting microphone via getUserMedia...')
      
      // getUserMedia만 호출 (permissions.query 사용 안 함)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      console.log('[Permissions] ✅ Permission granted, stream obtained')
      
      // 스트림 캐싱
      cachedStream = stream
      
      isRequestingPermission = false
      permissionRequestPromise = null
      
      return {
        granted: true,
        stream
      }
    } catch (error) {
      console.error('[Permissions] ❌ Error:', error)
      
      isRequestingPermission = false
      permissionRequestPromise = null
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          return {
            granted: false,
            error: '마이크 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.'
          }
        } else if (error.name === 'NotFoundError') {
          return {
            granted: false,
            error: '마이크를 찾을 수 없습니다.'
          }
        } else if (error.name === 'NotReadableError') {
          return {
            granted: false,
            error: '마이크가 다른 앱에서 사용 중입니다.'
          }
        }
      }
      
      return {
        granted: false,
        error: '마이크 접근 중 오류가 발생했습니다.'
      }
    }
  })()
  
  return permissionRequestPromise
}

/**
 * 권한 상태 확인 (프롬프트 없이)
 * 
 * 주의: 일부 모바일 브라우저에서는 permissions.query()가
 * 지원되지 않거나 프롬프트를 트리거할 수 있습니다.
 * 따라서 이 함수는 선택적으로만 사용하세요.
 */
export const checkMicrophonePermission = async (): Promise<PermissionState | null> => {
  if (!navigator.permissions?.query) {
    return null
  }

  try {
    const status = await navigator.permissions.query({ 
      name: 'microphone' as PermissionName 
    })
    return status.state
  } catch (error) {
    // 모바일에서는 지원하지 않을 수 있음
    return null
  }
}
