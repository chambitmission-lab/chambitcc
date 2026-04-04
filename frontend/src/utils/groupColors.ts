// 그룹별 고유한 빛의 색상 시스템
export interface GroupColorTheme {
  name: string
  primary: string // 메인 색상
  secondary: string // 보조 색상
  accent: string // 강조 색상
  glow: string // 발광 효과
  particle: string // 파티클 색상
  shadow: string // 그림자 효과
  gradient: string // 그라데이션
}

// 그룹별 색상 테마 정의
const groupColorThemes: Record<string, GroupColorTheme> = {
  // 유치부 - 밝고 따뜻한 노란색 (순수한 빛)
  '유치부': {
    name: '순수한 빛',
    primary: '#FCD34D', // yellow-300
    secondary: '#FDE047', // yellow-300
    accent: '#FBBF24', // yellow-400
    glow: 'rgba(252, 211, 77, 0.6)',
    particle: '🌟',
    shadow: '0 0 20px rgba(252, 211, 77, 0.4)',
    gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE047 50%, #FBBF24 100%)'
  },
  
  // 청년부 - 활기찬 오렌지 (열정의 불꽃)
  '청년부': {
    name: '열정의 불꽃',
    primary: '#FB923C', // orange-400
    secondary: '#F97316', // orange-500
    accent: '#EA580C', // orange-600
    glow: 'rgba(251, 146, 60, 0.6)',
    particle: '🔥',
    shadow: '0 0 20px rgba(251, 146, 60, 0.4)',
    gradient: 'linear-gradient(135deg, #FFEDD5 0%, #FB923C 50%, #EA580C 100%)'
  },
  
  // 장년부 - 깊은 골드 (성숙한 빛)
  '장년부': {
    name: '성숙한 빛',
    primary: '#D97706', // amber-600
    secondary: '#B45309', // amber-700
    accent: '#92400E', // amber-800
    glow: 'rgba(217, 119, 6, 0.6)',
    particle: '✨',
    shadow: '0 0 20px rgba(217, 119, 6, 0.4)',
    gradient: 'linear-gradient(135deg, #FEF3C7 0%, #D97706 50%, #92400E 100%)'
  },
  
  // 중고등부 - 생동감 있는 청록색 (성장의 빛)
  '중고등부': {
    name: '성장의 빛',
    primary: '#14B8A6', // teal-500
    secondary: '#0D9488', // teal-600
    accent: '#0F766E', // teal-700
    glow: 'rgba(20, 184, 166, 0.6)',
    particle: '💫',
    shadow: '0 0 20px rgba(20, 184, 166, 0.4)',
    gradient: 'linear-gradient(135deg, #CCFBF1 0%, #14B8A6 50%, #0F766E 100%)'
  },
  
  // 선교부 - 밝은 하늘색 (희망의 빛)
  '선교부': {
    name: '희망의 빛',
    primary: '#38BDF8', // sky-400
    secondary: '#0EA5E9', // sky-500
    accent: '#0284C7', // sky-600
    glow: 'rgba(56, 189, 248, 0.6)',
    particle: '🌈',
    shadow: '0 0 20px rgba(56, 189, 248, 0.4)',
    gradient: 'linear-gradient(135deg, #E0F2FE 0%, #38BDF8 50%, #0284C7 100%)'
  },
  
  // 찬양팀 - 보라색 (영광의 빛)
  '찬양팀': {
    name: '영광의 빛',
    primary: '#A78BFA', // violet-400
    secondary: '#8B5CF6', // violet-500
    accent: '#7C3AED', // violet-600
    glow: 'rgba(167, 139, 250, 0.6)',
    particle: '🎵',
    shadow: '0 0 20px rgba(167, 139, 250, 0.4)',
    gradient: 'linear-gradient(135deg, #EDE9FE 0%, #A78BFA 50%, #7C3AED 100%)'
  },
  
  // 기본 (그룹 없음) - 따뜻한 골드
  'default': {
    name: '참빛',
    primary: '#FCD34D', // amber-300
    secondary: '#FFC107',
    accent: '#FF9800',
    glow: 'rgba(251, 191, 36, 0.6)',
    particle: '✨',
    shadow: '0 0 20px rgba(251, 191, 36, 0.4)',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFC107 50%, #FF9800 100%)'
  }
}

// 그룹 이름으로 색상 테마 가져오기
export const getGroupColorTheme = (groupName?: string): GroupColorTheme => {
  if (!groupName) return groupColorThemes.default
  
  // 정확히 일치하는 그룹 찾기
  if (groupColorThemes[groupName]) {
    return groupColorThemes[groupName]
  }
  
  // 부분 일치 검색 (예: "청년부 1팀" -> "청년부")
  const matchedKey = Object.keys(groupColorThemes).find(key => 
    groupName.includes(key) || key.includes(groupName)
  )
  
  if (matchedKey) {
    return groupColorThemes[matchedKey]
  }
  
  // 그룹 ID 기반 색상 (일치하는 게 없을 때)
  return groupColorThemes.default
}

// 그룹 ID로 색상 테마 가져오기 (해시 기반)
export const getGroupColorThemeById = (groupId?: number, groupName?: string): GroupColorTheme => {
  // 이름이 있으면 이름 우선
  if (groupName) {
    return getGroupColorTheme(groupName)
  }
  
  // ID만 있으면 해시로 색상 선택
  if (groupId) {
    const themes = Object.values(groupColorThemes).filter(t => t.name !== '참빛')
    const index = groupId % themes.length
    return themes[index]
  }
  
  return groupColorThemes.default
}

// CSS 변수로 변환
export const getGroupColorCSSVars = (theme: GroupColorTheme) => ({
  '--group-primary': theme.primary,
  '--group-secondary': theme.secondary,
  '--group-accent': theme.accent,
  '--group-glow': theme.glow,
  '--group-shadow': theme.shadow,
  '--group-gradient': theme.gradient
})
