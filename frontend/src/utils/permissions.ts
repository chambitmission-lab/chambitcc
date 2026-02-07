// 권한 관리 유틸리티

// 전역 싱글톤: 권한 요청 중복 완전 차단
let isRequestingPermission = false
let permissionRequestPromise: Promise<{
  granted: boolean
  stream?: MediaStream
  error?: string
}> | null = null
let lastRequestTimestamp = 0
const MIN_REQUEST_INTERVAL = 1000 // 최소 1초 간격

/**
 * 마이크 권한 상태 확인
 * 주의: 모바일에서는 permissions.query()가 권한 프롬프트를 트리거할 수 있으므로
 * 실제 사용 시에는 getUserMedia()를 직접 호출하는 것을 권장
 */
export const checkMicrophonePermission = async (): Promise<PermissionState | null> => {
  // 모바일 브라우저에서 중복 권한 요청을 방지하기 위해
  // permissions.query()를 사용하지 않음
  console.log('checkMicrophonePermission: Skipping permissions.query() to avoid duplicate prompts on mobile')
  return null
  
  /* 원래 코드 (모바일에서 중복 프롬프트 발생)
  if (!navigator.permissions || !navigator.permissions.query) {
    console.log('Permissions API not supported')
    return null
  }

  try {
    const permissionStatus = await navigator.permissions.query({ 
      name: 'microphone' as PermissionName 
    })
    return permissionStatus.state
  } catch (error) {
    console.log('Error checking microphone permission:', error)
    return null
  }
  */
}

/**
 * 마이크 권한 요청 (getUserMedia만 사용하여 중복 요청 방지)
 * 
 * 중요: 모바일 브라우저(특히 iOS Safari, Chrome 모바일)에서
 * permissions.query()를 호출하면 권한 프롬프트가 표시될 수 있습니다.
 * 따라서 getUserMedia()만 직접 호출하여 한 번만 권한을 요청합니다.
 * 
 * 전역 플래그로 중복 호출 완전 차단
 */
export const requestMicrophonePermission = async (): Promise<{
  granted: boolean
  stream?: MediaStream
  error?: string
}> => {
  const now = Date.now()
  
  // 1. 이미 권한 요청 중이면 같은 Promise 반환
  if (isRequestingPermission && permissionRequestPromise) {
    console.log('[Permissions] Already requesting permission, returning existing promise')
    return permissionRequestPromise
  }
  
  // 2. 최근에 요청했으면 무시 (디바운스)
  if (now - lastRequestTimestamp < MIN_REQUEST_INTERVAL) {
    console.log('[Permissions] Request too soon, ignoring (debounce)')
    return {
      granted: false,
      error: '권한 요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.'
    }
  }
  
  lastRequestTimestamp = now
  isRequestingPermission = true
  
  permissionRequestPromise = (async () => {
    try {
      const requestId = Math.random().toString(36).substring(7)
      console.log(`[Permissions ${requestId}] ========== START ==========`)
      console.log(`[Permissions ${requestId}] Requesting microphone permission via getUserMedia...`)
      console.log(`[Permissions ${requestId}] Timestamp:`, Date.now())
      
      // Permissions API 체크를 제거 - 모바일에서 이것이 첫 번째 프롬프트를 트리거할 수 있음
      // 바로 getUserMedia만 호출
      
      console.log(`[Permissions ${requestId}] About to call getUserMedia...`)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true
      })
      console.log(`[Permissions ${requestId}] getUserMedia returned successfully`)
      
      console.log(`[Permissions ${requestId}] Microphone permission granted, stream obtained`)
      console.log(`[Permissions ${requestId}] Audio tracks:`, stream.getAudioTracks().length)
      console.log(`[Permissions ${requestId}] Timestamp after grant:`, Date.now())
      console.log(`[Permissions ${requestId}] ========== END ==========`)
      
      isRequestingPermission = false
      permissionRequestPromise = null
      
      return {
        granted: true,
        stream
      }
    } catch (error) {
      console.error('[Permissions] Error requesting microphone permission:', error)
      
      isRequestingPermission = false
      permissionRequestPromise = null
      
      if (error instanceof DOMException) {
        console.error('[Permissions] DOMException name:', error.name)
        console.error('[Permissions] DOMException message:', error.message)
        
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
 * 권한 상태 변경 감지
 */
export const watchPermissionChange = (
  permissionName: PermissionName,
  callback: (state: PermissionState) => void
): (() => void) | null => {
  if (!navigator.permissions || !navigator.permissions.query) {
    return null
  }

  let permissionStatus: PermissionStatus | null = null

  navigator.permissions.query({ name: permissionName }).then(status => {
    permissionStatus = status
    status.addEventListener('change', () => {
      callback(status.state)
    })
  }).catch(error => {
    console.log('Error watching permission change:', error)
  })

  // cleanup 함수 반환
  return () => {
    if (permissionStatus) {
      permissionStatus.removeEventListener('change', () => {})
    }
  }
}
