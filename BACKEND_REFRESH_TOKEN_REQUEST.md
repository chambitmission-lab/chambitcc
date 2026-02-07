# 백엔드 Refresh Token 구현 요청사항

## 개요
현재 JWT Access Token만 사용하여 시간이 지나면 자동 로그아웃되는 문제가 있습니다.
사용자 경험 개선을 위해 Refresh Token 메커니즘을 추가해주세요.

---

## 1. 로그인/회원가입 API 응답 수정

### 현재 응답
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

### 수정 요청 응답
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_expires_in": 2592000
}
```

### 필드 설명
- `access_token`: 기존과 동일 (API 호출용 단기 토큰)
- `refresh_token`: **새로 추가** (Access Token 갱신용 장기 토큰)
- `token_type`: "bearer" (기존과 동일)
- `expires_in`: Access Token 만료 시간 (초 단위, 예: 3600 = 1시간)
- `refresh_expires_in`: Refresh Token 만료 시간 (초 단위, 예: 2592000 = 30일)

### 적용 대상 API
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register` (자동 로그인하는 경우)

---

## 2. Token Refresh API 엔드포인트 추가

### 엔드포인트
```
POST /api/v1/auth/refresh
```

### Request Body
```json
{
  "refresh_token": "eyJ..."
}
```

### Response (성공 - 200 OK)
```json
{
  "access_token": "new_eyJ...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Response (실패 - 401 Unauthorized)
```json
{
  "detail": "Invalid or expired refresh token"
}
```

### 동작 방식
1. 클라이언트가 Refresh Token을 전송
2. 서버가 Refresh Token 유효성 검증
3. 유효하면 새로운 Access Token 발급
4. 무효하면 401 에러 반환 (클라이언트는 재로그인 필요)

---

## 3. 토큰 만료 시간 권장 설정

| 토큰 종류 | 만료 시간 | 이유 |
|----------|----------|------|
| Access Token | 1시간 (3600초) | 보안을 위해 짧게 설정 |
| Refresh Token | 30일 (2592000초) | 사용자 편의를 위해 길게 설정 |

---

## 4. 구현 참고사항

### JWT Payload 예시
```python
# Access Token
{
  "sub": "user_id",
  "username": "john_doe",
  "exp": 1234567890,  # 1시간 후
  "type": "access"
}

# Refresh Token
{
  "sub": "user_id",
  "exp": 1237159890,  # 30일 후
  "type": "refresh"
}
```

### 보안 고려사항
1. Refresh Token은 DB에 저장하여 무효화 가능하도록 구현 (선택사항)
2. Refresh Token 사용 시 IP/User-Agent 검증 (선택사항)
3. Refresh Token은 한 번만 사용 가능하도록 구현 (Rotation, 선택사항)

---

## 5. 프론트엔드 구현 완료 사항

✅ `localStorage`에 `refresh_token` 저장
✅ 401 에러 발생 시 자동으로 Token Refresh API 호출
✅ 새 Access Token으로 원래 요청 재시도
✅ Refresh Token도 만료된 경우 로그인 페이지로 리다이렉트

---

## 6. 테스트 시나리오

### 시나리오 1: 정상 토큰 갱신
1. 로그인 → Access Token + Refresh Token 받음
2. 1시간 후 API 호출 → 401 에러
3. 자동으로 Refresh API 호출 → 새 Access Token 받음
4. 원래 API 재시도 → 성공

### 시나리오 2: Refresh Token 만료
1. 로그인 후 30일 경과
2. API 호출 → 401 에러
3. Refresh API 호출 → 401 에러 (Refresh Token 만료)
4. 자동 로그아웃 → 로그인 페이지로 이동

---

## 7. 구현 우선순위

### 필수 (Phase 1)
- [ ] 로그인/회원가입 응답에 `refresh_token` 추가
- [ ] `POST /api/v1/auth/refresh` 엔드포인트 구현
- [ ] Access Token 만료 시간 1시간으로 설정
- [ ] Refresh Token 만료 시간 30일로 설정

### 선택 (Phase 2 - 추후 개선)
- [ ] Refresh Token DB 저장 및 무효화 기능
- [ ] Refresh Token Rotation (한 번 사용 후 새 토큰 발급)
- [ ] IP/User-Agent 검증

---

## 8. 참고 자료

### FastAPI JWT 예시
```python
from datetime import datetime, timedelta
from jose import jwt

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=1)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

---

## 문의사항
프론트엔드 구현은 완료되었으니, 백엔드 구현 후 테스트 부탁드립니다.
