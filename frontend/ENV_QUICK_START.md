# 환경별 API 설정 - 빠른 시작

## 요약

이제 **환경에 따라 자동으로** API 서버가 전환됩니다!

```bash
# 로컬 개발 → localhost:8000
npm run dev

# 프로덕션 빌드 → 프로덕션 서버
npm run build
```

## 설정 확인

```bash
npm run check-env
```

출력:
```
✅ .env.development
   개발 환경 (npm run dev)
   API URL: http://localhost:8000

✅ .env.production
   프로덕션 환경 (npm run build)
   API URL: https://port-0-chambit-ml1vrmry20fb0cc0.sel3.cloudtype.app
```

## 파일 구조

```
frontend/
├── .env                    # 기본값 (localhost:8000)
├── .env.development        # 개발용 (localhost:8000)
└── .env.production         # 프로덕션용 (cloudtype 서버)
```

## 동작 방식

| 명령어 | 사용 파일 | API URL |
|--------|----------|---------|
| `npm run dev` | `.env.development` | `http://localhost:8000` |
| `npm run build` | `.env.production` | `https://port-0-chambit-ml1vrmry20fb0cc0.sel3.cloudtype.app` |
| `npm run preview` | `.env.production` | `https://port-0-chambit-ml1vrmry20fb0cc0.sel3.cloudtype.app` |

## 더 이상 수동으로 변경할 필요 없음! 🎉

- ❌ 배포 전에 `.env` 파일 수정
- ❌ 로컬 개발 시 다시 원복
- ✅ 그냥 `npm run dev` 또는 `npm run build`만 실행

## 문제 해결

### API가 잘못된 서버를 호출하는 경우

1. 개발 서버 재시작
```bash
# Ctrl+C로 중지 후
npm run dev
```

2. 환경 설정 확인
```bash
npm run check-env
```

3. 브라우저 콘솔에서 확인
```javascript
console.log(import.meta.env.VITE_API_URL)
```

## 상세 가이드

더 자세한 내용은 `ENV_SETUP_GUIDE.md` 참고
