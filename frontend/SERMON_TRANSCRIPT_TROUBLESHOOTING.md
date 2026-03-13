# 설교 트랜스크립트 기능 문제 해결 가이드

## 🔴 401 Unauthorized 오류

### 증상
```
POST http://localhost:8000/api/v1/sermons/26/analyze-transcript 401 (Unauthorized)
```

### 원인
1. **로그인하지 않은 상태**
2. **관리자 권한이 없는 사용자**
3. **토큰이 만료됨**

### 해결 방법

#### 1. 로그인 상태 확인
```javascript
// 브라우저 콘솔에서 확인
console.log('Access Token:', localStorage.getItem('access_token'))
console.log('Username:', localStorage.getItem('user_username'))
```

- `access_token`이 없으면 → 로그인 필요
- `user_username`이 'admin'이 아니면 → 관리자 권한 없음

#### 2. 관리자 계정으로 로그인
- 사용자명: `admin`
- 비밀번호: (관리자 비밀번호)

#### 3. 토큰 갱신
토큰이 만료된 경우 자동으로 갱신을 시도합니다. 갱신 실패 시:
1. 로그아웃
2. 다시 로그인

#### 4. 수동 토큰 확인
```javascript
// 브라우저 콘솔에서 토큰 디코딩
const token = localStorage.getItem('access_token')
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]))
  console.log('Token Payload:', payload)
  console.log('Expires:', new Date(payload.exp * 1000))
}
```

## 🔴 403 Forbidden 오류

### 증상
```
POST http://localhost:8000/api/v1/sermons/26/analyze-transcript 403 (Forbidden)
```

### 원인
- 로그인은 되어 있지만 관리자 권한이 없음

### 해결 방법
1. 관리자 계정으로 로그인
2. 백엔드에서 사용자에게 관리자 권한 부여

## 🔴 트랜스크립트 업로드 버튼이 보이지 않음

### 원인
- 관리자가 아닌 경우 트랜스크립트 업로드 섹션이 표시되지 않음

### 해결 방법
1. 관리자 계정으로 로그인
2. 설교 등록 또는 수정 페이지 접근

## 🔴 JSON 파일 형식 오류

### 증상
```
트랜스크립트 분석에 실패했습니다
```

### 원인
- JSON 파일 형식이 올바르지 않음

### 해결 방법
올바른 JSON 형식 확인:

```json
{
  "segments": [
    {
      "start": 168.5,
      "end": 172.3,
      "text": "오늘 말씀에 사무엘상 3장 3절 상반절에"
    },
    {
      "start": 172.3,
      "end": 176.8,
      "text": "하나님의 등불은 아직 꺼지지 않았습니다"
    }
  ]
}
```

필수 필드:
- `segments`: 배열
- `segments[].start`: 숫자 (초 단위)
- `segments[].end`: 숫자 (초 단위)
- `segments[].text`: 문자열

## 🔴 성경 구절이 추출되지 않음

### 증상
```
0개의 성경 구절이 추출되었습니다
```

### 원인
- 트랜스크립트 텍스트에 성경 구절 표현이 없음
- 성경 구절 표현이 인식 가능한 형식이 아님

### 해결 방법
트랜스크립트에 다음과 같은 형식의 성경 구절 표현 포함:
- "사무엘상 3장 3절"
- "창세기 1장 1절"
- "요한복음 3장 16절"
- "시편 23편 1절"

## 🔴 비디오 타임스탬프가 작동하지 않음

### 증상
- 타임스탬프 버튼 클릭 시 비디오가 이동하지 않음

### 원인
1. YouTube URL이 올바르지 않음
2. 비디오 ID 추출 실패

### 해결 방법
올바른 YouTube URL 형식:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `VIDEO_ID` (직접 입력)

## 🔴 성경 구절 클릭 시 페이지 이동 안됨

### 증상
- 성경 구절 카드 클릭 시 아무 반응 없음

### 원인
- ~~라우팅 설정 문제~~ ✅ 해결됨
- ~~`book_number` 값이 올바르지 않음~~

### 해결 방법
✅ **이미 수정 완료**
- `/bible/:bookNumber/:chapter` 라우트 추가됨
- BibleStudy 컴포넌트가 URL 파라미터를 자동으로 처리
- 성경 구절 클릭 시 해당 책과 장으로 자동 이동

### 작동 방식
1. 성경 구절 카드 클릭
2. `/bible/9/3` 형식의 URL로 이동 (예: 사무엘상 3장)
3. BibleStudy 컴포넌트가 URL 파라미터 감지
4. 자동으로 해당 책과 장을 선택하여 표시
5. 페이지 상단으로 스크롤

## 🛠️ 디버깅 팁

### 1. 네트워크 요청 확인
브라우저 개발자 도구 → Network 탭:
- 요청 URL 확인
- 요청 헤더 (Authorization) 확인
- 응답 상태 코드 확인
- 응답 본문 확인

### 2. 콘솔 로그 확인
브라우저 개발자 도구 → Console 탭:
- 오류 메시지 확인
- React Query 상태 확인

### 3. React Query DevTools
React Query DevTools를 사용하여:
- 쿼리 상태 확인
- 캐시 데이터 확인
- 쿼리 재실행

### 4. localStorage 확인
```javascript
// 브라우저 콘솔에서
console.log('All localStorage:', { ...localStorage })
```

## 📞 추가 지원

위 방법으로 해결되지 않는 경우:
1. 브라우저 콘솔의 전체 오류 메시지 복사
2. 네트워크 탭의 요청/응답 정보 확인
3. 백엔드 로그 확인
4. 개발팀에 문의

## ✅ 정상 작동 확인

다음 단계를 통해 정상 작동 확인:

1. **관리자 로그인**
   - ✅ 로그인 성공
   - ✅ localStorage에 access_token 존재
   - ✅ user_username이 'admin'

2. **설교 등록**
   - ✅ 설교 등록 성공
   - ✅ 설교 ID 생성됨

3. **트랜스크립트 업로드**
   - ✅ 트랜스크립트 업로드 섹션 표시됨
   - ✅ JSON 파일 선택 가능
   - ✅ 업로드 성공 메시지 표시
   - ✅ "X개의 성경 구절이 추출되었습니다" 표시

4. **설교 상세보기**
   - ✅ "언급된 성경 구절" 섹션 표시
   - ✅ 성경 구절 카드 표시
   - ✅ 타임스탬프 버튼 작동
   - ✅ 성경 구절 클릭 시 페이지 이동
