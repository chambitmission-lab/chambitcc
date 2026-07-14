// 입력 검증 유틸리티
export const validation = {
  // 제목 검증 (선택 — 비워도 되며, 쓴 경우 길이만 확인)
  validateTitle: (title: string): { valid: boolean; error?: string } => {
    const trimmed = title.trim()

    if (!trimmed) {
      return { valid: true }  // 제목 없이 내용만으로도 작성 가능
    }

    if (trimmed.length > 100) {
      return { valid: false, error: '제목은 100자를 초과할 수 없습니다' }
    }

    return { valid: true }
  },

  // 내용 검증
  validateContent: (content: string): { valid: boolean; error?: string } => {
    const trimmed = content.trim()
    
    if (!trimmed) {
      return { valid: false, error: '내용을 입력해주세요' }
    }
    
    if (trimmed.length < 10) {
      return { valid: false, error: '내용은 최소 10자 이상이어야 합니다' }
    }
    
    if (trimmed.length > 1000) {
      return { valid: false, error: '내용은 1000자를 초과할 수 없습니다' }
    }
    
    return { valid: true }
  },

  // 표시 이름 검증
  validateDisplayName: (name: string): { valid: boolean; error?: string } => {
    const trimmed = name.trim()
    
    if (trimmed.length > 20) {
      return { valid: false, error: '이름은 20자를 초과할 수 없습니다' }
    }
    
    return { valid: true }
  },
}
