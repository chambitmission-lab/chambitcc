# /intercession 누군가의 기도 히어로 배경 프롬프트 (Gemini용)

`/intercession` 맨 위 히어로 카드(`Intercession.tsx` 의 `Hero`, `LampHero`) 뒤에 깔 배경.
지금은 연한 하늘색 그라데이션 면 위에 **가운데 유리컵 촛불 줄**(SVG `Lamp` — 이번 달 주마다 초 하나)만 있어 비어 보인다.
촛불은 계속 코드(SVG)로 그리고, 배경은 **그 촛불 줄을 주인공으로 받쳐 주는 무대**가 되는 게 목표.

정서: "보이지 않는 누군가가, 어디선가, 지금 나를 위해 기도하고 있다" — 따뜻하고 조용한데 **살짝 설레는** 기대감.
(밤새 누가 문 앞에 편지를 두고 간 걸 발견한 아침 같은 느낌)

라이트/다크 각각, 장면 시안 5종(A~E) 중 마음에 드는 것을 골라 뽑는다.

## 사용법

1. Gemini에 **`frontend/public/images/home/verse-scene-light.webp`** (다크는 `verse-scene-dark.webp`)를 첨부하고,
   아래 **공통 머리말 + 장면 시안 하나 + 테마 꼬리말**을 이어 붙여 보낸다.
   → 첨부 이미지와 같은 파스텔 동화풍으로 맞춰져, 홈·성경 읽기 카드와 한 세계관이 된다.
2. **비율은 Gemini 화면의 가로(16:9) 옵션**으로 고른다. 프롬프트에 비율 숫자를 쓰지 말 것.
3. 라이트를 먼저 뽑고 마음에 들면, 그 결과물을 다시 첨부해 같은 시안의 다크를 요청한다
   ("이 그림과 완전히 같은 구도로, 밤 버전으로" + 다크 꼬리말). 구도가 짝으로 맞아야 테마 전환이 자연스럽다.
4. 한 시안당 2~3번 다시 뽑아 보고 고른다. 원본 PNG를 넘겨주면 워터마크 제거·크롭·webp 변환·CSS 적용은 이쪽에서 한다.
5. 저장 파일명(예정): `frontend/src/assets/intercession/hero-light.webp` / `hero-dark.webp`
   (`public/` 은 SW 캐시 탓에 교체가 늦게 반영되므로 `src/assets` 해시 경로로 둔다)

## 레이아웃 제약 (프롬프트의 핵심)

카드 구성: **왼쪽 위** `누군가의 기도` 라벨 + 두 줄 제목 → **가운데(세로 60~75% 높이)** 유리컵 촛불 1~5개가 가로로 한 줄
→ **아래 가운데** 한 줄 안내 문구. 카드 비율은 PC 약 2.5:1, 모바일 약 1:1 (모바일은 가운데 정사각형만 보인다).

- `cover; center` 로 깐다 → **중요한 건 전부 가로 가운데 40% 안에**, 장식은 좌우 끝에만 (모바일에선 잘려도 되는 것).
- **촛불·등잔·불꽃을 그림에 그리지 말 것.** 촛불은 코드가 올린다 — 그림엔 촛불이 놓일 **빈 자리(낮은 받침·평평한 언덕 마루 등)와
  그 뒤 은은한 빛 웅덩이**만 있어야 한다. 그림에 초가 있으면 두 겹으로 겹쳐 보인다.
- 촛불 자리 바로 뒤는 **너무 하얗게 날아가면 안 된다** — 라이트의 유리컵 테두리(푸른 회색)가 안 보인다. 따뜻한 크림·복숭아빛 정도.
- **왼쪽 위 30%는 차분하게** (제목 자리), **아래 가운데 띠도 차분하게** (안내 문구 자리).
- 가장자리 색이 카드 면 색과 맞아야 둥근 모서리 주변이 어색하지 않다:
  라이트 `#e3efff → #f6f9ff`(맑은 하늘빛 흰빛), 다크 `#0a1830 → #101a2e`(깊은 남청).
- **사람 얼굴 금지** — 익명 원칙상 "누가" 기도하는지 보여 주지 않는다. 사람은 아주 먼 창문 불빛·작은 실루엣 정도까지만.
- 글자·숫자·로고·편지 위 읽히는 글씨 금지. 테두리·둥근 모서리·비네트 금지.

