# /bible 성경 읽기 현황 카드 배경 프롬프트 (Gemini용)

`/bible` → **성경 읽기 현황 → 진행률** 카드(`.reading-hero`, `book-selector/summary.css`) 뒤에 깔 배경.
지금은 오른쪽 118px 칸에 "빛나는 책" 오브제(`reading-hero-{light,dark}.webp`)만 있다.
이걸 홈 묵상 카드 핵심 절 박스(`public/images/home/verse-scene-{light,dark}.webp`)처럼
**카드 전체 배경 삽화**로 바꿔, "예수님이 곁에서 함께 읽고 계신다"는 느낌을 주는 게 목표.

라이트/다크 각각, 장면 시안 4종(A~D) 중 마음에 드는 것을 골라 뽑는다.

## 사용법

1. Gemini에 **`frontend/public/images/home/verse-scene-light.webp`** (다크는 `verse-scene-dark.webp`)를
   첨부하고, 아래 **공통 머리말 + 장면 시안 하나 + 테마 꼬리말**을 이어 붙여 보낸다.
   → 첨부 이미지와 같은 화풍·같은 예수님/어린양 캐릭터로 맞춰진다.
2. 라이트를 먼저 뽑고 마음에 들면, 그 결과물을 다시 첨부해서 같은 시안의 다크를 요청한다
   ("이 그림과 완전히 같은 구도·인물로, 밤 버전으로" + 다크 꼬리말). 구도가 짝으로 맞아야 테마 전환이 자연스럽다.
3. 한 시안당 2~3번 다시 뽑아보고 고른다. 마음에 드는 걸 받으면 원본 PNG를 넘겨주면 된다
   (워터마크 제거·크롭·webp 변환·CSS 적용은 이쪽에서 처리).
4. 저장 파일명(예정): `frontend/public/images/bible/reading-scene-light.webp` / `reading-scene-dark.webp`

## 레이아웃 제약 (프롬프트의 핵심)

카드 구성: 왼쪽 위 `전체 진행률` 라벨 → 큰 `70%` 숫자 → 격려 문구, **맨 아래에 카드 전체 폭의 진행 바**와
`837 / 1,189장 · 남은 352장`. 카드 비율은 모바일 약 1.8:1, PC 약 2.8:1.

- 규격: 최종 2.4:1(1536×640)로 크롭한다 — **이 숫자는 프롬프트에 쓰지 말 것**, Gemini 가로 비율 옵션으로 뽑기.
  `cover; right center`로 깔려 모바일에선 왼쪽이 잘린다.
- **인물은 오른쪽 35% 안에만.** 왼쪽 60%는 하늘·안개 같은 거의 빈 그라데이션.
- **아래쪽 20% 띠는 전 폭이 차분해야 한다** — 진행 바와 숫자가 올라간다. 풀밭이 있어도 낮고 흐릿하게.
- 왼쪽 가장자리 색이 카드 면 색과 맞아야 이음새가 안 보인다:
  라이트 `#f3f8ff`(아주 연한 하늘색 흰빛), 다크 `#1c2532 → #151b25`(먹색 남청).
- 예수님 얼굴은 **뒷모습 또는 옆 뒷모습**(참조 이미지와 동일) — 정면 얼굴은 화풍이 흔들리고 경건함도 깨진다.
- 글자·숫자·로고·책장의 읽히는 글씨 금지. 테두리·둥근 모서리·비네트 금지.

---

## 공통 머리말 (모든 요청 맨 앞에)

> ⚠️ 1차 결과 교훈(2026-10-01): 프롬프트에 "2.4:1", "progress bar", "text will be overlaid" 같은
> **UI 단어를 쓰면 Gemini가 그걸 그림 안에 그려 넣는다**(숫자 2.4:1·하단 회색 바가 박혀 나옴).
> 그래서 머리말에는 비율·UI 언급을 전부 빼고, 빈 공간도 "하늘이 넓게 트인 구도"로만 묘사한다.
> **비율은 Gemini 화면의 가로(16:9 이상) 옵션으로 고르고**, 크롭은 이쪽에서 한다.
> 또 사실풍 성화(수염·근육·옷 주름)로 흐르기 쉬워서, 캐릭터를 **2~2.5등신 치비**로 못 박았다.

```
A wide landscape storybook illustration. Match the attached reference image
EXACTLY in style and characters: a cute chibi-style children's picture-book
illustration — soft pastel colors, simple rounded shapes, gentle cel shading,
very little line detail, hazy dreamy light.

Characters must be cute cartoon characters, NOT realistic:
- Jesus as a small chibi figure about 2 to 2.5 heads tall, with a big round head,
  a simple soft bob of brown hair, a plain cream robe and a muted red sash draped
  over one shoulder. Shown from behind or in three-quarter back view so the face
  is not visible. No beard detail, no realistic anatomy, no muscles, no detailed
  hands or fabric folds — simple soft shapes like the reference.
- The same small fluffy white lamb as the reference: round puffy body, round
  simple face with tiny closed smiling eyes, very simple.
- The characters are SMALL in the frame — together they fill only about half of
  the picture's height, sitting low in the lower right.

The mood: Jesus is quietly reading the Word together with the little lamb.
Calm, warm, cozy, tender. No halo, no glowing rays.

Composition: a wide open sky. The characters sit in the lower right corner on a
gentle grassy hill. The rest of the picture — the whole left side and the upper
area — is just soft open sky and pale distant haze with almost nothing in it.
The grass along the bottom edge is soft, low and blurry.

The image must contain ONLY the illustration: no text, no numbers, no letters,
no captions, no labels, no user interface elements, no bars, no lines, no
buttons, no frames, no borders, no rounded corners, no vignette.
```

