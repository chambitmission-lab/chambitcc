// 권한 관리 유틸리티

/**
 * 마이크 권한 상태 확인
 */
export const checkMicrophonePermission = async (): Promise<PermissionState | null> => {
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
}

/**
 * 마이크 권한 요청 (getUserMedia 호출 전 상태 확인)
 */
export const requestMicrophonePermission = async (): Promise<{
  granted: boolean
  stream?: MediaStream
  error?: string
}> => {
  try {
    // 권한 상태 먼저 확인
    const permissionState = await checkMicrophonePermission()
    
    if (permissionState === 'denied') {
      return {
        granted: false,
        error: '마이크 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.'
      }
    }

    // 이미 권한이 있는 경우 바로 스트림 획득
    if (permissionState === 'granted') {
      console.log('Microphone permission already granted')
    }

    // getUserMedia 호출 (권한이 없으면 여기서 한 번만 요청됨)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    return {
      granted: true,
      stream
    }
  } catch (error) {
    console.error('Error requesting microphone permission:', error)
    
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        return {
          granted: false,
          error: '마이크 권한이 거부되었습니다.'
        }
      } else if (error.name === 'NotFoundError') {
        return {
          granted: false,
          error: '마이크를 찾을 수 없습니다.'
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
