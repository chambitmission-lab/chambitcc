// 이벤트 관련 번역
export const event = {
  title: '교회 일정',
  calendar: '달력',
  list: '목록',
  detail: '상세 정보',
  create: '일정 등록',
  edit: '일정 수정',
  delete: '일정 삭제',
  
  // 카테고리
  category: '카테고리',
  categories: {
    all: '전체',
    worship: '예배',
    meeting: '모임',
    service: '봉사',
    special: '특별행사',
    education: '교육',
    other: '기타',
  },
  
  // 필드
  eventTitle: '제목',
  description: '설명',
  startDate: '시작일시',
  endDate: '종료일시',
  location: '장소',
  attachment: '첨부파일',
  repeatType: '반복',
  repeatEndDate: '반복 종료일',
  isPublished: '공개',
  
  // 반복 타입
  repeat: {
    none: '반복 안함',
    daily: '매일',
    weekly: '매주',
    monthly: '매월',
  },
  
  // 참석
  attendance: '참석',
  attendanceCount: '참석 예정',
  attendanceStatus: {
    attending: '참석',
    maybe: '미정',
    not_attending: '불참',
  },
  attend: '참석 의사 표시',
  cancelAttendance: '참석 취소',
  
  // 댓글
  comments: '댓글',
  writeComment: '댓글 작성',
  deleteComment: '댓글 삭제',
  
  // 메시지
  noEvents: '등록된 일정이 없습니다',
  loadMore: '더 보기',
  views: '조회',
  
  // 폼
  selectCategory: '카테고리 선택',
  selectRepeatType: '반복 유형 선택',
  enterTitle: '제목을 입력하세요',
  enterDescription: '설명을 입력하세요',
  enterLocation: '장소를 입력하세요',
  uploadFile: '파일 업로드',
  
  // 확인 메시지
  confirmDelete: '이 일정을 삭제하시겠습니까?',
  confirmDeleteComment: '이 댓글을 삭제하시겠습니까?',
  
  // 성공/에러 메시지
  createSuccess: '일정이 등록되었습니다',
  updateSuccess: '일정이 수정되었습니다',
  deleteSuccess: '일정이 삭제되었습니다',
  attendSuccess: '참석 의사가 등록되었습니다',
  cancelSuccess: '참석이 취소되었습니다',
  commentSuccess: '댓글이 작성되었습니다',
  commentDeleteSuccess: '댓글이 삭제되었습니다',
  
  error: '오류가 발생했습니다',
  loginRequired: '로그인이 필요합니다',
} as const
