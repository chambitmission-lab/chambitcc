# 참빛교회 웹사이트

현대적이고 반응형인 교회 웹사이트 프로젝트

## 프로젝트 구조

```
chambit/
├── frontend/          # React + Vite + TypeScript + Tailwind CSS
└── backend/           # FastAPI + SQLAlchemy + MariaDB
```

## 기술 스택

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Zustand (상태 관리)
- Axios (API 통신)

### Backend
- FastAPI
- SQLAlchemy
- MariaDB (PyMySQL)
- Pydantic
- JWT 인증
- Python 3.9+

## 주요 기능

- 교회 소개
- 참빛TV (설교 영상)
- 교육과 훈련
- 선교과 전도
- 사역과 섬김
- 교회 소식
- 나눔과 참여
- 온라인콘텐츠
- 문화교실
- 관리자 페이지

## 설치 및 실행

### Frontend

```bash
cd frontend
npm install
npm run dev
```

프론트엔드: http://localhost:5173

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
./start.sh
```

백엔드: http://localhost:8000
API 문서: http://localhost:8000/api/v1/docs

## 환경 설정

### Backend .env

```
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/church_db
SECRET_KEY=your-secret-key
FRONTEND_URL=http://localhost:5173
```

## 배포

- Frontend: GitHub Pages
- Backend: 클라우드타입
- Database: 클라우드타입 MariaDB

## 개발 원칙

- SOLID 원칙 준수
- 파일당 200라인 이하
- JavaScript/CSS 완전 분리
- 컴포넌트 기반 설계
- 확장 가능한 구조

## 라이선스

MIT License
