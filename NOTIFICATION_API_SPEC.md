# 공지사항 알림 API 명세서

## 개요
교회 홈페이지에 공지사항 알림 기능을 추가합니다.
- 모든 사용자: 공지사항 목록 조회 가능
- 로그인 사용자: 읽음/안읽음 상태 확인 및 읽음 처리 가능
- 관리자(admin): 공지사항 생성/수정/삭제 가능

---

## 1. API 엔드포인트

### 1.1 공지사항 목록 조회 (모든 사용자)
```
GET /api/v1/notifications
```

**인증**: 선택 (로그인 시 Authorization 헤더 포함 가능)

**Headers (로그인 시):**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "교회 행사 안내",
    "content": "다음 주 일요일에 특별 집회가 있습니다.",
    "created_at": "2025-02-02T10:00:00Z",
    "updated_at": "2025-02-02T10:00:00Z",
    "is_active": true,
    "is_read": false  // 로그인 시에만 포함, 비로그인 시 null 또는 생략
  },
  {
    "id": 2,
    "title": "예배 시간 변경 안내",
    "content": "이번 주 수요예배 시간이 변경되었습니다.",
    "created_at": "2025-02-01T09:00:00Z",
    "updated_at": "2025-02-01T09:00:00Z",
    "is_active": true,
    "is_read": true
  }
]
```

**참고:**
- `is_active: true`인 공지사항만 반환
- 최신순으로 정렬 (created_at DESC)
- 로그인 사용자의 경우 `is_read` 필드 포함 (해당 사용자의 읽음 상태)
- 비로그인 사용자의 경우 `is_read` 필드는 null 또는 생략

---

### 1.2 공지사항 상세 조회 (모든 사용자)
```
GET /api/v1/notifications/{id}
```

**인증**: 선택

**Headers (로그인 시):**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "교회 행사 안내",
  "content": "다음 주 일요일에 특별 집회가 있습니다.\n\n시간: 오후 2시\n장소: 본당",
  "created_at": "2025-02-02T10:00:00Z",
  "updated_at": "2025-02-02T10:00:00Z",
  "is_active": true,
  "is_read": false
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "공지사항을 찾을 수 없습니다"
}
```

---

### 1.3 읽지 않은 알림 개수 조회 (로그인 필수)
```
GET /api/v1/notifications/unread-count
```

**인증**: 필수

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "unread_count": 3
}
```

**참고:**
- 현재 로그인한 사용자가 읽지 않은 활성 공지사항의 개수
- 헤더의 종 아이콘에 빨간 점 표시 여부 결정

---

### 1.4 알림 읽음 처리 (로그인 필수)
```
POST /api/v1/notifications/{id}/read
```

**인증**: 필수

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "읽음 처리되었습니다"
}
```

**참고:**
- 이미 읽은 알림을 다시 읽음 처리해도 에러 없이 성공 응답
- 해당 사용자의 읽음 상태만 업데이트 (다른 사용자에게 영향 없음)

---

### 1.5 모든 알림 읽음 처리 (로그인 필수)
```
POST /api/v1/notifications/read-all
```

**인증**: 필수

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "모든 알림이 읽음 처리되었습니다"
}
```

**참고:**
- 현재 로그인한 사용자의 모든 읽지 않은 알림을 읽음 처리
- 활성 공지사항만 대상

---

### 1.6 공지사항 생성 (관리자 전용)
```
POST /api/v1/notifications
```

**인증**: 필수 (admin 계정만)

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "교회 행사 안내",
  "content": "다음 주 일요일에 특별 집회가 있습니다.",
  "is_active": true
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "title": "교회 행사 안내",
  "content": "다음 주 일요일에 특별 집회가 있습니다.",
  "created_at": "2025-02-02T10:00:00Z",
  "updated_at": "2025-02-02T10:00:00Z",
  "is_active": true
}
```

**Error Response (403 Forbidden):**
```json
{
  "detail": "관리자 권한이 필요합니다"
}
```

---

### 1.7 공지사항 수정 (관리자 전용)
```
PUT /api/v1/notifications/{id}
```

**인증**: 필수 (admin 계정만)

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "수정된 제목",
  "content": "수정된 내용",
  "is_active": false
}
```

**참고:**
- 모든 필드는 선택사항 (보낸 필드만 업데이트)
- `updated_at`은 자동으로 현재 시간으로 업데이트

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "수정된 제목",
  "content": "수정된 내용",
  "created_at": "2025-02-02T10:00:00Z",
  "updated_at": "2025-02-02T11:00:00Z",
  "is_active": false
}
```

---

