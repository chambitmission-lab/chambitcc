# 홈 "함께 읽는 말씀" 카드 배경 이미지 프롬프트 (Gemini용)

홈(기도 목록) 사이드바의 **지금/오늘 함께 읽는 말씀 카드**
(`pages/Home/components/LiveReadingCard.tsx`, `.live-card` — `오늘 함께 읽은 말씀` 라벨 +
`욥기 31장` + `오늘 3명의 성도가 이 말씀을 펼쳤어요` + `나도 읽기 ›`) 뒤에 깔 배경. 라이트/다크 각 1장.

컨셉은 이어 읽기 카드(`resume-card-bg-prompts.md`)·칭호·타임캡슐과 같은
**코지-에픽 동화풍 + 같은 양 캐릭터**. 장면은 이 카드만의 것이다 —
**양 몇 마리가 큰 성경책을 펴놓고 같이 읽고 있고, 조금 떨어진 언덕에서 다른 양 한 마리가
목을 빼고 궁금해하며 넘겨다본다.** 카드 문구가 그대로 그림이 되는 구조다:
읽고 있는 무리 = `3명의 성도가 이 말씀을 펼쳤어요`, 궁금해하는 양 = 이 카드를 보고 있는 사용자,
그리고 `나도 읽기` 버튼이 그 양을 무리로 데려간다.

> **참조 이미지는 `public/images/bible/resume-light.webp` 가 정답이다.**
> 이미 "그 양이 성경책을 펴들고 읽는" 형제 그림이라 캐릭터·책·손발굽 문법이 그대로 이어진다.
> 다크는 저 그림의 **남색 밤하늘을 따라가면 안 된다** — 아래 팔레트 표를 반드시 지킬 것
> (`resume-dark.webp` 는 2026-09 이전 남색 다크 토큰 시절 자산이다).

## 사용법

1. Gemini에 `public/images/bible/resume-light.webp` 를 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로, 같은 화풍으로" 라고 덧붙인 뒤 프롬프트를 통째로 붙여넣는다.
   **한 세션에서 라이트 → 다크 순으로 이어서 뽑아야 톤이 맞는다.**
2. 저장 위치 (파일명 고정, `home/` 폴더는 새로 만든다):
   - 라이트: `frontend/public/images/home/live-reading-light.webp`
   - 다크:   `frontend/public/images/home/live-reading-dark.webp`
3. 규격: **3:1 가로 (1536×512 권장)**. 카드가 최대 416×146 이라 이 해상도면 3배수 이상이다.
   후처리는 `docs/verse-alarm-hero-process.py` 를 좌표만 고쳐 재사용한다
   (Gemini 워터마크 ✦ 는 우하단 — 아래 "워터마크" 항목 참고).
   **한 장 40KB 이하**를 목표로 한다(`cwebp -q 76`). 홈 첫 화면에 깔리는 그림이라 무게가 곧 체감 속도다.
   알파는 쓰지 않는다 — 카드 전체를 덮는 배경이다.

---

## 레이아웃 제약 (프롬프트의 핵심)

### 카드 실측

| 위치 | 카드 폭 | 카드 높이 | 비율 |
|---|---|---|---|
| PC(lg+) 우측 사이드바 (`lg:w-[368px]` − `px-4`) | **336** | 146 | 2.30 : 1 |
| 모바일 390 뷰포트 (`max-w-md` − `px-4`) | **358** | 146 | 2.45 : 1 |
| 모바일 최대 (`max-w-md` 448 − `px-4`) | **416** | 146 | 2.85 : 1 |
| 실시간 모드 + 다른 장 칩 2개 (`.live-card__extras`) | 336~416 | **180** | 1.87~2.31 : 1 |

- 높이는 **제목 1줄 + 본문 1줄로 사실상 146px 고정**이다. 폭만 336~416 사이에서 변한다.
- `background-size: cover; background-position: right center` 로 깐다.
  삽화(3:1)가 카드보다 항상 가로로 길기 때문에 **배율은 카드 높이가 정하고, 잘리는 건 왼쪽뿐이다.**
  → **세로는 한 번도 안 잘린다.** 대신 왼쪽이 잘린다:

