# 읽기 플랜 커버 이미지 생성 프롬프트 (Gemini용)

`/bible/plans` 목록 카드와 `/bible/plans/:id` 상세 히어로에 함께 쓰이는 플랜별 배경 이미지.
컨셉: **"고요한 새벽빛 수채화"** — 사진이 아니라 옅은 수채/디지털 페인팅. 화면을 압도하지 않고
글 뒤에서 분위기만 만들어 주는, 숨 쉴 틈이 많은 그림.

## 사용법

1. 아래 **공통 스타일 블록**을 먼저 붙여넣고, 이어서 원하는 플랜의 **장면 문단**을 붙여 한 번에 요청한다.
   시리즈 톤을 맞추려면 먼저 만든 결과 한 장을 첨부하고 "같은 화풍·같은 팔레트로"라고 덧붙인다.
2. 결과물은 `frontend/src/assets/plans/<slug>.jpg` 로 **덮어쓰기** 한다 (파일명이 곧 slug).
   `planCovers.ts` 가 파일명으로 import 하므로 코드 수정은 필요 없다.
   - 새 플랜을 추가할 때만 `planCovers.ts` 의 `PLAN_COVERS` 에 한 줄 추가.
3. 규격: **3:2 가로 (기존 5장 모두 800×533)**, JPEG 품질 80 안팎, **한 장 120KB 이하**.
   더 크게 뽑았으면 `magick input.png -resize 800x533^ -gravity center -extent 800x533 -quality 80 <slug>.jpg` 로 줄인다.

## 레이아웃 제약 (이게 프롬프트의 핵심)

한 장이 **두 자리**에 동시에 쓰인다. 두 크롭 모두에서 살아남아야 한다.

| 자리 | 크롭 | 요구사항 |
|---|---|---|
| 상세 히어로 (`PlanDetail`) | 카드 오른쪽 **42% 세로 컬럼**, `object-position: 72% 50%` | **주요 피사체가 오른쪽 절반**에 있어야 함. 왼쪽은 마스크로 사라짐 |
| 목록 카드 (`PlanList` 피드) | **5:4 전체**, 좌상단에 이모지 배지 | 좌상단은 비워둘 것 |

즉 **"왼쪽 절반은 조용한 하늘/안개, 오른쪽 절반에 주인공"** 구도가 정답이다.
상세 히어로에서 그림 왼쪽 끝은 카드 바탕색으로 서서히 녹아 사라지므로,
왼쪽에 디테일을 넣으면 잘린 채 뭉개진다.

## 일관성 규칙 (5장 공통)

