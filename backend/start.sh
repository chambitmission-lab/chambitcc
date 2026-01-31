#!/bin/bash

# 백엔드 서버 시작 스크립트

echo "🚀 참빛교회 백엔드 서버 시작..."
echo ""

# 가상환경 활성화
source venv/bin/activate

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
