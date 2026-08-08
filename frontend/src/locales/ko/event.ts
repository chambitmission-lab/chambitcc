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
  currentStatus: '현재 상태',
  changeTo: '{status}(으)로 변경',
  rsvpDeadline: 'RSVP 마감',
  rsvpClosed: 'RSVP 마감되었습니다',
  rsvpClosesOn: 'RSVP 마감: {date}',
  rsvpDeadlineAfterStart: 'RSVP 마감은 일정 시작 시각보다 늦을 수 없어요.',
  rsvpRemaining: '마감까지 {time} 남음',
  rsvpClosedBadge: '접수 마감',
  rsvpClosedForResponder: '마감 후에도 응답 변경과 취소는 할 수 있어요.',
  rsvpClosedForNewcomer: '새 참석 등록은 더 이상 받지 않아요.',
  rsvpCancelAfterCloseTitle: '참석 취소',
  rsvpCancelAfterCloseConfirm: '지금 취소하면 다시 참석 등록을 할 수 없어요.\n그래도 취소할까요?',
  rsvpCancelAfterCloseAction: '취소하기',

  // 상세 페이지 퀵 액션
  addToCalendar: '캘린더 추가',
  viewMap: '지도 보기',
  share: '공유',
  linkCopied: '링크 복사됨!',

  // 참석자
  attendees: '함께하는 사람들',
  attendeesMaybeCount: '미정 {count}명',
  attendeesNotAttendingCount: '불참 {count}명',

  // 소그룹 전용 모임
  groupOnlyBadge: '소그룹 전용',
  groupLabel: '그룹',
  groupOptional: '소그룹 (선택)',
  groupPublic: '전체 공개',
  selectGroup: '그룹 선택',
  
  // 댓글
  comments: '댓글',
  writeComment: '댓글 작성',
  deleteComment: '댓글 삭제',
  noComments: '아직 댓글이 없어요. 첫 댓글을 남겨보세요 ✨',
  
  // 빈 상태 카드
  emptyTitleAll: '이번 주는 조금 여유로운 한 주네요!',
  emptyTitleCategory: '아직 예정된 {label} 일정이 없어요',
  emptyDescAll: '친구들에게 먼저 모임을 제안해 보는 건 어떨까요? ✨',
  emptyDescCategory: '다른 카테고리도 눌러 보세요. 새 소식이 곧 올라올 거예요 ✨',
  emptyCreateEvent: '새 일정 만들기',
  emptyBrowseGroups: '내 모임 둘러보기',

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
  confirmDeleteAction: '삭제',
  confirmDeleteCommentTitle: '댓글 삭제',
  confirmDeleteComment: '이 댓글을 삭제하시겠습니까?',
  confirmDeleteCommentAction: '삭제',
  
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
