/**
 * 텍스트 유사도 검사 유틸리티
 * 성경 구절 음성 읽기 검증용
 */

/**
 * 텍스트 정규화 (비교를 위한 전처리)
 */
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, '') // 특수문자, 구두점 제거
    .replace(/\s+/g, ' ') // 연속 공백을 하나로
    .trim()
}

/**
 * Levenshtein Distance 계산
 * 두 문자열 간의 편집 거리 계산
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const len1 = str1.length
  const len2 = str2.length
  const matrix: number[][] = []

  // 초기화
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // 동적 프로그래밍으로 거리 계산
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // 삭제
        matrix[i][j - 1] + 1, // 삽입
        matrix[i - 1][j - 1] + cost // 대체
      )
    }
  }

  return matrix[len1][len2]
}

/**
 * 텍스트 유사도 계산 (0~1 사이 값)
 * 1에 가까울수록 유사함
 */
export const calculateSimilarity = (text1: string, text2: string): number => {
  const normalized1 = normalizeText(text1)
  const normalized2 = normalizeText(text2)

  if (normalized1 === normalized2) {
    return 1.0
  }

  if (!normalized1 || !normalized2) {
    return 0.0
  }

  const distance = levenshteinDistance(normalized1, normalized2)
  const maxLength = Math.max(normalized1.length, normalized2.length)
  
  return 1 - distance / maxLength
}

/**
 * 성경 구절 읽기 검증
 * @param originalText 원본 성경 구절
 * @param spokenText 사용자가 읽은 텍스트
 * @param threshold 통과 기준 (기본 0.75 = 75%)
 * @returns 검증 결과
 */
export const verifyVerseReading = (
  originalText: string,
  spokenText: string,
  threshold: number = 0.75
): {
  isValid: boolean
  similarity: number
  message: string
} => {
  const similarity = calculateSimilarity(originalText, spokenText)
  const isValid = similarity >= threshold

  let message = ''
  if (isValid) {
    if (similarity >= 0.95) {
      message = '아멘! 말씀을 마음에 새기셨습니다 ✨'
    } else if (similarity >= 0.85) {
      message = '하나님의 말씀을 잘 읽으셨습니다 🙏'
    } else {
      message = '말씀과 함께하셨습니다 💫'
    }
  } else {
    if (similarity >= 0.6) {
      message = '천천히 다시 한번 읽어보세요 📖'
    } else if (similarity >= 0.4) {
      message = '말씀을 다시 확인해주세요 📕'
    } else {
      message = '구절을 다시 읽어주세요 📖'
    }
  }

  return {
    isValid,
    similarity: Math.round(similarity * 100) / 100,
    message
  }
}
