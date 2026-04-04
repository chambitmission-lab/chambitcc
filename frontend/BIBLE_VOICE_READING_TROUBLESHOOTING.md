# 성경 음성 읽기 - 문제 해결 가이드

## 🐛 자주 발생하는 에러

### 1. 401 Unauthorized

**증상:**
```
GET /api/v1/bible/chapters/1/1/read-status 401 (Unauthorized)
```

**원인:**
- 로그인하지 않았거나 토큰이 만료됨
- 읽기 모드를 활성화했지만 인증되지 않음

**해결 방법:**
1. 로그인 상태 확인
2. 페이지 새로고침
3. 다시 로그인

---

### 2. 409 Conflict

**증상:**
```
POST /api/v1/bible/verses/6/read 409 (Conflict)
```

**원인:**
- 이미 읽음 처리된 구절을 다시 읽으려고 함
- 데이터베이스에 `UNIQUE(user_id, verse_id)` 제약이 있음

**해결 방법:**
- 자동으로 처리됨 (에러 무시)
- 이미 읽은 구절은 체크 표시됨
- 다시 읽기를 원하면 백엔드에서 먼저 삭제 필요

---

### 3. 음성 인식이 너무 빨리 끊김

**증상:**
- 천천히 읽으면 중간에 종료됨
- 긴 구절을 다 읽기 전에 끊김

**원인:**
- 음성이 3초 이상 감지되지 않으면 자동 종료

**해결 방법:**
- 계속 말하기 (3초 이내에 다음 단어 시작)
- 또는 "확인" 버튼 사용

---

### 4. 음성 인식이 안 됨

**증상:**
- 마이크 버튼을 눌러도 반응 없음
- "읽은 내용" 표시 안 됨

**원인:**
- 마이크 권한 거부
- 브라우저가 Web Speech API 미지원
- HTTPS 아님

**해결 방법:**
1. 브라우저 설정에서 마이크 권한 허용
2. Chrome 또는 Safari 사용
3. HTTPS 연결 확인

---

### 5. 진행률이 업데이트 안 됨

**증상:**
- 구절을 읽었는데 진행률이 0%
- 카운트가 증가하지 않음

**원인:**
- 백엔드 API 응답 구조가 다름
- `total_verses`, `read_verses`, `progress`가 `undefined`

**해결 방법:**
- 백엔드 API 응답 확인
- 명세서대로 응답하는지 확인
- 네트워크 탭에서 실제 응답 확인

---

## 🔍 디버깅 방법

### 1. 콘솔 로그 확인
```javascript
// 브라우저 개발자 도구 > Console
// 에러 메시지 확인
```

### 2. 네트워크 탭 확인
```
개발자 도구 > Network
- POST /api/v1/bible/verses/{id}/read
- GET /api/v1/bible/chapters/{book}/{chapter}/read-status
```

### 3. React Query DevTools
```
- 캐시 상태 확인
- 쿼리 무효화 확인
- Mutation 상태 확인
```

---

## 📋 체크리스트

읽기 기능이 작동하지 않을 때:

- [ ] 로그인 상태 확인
- [ ] 마이크 권한 허용
- [ ] HTTPS 연결 확인
- [ ] Chrome/Safari 브라우저 사용
- [ ] 백엔드 API 실행 중
- [ ] 네트워크 연결 확인
- [ ] 콘솔 에러 확인

---

## 🛠️ 백엔드 확인 사항

### API 엔드포인트 확인
```bash
# 읽음 처리
curl -X POST "http://localhost:8000/api/v1/bible/verses/1/read" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"similarity": 0.95, "read_at": "2024-03-07T10:30:00Z"}'

# 읽음 상태 조회
curl -X GET "http://localhost:8000/api/v1/bible/chapters/1/1/read-status" \
  -H "Authorization: Bearer {token}"
```

### 응답 구조 확인
```json
{
  "success": true,
  "data": {
    "book_number": 1,
    "book_name_ko": "창세기",
    "chapter": 1,
    "total_verses": 31,
    "read_verses": 2,
    "progress": 6.45,
    "verses": [...]
  }
}
```

---

## 💡 팁

### 1. 이미 읽은 구절 다시 읽기
백엔드에서 삭제 후 다시 읽기:
```bash
curl -X DELETE "http://localhost:8000/api/v1/bible/verses/1/read" \
  -H "Authorization: Bearer {token}"
```

### 2. 천천히 읽기
- 3초 이내에 계속 말하기
- 또는 다 읽고 "확인" 버튼 클릭

### 3. 정확하게 읽기
- 원본 구절 그대로 읽기
- 75% 이상 일치해야 통과
- 띄어쓰기, 구두점은 무시됨

---

## 📞 추가 지원

문제가 계속되면:
1. 콘솔 로그 캡처
2. 네트워크 요청/응답 캡처
3. 재현 단계 기록
4. 개발팀에 문의
