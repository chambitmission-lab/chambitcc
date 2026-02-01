# 기도 상세 조회 기능 구현 완료

## 구현 내용

기도 요청 상세 조회 API를 연동하고, 모달 형태의 상세 페이지를 구현했습니다.

## 변경된 파일

### 1. 새로 추가된 파일
- `src/pages/Home/components/PrayerDetail.tsx` - 기도 상세 모달 컴포넌트

### 2. 수정된 파일
- `src/api/prayer.ts` - `fetchPrayerDetail()` API 함수 추가
- `src/types/prayer.ts` - `is_owner` 필드 추가, `PrayerDetailResponse` 타입 추가
- `src/hooks/usePrayersQuery.ts` - `usePrayerDetail()` 훅 추가
- `src/pages/Home/NewHome.tsx` - 기도 카드 클릭 시 상세 모달 표시

## 주요 기능

### ✅ 기도 상세 조회
- API: `GET /api/v1/prayers/{prayer_id}`
- 기도 카드 클릭 시 상세 모달 표시
- 캐싱 적용 (2분간 fresh 유지)

### ✅ 상세 페이지 기능
- 기도 제목 및 내용 전체 표시
- 영어 번역 토글 (있는 경우)
- 기도했어요 버튼 (Optimistic Update)
- 댓글 버튼 (UI만)
- 기도 통계 (기도 수, 댓글 수)
- 내가 작성한 기도 표시 (`is_owner`)

### ✅ Optimistic Updates
- 기도했어요 버튼 클릭 시 즉시 UI 반영
- 실패 시 자동 롤백
- 성공 시 목록 캐시도 자동 업데이트

### ✅ 사용자 경험 개선
- 기도 카드에 hover 효과 추가
- 버튼 클릭 시 이벤트 전파 방지 (카드 클릭과 분리)
- 로딩 상태 표시
- 에러 처리

## API 응답 형식

```json
{
  "success": true,
  "data": {
    "id": 1,
    "display_name": "익명",
    "title": "힘든 시기를 겪고 있습니다",
    "content": "요즘 직장에서 어려움을 겪고 있습니다...",
    "title_en": "Going through a difficult time",
    "content_en": "I'm having difficulties at work these days...",
    "prayer_count": 15,
    "reply_count": 3,
    "is_prayed": false,
    "is_owner": false,
    "created_at": "2024-01-15T10:30:00Z",
    "time_ago": "2시간 전"
  }
}
```

## 사용 방법

### 1. 기도 상세 조회 훅 사용
```typescript
import { usePrayerDetail } from '../../../hooks/usePrayersQuery'

const MyComponent = () => {
  const { 
    prayer,              // 기도 상세 데이터
    loading,             // 로딩 상태
    error,               // 에러 메시지
    fingerprint,         // 사용자 fingerprint
    handlePrayerToggle,  // 기도했어요 토글
    isToggling,          // 토글 중 상태
    refresh,             // 수동 새로고침
  } = usePrayerDetail(prayerId)

  return (
    <div>
      {loading && <p>로딩 중...</p>}
      {error && <p>{error}</p>}
      {prayer && (
        <div>
          <h1>{prayer.title}</h1>
          <p>{prayer.content}</p>
          <button onClick={handlePrayerToggle}>
            {prayer.is_prayed ? '기도중' : '기도하기'}
          </button>
        </div>
      )}
    </div>
  )
}
```

### 2. 상세 모달 컴포넌트 사용
```typescript
import PrayerDetail from './components/PrayerDetail'

const [selectedPrayerId, setSelectedPrayerId] = useState<number | null>(null)

// 모달 열기
<button onClick={() => setSelectedPrayerId(1)}>
  상세 보기
</button>

// 모달 렌더링
{selectedPrayerId && (
  <PrayerDetail
    prayerId={selectedPrayerId}
    onClose={() => setSelectedPrayerId(null)}
  />
)}
```

### 3. 기도 카드 클릭 이벤트
```typescript
<PrayerArticle
  prayer={prayer}
  onPrayerToggle={handleToggle}
  onClick={() => setSelectedPrayerId(prayer.id)}
/>
```