---

## 공통 머리말 (모든 요청 맨 앞에)

> ⚠️ 다른 배경 문서들의 교훈: "card", "text area", "UI", 비율 숫자 같은 단어를 쓰면 Gemini가 그걸 그림 안에 그려 넣는다.
> 빈 공간은 "하늘이 넓게 트인 구도"처럼 **장면 말로만** 묘사한다. 또 "candle" 을 언급하면 초를 그려 넣으므로,
> 촛불 자리는 "작은 빛을 놓아 둘 빈 자리"로만 말한다.

```
A wide landscape storybook illustration. Match the attached reference image
EXACTLY in style: a soft pastel children's picture-book illustration — dreamy
hazy light, gentle cel shading, simple rounded shapes, very little line detail,
calm and tender.

The mood: quiet, warm and hopeful, with a gentle flutter of anticipation — like
waking up to find that someone, somewhere, has been thinking of you all night.
Tender, peaceful, a little magical. No people's faces anywhere.

Composition: the scene is built symmetrically around an empty resting spot in
the exact horizontal center, a little below the middle of the picture — a low,
softly lit place where a few small lights could later be set down. Leave that
center spot completely empty: NO candles, NO lamps, NO lanterns, NO flames,
NO objects on it — only a soft warm pool of light behind it.
The upper left area is calm open sky with almost nothing in it. The strip along
the bottom center is soft, plain and low-contrast. Decorative details stay near
the far left and far right edges only.

The image must contain ONLY the illustration: no text, no numbers, no letters,
no captions, no labels, no user interface elements, no bars, no buttons,
no frames, no borders, no rounded corners, no vignette.
```

## 장면 시안 (하나만 골라 이어 붙이기)

### A. 새벽 창턱 — "누군가 내 방 창가에 빛을 놓고 간 아침"

```
Scene: seen from inside a cozy room, a wide old wooden windowsill runs across
the lower part of the picture; its middle section is bare and softly lit — the
empty resting spot. Beyond the open window, gentle rolling hills and a pale
sky at first light. Thin sheer curtains hang at the far left and far right
edges, lifted slightly by a breeze. A small sprig of wildflowers in a tiny
glass bottle stands at the far right end of the sill. A few tiny glowing dust
motes float in the air above the empty middle of the sill.
```

### B. 언덕 너머 불 켜진 창들 — "어디선가 누군가도 깨어 기도하고 있다"

```
Scene: the soft rounded crest of a grassy hill runs across the lower middle of
the picture, with a small flat bare clearing at its very center — the empty
resting spot. Far below and beyond, in the distance on both sides, a tiny
sleepy village of little houses is scattered across the valley; a handful of
their windows glow warm, like small lights of people awake somewhere far away.
Faint threads of tiny glowing motes drift up from those distant windows and
float slowly toward the sky above the center of the hill.
```

### C. 떠오르는 빛 입자 들판 — "기도가 올라가는 장면" (가장 설레는 쪽)

```
Scene: a soft meadow of tall grass and small wildflowers fills the far left
and far right of the lower picture, framing a low, smooth, open patch of short
grass in the center — the empty resting spot. Dozens of tiny warm glowing light
particles rise gently from the meadow on both sides and drift upward in soft
curving paths, gathering faintly in the sky above the center like quiet
prayers going up. A few drifting dandelion seeds catch the light.
```

### D. 바람에 실려 오는 편지 — 익명 편지와 이어지는 장면

```
Scene: a gentle hilltop at golden first light, with a small flat smooth stone
lying in the exact center of the lower middle — its top bare and softly lit,
the empty resting spot. From the distant right side of the sky, a few tiny
folded paper letters and soft flower petals float on the breeze toward the
center, small and far away, as if arriving from someone unseen. The letters are
plain, blank, with no writing and no visible seals. Wisps of soft cloud at the
far left and far right edges.
```

### E. 등불을 기다리는 어린 양 — 마스코트가 지켜보는 장면 (선택)

```
Scene: a soft grassy hilltop with a small flat bare clearing in the exact center
of the lower middle — the empty resting spot. At the far right edge, small in
the frame, the same fluffy white lamb style as the reference sits in the grass
seen from the side, gazing toward the empty center with a calm, expectant look,
as if quietly waiting for a light to appear there. A few tiny wildflowers near
the lamb. Nothing at all on the center spot, and the lamb is not holding
anything.
```

