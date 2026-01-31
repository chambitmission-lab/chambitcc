# 클라우드타입 배포 가이드

## 준비된 파일들
- `Dockerfile`: Docker 컨테이너 설정
- `Procfile`: 프로세스 실행 명령
- `cloudtype.json`: 클라우드타입 설정
- `runtime.txt`: Python 버전 지정
- `.dockerignore`: Docker 빌드 제외 파일

## 배포 단계

### 1. 클라우드타입 프로젝트 생성
1. [CloudType](https://cloudtype.io/) 로그인
2. 새 프로젝트 생성
3. GitHub 저장소 연결: `chambitmission-lab/chambit`

### 2. 빌드 설정
- **빌드 경로**: `backend`
- **빌드 명령**: `pip install -r requirements.txt`
- **시작 명령**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **포트**: `8000`

### 3. 환경 변수 설정
클라우드타입 대시보드에서 다음 환경 변수를 설정하세요:

```
DATABASE_URL=mysql+pymysql://user:password@host:3306/database
SECRET_KEY=your-production-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=https://your-frontend-domain.com
ENVIRONMENT=production
```

### 4. 데이터베이스 설정
- MySQL 8.0 이상 권장
- 클라우드타입에서 MySQL 애드온 추가 또는 외부 DB 사용
- DATABASE_URL 형식: `mysql+pymysql://username:password@host:port/database`

### 5. 배포 확인
배포 후 다음 엔드포인트로 확인:
- Health Check: `https://your-domain.com/health`
- API Docs: `https://your-domain.com/api/v1/docs`
- Root: `https://your-domain.com/`

## 주의사항
- SECRET_KEY는 반드시 프로덕션용으로 새로 생성하세요
- DATABASE_URL에 실제 DB 정보를 입력하세요
- FRONTEND_URL을 실제 프론트엔드 도메인으로 설정하세요
- CORS 설정이 프론트엔드 도메인을 허용하는지 확인하세요

## 트러블슈팅
- 빌드 실패: requirements.txt 의존성 확인
- DB 연결 실패: DATABASE_URL 형식 및 네트워크 확인
- CORS 에러: FRONTEND_URL 및 CORS 설정 확인
