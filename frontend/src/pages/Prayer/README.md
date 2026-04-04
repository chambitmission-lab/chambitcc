# 기도 소그룹 기능

## 개요

기도 목록에 **선택적 소그룹 기능**을 추가했습니다. 사용자는 전체 공개 기도와 소그룹 기도를 선택할 수 있습니다.

## 구조

```
🌍 전체 기도 나눔 (공개 피드) - 기본 기능
   ↓
👥 소그룹 기도방 (선택 기능)
   - 청년부
   - 찬양팀
   - 셀 모임 A
   - 사역팀 등
```

## 주요 기능

### 1. 그룹 필터 (GroupFilter)
- 전체 공개 / 내 그룹 선택
- 드롭다운으로 그룹 목록 표시
- 그룹 생성 및 가입 버튼

### 2. 그룹 생성 (CreateGroupModal)
- 그룹 이름, 설명, 아이콘 선택
- 생성 시 초대 코드 자동 생성
- 초대 코드 복사 기능

### 3. 그룹 가입 (JoinGroupModal)
- 초대 코드 입력으로 가입
- 유효성 검증

### 4. 기도 작성 (PrayerComposer)
- 공개 범위 선택 (전체 공개 / 특정 그룹)
- 기존 기도 작성 기능 유지

### 5. 기도 카드 (PrayerCard)
- 그룹 배지 표시
- 그룹 아이콘 + 이름

## 파일 구조

```
frontend/src/
├── types/prayer.ts                    # 타입 정의 (PrayerGroup 추가)
├── api/group.ts                       # 그룹 API (Mock)
├── hooks/useGroups.ts                 # 그룹 관리 Hook
├── components/prayer/
│   ├── GroupFilter.tsx                # 그룹 필터
│   ├── GroupFilter.css
│   ├── GroupModals.tsx                # 생성/가입 모달
│   ├── GroupModals.css
│   ├── PrayerComposer.tsx             # 기도 작성 (그룹 선택 포함)
│   ├── PrayerComposer.css
│   ├── PrayerCard.tsx                 # 기도 카드 (그룹 배지 포함)
│   └── PrayerCard.css
├── pages/Prayer/
│   ├── PrayerList.tsx                 # 기도 목록 페이지
│   ├── PrayerList.css
│   └── README.md
└── locales/
    ├── ko/prayer.ts                   # 한국어 번역
    └── en/prayer.ts                   # 영어 번역
```

## 백엔드 API 연동 준비

현재는 Mock 데이터로 동작하며, 백엔드 API가 준비되면 다음 파일만 수정하면 됩니다:

### 1. `frontend/src/api/group.ts`

```typescript
// TODO 주석이 있는 부분을 실제 API 호출로 변경

// 예시:
export const fetchMyGroups = async (): Promise<GroupListResponse> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/prayer-groups/my`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.json()
}
```

### 2. `frontend/src/api/prayer.ts`

기도 목록 조회 시 `group_id` 파라미터 추가:

```typescript
export const fetchPrayers = async (
  page: number = 1,
  limit: number = 20,
  sort: SortType = 'popular',
  groupId?: number  // 추가
): Promise<PrayerListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort,
  })
  
  if (groupId) {
    params.append('group_id', groupId.toString())
  }
  
  // ...
}
```

## 필요한 백엔드 API

### 그룹 관리
- `GET /api/v1/prayer-groups/my` - 내 그룹 목록
- `GET /api/v1/prayer-groups` - 전체 그룹 목록
- `POST /api/v1/prayer-groups` - 그룹 생성
- `POST /api/v1/prayer-groups/join` - 그룹 가입 (초대 코드)
- `DELETE /api/v1/prayer-groups/{id}/leave` - 그룹 탈퇴
- `GET /api/v1/prayer-groups/{id}/members` - 그룹 멤버 목록

### 기도 관리
- `GET /api/v1/prayers?group_id={id}` - 그룹별 기도 목록
- `POST /api/v1/prayers` - 기도 생성 (group_id 포함)

## 사용 방법

### 라우팅 추가

`App.tsx` 또는 라우터 설정에 추가:

```typescript
import PrayerList from './pages/Prayer/PrayerList'

// 라우트 추가
<Route path="/prayers" element={<PrayerList />} />
```

### 네비게이션 메뉴 추가

```typescript
<Link to="/prayers">기도 나눔</Link>
```

## 테스트

현재 Mock 데이터로 다음 기능을 테스트할 수 있습니다:

1. ✅ 그룹 필터 (전체 공개 / 내 그룹)
2. ✅ 그룹 생성 (초대 코드 생성)
3. ✅ 그룹 가입 (초대 코드 입력)
4. ✅ 기도 작성 (그룹 선택)
5. ✅ 기도 카드 (그룹 배지 표시)
6. ✅ 다국어 지원 (한국어/영어)

## 다음 단계

1. 백엔드 API 개발 완료 대기
2. `frontend/src/api/group.ts`의 Mock 함수를 실제 API로 교체
3. 에러 처리 및 로딩 상태 개선
4. 그룹 관리 페이지 추가 (멤버 관리, 설정 등)
5. 푸시 알림 연동 (그룹 내 새 기도 알림)

## 주의사항

- 현재는 프론트엔드 필터링으로 그룹별 기도를 표시하지만, 실제로는 백엔드에서 필터링해야 합니다
- 초대 코드는 백엔드에서 생성하고 관리해야 합니다
- 그룹 권한 관리 (관리자/멤버)는 백엔드에서 처리해야 합니다