## 캐싱 동작

### 상세 조회 캐싱
- **Query Key**: `['prayers', 'detail', prayerId, fingerprint]`
- **staleTime**: 2분
- **gcTime**: 30분

### 캐시 무효화
- 기도했어요 토글 성공 시 목록 캐시 자동 무효화
- 상세 페이지 캐시는 서버 응답으로 업데이트

### 캐시 흐름
1. 기도 카드 클릭
2. 캐시 확인 (2분 내면 캐시 사용)
3. 캐시 없으면 API 호출
4. 기도했어요 클릭 시 즉시 UI 업데이트
5. 백그라운드에서 API 호출
6. 성공 시 목록 캐시도 업데이트

## 이벤트 전파 방지

기도 카드 내부의 버튼들은 클릭 시 상세 페이지가 열리지 않도록 이벤트 전파를 방지합니다:

```typescript
// 기도했어요 버튼
const handlePray = async (e: React.MouseEvent) => {
  e.stopPropagation() // 카드 클릭 이벤트 방지
  // ...
}

// 영어 번역 버튼
<button onClick={(e) => {
  e.stopPropagation()
  setShowEnglish(!showEnglish)
}}>

// 댓글, 공유, 더보기 버튼
<button onClick={(e) => e.stopPropagation()}>
```

## UI/UX 개선

### 기도 카드
- hover 시 배경색 변경
- cursor: pointer 추가
- 부드러운 transition 효과

### 상세 모달
- 모바일: 하단에서 올라오는 바텀시트 스타일
- 데스크톱: 중앙 모달
- 최대 높이 90vh, 스크롤 가능
- 닫기 버튼 (X)
- 배경 클릭 시 닫기 (구현 가능)

### 로딩 상태
- 스피너 + 텍스트
- 중앙 정렬
- 부드러운 애니메이션

### 에러 상태
- 에러 메시지 표시
- 닫기 버튼 제공

## 추가 구현 가능 기능

### 1. 댓글 기능
```typescript
// 댓글 목록 조회
const { comments } = useComments(prayerId)

// 댓글 작성
const { mutate: createComment } = useCreateComment()
```

### 2. 공유 기능
```typescript
const handleShare = async () => {
  if (navigator.share) {
    await navigator.share({
      title: prayer.title,
      text: prayer.content,
      url: `${window.location.origin}/prayers/${prayer.id}`,
    })
  }
}
```

### 3. 북마크 기능
```typescript
const { mutate: toggleBookmark } = useToggleBookmark()
```

### 4. 신고 기능
```typescript
const { mutate: reportPrayer } = useReportPrayer()
```

### 5. 수정/삭제 (is_owner인 경우)
```typescript
{prayer.is_owner && (
  <>
    <button onClick={handleEdit}>수정</button>
    <button onClick={handleDelete}>삭제</button>
  </>
)}
```

## 테스트 방법

1. 개발 서버 실행
```bash
cd frontend
npm run dev
```

2. 로컬 백엔드 서버 실행 (포트 8000)

3. 브라우저에서 확인
- 기도 목록 페이지 방문
- 기도 카드 클릭
- 상세 모달 확인
- 기도했어요 버튼 클릭 (즉시 반영 확인)
- 영어 번역 토글 (있는 경우)
- 네트워크 탭에서 API 호출 확인

4. 캐싱 확인
- 같은 기도 카드 다시 클릭 (2분 내)
- 네트워크 탭에서 API 호출 없는지 확인
- React Query DevTools로 캐시 상태 확인 (필요시)

## 환경 설정

### API URL 설정
`.env` 파일에서 백엔드 서버 URL 설정:

```env
# 로컬 개발
VITE_API_URL=http://localhost:8000

# 프로덕션
VITE_API_URL=https://your-production-server.com
```

## 참고
- 상세 캐싱 가이드: `CACHING_GUIDE.md`
- API 문서: `BACKEND_API_REQUEST.md`
