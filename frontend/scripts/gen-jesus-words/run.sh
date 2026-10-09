#!/bin/sh
# 예수님 말씀(붉은 글씨) 데이터 재생성 — src/pages/Bible/data/jesusWords/bookNN.ts 를 덮어쓴다.
#  1) World English Bible(퍼블릭 도메인) USFM 의 \wj 표시로 "어느 절이 예수님 말씀인가"를 정하고
#  2) 절 중간에서 시작·끝나는 절만 개역개정 어미("~시되" 도입, "하시니" 맺음)로 어절 위치를 맞춘다.
#  3) 자동으로 못 맞춘 절·오류는 override.json 에 구절 문자열로 직접 지정 (빈 목록 = 칠하지 않음).
# 필요: 로컬 백엔드(localhost:8000) — 개역개정 본문을 API 로 받는다.
set -e
cd "$(dirname "$0")"
W=$(mktemp -d)
curl -sL -o "$W/web.zip" https://ebible.org/Scriptures/eng-web_usfm.zip
unzip -q "$W/web.zip" -d "$W/usfm"
python3 -I fetch_ko.py "$W/ko.json"
python3 -I parse_en.py "$W/usfm" "$W/en.json"
python3 -I align.py "$W/en.json" "$W/ko.json" "$W/aligned.json" override.json
python3 -I emit.py "$W/aligned.json" ../../src/pages/Bible/data/jesusWords
rm -rf "$W"
