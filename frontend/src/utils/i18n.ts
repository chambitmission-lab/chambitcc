// 간단한 다국어 지원 유틸리티
export type Language = 'ko' | 'en'

export const translations = {
  ko: {
    // 공통
    close: '닫기',
    back: '뒤로',
    save: '저장',
    cancel: '취소',
    delete: '삭제',
    edit: '수정',
    loading: '로딩 중...',
    error: '오류가 발생했습니다',
    
    // 네비게이션
    home: '홈',
    profile: '프로필',
    sermon: '설교',
    worship: '예배',
    about: '소개',
    
    // 기도 관련
    prayer: '기도',
    prayerRequest: '기도 요청',
    newPrayerRequest: '새 기도 요청',
    anonymousPrayerRequest: '익명 기도 요청',
    prayerTitle: '기도 제목',
    prayerContent: '기도 내용',
    prayerPlaceholder: '기도 제목을 나눠주세요...',
    writePrayerRequest: '기도 요청 작성',
    noPrayersYet: '아직 기도 요청이 없습니다',
    firstPrayerRequest: '첫 번째로 나눠주세요',
    loadingPrayers: '기도 요청을 불러오는 중...',
    prayerFailed: '기도 처리에 실패했습니다',
    loadingPrayerList: '기도 목록을 불러오는 중...',
    notAlone: '혼자가 아닙니다. 함께 기도합니다.',
    
    // 기도 통계
    peopleArePraying: '명이 기도중',
    praying: '기도중',
    prayed: '기도함',
    totalPrayers: '총 기도',
    consecutivePrayers: '연속 기도',
    
    // 댓글 관련
    reply: '댓글',
    replies: '댓글',
    replyCount: '개',
    noRepliesYet: '아직 댓글이 없습니다',
    writeReply: '댓글 작성',
    
    // 프로필
    myProfile: '프로필',
    myPrayers: '내 기도',
    myReplies: '댓글',
    prayingFor: '기도중',
    myPrayerActivity: '나의 기도 활동',
    noPrayersWritten: '아직 작성한 기도가 없습니다',
    noPrayingFor: '아직 기도중인 항목이 없습니다',
    noRepliesWritten: '아직 작성한 댓글이 없습니다',
    cannotLoadProfile: '프로필을 불러올 수 없습니다',
    logout: '로그아웃',
    
    // 성경 말씀
    bibleVerse: '성경 말씀',
    bibleVersesForYou: '당신을 위한 성경 말씀',
    todaysVerse: '오늘의 말씀',
    viewMore: '더보기',
    
    // 정렬
    popular: '인기순',
    latest: '최신순',
    
    // 번역
    translation: '번역',
    viewOriginal: '원문 보기',
    viewTranslation: '번역 보기',
    
    // 익명/실명
    anonymous: '익명',
    realName: '실명',
    anonymousNotice: '기도 요청은 익명으로 게시됩니다. 표시 이름만 다른 사람에게 보입니다.',
    realNameNotice: '기도 요청이 실명으로 게시됩니다. 다른 사람들이 작성자를 확인할 수 있습니다.',
    
    // 인증
    login: '로그인',
    register: '회원가입',
    
    // 기타
    cannotLoadData: '데이터를 불러올 수 없습니다',
    refresh: '새로고침',
    owner: '작성자',
    deleteConfirm: '정말 삭제하시겠습니까?',
  },
  en: {
    // Common
    close: 'Close',
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'An error occurred',
    
    // Navigation
    home: 'Home',
    profile: 'Profile',
    sermon: 'Sermon',
    worship: 'Worship',
    about: 'About',
    
    // Prayer
    prayer: 'Prayer',
    prayerRequest: 'Prayer Request',
    newPrayerRequest: 'New Prayer Request',
    anonymousPrayerRequest: 'Anonymous Prayer Request',
    prayerTitle: 'Prayer Title',
    prayerContent: 'Prayer Content',
    prayerPlaceholder: 'Share your prayer request...',
    writePrayerRequest: 'Write Prayer Request',
    noPrayersYet: 'No prayer requests yet',
    firstPrayerRequest: 'Be the first to share',
    loadingPrayers: 'Loading prayer requests...',
    prayerFailed: 'Failed to process prayer',
    loadingPrayerList: 'Loading prayer list...',
    notAlone: 'You are not alone. We pray together.',
    
    // Prayer Stats
    peopleArePraying: 'people praying',
    praying: 'Praying',
    prayed: 'Prayed',
    totalPrayers: 'Total Prayers',
    consecutivePrayers: 'Streak Days',
    
    // Reply
    reply: 'Reply',
    replies: 'Replies',
    replyCount: '',
    noRepliesYet: 'No replies yet',
    writeReply: 'Write Reply',
    
    // Profile
    myProfile: 'Profile',
    myPrayers: 'My Prayers',
    myReplies: 'Replies',
    prayingFor: 'Praying For',
    myPrayerActivity: 'My Prayer Activity',
    noPrayersWritten: 'No prayers written yet',
    noPrayingFor: 'Not praying for anything yet',
    noRepliesWritten: 'No replies written yet',
    cannotLoadProfile: 'Cannot load profile',
    logout: 'Logout',
    
    // Bible Verse
    bibleVerse: 'Bible Verse',
    bibleVersesForYou: 'Bible Verses For You',
    todaysVerse: "Today's Verse",
    viewMore: 'View More',
    
    // Sort
    popular: 'Popular',
    latest: 'Latest',
    
    // Translation
    translation: 'Translation',
    viewOriginal: 'View Original',
    viewTranslation: 'View Translation',
    
    // Anonymous/Real Name
    anonymous: 'Anonymous',
    realName: 'Real Name',
    anonymousNotice: 'Prayer request will be posted anonymously. Only display name will be visible.',
    realNameNotice: 'Prayer request will be posted with your real name. Others can see who wrote it.',
    
    // Auth
    login: 'Login',
    register: 'Register',
    
    // Others
    cannotLoadData: 'Cannot load data',
    refresh: 'Refresh',
    owner: 'Owner',
    deleteConfirm: 'Are you sure you want to delete?',
  },
} as const

// 브라우저 언어 감지
export const detectLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('ko')) return 'ko'
  return 'en'
}

// 로컬 스토리지에서 언어 가져오기
export const getStoredLanguage = (): Language => {
  const stored = localStorage.getItem('language') as Language
  return stored || detectLanguage()
}

// 로컬 스토리지에 언어 저장
export const setStoredLanguage = (lang: Language): void => {
  localStorage.setItem('language', lang)
}
