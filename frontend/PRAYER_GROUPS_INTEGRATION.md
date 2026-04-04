# 🎉 기도 그룹 기능 통합 완료

백엔드 API가 준비되어 프론트엔드의 Mock 코드를 실제 API 호출로 변경했습니다.

## 📝 변경된 파일

### 1. API 레이어
- `frontend/src/api/group.ts` - Mock 데이터 제거, 실제 API 호출로 변경
- `frontend/src/api/prayer.ts` - 기도 목록 조회에 `groupId` 파라미터 추가

### 2. Hook 레이어
- `frontend/src/hooks/usePrayersQuery.ts` - 그룹 필터링 지원 추가
- `frontend/src/hooks/usePrayerToggle.ts` - 그룹별 캐시 관리 추가

### 3. 컴포넌트 레이어
- `frontend/src/pages/Prayer/PrayerList.tsx` - 그룹 필터링 적용
- `frontend/src/components/prayer/PrayerComposer.tsx` - 초기 그룹 선택 지원

## 🔄 주요 변경사항

### API 호출 구조

#### 그룹 목록 조회
```typescript
// 내가 속한 그룹
GET /api/v1/prayer-groups/my
Authorization: Bearer {token}

// 전체 그룹 (검색용)
GET /api/v1/prayer-groups
Authorization: Bearer {token} (선택)
```

#### 그룹 생성
```typescript
POST /api/v1/prayer-groups
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "청년부",
  "description": "청년부 기도 나눔방",
  "icon": "🙏"
}
```

#### 그룹 가입
```typescript
POST /api/v1/prayer-groups/join
Authorization: Bearer {token}
Content-Type: application/json

{
  "invite_code": "ABCD1234"
}
```

#### 기도 목록 조회 (그룹 필터링)
```typescript
// 전체 공개 기도
GET /api/v1/prayers?sort=popular

// 특정 그룹 기도
GET /api/v1/prayers?group_id=1&sort=popular
```

#### 기도 작성 (그룹 지정)
```typescript
POST /api/v1/prayers
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "기도 제목",
  "content": "기도 내용",
  "display_name": "익명",
  "is_fully_anonymous": false,
  "group_id": 1  // null이면 전체 공개
}
```

## 🎯 사용자 시나리오

### 시나리오 1: 전체 공개 기도 보기
1. 기도 목록 페이지 접속
2. "전체 공개" 버튼 선택 (기본값)
3. 모든 사용자의 공개 기도 표시

### 시나리오 2: 그룹 만들기
1. "내 그룹" 드롭다운 클릭
2. "그룹 만들기" 버튼 클릭
3. 그룹 이름, 설명, 아이콘 입력
4. 생성 완료 후 초대 코드 표시
5. 초대 코드를 다른 멤버에게 공유

### 시나리오 3: 그룹 가입하기
1. "내 그룹" 드롭다운 클릭
2. "그룹 가입" 버튼 클릭
3. 받은 초대 코드 입력
4. 가입 완료

### 시나리오 4: 그룹 기도 작성
1. 그룹 선택 (예: "청년부")
2. "기도 요청하기" 버튼 클릭
3. 공개 범위에서 해당 그룹 선택
4. 기도 내용 작성 후 등록
5. 해당 그룹 멤버만 볼 수 있음

### 시나리오 5: 그룹 기도 보기
1. "내 그룹" 드롭다운에서 그룹 선택
2. 해당 그룹의 기도만 필터링되어 표시
3. 그룹 멤버들의 기도 확인 및 응답

## 🔐 권한 관리

### 그룹 생성
- 로그인한 사용자만 가능
- 생성자는 자동으로 관리자가 됨

### 그룹 가입
- 유효한 초대 코드 필요
- 로그인 필수

### 그룹 기도 조회
- 해당 그룹 멤버만 가능
- 비멤버는 접근 불가

### 그룹 기도 작성
- 해당 그룹 멤버만 가능
- 비멤버는 작성 불가

## 📊 캐시 관리

### Query Key 구조
```typescript
// 기도 목록
['prayers', 'list', sort, groupId, username]

// 예시
['prayers', 'list', 'popular', null, 'user123']      // 전체 공개
['prayers', 'list', 'popular', 1, 'user123']         // 그룹 1
['prayers', 'list', 'latest', null, 'anonymous']     // 비로그인
```

### 캐시 무효화 전략
- 그룹 생성/가입 시: 그룹 목록 캐시 무효화
- 기도 작성 시: 모든 기도 목록 캐시 무효화
- 기도 토글 시: 현재 보고 있는 목록만 Optimistic Update

## 🧪 테스트 체크리스트

- [x] 그룹 목록 조회 (내 그룹)
- [x] 그룹 생성 및 초대 코드 발급
- [x] 그룹 가입 (초대 코드)
- [x] 전체 공개 기도 조회
- [x] 그룹 기도 조회 (필터링)
- [x] 전체 공개 기도 작성
- [x] 그룹 기도 작성
- [x] 그룹 전환 시 목록 갱신
- [x] 로그인/비로그인 상태 처리
- [x] 에러 처리 및 토스트 메시지

## 🚀 다음 단계

### 추가 기능 (선택사항)
1. 그룹 검색 기능
2. 그룹 수정/삭제 (관리자)
3. 멤버 관리 (추방, 권한 이양)
4. 그룹 통계 (멤버 수, 기도 수)
5. 그룹 알림 설정

### 성능 최적화
1. 무한 스크롤 최적화
2. 이미지 lazy loading
3. 캐시 전략 개선

## 📞 문의

백엔드 API 관련 문제나 추가 요청사항이 있으면 백엔드 팀에 문의해주세요.

---

**작업 완료일**: 2024-02-24
**작업자**: 프론트엔드 팀