| 카드 | 그려지는 삽화 폭 | 왼쪽에서 잘리는 양 |
|---|---|---|
| 416×146 | 438 | 22px = 삽화의 **5%** |
| 358×146 | 438 | 80px = 삽화의 **18%** |
| 336×146 | 438 | 102px = 삽화의 **23%** |
| 336×180 (칩 있을 때) | 540 | 204px = 삽화의 **38%** |

→ **삽화의 왼쪽 0~40% 는 언제 잘려도 그만인 빈 하늘·풀밭으로만 그린다.**
주인공을 왼쪽에 두면 PC에서 반토막 난다. 세로 여백은 잘리지 않지만
위·아래 각 6% 는 반올림 여유로 비워 둔다.

### 글자가 지나가는 자리 — ★ 왼쪽 2/3 는 성역이다

카드 위에 얹히는 것들(카드 폭 기준 백분율):

| 요소 | 카드 x | 카드 y | 색 |
|---|---|---|---|
| `오늘 함께 읽은 말씀` 라벨 (11px/700) | 0~48% | 10~22% | 브랜드 파랑 |
| `욥기 31장` 제목 (20px/700) | 0~50% | 27~45% | `#191722` / `#e5e2e1` |
| `오늘 3명의 성도가…` 본문 (13.5px) | 0~66% | 48~62% | `#3a3744` / `#cac4d4` |
| `오늘 성도들이 가장 많이 머문 자리예요` (12.5px, **2줄로 감김**) | 0~68% | 66~96% | `#7d7887` / `#938f9a` |
| **`나도 읽기 ›` CTA pill** (브랜드 솔리드) | 70~96% | 69~89% | 흰 글씨 / `#3182f6` 바탕 |
| 책 엠블럼 44×44 (`.live-card__emblem`) | 83~96% | 31~61% | 브랜드 tint 사각형 |

이걸 삽화(3:1) 좌표로 옮기면 이렇게 된다. **프롬프트가 지켜야 하는 건 이 표다.**

| 삽화 영역 | 규칙 |
|---|---|
| x **0~40%** | 잘리는 구역. 매끈한 하늘·풀밭 그라데이션만. 디테일 금지 |
| x **40~65%** | 글자가 지나간다. 흐린 원경(먼 언덕·안개)만, 대비 낮게 |
| x **65~100%** | **주인공 구역.** 여기에 전부 몰아넣는다 |
| x 72~98% · y 66~92% | **CTA pill 자리.** 평평한 풀밭·물가로 비운다(디테일·밝은 점 금지) |
| 우하단 x 88~100% · y 80~100% | Gemini 워터마크 ✦ 자리. 지워야 하므로 평평하게 |
| 위 6% · 아래 6% | 반올림 여유 |

- **주인공 구역과 글자 구역 사이에 딱딱한 세로 경계를 만들지 말 것.** 왼쪽으로 갈수록
  안개에 녹아 사라져야 한다. CSS 가 좌측 페이드를 한 겹 더 얹지만, 그림 자체가 부드럽지 않으면
  카드 한가운데에 세로줄이 생긴다(이어 읽기 카드에서 이미 겪은 문제다).
- **브랜드 파랑 덩어리를 x 70% 오른쪽에 두지 말 것.** CTA pill 이 브랜드 솔리드 파랑이라
  **파랑끼리 먹힌다.** 파랑은 왼쪽 하늘의 옅은 톤으로만 쓴다.
- 펼친 책 페이지에 **글자를 절대 그리지 않는다.** 백지 + 부드러운 빛만.
- **물음표(?) 기호도 금지다.** 궁금함은 고개 기울임·귀 쫑긋·발끝 들기로만 표현한다.

### ★ 라이트와 다크의 차이는 "카드색"이다 (여기서 제일 많이 틀린다)

