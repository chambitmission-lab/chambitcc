# 기도 목록 캐싱 구현 완료

## 구현 내용

React Query(TanStack Query)를 사용하여 기도 목록 API 응답을 캐싱하고 성능을 최적화했습니다.

## 변경된 파일

### 1. 새로 추가된 파일
- `src/config/queryClient.ts` - React Query 전역 설정
- `src/hooks/usePrayersQuery.ts` - React Query 기반 기도 목록 훅
- `CACHING_GUIDE.md` - 상세 캐싱 가이드 문서

### 2. 수정된 파일
- `src/main.tsx` - QueryClientProvider 및 DevTools 추가
- `src/pages/Home/NewHome.tsx` - 새로운 훅으로 교체, 무한 스크롤 개선

### 3. 설치된 패키지
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

## 주요 기능

### ✅ 자동 캐싱
- 2분간 캐시된 데이터를 fresh로 유지
- 30분간 메모리에 캐시 보관
- 페이지 재방문 시 즉시 표시

### ✅ Optimistic Updates
- 기도했어요 버튼 클릭 시 즉시 UI 반영
- 서버 응답 기다리지 않음
- 실패 시 자동 롤백

### ✅ 백그라운드 리페치
- 캐시된 데이터를 먼저 보여주고
- 백그라운드에서 최신 데이터 가져옴
- 사용자는 로딩 없이 즉시 콘텐츠 확인

### ✅ 중복 요청 제거
- 같은 데이터를 여러 번 요청하지 않음
- 네트워크 트래픽 감소

### ✅ 무한 스크롤 최적화
- 페이지별 캐싱
- 이미 로드된 페이지는 재요청 안함

### ✅ 개발자 도구
- React Query DevTools 포함
- 캐시 상태 실시간 모니터링

## 사용 방법

### 기본 사용
```typescript
import { usePrayersInfinite } from '../../hooks/usePrayersQuery'

const { 
  prayers,              // 기도 목록
  loading,              // 로딩 상태
  hasMore,              // 더 불러올 데이터 있는지
  loadMore,             // 다음 페이지 로드
  handlePrayerToggle,   // 기도했어요 토글
  refresh,              // 수동 새로고침
} = usePrayersInfinite('popular')
```

### 정렬 변경
```typescript
const [sort, setSort] = useState<SortType>('popular')
const prayerHook = usePrayersInfinite(sort)

// 정렬 변경 시 자동으로 캐시에서 가져오거나 새로 로드
setSort('latest')
```

## 성능 개선 효과

| 항목 | Before | After |
|------|--------|-------|
| 페이지 재방문 | 매번 API 호출 | 캐시에서 즉시 표시 |
| 정렬 전환 | 전체 재로드 | 캐시에서 즉시 표시 |
| 기도했어요 클릭 | 서버 응답 대기 | 즉시 UI 반영 |
| 중복 요청 | 발생 가능 | 자동 제거 |
| 네트워크 트래픽 | 높음 | 낮음 |

## 테스트 방법

1. 개발 서버 실행
```bash
cd frontend
npm run dev
```

2. 브라우저에서 확인
- 기도 목록 페이지 방문
- 화면 하단의 React Query 아이콘 클릭
- 캐시 상태 확인

3. 캐싱 동작 확인
- 페이지 새로고침 → 즉시 표시 (2분 내)
- 정렬 변경 → 즉시 전환
- 기도했어요 클릭 → 즉시 반영
- 네트워크 탭에서 중복 요청 없는지 확인

## 추가 최적화 가능

필요시 다음 기능들을 추가할 수 있습니다:

1. **Prefetching** - 다음 페이지 미리 로드
2. **Persistent Cache** - localStorage에 캐시 저장 (앱 재시작 후에도 유지)
3. **조건부 리페치** - 특정 조건에서만 자동 업데이트
4. **Polling** - 주기적으로 자동 새로고침

자세한 내용은 `CACHING_GUIDE.md`를 참고하세요.

## 문제 해결

### 캐시가 업데이트되지 않을 때
```typescript
prayerHook.refresh() // 수동 새로고침
```

### 개발 중 캐시 초기화
```typescript
import { queryClient } from './config/queryClient'
queryClient.clear() // 모든 캐시 제거
```

## 참고
- 상세 가이드: `CACHING_GUIDE.md`
- React Query 공식 문서: https://tanstack.com/query/latest