## 테마 꼬리말 (맨 뒤에 하나)

### 라이트

```
LIGHT MODE. Bright, high-key early-dawn light. Palette: clear pale sky blue
fading to almost white at the edges (edges very close to #e3efff and #f6f9ff),
soft white clouds, and a gentle warm cream-and-peach glow only in the center
behind the empty resting spot — warm but not blown out to pure white.
Soft sage-green grass, pale lavender haze on the far hills.
Overall airy, soft and low-contrast, matching a light blue page.

No candles, no lamps, no flames. No text, no numbers, no letters, no frames,
no borders.
```

### 다크

```
DARK MODE, night version of the same scene. Palette: deep muted navy night sky
(edges very close to #0a1830, softly shifting to #101a2e), many tiny faint
stars, a thin crescent moon high in the upper right. The only warm light is a
soft, low amber glow pooled around the empty center spot, as if a small light
is about to be set there; distant warm windows or glowing motes (if in the
scene) are tiny amber dots. Everything else stays dark, soft and muted
blue-violet. The center glow is gentle and dim, not a bright flare.

No candles, no lamps, no flames. No text, no numbers, no letters, no frames,
no borders.
```

---

## 고를 때 체크리스트

- [ ] 그림 안에 **초·등잔·불꽃이 없나** (있으면 코드 촛불과 겹쳐 탈락)
- [ ] 가운데 빈 자리가 **가로 정중앙, 세로 60~75% 높이**쯤에 있나 — 촛불 줄이 "놓인" 것처럼 보여야 한다
- [ ] 빈 자리 바로 뒤가 하얗게 날아가지 않았나 (라이트에서 유리컵 테두리가 보여야 함)
- [ ] 왼쪽 위(제목 자리)가 차분한가, 아래 가운데(안내 문구 자리)가 차분한가
- [ ] 가운데 정사각형만 잘라 봐도(모바일) 장면이 성립하나
- [ ] 사람 얼굴이 없나, 편지·창문에 가짜 글씨가 없나
- [ ] 라이트/다크 짝의 구도가 같은가
- [ ] 홈 묵상 카드(verse-scene)와 같은 세계관이면서 다른 장면인가

## 적용 메모 (받으면 이쪽에서)

- `Hero` 의 그라데이션 배경 위에 삽화를 `cover; center` 로 얹고, 왼쪽 위 제목 칸만 카드 면 색 워시로 살짝 눌러 가독성 확보.
- `/intercession` 의 다른 상태 히어로(신청 전·쉬는 중 등, `Intercession.tsx` 의 `<Hero>` 5곳)도 같은 컴포넌트라 같이 바뀐다
  — 촛불이 없는 상태에서도 가운데 빈 자리가 어색하지 않은지 확인. (월말 회고 `Recap` 은 별도 화면이라 해당 없음)
- 테마 전환 선로딩은 `themeAssets.ts` 에 등록.

## 적용 상태 (2026-10-02)

- 시안 A(새벽 창턱) 라이트/다크 적용 → `src/assets/intercession/hero-{light,dark}.webp`
  (원본 1376×768 그대로, webp q80, 22KB/15KB). ✦ 는 `gemini-unwatermark.py`(다크 정상, 라이트는 평평한 바닥이라
  옅은 잔상 → 창턱 아래 선(y≥626)만 행 단위 보간으로 메움. 창턱 테두리선은 건드리지 않음).
- 배경은 카드가 아니라 **촛불 줄 컨테이너에 붙인다**(`LampHero` 의 `.ic-hero-scene`): 그림 속 창턱 윗면 y=560(72.9%)을
  유리컵 밑면에 맞춤. 폭 `max(100% + 300px, 720px)` — PC에서 커튼이 제목을 덮지 않게 가장자리로 밀어낸 값.
  안내 문구 `mt-7 lg:mt-9` 는 창턱 앞면을 지나 바닥 면에 오도록 맞춘 값.
- 등불이 없는 다른 상태 히어로(신청 전·쉬는 중 등)에는 아직 안 깔았다.
- 선로딩: `themeAssets.ts INTERCESSION_HERO` + `useThemeArt`(조건부 화면이라 매니페스트 미등록).
