# 성경 음성 읽기 - 백엔드 연동 완료

## ✅ 연동 완료

백엔드 API와의 연동이 완료되었습니다!

## 📁 추가된 파일

### API 레이어
- `src/api/bibleReading.ts` - 백엔드 API 호출 함수들
  - `markVerseAsRead()` - 구절 읽음 처리
  - `getReadVerses()` - 읽은 구절 목록 조회
  - `getChapterReadStatus()` - 특정 장의 읽음 상태 조회
  - `getReadingProgress()` - 전체 읽기 진행률 조회
  - `getBookReadingProgress()` - 특정 책의 읽기 진행률 조회
  - `unmarkVerseAsRead()` - 읽음 취소

### React Query 훅
- `src/hooks/useBibleReading.ts` - React Query 훅들
  - `useMarkVerseAsRead()` - 읽음 처리 Mutation
  - `useChapterReadStatus()` - 장 읽음 상태 Query
  - `useReadVerses()` - 읽은 구절 목록 Query
  - `useReadingProgress()` - 전체 진행률 Query
  - `useBookReadingProgress()` - 책 진행률 Query
  - `useUnmarkVerseAsRead()` - 읽음 취소 Mutation

## 🔄 데이터 흐름

### 1. 구절 읽기 성공 시
```
사용자 음성 읽기
  ↓
텍스트 유사도 검증 (75% 이상)
  ↓
useMarkVerseAsRead.mutateAsync()
  ↓
POST /api/v1/bible/verses/{verse_id}/read
  ↓
백엔드 DB 저장
  ↓
React Query 캐시 무효화
  ↓
UI 자동 업데이트 (체크 표시, 진행률)
```

### 2. 페이지 로드 시
```
성경 읽기 페이지 접속
  ↓
음성 읽기 모드 활성화
  ↓
useChapterReadStatus(bookNumber, chapter)
  ↓
GET /api/v1/bible/chapters/{book_number}/{chapter}/read-status
  ↓
읽은 구절 표시 (체크, 취소선)
  ↓
진행률 표시 (X / Y, 진행률 바)
```

## 🎯 주요 기능

### 자동 캐시 관리
- React Query가 자동으로 캐시 관리
- 읽음 처리 성공 시 관련 쿼리 자동 무효화
- 5분간 캐시 유지 (staleTime)

### 낙관적 업데이트
- 백엔드 응답 전에 UI 먼저 업데이트
- 실패 시 자동 롤백
- 빠른 사용자 경험

### 에러 처리
- 네트워크 에러 자동 재시도
- 인증 에러 시 자동 토큰 갱신
- 사용자 친화적 에러 메시지

## 📊 API 엔드포인트

### 구절 읽음 처리
```typescript
POST /api/v1/bible/verses/{verse_id}/read
Authorization: Bearer {token}

Request:
{
  "similarity": 0.95,
  "read_at": "2024-03-07T10:30:00Z"
}

Response:
{
  "success": true,
  "data": {
    "id": 123,
    "user_id": 456,
    "verse_id": 1,
    "similarity": 0.95,
    "read_at": "2024-03-07T10:30:00Z",
    "created_at": "2024-03-07T10:30:00Z"
  }
}
```

### 장 읽음 상태 조회
```typescript
GET /api/v1/bible/chapters/{book_number}/{chapter}/read-status
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "book_number": 1,
    "book_name_ko": "창세기",
    "chapter": 1,
    "total_verses": 31,
    "read_verses": 15,
    "progress": 48.39,
    "verses": [
      {
        "verse_id": 1,
        "verse": 1,
        "is_read": true,
        "similarity": 0.95,
        "read_at": "2024-03-07T10:30:00Z"
      },
      ...
    ]
  }
}
```

## 🔧 사용 예시

### 컴포넌트에서 사용
```typescript
import { useChapterReadStatus, useMarkVerseAsRead } from '../hooks/useBibleReading'

const MyComponent = () => {
  // 읽음 상태 조회
  const { data, isLoading } = useChapterReadStatus(1, 1)
  
  // 읽음 처리
  const markAsRead = useMarkVerseAsRead()
  
  const handleRead = async (verseId: number, similarity: number) => {
    try {
      await markAsRead.mutateAsync({ verseId, similarity })
      console.log('Success!')
    } catch (error) {
      console.error('Failed:', error)
    }
  }
  
  return (
    <div>
      {data?.verses.map(verse => (
        <div key={verse.verse_id}>
          {verse.is_read ? '✅' : '⬜'} Verse {verse.verse}
        </div>
      ))}
    </div>
  )
}
```

## 🎨 UI 업데이트

### VerseList 컴포넌트
- `useChapterReadStatus()` 훅으로 읽음 상태 조회
- 읽기 모드 활성화 시에만 API 호출
- 백엔드 데이터 기반으로 진행률 표시

### VerseItem 컴포넌트
- 읽음 성공 시 `useMarkVerseAsRead()` 호출
- 자동으로 UI 업데이트 (React Query 캐시 무효화)
- 에러 발생 시 사용자에게 알림

## 🔐 인증

모든 API는 JWT 토큰 인증이 필요합니다:
```typescript
Authorization: Bearer {access_token}
```

- `requireAuth()` - 로그인 확인
- `getAuthHeaders(true)` - 인증 헤더 자동 추가
- 토큰 만료 시 자동 갱신 (apiFetch)

## 📈 성능 최적화

### 캐싱 전략
```typescript
{
  staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
  cacheTime: 1000 * 60 * 30, // 30분간 메모리 유지
}
```

### 쿼리 무효화
```typescript
// 읽음 처리 성공 시
queryClient.invalidateQueries({ 
  queryKey: bibleReadingKeys.all 
})
```

### 조건부 쿼리
```typescript
// 읽기 모드일 때만 조회
useChapterReadStatus(bookNumber, chapter, readingMode)
```

## 🧪 테스트

### 로컬 테스트
```bash
cd frontend
npm run dev
```

### API 테스트
1. 성경 읽기 페이지 접속
2. 음성 읽기 모드 활성화
3. 구절 읽기 시도
4. 네트워크 탭에서 API 호출 확인
5. 진행률 업데이트 확인

### 에러 테스트
1. 네트워크 끊고 읽기 시도 → 에러 처리 확인
2. 토큰 만료 시뮬레이션 → 자동 갱신 확인
3. 중복 읽기 시도 → 409 에러 처리 확인

## 🐛 문제 해결

### "읽음 처리가 안 돼요"
→ 네트워크 탭에서 API 응답 확인
→ 401 에러: 로그인 확인
→ 500 에러: 백엔드 로그 확인

### "진행률이 안 보여요"
→ 읽기 모드 활성화 확인
→ API 응답 데이터 구조 확인
→ React Query DevTools로 캐시 확인

### "읽은 구절이 사라져요"
→ 캐시 무효화 로직 확인
→ 쿼리 키 일치 여부 확인
→ 백엔드 데이터 저장 확인

## 📚 관련 문서

- [전체 가이드](./BIBLE_VOICE_READING.md)
- [백엔드 API 명세](../BIBLE_READING_API_SPEC.md)
- [빠른 시작](./BIBLE_VOICE_READING_QUICKSTART.md)

## 🎉 완료!

백엔드 API와의 연동이 완료되어 사용자의 읽기 기록이 서버에 저장됩니다!

### 다음 단계
1. ✅ 프론트엔드 구현
2. ✅ 백엔드 API 구현
3. ✅ API 연동
4. ⬜ 통합 테스트
5. ⬜ 배포
