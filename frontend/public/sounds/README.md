# 사운드 파일

이 폴더에 아래 파일들을 mp3 형식으로 두면 자동으로 재생됩니다.
파일이 없어도 화면은 정상 동작합니다 (graceful degradation - 무음).

## 효과음 (발자취 게임)

- `step.mp3` — 발자국 한 걸음 (짧고 가볍게)
- `reveal.mp3` — 안개가 걷히며 칸이 밝혀지는 효과음 (약 0.5~1초)
- `correct.mp3` — 정답 시 (밝고 짧은 종소리/벨)
- `wrong.mp3` — 오답 시 (낮은 톤, 부드럽게)
- `milestone.mp3` — 이정표 도달 (팡파레보다 짧은 강조음)
- `fanfare.mp3` — 여행 완주 (1~2초 팡파레)
- `click.mp3` — 버튼 클릭 (매우 짧게)

## 배경음 — 집중 기도시간 (/prayer-focus)

- `ambience-rain.mp3` — 빗소리 (잔잔한 비, 천둥 없이)
- `ambience-dawn.mp3` — 새벽 공기 (새소리·바람)
- `ambience-piano.mp3` — 잔잔한 피아노
- `ambience-candle.mp3` — 촛불 (잔잔한 불꽃·바람)
- `ambience-church.mp3` — 교회 잔향 (오르간·합창 reverb)

## 배경음 — 신앙 여정·주간 스토리 (/growth, /weekly-story)

묵상·회상에 어울리는 잔잔한 곡 5종. mp3를 떨궈 넣으면 즉시 활성화됩니다.

- `ambience-growth-piano.mp3` — 잔잔한 피아노 묵상
- `ambience-growth-hymn.mp3` — 찬송가 instrumental
- `ambience-growth-worship.mp3` — 워십 앰비언트 (패드·잔향)
- `ambience-growth-nature.mp3` — 숲·시냇물 자연음
- `ambience-growth-strings.mp3` — 현악 묵상 (조용한 strings)

3~5분 loop 가능한 길이가 적당 (HTML5 `<audio loop>` 사용).

## 라이선스 무료 사운드 출처 추천

- https://freesound.org (CC0 / CC-BY 검색)
- https://pixabay.com/sound-effects/
- https://opengameart.org/

## 음소거

게임 우상단 🔊 버튼으로 토글. localStorage `bm-sfx-muted`에 저장됨.
