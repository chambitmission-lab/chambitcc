# 소그룹 기능 통합 가이드

## 빠른 시작

### 1. 라우팅 추가

기존 라우터 설정에 기도 목록 페이지를 추가하세요:

```typescript
// App.tsx 또는 라우터 설정 파일
import PrayerList from './pages/Prayer/PrayerList'

// 라우트 추가
<Route path="/prayers" element={<PrayerList />} />
```

### 2. 네비게이션 메뉴 추가

```typescript
// 네비게이션 컴포넌트
<Link to="/prayers">
  <span>🙏</span>
  <span>기도 나눔</span>
</Link>
```

### 3. 테스트

브라우저에서 `/prayers` 경로로 이동하여 다음 기능을 테스트:

- ✅ 전체 공개 / 내 그룹 필터
- ✅ 그룹 생성 (초대 코드 자동 생성)
- ✅ 그룹 가입 (초대 코드 입력)
- ✅ 기도 작성 (그룹 선택)
- ✅ 기도 카드 표시

## 기존 기도 페이지와 통합

기존에 기도 관련 페이지가 있다면, 컴포넌트를 재사용할 수 있습니다:

### 옵션 1: 기존 페이지에 그룹 필터 추가

```typescript
import { useState } from 'react'
import GroupFilter from '../../components/prayer/GroupFilter'
import { CreateGroupModal, JoinGroupModal } from '../../components/prayer/GroupModals'

const YourExistingPrayerPage = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  
  return (
    <div>
      {/* 그룹 필터 추가 */}
      <GroupFilter
        selectedGroupId={selectedGroupId}
        onGroupChange={setSelectedGroupId}
        onCreateGroup={() => setShowCreateModal(true)}
        onJoinGroup={() => setShowJoinModal(true)}
      />
      
      {/* 기존 기도 목록 컴포넌트 */}
      <YourPrayerList groupId={selectedGroupId} />
      
      {/* 모달 */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      <JoinGroupModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </div>
  )
}
```

### 옵션 2: 새 페이지로 분리

- `/prayers` - 전체 공개 기도 (기존)
- `/prayers/groups` - 소그룹 기도 (새로 추가)

## 컴포넌트 개별 사용

### GroupFilter만 사용

```typescript
import GroupFilter from '../../components/prayer/GroupFilter'

<GroupFilter
  selectedGroupId={selectedGroupId}
  onGroupChange={(id) => setSelectedGroupId(id)}
  onCreateGroup={() => {/* 그룹 생성 로직 */}}
  onJoinGroup={() => {/* 그룹 가입 로직 */}}
/>
```

### PrayerCard만 사용

```typescript
import PrayerCard from '../../components/prayer/PrayerCard'

<PrayerCard
  prayer={prayerData}
  onPrayerToggle={(id) => handleToggle(id)}
  onReplyClick={(id) => handleReply(id)}
  isToggling={false}
/>
```

### PrayerComposer만 사용

```typescript
import PrayerComposer from '../../components/prayer/PrayerComposer'

<PrayerComposer
  onSubmit={async (data) => {
    await createPrayer(data)
  }}
  isSubmitting={false}
/>
```

## 스타일 커스터마이징

각 컴포넌트의 CSS 파일을 수정하여 디자인을 변경할 수 있습니다:

```
frontend/src/components/prayer/
├── GroupFilter.css       # 그룹 필터 스타일
├── GroupModals.css       # 모달 스타일
├── PrayerComposer.css    # 작성 폼 스타일
└── PrayerCard.css        # 카드 스타일
```

### 예시: 색상 변경

```css
/* GroupFilter.css */
.group-filter-btn.active {
  border-color: #your-color;
  background: #your-color;
}
```

## 다국어 지원

이미 한국어/영어 번역이 추가되어 있습니다:

```typescript
import { useLanguage } from '../../contexts/LanguageContext'

const { t } = useLanguage()

// 사용
<h1>{t.prayer.prayerGroups}</h1>
<button>{t.prayer.createGroup}</button>
```

## 백엔드 연동 체크리스트

백엔드 API가 준비되면 다음 단계를 진행하세요:

### 1. API 엔드포인트 확인

- [ ] `GET /api/v1/prayer-groups/my`
- [ ] `POST /api/v1/prayer-groups`
- [ ] `POST /api/v1/prayer-groups/join`
- [ ] `GET /api/v1/prayers?group_id={id}`

### 2. API 함수 교체

`frontend/src/api/group.ts` 파일의 Mock 함수를 실제 API로 교체:

```typescript
// Before (Mock)
export const fetchMyGroups = async (): Promise<GroupListResponse> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  return { success: true, data: { items: mockGroups, total: 2 } }
}

// After (Real API)
export const fetchMyGroups = async (): Promise<GroupListResponse> => {
  const token = localStorage.getItem('access_token')
  const response = await apiFetch(`${API_V1}/prayer-groups/my`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.json()
}
```

### 3. 타입 검증

백엔드 응답 형식이 타입 정의와 일치하는지 확인:

```typescript
// frontend/src/types/prayer.ts
export interface PrayerGroup {
  id: number
  name: string
  description?: string
  icon?: string
  member_count: number
  prayer_count: number
  is_member: boolean
  is_admin: boolean
  created_at: string
  invite_code?: string
}
```

### 4. 에러 처리 개선

실제 API 에러 메시지에 맞게 수정:

```typescript
try {
  await createGroup(data)
} catch (error) {
  if (error.response?.status === 409) {
    showToast('이미 존재하는 그룹 이름입니다', 'error')
  } else {
    showToast(error.message, 'error')
  }
}
```

## 문제 해결

### Q: 그룹 목록이 표시되지 않아요
A: 브라우저 콘솔에서 API 호출 확인:
```javascript
// 개발자 도구 콘솔
localStorage.getItem('access_token') // 토큰 확인
```

### Q: 스타일이 깨져요
A: CSS 파일이 제대로 import 되었는지 확인:
```typescript
import './GroupFilter.css'
```

### Q: 타입 에러가 발생해요
A: `PrayerGroup` 타입이 제대로 import 되었는지 확인:
```typescript
import type { PrayerGroup } from '../../types/prayer'
```

## 추가 기능 제안

### 1. 그룹 관리 페이지
- 멤버 목록 및 관리
- 그룹 설정 (이름, 설명 수정)
- 초대 코드 재생성

### 2. 알림 기능
- 그룹 내 새 기도 알림
- 내 기도에 댓글 알림

### 3. 통계 대시보드
- 그룹별 기도 통계
- 활동 그래프

## 지원

문제가 발생하면 다음을 확인하세요:

1. `frontend/src/pages/Prayer/README.md` - 전체 개요
2. 브라우저 개발자 도구 콘솔 - 에러 메시지
3. 네트워크 탭 - API 호출 상태

Happy coding! 🙏
