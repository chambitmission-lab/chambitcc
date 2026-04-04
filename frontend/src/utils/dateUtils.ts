/**
 * 상대 시간 계산 유틸리티
 * UTC 시간을 받아서 사용자의 로컬 시간 기준으로 상대 시간을 계산합니다.
 * 
 * @param dateString - ISO 8601 형식의 UTC 시간 문자열 (예: "2026-02-05T12:36:59Z")
 * @returns 상대 시간 문자열 (예: "1시간 전", "3일 전")
 */
export const getRelativeTime = (dateString: string): string => {
  // 현재 시간 (사용자의 로컬 시간)
  const now = new Date()
  
  // UTC 시간을 파싱 (자동으로 로컬 시간으로 변환됨)
  const past = new Date(dateString)
  
  // 유효하지 않은 날짜 체크
  if (isNaN(past.getTime())) {
    console.error('Invalid date string:', dateString)
    return '알 수 없음'
  }
  
  // 시간 차이 계산 (밀리초 단위)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  // 음수인 경우 (미래 시간) 처리
  if (diffInSeconds < 0) {
    console.warn('Future date detected:', dateString)
    return '방금 전'
  }

  // 상대 시간 계산
  if (diffInSeconds < 60) return '방금 전'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`
  
  // 7일 이상인 경우 날짜 표시
  return past.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * UTC 시간을 로컬 시간 문자열로 변환
 * 
 * @param dateString - ISO 8601 형식의 UTC 시간 문자열
 * @returns 로컬 시간 문자열 (예: "2026년 2월 5일 오후 9:36")
 */
export const formatLocalDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) {
    return '알 수 없음'
  }
  
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * UTC 시간을 로컬 날짜 문자열로 변환
 * 
 * @param dateString - ISO 8601 형식의 UTC 시간 문자열
 * @returns 로컬 날짜 문자열 (예: "2026년 2월 5일")
 */
export const formatLocalDate = (dateString: string): string => {
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) {
    return '알 수 없음'
  }
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