- **팔레트 고정** — 토스 블루 계열(#3182f6 언저리)의 저채도 하늘빛 + 새벽 광원 하나(따뜻한 크림/살구빛).
  초록·자주·형광은 쓰지 않는다. 브랜드 색과 부딪힌다.
- **밝고 낮은 대비** — 라이트 모드에선 흰 카드 위에, 다크 모드에선 85% 불투명도로 얹힌다.
  어두운 그림은 다크에서 시커먼 덩어리가 된다. 전체적으로 **밝게, 대비는 약하게**.
- **글자 금지** — 문자·숫자·로고·펼친 성경의 본문 글씨까지 전부 금지. UI 텍스트와 충돌한다.
  (책을 그린다면 지면은 빛에 날아간 무지 여백으로)
- **사람 얼굴 금지** — 실루엣·뒷모습·손 정도까지만. 얼굴이 들어가면 특정 인물처럼 읽힌다.
- **테두리·액자·비네트 금지** — 카드 모서리에서 잘리면 지저분해진다.
- **십자가는 은은하게** — 하늘의 빛줄기나 먼 언덕 위 실루엣 정도. 정면 클로즈업은 무겁다.

---

## 공통 스타일 블록 (매번 맨 앞에 붙여넣기)

```
A soft 3:2 landscape background illustration for a Bible reading-plan card in a
mobile church app. Style: gentle watercolor / light digital painting with soft
gradients, misty atmosphere and visible paper texture — calm, airy, devotional,
NOT photorealistic. Palette: low-saturation sky blues and pale teal (around
#3182f6 as the deepest tone) with ONE warm cream-apricot dawn light source.
Overall bright, high-key and low-contrast so dark text stays readable when the
image sits behind a white card.

Composition is the critical part: place the main subject in the RIGHT HALF of the
frame. The LEFT HALF must stay quiet and nearly empty — just soft sky, haze or a
flat gradient with no detail — because it will be faded out behind text. Keep the
top-left corner especially clean and simple.

No text, no letters, no numbers, no logos, no readable writing of any kind. No human
faces. No frames, no borders, no vignette. Nothing dark or heavy.

Scene:
```

---

## 플랜별 장면 (5종)

### intro-7 · 🌱 성경과 친해지기 (7일 · 입문 · 습관)
> "성경이 처음이거나 다시 시작하고 싶은 분을 위한 7일 입문 플랜"

```
A single small green sprout with two tender leaves pushing up through soft morning
grass on the right side of the frame, catching the first warm light of dawn. Fine
dew droplets sparkle on the blades. Behind it the field dissolves into pale blue
morning mist. The left half is empty sky brightening from soft blue to cream. The
mood is a quiet, hopeful first step — small, tender, just beginning.
```

### john-30 · ✝️ 요한복음 깊이 읽기 (30일 · 초급 · 복음서)
> "예수님이 누구신지 가장 분명하게 보여주는 요한복음을 30일 동안 한 권 통째로"

```
A slender wooden cross standing on a low hill in the right half of the frame,
silhouetted softly against a wide dawn sky. Warm light breaks from directly behind
the cross and spreads outward in gentle rays, dissolving into pale blue haze toward
the left. A few distant birds. The left half is open, luminous, almost empty sky.
The mood is reverent and grateful — light coming from one place.
```

### overview-90 · 🗺️ 구원의 큰 그림 (90일 · 중급 · 개관)
> "창조와 타락에서 그리스도와 새 하늘 새 땅까지, 구속사의 큰 흐름"

```
A wide layered landscape seen from a high vantage point: a pale winding river and a
long footpath curling from the misty distance toward the right foreground, with
ridge after ridge of soft blue mountains receding into the haze. Dawn light rests on
the farthest peaks on the right. The left half is deep atmospheric mist with almost
no detail. The mood is a vast, unfolding journey seen whole — the forest, not the trees.
```

### nt-120 · 🕊️ 신약 통독 (120일 · 고급 · 통독)
> "신약 27권을 마태복음부터 요한계시록까지 한 권도 빠짐없이 120일 동안"

```
A white dove in calm gliding flight, wings spread, in the right half of the frame,
lit from below by warm dawn light. Beneath it a soft sea of clouds resting over
distant blue ridges, an olive branch shape suggested loosely in the cloud edges.
The left half is clear pale sky, empty and luminous. The mood is peace after a long
climb — steady, high, unhurried.
```

### bible-365 · 📖 성경 일독 (365일 · 고급 · 통독)
> "성경 66권 1,189장 전체를 1년 동안 하루 3~4장씩 순서대로"

```
An open book resting on soft ground in the right half of the frame, its pages blank
and glowing warm cream in the dawn light — no writing, no letters on the pages. From
the book a pale footpath winds away into misty blue hills toward the horizon, where
the sun is just rising. The left half is quiet gradient sky. The mood is a long road
begun with a single open page — patient, warm, year-long.
```

---

## 받은 뒤 체크리스트

1. **오른쪽 절반에 주인공이 있나?** — 히어로에서 세로로 잘려도 살아남는지 본다.
2. **왼쪽 절반이 조용한가?** — 디테일이 있으면 마스크에 뭉개져 얼룩처럼 보인다 (이전 전면 워시 방식의 실패 원인).
3. **글자가 섞여 들어가지 않았나?** — 책 지면·간판에 가짜 글자가 잘 생긴다. 있으면 재생성.
4. **다크 모드 확인** — `/#/bible/plans/5` 에서 테마를 바꿔 본다. 그림이 어두우면 다시 밝게 뽑는다.
5. 800×533 / 120KB 이하로 줄여 `src/assets/plans/<slug>.jpg` 에 덮어쓰고 새로고침.

---

## 생성 이력

**2026-08-28 — 5장 전부 교체 완료** (Gemini, 1264×848 PNG → 800×533 JPEG q85, 24~40KB)
기존 Unsplash 사진 커버를 위 프롬프트로 만든 수채화 일러스트로 갈아끼웠다. 히어로 세로 크롭·피드 5:4 크롭 모두에서 피사체가 살아남는 것을 확인함.

### Gemini 워터마크(반짝이 글리프) 제거 방법

Gemini 결과물에는 우하단 (1264×848 기준 x 1118~1166, y 704~752)에 반투명 흰색 4각 반짝이가 찍혀 나온다.
**그 자리를 inpaint 로 지우면 안 된다** — 5번(책 모서리)·3번(수풀)처럼 디테일이 있는 자리는 뭉개진 얼룩이 남는다.

워터마크는 단순 알파 합성(`O = B*(1-a) + 255*a`)이라 **알파를 역산해 원본을 복원**하는 편이 훨씬 깨끗하다:

1. 배경이 가장 매끈한 결과물 한 장에서 글리프 마스크를 따고(고주파 잔차 임계값 → 최대 연결요소 → close/dilate),
2. 글리프 **바깥** 화소로 2차 다항식면을 적합해 배경 `B` 를 추정한 뒤 `a = (O-B)/(255-B)` 로 알파 맵을 만든다,
3. 위치가 동일하므로 그 알파 맵을 5장 전부에 `B = (O - 255a)/(1-a)` 로 적용한다.

알파가 0인 곳은 원본 그대로라 책 모서리·수풀 디테일이 보존된다 (실측 alpha 최대 0.39).