## 장면 시안 (하나만 골라 이어 붙이기)

### A. 함께 펼친 책 — 가장 직접적인 "같이 읽기"

```
Scene (right 35%): Jesus sits on a gentle grassy hillside, seen from behind and
slightly to the side, holding a large open book on his lap. The little lamb sits
pressed close against his side, peeking over his arm at the same open pages, as
if they are reading together. The pages are blank and softly luminous — no
writing. A few small wildflowers near them, distant soft hills fading into haze.
```

### B. 어깨 너머로 — 곁에서 지켜봐 주시는 느낌

```
Scene (right 35%): the little lamb sits upright in the grass with a small open
book in front of it, absorbed in reading. Jesus kneels just behind it, seen in
three-quarter back view, one hand resting gently on the lamb's back, leaning in
to look at the same page with quiet warmth — like a parent reading with a child.
The pages are blank and softly glowing — no writing. Tall soft grass and a few
wildflowers around them, hazy hills behind.
```

### C. 올리브나무 그늘 — 쉼이 있는 묵상

```
Scene (right 35%): a single old olive tree with silvery-green leaves stands at
the right edge, its canopy reaching only slightly into the frame's upper right.
In its shade Jesus sits leaning against the trunk, seen from behind and to the
side, reading an unrolled scroll held in both hands; the lamb lies curled up
beside him with its head resting on his knee, eyes half closed, listening.
The scroll is blank — no writing. Dappled light on the grass.
```

### D. 함께 걷는 길 — 진행률(여정) 은유

```
Scene (right 35%): a narrow footpath winds from the lower right toward distant
soft hills. Jesus walks slowly along it, seen from behind, carrying a closed book
held against his chest with one arm; the lamb trots close at his heel looking up
at him. The path ahead fades gently into light haze on the horizon, suggesting a
journey still unfolding. Keep the path faint and short, staying in the lower right.
```

## 테마 꼬리말 (맨 뒤에 하나)

### 라이트

```
LIGHT MODE. Bright, high-key early-morning light. Palette: pale sky blue fading
to almost white (the left edge should be very close to #f3f8ff), fluffy soft
white clouds, warm cream sunlight coming from the upper right, soft sage-green
grass.
Overall bright, airy and low-contrast.

No text, no numbers, no letters, no bars, no frames, no borders.
```

### 다크

```
DARK MODE, night version of the same scene. Palette: deep muted blue-slate night
sky (the left edge should be very close to #1c2532, darkening to #151b25 toward
the bottom), a few tiny faint stars, a thin crescent moon high in the upper
right. The only warm light is a small oil lamp set beside them on the grass (or
hanging from the olive branch), casting a soft amber glow on the open pages,
Jesus's robe and the lamb's wool — the mood is "late at night, still reading
together".
Everything else stays dark, soft and muted.

The only bright areas are the lamp glow, the pages and the moon.
No text, no numbers, no letters, no bars, no frames, no borders.
```

---

## 고를 때 체크리스트

- [ ] 그림 안에 숫자·글자·회색 바 같은 UI 흔적이 없나
- [ ] 인물이 치비(2~2.5등신)인가 — 수염·사실적 얼굴/손이면 탈락
- [ ] 왼쪽 60%가 정말 비어 있나 (구름 하나 정도는 OK, 산 능선이 왼쪽까지 뻗으면 탈락)
- [ ] 아래 띠가 차분한가 (진행 바가 올라가도 풀이 뾰족하게 튀지 않는지)
- [ ] 예수님 얼굴이 정면으로 나오지 않았나
- [ ] 책장·두루마리에 가짜 글씨가 생기지 않았나
- [ ] 라이트/다크 짝의 구도·인물 위치가 같은가
- [ ] 홈 묵상 카드(verse-scene)와 너무 똑같아 보이진 않나 — 같은 세계관, 다른 장면이어야 함

## 적용 상태 (2026-10-01)

- 시안 A(함께 펼친 책) 치비 판 라이트/다크 적용 → `public/images/bible/reading-scene-{light,dark}.webp`
  (원본 1376×768 → 1200×670, cwebp q78, 16~19KB). ✦ 는 `gemini-unwatermark.py` 로 제거(중심 W-120.5, H-120.5 그대로).
- `summary.css .reading-hero` 배경 4겹: 왼쪽 워시 → 아래 워시(진행 바 자리) → 삽화 `right 72% / cover` → 바탕색.
  글자 칸 `.reading-hero__stat` 는 `max-width: 56%`. 예전 책 오브제(`.reading-hero__art`, `reading-hero-*.webp`)는 삭제.
- `themeAssets.ts READING_HERO` 가 새 파일을 가리킨다(테마 전환 선로딩).
- 넓은 폭(≥480px)은 `cover` 대신 높이 기준 `auto 112%`·아래 붙임 — 폭 기준이면 PC에서 인물이 카드를 다 덮었다. 그림 왼쪽 빈자리는 삽화 왼쪽 가장자리 색을 높이별로 잰 세로 그라데이션으로 이음(삽화 교체 시 재측정).
