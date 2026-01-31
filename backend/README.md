# 참빛교회 백엔드 API

FastAPI 기반 교회 웹사이트 백엔드 서버

## 기술 스택

- **FastAPI**: 고성능 Python 웹 프레임워크
- **SQLAlchemy**: ORM
- **MariaDB**: 데이터베이스
- **Pydantic**: 데이터 검증
- **JWT**: 인증

## 프로젝트 구조

```
backend/
├── app/
│   ├── api/              # API 엔드포인트
│   ├── core/             # 핵심 설정
│   ├── models/           # DB 모델
│   ├── schemas/          # Pydantic 스키마
│   ├── services/         # 비즈니스 로직
│   ├── repositories/     # 데이터 접근 계층
│   └── main.py          # 메인 애플리케이션
└── requirements.txt
```

## 설치 및 실행

### 1. 가상환경 생성 및 활성화

```bash
python -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate  # Windows
```

### 2. 패키지 설치

```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정

`.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일 수정:

```
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/church_db
SECRET_KEY=your-secret-key-here
FRONTEND_URL=http://localhost:5173
```

### 4. 서버 실행

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API 문서

서버 실행 후 다음 URL에서 API 문서 확인:

- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## API 엔드포인트

### 인증
- `POST /api/v1/auth/register` - 회원가입
- `POST /api/v1/auth/login` - 로그인

### 예배
- `GET /api/v1/worships` - 예배 목록
- `GET /api/v1/worships/active` - 활성 예배
- `POST /api/v1/worships` - 예배 생성 (관리자)

### 설교
- `GET /api/v1/sermons` - 설교 목록
- `GET /api/v1/sermons/{id}` - 설교 상세
- `POST /api/v1/sermons` - 설교 생성 (관리자)

### 교회 소식
- `GET /api/v1/news` - 소식 목록
- `GET /api/v1/news/{id}` - 소식 상세
- `POST /api/v1/news` - 소식 생성 (관리자)

## SOLID 원칙 적용

- **Single Responsibility**: 각 모듈은 하나의 책임만
- **Open/Closed**: 확장에 열려있고 수정에 닫혀있음
- **Liskov Substitution**: Repository 패턴으로 추상화
- **Interface Segregation**: 작은 서비스로 분리
- **Dependency Inversion**: 의존성 주입 사용

## 배포

클라우드타입에 배포:

1. GitHub 저장소 연결
2. 환경 변수 설정
3. 빌드 명령: `pip install -r requirements.txt`
4. 실행 명령: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