| | 카드 바탕 | 글씨 | 그림 톤 | 유일한 광원 |
|---|---|---|---|---|
| 라이트 | 흰색 `#ffffff` → `#f3f1f7` (좌상단에 브랜드 8% tint) | `#191722` | **하이키 파스텔**(거의 흰 대낮) | 오른쪽 위 크림-골드 햇살 |
| 다크 | **따뜻한 차콜 `#201f1f` → `#2a2a2a`** | `#e5e2e1` | **저채도 웜 차콜·모브브라운** | 펼친 책 + 등불의 앰버 |

★ **다크 카드는 남색이 아니다.** `resume-dark.webp` 의 남색 밤하늘(`#0A1428` 계열)을 그대로 가져오면
`#201f1f` 카드 위에서 **파란 직사각형**으로 뜬다. 다크는 **따뜻한 회갈색 밤**으로 번역해서 그려야 한다.
라이트도 마찬가지로 **흰 카드보다 어두워지면 회색 판떼기**로 보인다 — 거의 흰색에서 시작한다.

---

## A안 · 「먼저 온 양들, 늦게 온 양」 (메인)

오른쪽에 양 셋이 큰 성경책 한 권을 가운데 펴놓고 둘러앉아 읽는다.
한 마리는 발굽으로 구절을 짚고, 한 마리는 고개를 갸웃, 한 마리는 감동해서 눈을 반짝인다.
그 뒤 조금 떨어진 작은 언덕에, **네 번째 양이 발끝을 들고 목을 길게 빼고** 넘겨다본다 —
너무 기울여서 곧 넘어질 것 같은 자세다. 이 양이 사용자다.