### 1.8 공지사항 삭제 (관리자 전용)
```
DELETE /api/v1/notifications/{id}
```

**인증**: 필수 (admin 계정만)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "공지사항이 삭제되었습니다"
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "공지사항을 찾을 수 없습니다"
}
```

---

## 2. 데이터베이스 스키마

### 2.1 notifications 테이블
```sql
CREATE TABLE notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active),
  INDEX idx_created_at (created_at)
);
```

### 2.2 notification_reads 테이블 (읽음 상태 추적)
```sql
CREATE TABLE notification_reads (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  notification_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_read (notification_id, user_id),
  INDEX idx_notification_id (notification_id),
  INDEX idx_user_id (user_id)
);
```

---

## 3. 권한 체크 로직

### 3.1 관리자 확인
```python
def is_admin(current_user: User) -> bool:
    """admin 계정인지 확인"""
    return current_user.username == "admin"
```

### 3.2 읽음 상태 확인
```python
def get_notifications_with_read_status(user_id: int = None):
    """
    공지사항 목록 조회 시 읽음 상태 포함
    - user_id가 있으면: notification_reads 테이블 조인하여 is_read 포함
    - user_id가 없으면: is_read는 null 또는 생략
    """
    pass
```

### 3.3 읽지 않은 개수 계산
```python
def get_unread_count(user_id: int) -> int:
    """
    활성 공지사항 중 해당 사용자가 읽지 않은 개수
    = (활성 공지사항 수) - (해당 사용자가 읽은 공지사항 수)
    """
    pass
```

---

## 4. 구현 우선순위

### Phase 1 (필수)
1. ✅ notifications 테이블 생성
2. ✅ notification_reads 테이블 생성
3. ✅ GET /api/v1/notifications (목록 조회)
4. ✅ GET /api/v1/notifications/unread-count (읽지 않은 개수)
5. ✅ POST /api/v1/notifications/{id}/read (읽음 처리)

### Phase 2 (관리자 기능)
1. ✅ POST /api/v1/notifications (생성)
2. ✅ PUT /api/v1/notifications/{id} (수정)
3. ✅ DELETE /api/v1/notifications/{id} (삭제)

### Phase 3 (추가 기능)
1. ✅ POST /api/v1/notifications/read-all (모두 읽음)
2. ✅ GET /api/v1/notifications/{id} (상세 조회)

---

## 5. 프론트엔드 연동 완료

### 5.1 구현된 기능
- ✅ 헤더 종 아이콘에 읽지 않은 알림 개수 표시 (빨간 점)
- ✅ 종 아이콘 클릭 시 공지사항 목록 모달 표시
- ✅ 공지사항 클릭 시 상세 내용 표시 및 자동 읽음 처리
- ✅ "모두 읽음" 버튼으로 일괄 읽음 처리
- ✅ 관리자 계정 로그인 시 "공지사항 관리" 메뉴 표시
- ✅ 관리자 페이지에서 공지사항 생성/수정/삭제

### 5.2 API 호출 위치
- `NewHeader.tsx`: 읽지 않은 개수 조회
- `NotificationModal.tsx`: 목록 조회, 읽음 처리, 모두 읽음
- `NotificationManagement.tsx`: 관리자 CRUD 작업

---

## 6. 테스트 시나리오

### 6.1 비로그인 사용자
1. 공지사항 목록 조회 가능
2. 읽음 상태는 표시되지 않음
3. 읽음 처리 불가

### 6.2 일반 로그인 사용자
1. 공지사항 목록 조회 시 읽음 상태 표시
2. 읽지 않은 알림 개수 확인
3. 공지사항 클릭 시 읽음 처리
4. 모두 읽음 처리 가능

### 6.3 관리자 (admin)
1. 일반 사용자 기능 + 관리 기능
2. 공지사항 생성/수정/삭제
3. 활성화/비활성화 토글

---

## 7. 참고사항

### 7.1 읽음 상태 로직
- 각 사용자별로 독립적인 읽음 상태 관리
- 새 공지사항 생성 시 모든 사용자에게 "읽지 않음" 상태
- 공지사항 삭제 시 관련 읽음 기록도 자동 삭제 (CASCADE)

### 7.2 성능 최적화
- `notification_reads` 테이블에 인덱스 필수
- 읽지 않은 개수 조회는 자주 호출되므로 최적화 필요
- 가능하면 Redis 캐싱 고려

### 7.3 보안
- 관리자 권한 체크 필수 (username === "admin")
- 일반 사용자는 자신의 읽음 상태만 수정 가능
- SQL Injection 방지

---

## 문의사항
구현 중 궁금한 점이나 추가 요구사항이 있으면 연락주세요!
