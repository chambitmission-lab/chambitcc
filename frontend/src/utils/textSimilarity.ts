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
 * 구조적 유사도 계산 (단어 순서와 구조 기반)
 * 히브리 이름 등이 잘못 인식되어도 문장 구조가 비슷하면 높은 점수
 */
const calculateStructuralSimilarity = (text1: string, text2: string): number => {
  const normalized1 = normalizeText(text1)
  const normalized2 = normalizeText(text2)
  
  // 단어로 분리
  const words1 = normalized1.split(/\s+/).filter(w => w.length > 0)
  const words2 = normalized2.split(/\s+/).filter(w => w.length > 0)
  
  if (words1.length === 0 || words2.length === 0) {
    return 0
  }
  
  // 공통 단어 찾기
  const commonWords = words1.filter(w => words2.includes(w))
  
  // 공통 단어 비율
  const commonRatio = (commonWords.length * 2) / (words1.length + words2.length)
  
  // 길이 유사도 (단어 개수가 비슷한지)
  const lengthRatio = Math.min(words1.length, words2.length) / Math.max(words1.length, words2.length)
  
  // 구조적 유사도 = 공통 단어 70% + 길이 유사도 30%
  return commonRatio * 0.7 + lengthRatio * 0.3
}

/**
 * 성경 구절 읽기 검증 (개선 버전)
 * @param originalText 원본 성경 구절
 * @param spokenText 사용자가 읽은 텍스트
 * @param threshold 통과 기준 (기본 0.5 = 50%)
 * @returns 검증 결과
 */
export const verifyVerseReading = (
  originalText: string,
  spokenText: string,
  threshold: number = 0.5
): {
  isValid: boolean
  similarity: number
  message: string
} => {
  // 전체 유사도 계산
  const fullSimilarity = calculateSimilarity(originalText, spokenText)
  
  // 구조적 유사도 계산 (단어 기반)
  const structuralSimilarity = calculateStructuralSimilarity(originalText, spokenText)
  
  // 최근 발화 내용 추출 (마지막 50% 정도)
  const normalized1 = normalizeText(originalText)
  const normalized2 = normalizeText(spokenText)
  
  // 디버깅 로그
  console.log('Verse reading verification:', {
    original: originalText,
    spoken: spokenText,
    normalized1,
    normalized2,
    fullSimilarity,
    structuralSimilarity,
    threshold
  })
  
  // 최근 발화가 원본 텍스트를 포함하는지 확인
  const recentLength = Math.floor(normalized2.length * 0.5)
  const recentSpoken = normalized2.slice(-recentLength)
  
  // 최근 발화가 원본 텍스트의 끝부분과 얼마나 일치하는지
  let recentSimilarity = 0
  if (recentSpoken.length > 0 && normalized1.length > 0) {
    const originalEnd = normalized1.slice(-recentLength)
    recentSimilarity = calculateSimilarity(originalEnd, recentSpoken)
  }
  
  // 최종 유사도: 문자 유사도 40% + 구조적 유사도 40% + 최근 발화 20%
  const weightedSimilarity = fullSimilarity * 0.4 + structuralSimilarity * 0.4 + recentSimilarity * 0.2
  
  console.log('Similarity calculation:', {
    fullSimilarity,
    structuralSimilarity,
    recentSimilarity,
    weightedSimilarity,
    isValid: weightedSimilarity >= threshold
  })
  
  const isValid = weightedSimilarity >= threshold

  let message = ''
  if (isValid) {
    if (weightedSimilarity >= 0.95) {
      message = '아멘! 말씀을 마음에 새기셨습니다 ✨'
    } else if (weightedSimilarity >= 0.85) {
      message = '하나님의 말씀을 잘 읽으셨습니다 🙏'
    } else {
      message = '말씀과 함께하셨습니다 💫'
    }
  } else {
    if (weightedSimilarity >= 0.6) {
      message = '천천히 다시 한번 읽어보세요 📖'
    } else if (weightedSimilarity >= 0.4) {
      message = '말씀을 다시 확인해주세요 📕'
    } else {
      message = '구절을 다시 읽어주세요 📖'
    }
  }

  return {
    isValid,
    similarity: Math.round(weightedSimilarity * 100) / 100,
    message
  }
}