### 1. A안 · 라이트 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for a small card in a Korean church
app home screen, LIGHT MODE. The card is only about 400x146 pixels and its background
is nearly WHITE (#ffffff fading to #f3f1f7), so this artwork must read as an
almost-white, high-key pastel scene. Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain texture, rounded friendly forms,
gentle airy daylight. Use the SAME small chubby white sheep character as the attached
reference image: cream-white wool, stubby legs, tiny round hooves, a small serene
smile, soft blue-grey line work.

Palette: a bright pale meadow morning. The sky is an almost-white wash — very light
warm cream (#fffaf2) near the horizon lifting into pale sky blue (#eef4fd) at the top,
over a soft pale sage-green meadow. Keep everything HIGH-KEY and low-contrast —
pastel, airy, almost washed out — because dark charcoal text is drawn on top of the
left side. The deepest tone anywhere is a soft blue-grey used only for thin outlines
and long soft shadows. No dark masses, no saturated colours, no black outlines, and no
strong or bright blue anywhere on the right side.

Composition is critical:
- Everything interesting lives in the RIGHT THIRD of the frame (x 65-100%).
- The LEFT 40% of the frame must be nearly EMPTY — just a smooth pale sky-to-meadow
  gradient with at most one faint distant cloud. It gets cropped away on narrow cards
  and text is drawn over whatever survives.
- The middle band (x 40-65%) holds only faint, hazy distance: one or two very soft,
  very pale rolling hills that dissolve into mist. No hard edges, no detail, no
  vertical boundary — the scene must fade gradually into the empty left side, never
  stop at a line.
- Reserve a CALM FLAT PATCH in the lower right, from x 72% to 98% and from y 66% down
  to y 92%: plain smooth grass with no objects, no highlights and no texture detail. A
  solid blue button sits exactly there.
- Keep the TOP 6% and BOTTOM 6% as calm expendable margin, and leave the very bottom
  right corner flat and featureless.

Scene (right third) — the joke is that the latecomer is dying of curiosity:
- THREE small chubby white sheep sit together on the grass in a loose semicircle
  around ONE large open book lying flat between them, its pages completely BLANK and
  glowing softly white in the sunlight. One sheep points at the page with a tiny
  hoof, one tilts its head with both ears perked, one has its eyes closed in a happy
  contented smile. They are turned toward the viewer in a gentle three-quarter-FRONT
  angle — never a flat side profile — so both eyes are visible on each face, the same
  size and evenly spaced.
- Slightly BEHIND and to the upper right, standing on a small separate hillock a
  little further away and therefore noticeably SMALLER and paler with haze, a FOURTH
  sheep stands alone: up on the very tips of its hooves, neck stretched
  comically long, leaning forward at a precarious angle, ears straight up, eyes wide
  and round with pure curiosity, trying to see what the others are reading. It is the
  most expressive character in the picture.
- A few tiny daisies, two small round bushes and one slender olive tree may sit at the
  outer right edge. Two or three tiny birds may drift high in the upper right.

No text, no letters, no numbers, no writing on the book pages, no logos. No question
marks, no exclamation marks, no speech bubbles, no thought bubbles — the curiosity must
be shown by the pose alone. Do NOT draw any user-interface elements, buttons, pills,
panels or rounded rectangles. The background must be ONE continuous soft gradient —
never a rectangular block, window or box of a different colour, and no straight
background edges anywhere. No frames, no borders, no vignette, no rounded corners.
```

### 2. A안 · 다크 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for a small card in a Korean church
app home screen, DARK MODE. The card is only about 400x146 pixels and its background
is a WARM CHARCOAL (#201f1f fading to #2a2a2a) — a soft near-black brown-grey, NOT
navy blue and NOT pure black. The artwork must melt into that warm charcoal. Style:
cozy-epic children's storybook illustration — soft flat shapes with subtle grain
texture, rounded friendly forms, warm rim lighting. Use the SAME small chubby sheep
character as the attached reference image: stubby legs, tiny round hooves, a small
serene smile — but here its wool reads as soft warm grey, never bright white.

Palette: a warm charcoal evening meadow. The sky goes from #1c1b1b at the top through
#26231f into a faintly mauve-brown #2b2622 near the horizon, over a deep warm
grey-green meadow. NO blue night sky, NO indigo, NO teal — the reference image's navy
sky must be re-translated into this warm brown-grey. The ONLY bright things in the
whole picture are the soft AMBER glow of the open book's blank pages and one small
warm lantern (#e0a458) beside the reading sheep, plus a thin warm rim light along the
top of each sheep. Keep everything else muted and low-contrast, because light grey
text is drawn on top of the left side.

Composition is critical:
- Everything interesting lives in the RIGHT THIRD of the frame (x 65-100%).
- The LEFT 40% of the frame must be nearly EMPTY — just a smooth dark warm-grey
  gradient with no stars and no detail. It gets cropped away on narrow cards and text
  is drawn over whatever survives.
- The middle band (x 40-65%) holds only faint, hazy distance: one or two very soft
  rolling hills kept extremely close in value to the sky so nothing reads as a hard
  silhouette. No hard edges, no vertical boundary — the scene must fade gradually into
  the empty left side, never stop at a line.
- Reserve a CALM FLAT PATCH in the lower right, from x 72% to 98% and from y 66% down
  to y 92%: plain smooth dark grass with no objects, no highlights and no lantern
  spill. A solid bright blue button sits exactly there.
- Keep the TOP 6% and BOTTOM 6% as calm expendable margin, and leave the very bottom
  right corner flat and featureless.

Scene (right third) — the joke is that the latecomer is dying of curiosity:
- THREE small chubby sheep sit together on the grass in a loose semicircle around ONE
  large open book lying flat between them, its pages completely BLANK and glowing warm
  amber, lighting the three faces from below like a campfire. One sheep points at the
  page with a tiny hoof, one tilts its head with both ears perked, one has its eyes
  closed in a happy contented smile. They are turned toward the viewer in a gentle
  three-quarter-FRONT angle — never a flat side profile — so both eyes are visible on
  each face, the same size and evenly spaced.
- Slightly BEHIND and to the upper right, standing on a small separate hillock a
  little further away and therefore noticeably SMALLER and darker, a FOURTH sheep
  stands alone just outside the warm circle of light: up on the very tips of its
  hooves, neck stretched comically long, leaning forward at a precarious angle, ears
  straight up, eyes wide and round with pure curiosity, only its face and one shoulder
  catching the amber glow. It is the most expressive character in the picture.
- Two small round bushes and one slender olive tree may sit at the outer right edge as
  soft dark shapes. Do NOT scatter a starfield across the sky.

No text, no letters, no numbers, no writing on the book pages, no logos. No question
marks, no exclamation marks, no speech bubbles, no thought bubbles — the curiosity must
be shown by the pose alone. Do NOT draw any user-interface elements, buttons, pills,
panels or rounded rectangles. The background must be ONE continuous soft gradient —
never a rectangular block, window or box of a different colour, and no straight
background edges anywhere. No frames, no borders, no vignette, no rounded corners.
```

---

## B안 · 「담요만 한 성경책」

성경책을 **담요처럼 크게 펴놓고** 양들이 그 위에 엎드려 읽는 그림.
늦게 온 양은 페이지 귀퉁이를 발굽으로 살짝 들춰서 밑에서 빼꼼 올려다본다.
A안이 계속 왼쪽까지 그림을 채우거나 네 번째 양이 안 보일 때 쓴다 — 무리와 구경꾼의 거리가
"멀리"가 아니라 "책 한 장 너머"라 좁은 카드에서 훨씬 잘 읽힌다.

### 3. B안 · 라이트 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for a small card in a Korean church
app home screen, LIGHT MODE. The card is only about 400x146 pixels and is nearly WHITE
(#ffffff to #f3f1f7), so this artwork must read as an almost-white, high-key pastel
scene. Style: cozy-epic children's storybook illustration — soft flat shapes with
subtle grain texture, rounded friendly forms, gentle airy daylight. Use the SAME small
chubby white sheep character as the attached reference image: cream-white wool, stubby
legs, tiny round hooves, a small serene smile, soft blue-grey line work.

Palette: a bright pale meadow morning — an almost-white sky, warm cream (#fffaf2) near
the horizon lifting into pale sky blue (#eef4fd) at the top, over a soft pale
sage-green meadow. Keep everything HIGH-KEY and low-contrast; the deepest tone is a
soft blue-grey used only for thin outlines and soft shadows. No dark masses, no
saturated colours, no black outlines, no strong blue on the right side.

Composition is critical:
- Everything interesting lives in the RIGHT THIRD of the frame (x 65-100%).
- The LEFT 40% must be nearly EMPTY — a smooth pale sky-to-meadow gradient, no detail;
  it gets cropped and text is drawn over it.
- The middle band (x 40-65%) holds only faint hazy distance that dissolves into mist,
  with no hard edge and no vertical boundary.
- Reserve a CALM FLAT PATCH from x 72% to 98% and y 66% to 92%: plain smooth grass,
  no objects, no highlights — a solid blue button sits exactly there.
- Keep the TOP 6% and BOTTOM 6% as calm expendable margin; the very bottom right
  corner stays flat and featureless.

Scene (right third) — the joke is the eavesdropper under the page:
- ONE enormous open book lies flat on the grass like a picnic blanket, pages
  completely BLANK and glowing softly white, drawn in gentle perspective. TWO small
  chubby white sheep lie on their tummies ON the open pages, chins propped on their
  front hooves, hind hooves kicked up happily behind them, reading with contented
  smiles.
- At the far right edge of the book, a THIRD sheep has lifted one corner of the page
  with a tiny hoof and is peeking out from underneath it — only its head, one hoof and
  two enormous round curious eyes visible, ears perked, mouth a tiny surprised circle,
  clearly not supposed to be there. The lifted page corner casts a soft shadow over
  its face.
- A few daisies and two small round bushes at the outer right edge; one or two tiny
  birds high in the upper right.

No text, no letters, no numbers, no writing on the book pages, no logos. No question
marks, no speech bubbles, no thought bubbles. Do NOT draw any user-interface elements,
buttons, pills, panels or rounded rectangles. The background must be ONE continuous
soft gradient — never a rectangular block, window or box of a different colour, and no
straight background edges anywhere. No frames, no borders, no vignette, no rounded
corners.
```

### 4. B안 · 다크 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for a small card in a Korean church
app home screen, DARK MODE. The card background is a WARM CHARCOAL (#201f1f to
#2a2a2a) — a soft near-black brown-grey, NOT navy blue and NOT pure black — and the
artwork must melt into it. Style: cozy-epic children's storybook illustration — soft
flat shapes with subtle grain texture, rounded friendly forms, warm rim lighting. Use
the SAME small chubby sheep character as the attached reference image, but here its
wool reads as soft warm grey, never bright white.

Palette: a warm charcoal evening meadow — #1c1b1b at the top through #26231f into a
faintly mauve-brown #2b2622 near the horizon, over deep warm grey-green grass. NO blue
night sky, NO indigo, NO teal, NO starfield; the reference image's navy must be
re-translated into warm brown-grey. The ONLY bright thing is the soft AMBER glow
(#e0a458) rising from the blank pages of the open book, lighting the sheep from below.
Keep everything else muted and low-contrast — light grey text is drawn over the left
side.

Composition is critical:
- Everything interesting lives in the RIGHT THIRD of the frame (x 65-100%).
- The LEFT 40% must be nearly EMPTY — a smooth dark warm-grey gradient, no stars, no
  detail; it gets cropped and text is drawn over it.
- The middle band (x 40-65%) holds only faint hazy hills kept extremely close in value
  to the sky, with no hard edge and no vertical boundary.
- Reserve a CALM FLAT PATCH from x 72% to 98% and y 66% to 92%: plain smooth dark
  grass, no objects, no highlights, no light spill — a solid bright blue button sits
  exactly there.
- Keep the TOP 6% and BOTTOM 6% as calm expendable margin; the very bottom right
  corner stays flat and featureless.

Scene (right third) — the joke is the eavesdropper under the page:
- ONE enormous open book lies flat on the grass like a picnic blanket, pages
  completely BLANK and glowing warm amber, drawn in gentle perspective — it is the
  only light source in the picture. TWO small chubby sheep lie on their tummies ON the
  open pages, chins propped on their front hooves, hind hooves kicked up behind them,
  faces warmly lit from below, reading with contented smiles.
- At the far right edge of the book, a THIRD sheep has lifted one corner of the page
  with a tiny hoof and is peeking out from underneath — only its head, one hoof and
  two enormous round curious eyes visible, catching a thin seam of amber light, ears
  perked, mouth a tiny surprised circle, clearly not supposed to be there.
- Two small round bushes at the outer right edge as soft dark shapes.

No text, no letters, no numbers, no writing on the book pages, no logos. No question
marks, no speech bubbles, no thought bubbles. Do NOT draw any user-interface elements,
buttons, pills, panels or rounded rectangles. The background must be ONE continuous
soft gradient — never a rectangular block, window or box of a different colour, and no
straight background edges anywhere. No frames, no borders, no vignette, no rounded
corners.
```

---

## 5. C안 · 저강도 안전판 (라이트 기준 + 다크 치환)

A·B 가 계속 왼쪽까지 그림을 채우거나, 좁은 카드(336px)에서 글자를 잡아먹을 때 쓰는 **보험**이다.
등장 인물을 **양 두 마리로 줄이고** 훨씬 작게, 더 오른쪽 구석으로 몬다.

```
A very wide 3:1 panoramic background illustration for a small card in a Korean church
app home screen, LIGHT MODE, extremely minimal. The card is only about 400x146 pixels
and is nearly WHITE (#ffffff to #f3f1f7), so this must read as an almost-white,
high-key pastel scene that is mostly empty. Style: cozy children's storybook
illustration — soft flat shapes with subtle grain texture, no outlines on the large
forms, gentle airy daylight.

Subject: a quiet pale meadow at the far right of the frame. ONE small chubby white
sheep sits on the grass with a large open book on its lap, pages completely BLANK and
glowing softly white, reading with a peaceful smile. A SECOND sheep stands a little
further away on a low hillock behind it, noticeably smaller and paler with distance
haze, up on its hoof-tips with its neck stretched forward and ears perked, curious.
Both are small — together they occupy no more than the right quarter of the picture.
Both faces are in a gentle three-quarter-FRONT angle so both eyes are visible.

Palette: an almost-white sky, warm cream (#fffaf2) near the horizon lifting into pale
sky blue (#eef4fd) at the top, over a soft pale sage-green meadow. Everything HIGH-KEY,
pastel and low-contrast; the deepest tone anywhere is a soft blue-grey used only for
the furthest hill. No dark masses, no saturated colours, no strong blue.

Composition is critical:
- The LEFT 65% of the frame is EMPTY — nothing but the smooth sky-to-meadow gradient
  and one faint pale hill dissolving into haze. Text is drawn over it.
- Reserve a CALM FLAT PATCH from x 72% to 98% and y 66% to 92%: plain smooth grass
  with no objects and no highlights at all.
- Keep the TOP 6% and BOTTOM 6% as calm expendable margin; the bottom right corner
  stays completely flat and featureless.
- No hard vertical boundary anywhere — the scene fades into the empty left side.

No text, no letters, no numbers, no writing on the book pages, no logos. No question
marks, no speech bubbles. Do NOT draw any user-interface elements, buttons, pills,
panels or rounded rectangles. The background must be ONE continuous soft gradient, and
no straight background edges anywhere. No frames, no borders, no vignette, no rounded
corners.
```

**다크로 바꿀 때는 위 프롬프트에서 팔레트 문단만 갈아 끼운다** (구도 문단은 그대로 둔다):

```
DARK MODE instead. The card background is a WARM CHARCOAL (#201f1f to #2a2a2a) — a
soft near-black brown-grey, NOT navy blue and NOT pure black — and the artwork must
melt into it. Palette: #1c1b1b at the top through #26231f into a faintly mauve-brown
#2b2622 near the horizon, over deep warm grey-green grass. NO blue night sky, NO
indigo, NO teal, NO starfield. The ONLY bright thing is the soft AMBER glow (#e0a458)
from the blank pages of the open book, lighting the reading sheep's face from below;
the curious sheep behind stays a soft dark shape with only its eyes and one cheek
catching that glow. The hills read as slightly darker warm grey masses kept very close
in value to the sky, so nothing looks like a hard silhouette.
```

---

## 부분 수정용 (번외)

잘 나온 장면을 통째로 다시 뽑으면 구도가 바뀐다. Gemini에 **그 이미지를 첨부**하고 한 군데만 고치게 한다.

**왼쪽까지 그림이 꽉 찼을 때** (제일 자주 터진다)

```
Keep this image exactly as it is — same characters, same style, same palette, same
lighting. Change ONE thing only:

Empty out the LEFT 40% of the frame completely. Remove every hill, tree, bush, cloud
and object from the left side and replace it with nothing but the smooth sky-to-meadow
gradient, and make whatever remains between 40% and 65% of the width fade gradually
into soft haze so there is no hard vertical edge anywhere. Everything to the right of
65% must stay pixel-identical.
```

**궁금해하는 양이 안 보이거나 무리에 붙어 있을 때**

```
Keep this image exactly as it is — same style, same palette, same lighting, same
reading sheep and same open book. Change ONE thing only:

Move the curious sheep further BACK and slightly UP, onto its own small separate
hillock clearly behind the reading group, and make it noticeably smaller and paler
with distance haze. Exaggerate its pose: up on the very tips of its hooves, neck
stretched comically long, leaning forward at a precarious angle, ears straight up,
eyes wide and round. Do not add a question mark or a speech bubble. Do not move
anything else.
```

**우하단(버튼 자리)에 디테일이 들어갔을 때**

```
Keep this image exactly as it is — same characters, same style, same palette, same
lighting. Change ONE thing only:

Clear the lower-right area of the picture, from 72% to 98% of the width and from 66%
to 92% of the height, so it contains nothing but plain smooth grass — no flowers, no
bushes, no rocks, no highlights, no light spill, no texture detail. Everything outside
that rectangle must stay pixel-identical.
```

**다크가 파랗게(남색으로) 나왔을 때**

```
Keep this image exactly as it is — same composition, same characters, same lighting
directions, same shapes. Change ONE thing only:

Shift the entire colour palette from a blue/navy night to a WARM CHARCOAL evening. The
sky must become a soft near-black brown-grey (#1c1b1b to #2b2622), with no blue, no
indigo and no teal anywhere. Keep the amber glow from the open book exactly as it is.
The wool stays soft warm grey. Do not move or redraw anything.
```

**책 페이지에 글자가 나왔을 때**

```
Keep this image exactly as it is. Change ONE thing only: erase every mark from the
pages of the open book so they are completely blank, smooth and softly glowing, with
no writing, no lines, no letters and no symbols of any kind.
```

---

## 적용 상태 (2026-09-10) — 아직 미적용, 프롬프트만 준비

이미지를 받아서 붙일 때 손봐야 하는 것들:

- **책 엠블럼(`.live-card__emblem`)은 빼는 쪽이 맞다.** 삽화가 "펼친 책"을 이미 그리고 있어서
  우측 44×44 브랜드 tint 사각형이 그림 위에 겹치면 두 번 말하는 꼴이고, 주인공이 설 자리
  (삽화 x 83~96%)를 정확히 가로챈다. 삽화를 깔 때만 `display: none` 으로 접는다.
- **CSS 는 두 겹으로 깐다** — 이어 읽기 카드(`.dash-card--resume`)와 같은 방식:
  `linear-gradient(90deg, 카드색 0%, 카드색 40%, transparent 78%)` + `url(...) right center / cover`.
  좌측 페이드가 없으면 글자 뒤에 풀밭이 비쳐 본문(13.5px `--text-body`)이 읽히지 않는다.
  `.live-card` 는 이미 `position: relative; overflow: hidden` 이라 `::before` 한 겹이면 된다.
  테마 분기는 프로젝트 관례대로 `html.dark` 가 아니라 `.dark .live-card::before`.
- **실시간 모드(`.live-card--live`)의 우상단 빛무리와 겹친다.**
  `radial-gradient(120px 90px at 100% 0%, var(--brand-soft-strong), …)` 가 삽화 위에 얹히므로,
  삽화를 깔 때는 그 레이어를 지우거나 투명도를 절반으로 줄인다.
- **선요청(prefetch)은 홈 첫 화면이라 필요 없다.** 카드 자체가 조건부 렌더(SSE 데이터가 와야 뜬다)라
  그림도 그때 같이 받으면 된다. 다만 도착 전 깜빡임을 막으려면 `.live-card.is-art-ready` 패턴
  (`VerseAlarm/heroPrefetch.ts` 와 같은 모양)으로 320ms 페이드인을 걸어 준다.
- **워터마크 ✦ 제거**: `verse-alarm-hero-process.py` 의 라플라스 채우기 방식을 그대로 쓰되
  중심 좌표만 실측해서 고친다. TELEA 인페인트는 금지(양 발굽을 빨아들인다).
  이 그림은 우하단이 평평한 풀밭이라 채우기가 잘 먹을 자리다.
- **모바일에도 그대로 깐다.** 이 카드는 PC 사이드바(336)보다 모바일(358~416)에서 더 넓게 나오므로,
  좁은 폭에서 잘리는 문제는 오히려 PC 쪽이다. 336px 에서 네 번째 양이 살아 있는지 꼭 확인할 것.
