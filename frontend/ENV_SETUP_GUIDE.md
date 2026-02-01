# 환경별 API 설정 가이드

## 개요
Vite의 환경별 설정 파일을 사용하여 개발/프로덕션 환경에서 자동으로 올바른 API 서버를 사용합니다.

## 환경 파일 구조

```
frontend/
├── .env                    # 기본 설정 (fallback)
├── .env.development        # 로컬 개발 환경 (npm run dev)
└── .env.production         # 프로덕션 환경 (npm run build)
```

## 환경 파일 내용

### `.env.development` (로컬 개발)
```env
VITE_API_URL=http://localhost:8000
```

### `.env.production` (프로덕션)
```env
VITE_API_URL=https://port-0-chambit-ml1vrmry20fb0cc0.sel3.cloudtype.app
```

### `.env` (기본값)
```env
VITE_API_URL=http://localhost:8000
```

## 동작 방식

### 개발 모드 (`npm run dev`)
1. `.env.development` 파일 로드
2. 없으면 `.env` 파일 사용
3. **결과**: `http://localhost:8000` 사용

### 프로덕션 빌드 (`npm run build`)
1. `.env.production` 파일 로드
2. 없으면 `.env` 파일 사용
3. **결과**: `https://port-0-chambit-ml1vrmry20fb0cc0.sel3.cloudtype.app` 사용

### 우선순위
```
.env.[mode] > .env
```

## 사용 방법

### 1. 로컬 개발
```bash
npm run dev
# → .env.development 사용
# → http://localhost:8000 API 호출
```

### 2. 프로덕션 빌드
```bash
npm run build
# → .env.production 사용
# → https://port-0-chambit-ml1vrmry20fb0cc0.sel3.cloudtype.app API 호출
```

### 3. 프로덕션 미리보기
```bash
npm run build
npm run preview
# → 빌드된 파일 실행 (프로덕션 API 사용)
```

## 환경 변수 접근

코드에서 환경 변수 사용:

```typescript
// src/config/api.ts
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const API_V1 = `${API_URL}/api/v1`

// 현재 모드 확인
console.log('Mode:', import.meta.env.MODE) // 'development' or 'production'
console.log('API URL:', import.meta.env.VITE_API_URL)
```

## 추가 환경 변수

필요한 경우 다른 환경 변수도 추가할 수 있습니다:

```env
# .env.development
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_ENABLE_DEVTOOLS=true
VITE_LOG_LEVEL=debug

# .env.production
VITE_API_URL=https://api.production.com
VITE_API_TIMEOUT=10000
VITE_ENABLE_DEVTOOLS=false
VITE_LOG_LEVEL=error
```

## 로컬에서 프로덕션 API 테스트

로컬 개발 중 프로덕션 API를 테스트하고 싶다면:

### 방법 1: 임시로 .env.development 수정
```env
# .env.development
VITE_API_URL=https://port-0-chambit-ml1vrmry20fb0cc0.sel3.cloudtype.app
```

### 방법 2: 프로덕션 모드로 실행
```bash
npm run build
npm run preview
```

### 방법 3: 커스텀 모드 사용
```bash
# .env.staging 파일 생성
VITE_API_URL=https://staging-api.com

# 실행
vite --mode staging
```

## Git 관리

### 환경 파일 커밋 여부

**커밋하는 파일:**
- `.env` (기본값)
- `.env.development` (팀 공유)
- `.env.production` (팀 공유)

**커밋하지 않는 파일:**
- `.env.local` (개인 설정)
- `.env.development.local` (개인 개발 설정)
- `.env.production.local` (개인 프로덕션 설정)

### .gitignore 설정
```gitignore
# 개인 환경 설정은 제외
*.local
```

## 개인별 설정 (선택사항)

팀원마다 다른 로컬 설정이 필요한 경우:

```bash
# .env.development.local 파일 생성 (git에 커밋되지 않음)
VITE_API_URL=http://192.168.1.100:8000
```

우선순위:
```
.env.development.local > .env.development > .env.local > .env
```

## 문제 해결

### 환경 변수가 적용되지 않을 때

1. **개발 서버 재시작**
```bash
# Ctrl+C로 중지 후
npm run dev
```

2. **환경 변수 이름 확인**
- Vite에서는 `VITE_` 접두사 필수
- ❌ `API_URL`
- ✅ `VITE_API_URL`

3. **빌드 캐시 삭제**
```bash
rm -rf node_modules/.vite
npm run dev
```

4. **환경 변수 출력 확인**
```typescript
console.log('Current API URL:', import.meta.env.VITE_API_URL)
console.log('Current Mode:', import.meta.env.MODE)
```

### API URL이 잘못 설정된 경우

브라우저 개발자 도구 > Network 탭에서 실제 호출되는 URL 확인:

```typescript
// src/config/api.ts에 디버깅 코드 추가
console.log('🔧 API Configuration:')
console.log('  Mode:', import.meta.env.MODE)
console.log('  API URL:', API_URL)
console.log('  API V1:', API_V1)
```

## 배포 시 주의사항

### Cloudtype 배포
Cloudtype에서는 자동으로 프로덕션 모드로 빌드됩니다:
```bash
npm run build  # .env.production 사용
```

### 환경 변수 오버라이드
Cloudtype 대시보드에서 환경 변수를 설정하면 `.env.production`보다 우선됩니다:
```
VITE_API_URL=https://custom-api.com
```

## 베스트 프랙티스

1. **민감한 정보는 환경 변수로**
   - API 키, 시크릿은 `.env.local`에 저장
   - Git에 커밋하지 않기

2. **팀 공유 설정은 커밋**
   - `.env.development`, `.env.production`은 커밋
   - 팀원 모두 같은 설정 사용

3. **환경별 설정 문서화**
   - README에 필요한 환경 변수 명시
   - 예제 파일 제공 (`.env.example`)

4. **프로덕션 빌드 전 확인**
```bash
# 프로덕션 API URL 확인
cat .env.production

# 빌드 및 테스트
npm run build
npm run preview
```

## 예제: .env.example

팀원들을 위한 예제 파일:

```env
# .env.example
# 이 파일을 복사하여 .env.development.local 생성

# API 서버 URL
VITE_API_URL=http://localhost:8000

# API 타임아웃 (ms)
VITE_API_TIMEOUT=30000

# 개발자 도구 활성화
VITE_ENABLE_DEVTOOLS=true
```

## 참고 자료
- [Vite 환경 변수 문서](https://vitejs.dev/guide/env-and-mode.html)
- [Vite 모드 설정](https://vitejs.dev/guide/env-and-mode.html#modes)
