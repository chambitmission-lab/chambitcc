# 발자취 게임 사운드 파일

이 폴더에 아래 파일들을 mp3 형식으로 두면 자동으로 재생됩니다.
파일이 없어도 게임은 정상 동작합니다 (graceful degradation - 무음).

## 필요한 파일 (mp3)

- `step.mp3` — 발자국 한 걸음 (짧고 가볍게)
- `reveal.mp3` — 안개가 걷히며 칸이 밝혀지는 효과음 (약 0.5~1초)
- `correct.mp3` — 정답 시 (밝고 짧은 종소리/벨)
- `wrong.mp3` — 오답 시 (낮은 톤, 부드럽게)
- `milestone.mp3` — 이정표 도달 (팡파레보다 짧은 강조음)
- `fanfare.mp3` — 여행 완주 (1~2초 팡파레)
- `click.mp3` — 버튼 클릭 (매우 짧게)

## 라이선스 무료 사운드 출처 추천

- https://freesound.org (CC0 / CC-BY 검색)
- https://pixabay.com/sound-effects/
- https://opengameart.org/

## 음소거

게임 우상단 🔊 버튼으로 토글. localStorage `bm-sfx-muted`에 저장됨.
