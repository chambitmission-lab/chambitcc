// 권한 관리 유틸리티

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
 */
export const requestMicrophonePermission = async (): Promise<{
  granted: boolean
  stream?: MediaStream
  error?: string
}> => {
  try {
    console.log('[Permissions] Requesting microphone permission via getUserMedia...')
    
    // getUserMedia를 직접 호출 (한 번만 권한 요청)
    // permissions.query()를 사용하지 않아 중복 권한 요청 방지
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    console.log('[Permissions] Microphone permission granted, stream obtained')
    console.log('[Permissions] Audio tracks:', stream.getAudioTracks().length)
    
    return {
      granted: true,
      stream
    }
  } catch (error) {
    console.error('[Permissions] Error requesting microphone permission:', error)
    
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
