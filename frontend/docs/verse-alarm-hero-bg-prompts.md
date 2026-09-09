# 구절 알람 히어로(다이얼) 배경 이미지 프롬프트 (Gemini용)

`/bible/alarm` 상단 **다음 알람 다이얼 카드**(`pages/Bible/VerseAlarm/VerseAlarmPage.tsx`,
`.va-hero` > `.va-dial-wrap` — 60개 눈금 링 + `다음 알람` / `17시간 46분 후` / `오전 7:29 · 아침`)
뒤에 깔 배경. 라이트/다크 각 1장.

컨셉은 칭호·타임캡슐·플랜·소식 히어로와 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**.
장면은 **"알람이 울리기 직전의 새벽 언덕"**, 그리고 **다이얼 원 자체를 해(달)로 읽게 만드는 것**이
이 화면만의 규칙이다. 눈금 링이 곧 떠오르는 해의 테두리가 되도록 좌우로만 그린다.

유머는 **깨우러 온 쪽이 더 졸리다**에서 나온다. 알람을 다섯 개까지 걸어 두고도
(앱 제약이 실제로 `5/5`다) 아무도 못 일어나는 그림이다.

> **참조 이미지는 `public/images/title-bg/dawn_riser.webp` 가 정답이다.**
> 이미 "양 + 알람시계 + 새벽 능선"으로 그려진 형제 그림이라, 캐릭터·소품 문법이 그대로 이어진다.
> 다만 **저건 밤하늘(남색)이고 이 카드는 아니다.** 아래 팔레트 표를 반드시 지킬 것.

## 사용법

1. Gemini에 `public/images/title-bg/dawn_riser.webp` 를 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로, 같은 화풍으로" 라고 덧붙인 뒤 프롬프트를 통째로 붙여넣는다.
   **한 세션에서 라이트 → 다크 순으로 이어서 뽑아야 톤이 맞는다.**
2. 저장 위치 (파일명 고정):
   - 라이트: `frontend/public/images/verse-alarm/hero-light.webp`
   - 다크:   `frontend/public/images/verse-alarm/hero-dark.webp`
3. 규격: 원본 **16:9** 그대로 쓴다(받아 보니 1376×768). 후처리는
   `python docs/verse-alarm-hero-process.py` — 워터마크 제거 + webp 저장까지 한 번에 한다.
   결과는 한 장 **30KB 이하**(실측 26.5 / 21.0KB)라 굳이 줄이지 않았다.
   알파는 쓰지 않는다 — 카드 전체를 덮는 배경이라 투명 구간이 없다.

---

## 레이아웃 제약 (프롬프트의 핵심)

### 카드 실측

`.va-hero` 는 **PC(≥1024px)에서만 카드**다. 모바일은 카드 없이 다이얼만 페이지 배경 위에 뜬다.

★ **카드가 생각보다 좁다.** `.va-shell`(max 1240) 안에서 성경 레일 176 과
우 컬럼 `clamp(288px, 26vw, 344px)` 를 떼고 나면 본문 칼럼에 남는 폭은 이렇다:

| 뷰포트 | 좌측 전역 레일 | 카드 | 비율 |
|---|---|---|---|
| 1024 | 76 | **400**×373 | ≈1.07 : 1 |
| 1280 | 248 | **439**×392 | ≈1.12 : 1 |
| 1440 | 248 | **588**×392 | ≈1.5 : 1 |
| 1536 이상 (shell 1240 상한) | 248 | **676**×392 | ≈1.72 : 1 |
| 모바일 | — | 카드 없음 (`min(70vw, 260px)` 다이얼) | — |

- 카드 높이는 **다이얼 320 + 상하 패딩 `clamp(20,2.6vw,36)`** 이라 **392px 로 사실상 고정**,
  **가로만 400~676 사이에서 변한다.**
- 다이얼은 `min(100%, 320px)` 이라 **카드가 넓어져도 원은 커지지 않는다.**
  → 카드가 넓어질수록 **좌우 여백만 40px → 178px 로 벌어진다.** 그림이 살 자리가 바로 여기다.
- `cover` 배율은 카드 높이(392)로 정해지므로 삽화는 항상 **폭 702px** 로 그려진다.
  → 카드가 그보다 좁은 만큼 좌우가 잘린다: 588 이면 57px 씩(이불 가장자리만 물린다),
  439 면 **131px 씩 — 새끼양이 반토막 난다.** 그래서 삽화는 **≥1440px 에서만** 깔았다.

### 화면에서 그림이 차지하는 크기

`background-size: cover; background-position: center` 로 얹는다.
배율은 항상 카드 높이(392)가 정하므로 삽화는 **702×392 로 그려지고, 남는 건 좌우가 잘리는 것뿐**이다.

→ **위 12% · 아래 12% 는 잘려도 되는 여백으로 그린다.** 주인공을 여기 두면 목이 날아간다.
좌우는 카드 폭에 따라 8~20% 까지 잘리므로, 좌·우 날개는 **가장자리에서 4% 정도 띄워** 그린다.

### 글자·눈금이 지나가는 자리 — ★ 가운데 원은 성역이다

다이얼 안에는 눈금 60개(`--text-muted` 28%/52% — **아주 흐린 회색**), 브랜드색 아크·점,
그리고 3줄 텍스트(`다음 알람` 12px / `17시간 46분 후` **26px/800** / `오전 7:29 · 아침` 13.6px 브랜드색)가 들어간다.
**눈금이 워낙 옅어서 뒤에 뭐라도 있으면 그대로 지워진다.**

| 영역 | 원본 기준 | 규칙 |
|---|---|---|
| 중앙 원 | 폭 **46%** × 높이 **82%**, 정중앙 | **완전히 비운다.** 매끈한 단색 하늘만. |
| 원 바깥 링 여유 | 중앙 원 + 사방 4% | 디테일·하이라이트 금지(눈금 밖 5px 이내) |
| 좌측 날개 | x 0~26% | 주인공 A |
| 우측 날개 | x 74~100% | 주인공 B |
| 우하단 모서리 | 폭 12% × 높이 20% | Gemini 워터마크 ✦ 자리. 평평하게 비운다 |

- **능선(지평선)을 화면 가로로 관통시키면 안 된다.** 원의 아래 끝이 높이 91% 까지 내려오기 때문에
  가로줄은 무조건 원을 가로지른다. → **언덕은 좌·우 날개에만 두고, 가운데 1/3 에서는 완전히 사라지게** 한다.
- 브랜드색(파랑) 덩어리를 원 근처에 두지 말 것. 아크·현재 점이 브랜드색이라 **파랑끼리 먹힌다.**
  파랑은 배경 하늘의 옅은 톤으로만 쓴다.

### ★ 라이트와 다크의 차이는 "카드색"이다 (여기서 제일 많이 틀린다)

| | 카드 바탕 | 글씨 | 눈금 | 그림 톤 | 유일한 광원 |
|---|---|---|---|---|---|
| 라이트 | **순백 `#ffffff`** | `#191722` | `#7d7887` 28% | **하이키 파스텔**(거의 흰 하늘) | 우측 크림-골드 여명 |
| 다크 | **따뜻한 차콜 `#201f1f`** | `#e5e2e1` | `#938f9a` 28% | **저채도 웜 차콜·모브브라운** | 앰버 등불빛 |

★ **다크 카드는 남색이 아니다.** `dawn_riser.webp` 의 남색 밤하늘(`#1b2440` 계열)을 그대로 가져오면
`#201f1f` 카드 위에서 **파란 직사각형**으로 뜬다. 다크는 **따뜻한 회갈색 밤**으로 번역해서 그려야 한다.
라이트도 마찬가지로 **흰 카드보다 어두워지면 회색 판떼기**로 보인다 — 거의 흰색에서 시작한다.

---

## A안 · 「깨우러 온 양이 더 졸리다」 (메인)

다이얼 원 = 막 떠오르는 해(라이트) / 낮게 걸린 달(다크).
왼쪽엔 이불을 뒤집어쓴 새끼양(발굽만 삐죽), 오른쪽엔 손종을 번쩍 든 큰 양 — 그런데 **본인이 하품 중**이다.

### 1. A안 · 라이트 테마 프롬프트

```
A wide 16:9 background illustration that will sit BEHIND a circular clock dial in a
mobile/desktop church app card, LIGHT MODE. The card is about 720x392 pixels and is
pure WHITE (#ffffff), so this artwork must read as an almost-white, high-key pastel
scene. Style: cozy-epic children's storybook illustration — soft flat shapes with
subtle grain texture, rounded friendly forms, gentle airy dawn light. Use the SAME
chubby white sheep character as the attached reference image: cream-white wool, tiny
round hooves, a small closed serene smile, soft navy-grey line work.

Palette: pale dawn. The sky is an almost-white wash — very light warm cream (#fffaf2)
at the centre lifting into pale sky blue (#eef4fd) at the upper corners, with ONE
gentle cream-gold dawn glow low on the RIGHT side. Keep everything HIGH-KEY and
low-contrast — pastel, airy, almost washed out — because dark charcoal text and very
faint grey tick marks are drawn on top. The deepest tone anywhere is a soft blue-grey
used only for thin outlines and long soft shadows. No dark masses, no saturated
colours, no black outlines, no strong blue — a bright blue arc is drawn on top by the
app and must not compete with the picture.

Composition is critical:
- A large CIRCLE in the exact CENTRE of the frame — about 46% of the image width and
  82% of the image height — must be COMPLETELY EMPTY: nothing but the smooth, even
  sky gradient. No clouds, no birds, no rays crossing it, no texture, no detail at all.
  Treat that circle as the rising sun itself: the app draws a ring of tick marks
  exactly there.
- All the artwork lives in the LEFT quarter (x 0-26%) and the RIGHT quarter (x 74-100%)
  as two small separate clusters, mirroring each other in weight.
- Do NOT draw a horizon line that runs across the whole picture. The little grassy
  hillocks exist only under the left and right clusters and must fade away completely
  before they reach the central circle — the middle third of the image has no ground
  at all, only empty sky.
- Keep the TOP 12% and the BOTTOM 12% as calm, expendable margin, and the LEFT 8% and
  RIGHT 8% as well — the card crops them at different widths.
- Leave the BOTTOM-RIGHT CORNER (about 12% of the width and 20% of the height) as
  plain flat empty ground with no detail at all.

Scene — the joke is that the sheep sent to wake everyone up is the sleepiest one:
- LEFT cluster: a tiny lamb fast asleep, completely buried under a soft quilted
  blanket so that only two little hooves and one ear stick out at the edge, with three
  small floating sleep bubbles drifting up and fading out well before the centre. Beside
  the blanket sit TWO small round twin-bell alarm clocks, tilted over and clearly being
  ignored.
- RIGHT cluster: the chubby white sheep stands on a low hillock holding a small brass
  handbell raised high in one hoof, ready to ring it — but its own head is thrown back
  in an enormous YAWN, eyes squeezed shut into two matching curved lines, one hoof
  rubbing an eye. Two thin curved sound ripples come off the bell toward the right edge.
  A tiny woolly nightcap is pushed back high on its head so it does NOT cover the face.
- Both faces are turned toward the viewer in a gentle three-quarter-FRONT angle — never
  a flat side profile — so BOTH eyes are visible on each character, the same size and
  evenly spaced.

Small props are allowed only in the outer quarters: the twin-bell alarm clocks must
have COMPLETELY BLANK faces — no numerals, no digits, no markings of any kind, at most
two simple hands. A few tiny star sparkles may hover over the sleeping lamb.

Do NOT draw a large clock face, a clock dial, a ring of tick marks, a circular frame,
a wreath or any circular object in the middle — that entire area is reserved. Do NOT
draw a rooster. Do NOT draw a speech bubble. Do NOT draw any user-interface elements,
buttons, pills, panels or rounded rectangles. The background must be ONE continuous
soft gradient — never a rectangular block, window or box of a different colour, and no
straight background edges anywhere. No text, no letters, no numbers, no logos. No
frames, no borders, no vignette, no rounded corners.
```

### 2. A안 · 다크 테마 프롬프트

```
A wide 16:9 background illustration that will sit BEHIND a circular clock dial in a
mobile/desktop church app card, DARK MODE. The card is about 720x392 pixels and its
background is a WARM CHARCOAL (#201f1f) — a soft near-black brown-grey, NOT navy blue
and NOT pure black. The artwork must melt into that warm charcoal. Style: cozy-epic
children's storybook illustration — soft flat shapes with subtle grain texture, rounded
friendly forms, warm rim lighting. Use the SAME chubby white sheep character as the
attached reference image: tiny round hooves, a small closed serene smile — but here its
wool reads as soft warm grey, never bright white.

Palette: warm charcoal night, the hour before sunrise. The sky goes from #1c1b1b at
the corners through #26231f into a faintly mauve-brown #2b2622 low on the right. NO
blue night sky, NO indigo, NO teal — the reference image's navy sky must be
re-translated into this warm brown-grey. The ONLY bright accent is a low AMBER glow
(#e0a458) hugging the RIGHT edge like the first hint of dawn, plus a thin warm rim
light along the top of the sheep. Keep everything muted and low-contrast, because light
grey text and very faint grey tick marks are drawn on top.

Composition is critical:
- A large CIRCLE in the exact CENTRE of the frame — about 46% of the image width and
  82% of the image height — must be COMPLETELY EMPTY: nothing but the smooth, even
  dark gradient. No stars, no clouds, no rays crossing it, no texture, no detail at
  all. Treat that circle as a low-hanging moon: the app draws a ring of tick marks
  exactly there.
- All the artwork lives in the LEFT quarter (x 0-26%) and the RIGHT quarter (x 74-100%)
  as two small separate clusters, mirroring each other in weight.
- Do NOT draw a horizon line that runs across the whole picture. The little hillocks
  exist only under the left and right clusters and must fade away completely before
  they reach the central circle — the middle third of the image has no ground at all,
  only empty sky.
- Keep the TOP 12% and the BOTTOM 12% as calm, expendable margin, and the LEFT 8% and
  RIGHT 8% as well.
- Leave the BOTTOM-RIGHT CORNER (about 12% of the width and 20% of the height) as
  plain flat empty ground with no detail at all.

Scene — the joke is that the sheep sent to wake everyone up is the sleepiest one:
- LEFT cluster: a tiny lamb fast asleep, completely buried under a soft quilted
  blanket so that only two little hooves and one ear stick out at the edge, with three
  small floating sleep bubbles drifting up and fading out well before the centre.
  Beside the blanket sit TWO small round twin-bell alarm clocks, tilted over and
  clearly being ignored, catching one weak amber highlight each.
- RIGHT cluster: the chubby sheep stands on a low hillock holding a small brass
  handbell raised high in one hoof, ready to ring it — but its own head is thrown back
  in an enormous YAWN, eyes squeezed shut into two matching curved lines, one hoof
  rubbing an eye. Two thin curved sound ripples come off the bell toward the right
  edge. A tiny woolly nightcap is pushed back high on its head so it does NOT cover the
  face. The amber dawn glow silhouettes it warmly from behind.
- Both faces are turned toward the viewer in a gentle three-quarter-FRONT angle — never
  a flat side profile — so BOTH eyes are visible on each character, the same size and
  evenly spaced.

Small props are allowed only in the outer quarters: the twin-bell alarm clocks must
have COMPLETELY BLANK faces — no numerals, no digits, no markings of any kind, at most
two simple hands. Two or three tiny warm sparkles may hover over the sleeping lamb —
but do NOT scatter a starfield across the sky.

Do NOT draw a large clock face, a clock dial, a ring of tick marks, a circular frame,
a moon disc or any circular object in the middle — that entire area is reserved. Do NOT
draw a rooster. Do NOT draw a speech bubble. Do NOT draw any user-interface elements,
buttons, pills, panels or rounded rectangles. The background must be ONE continuous
soft gradient — never a rectangular block, window or box of a different colour, and no
straight background edges anywhere. No text, no letters, no numbers, no logos. No
frames, no borders, no vignette, no rounded corners.
```

---

## B안 · 「알람 다섯 개를 이불로 덮어버린 양」

앱 제약이 그대로 개그가 된다 — **알람은 최대 5개**(`내 알람 5/5`).
다섯 개를 다 걸어 놓고 **이불 한 장으로 전부 덮어 눌러 놓은** 그림이다.
큰 양이 이불 귀퉁이를 들춰보며 정색하고, 새끼양은 들킨 얼굴로 딴청을 피운다.

### 3. B안 · 라이트 테마 프롬프트

```
A wide 16:9 background illustration that will sit BEHIND a circular clock dial in a
church app card, LIGHT MODE. The card is about 720x392 pixels and is pure WHITE
(#ffffff), so this artwork must read as an almost-white, high-key pastel scene. Style:
cozy-epic children's storybook illustration — soft flat shapes with subtle grain
texture, rounded friendly forms, gentle airy dawn light. Use the SAME chubby white
sheep character as the attached reference image: cream-white wool, tiny round hooves, a
small closed serene smile, soft navy-grey line work.

Palette: pale dawn. An almost-white sky — very light warm cream (#fffaf2) at the centre
lifting into pale sky blue (#eef4fd) at the upper corners, with ONE gentle cream-gold
glow low on the right. Keep everything HIGH-KEY and low-contrast; the deepest tone is a
soft blue-grey used only for thin outlines and long soft shadows. No dark masses, no
saturated colours, no black outlines, no strong blue.

Composition is critical:
- A large CIRCLE in the exact CENTRE of the frame — about 46% of the image width and
  82% of the image height — must be COMPLETELY EMPTY: nothing but the smooth, even sky
  gradient, no detail whatsoever. The app draws a ring of tick marks and text exactly
  there.
- All the artwork lives in the LEFT quarter (x 0-26%) and the RIGHT quarter (x 74-100%)
  as two small separate clusters of similar visual weight.
- No continuous horizon line: the small grassy hillocks exist only under the left and
  right clusters and fade away completely before reaching the central circle.
- Keep the TOP 12%, BOTTOM 12%, LEFT 8% and RIGHT 8% as calm expendable margin.
- Leave the BOTTOM-RIGHT CORNER (about 12% wide and 20% tall) as plain flat empty
  ground with no detail at all.

Scene — the joke is a cover-up in progress:
- LEFT cluster: FIVE small round twin-bell alarm clocks crowded together on a low
  hillock, and a tiny lamb is frantically pulling a soft quilted blanket over ALL of
  them at once. Two clocks are already buried under the blanket as soft lumps; one bell
  and one pair of little clock legs still poke out at the edge; tiny vibration lines and
  two star sparkles escape from under the fabric. The lamb looks straight at the viewer
  with a wide innocent smile and cheeks puffed, utterly unconvincing.
- RIGHT cluster: the chubby white sheep stands calmly on its own hillock, lifting one
  corner of the blanket with a single hoof and peering underneath with a flat,
  unimpressed expression, one eyebrow line raised. A small brass handbell hangs unused
  from its other hoof.
- Both faces are turned toward the viewer in a gentle three-quarter-FRONT angle — never
  a flat side profile — so BOTH eyes are visible on each character, the same size and
  evenly spaced.

The alarm clocks must have COMPLETELY BLANK faces — no numerals, no digits, no
markings of any kind, at most two simple hands.

Do NOT draw a large clock face, a clock dial, a ring of tick marks, a circular frame or
any circular object in the middle — that entire area is reserved. Do NOT draw a speech
bubble. Do NOT draw any user-interface elements, buttons, pills, panels or rounded
rectangles. The background must be ONE continuous soft gradient — never a rectangular
block, window or box of a different colour, and no straight background edges anywhere.
No text, no letters, no numbers, no logos. No frames, no borders, no vignette, no
rounded corners.
```

### 4. B안 · 다크 테마 프롬프트

```
A wide 16:9 background illustration that will sit BEHIND a circular clock dial in a
church app card, DARK MODE. The card background is a WARM CHARCOAL (#201f1f) — a soft
near-black brown-grey, NOT navy blue and NOT pure black. The artwork must melt into
that warm charcoal. Style: cozy-epic children's storybook illustration — soft flat
shapes with subtle grain texture, rounded friendly forms, warm rim lighting. Use the
SAME chubby white sheep character as the attached reference image, but here its wool
reads as soft warm grey, never bright white.

Palette: warm charcoal night before dawn — #1c1b1b at the corners through #26231f into
a faintly mauve-brown #2b2622 low on the right. NO blue night sky, NO indigo, NO teal;
the reference image's navy must be re-translated into warm brown-grey. The ONLY bright
accent is a low AMBER glow (#e0a458) at the right edge and the faint warm light leaking
out from under the blanket. Keep everything muted and low-contrast — light grey text
and very faint grey tick marks are drawn on top.

Composition is critical:
- A large CIRCLE in the exact CENTRE of the frame — about 46% of the image width and
  82% of the image height — must be COMPLETELY EMPTY: nothing but the smooth, even dark
  gradient, no stars, no detail whatsoever.
- All the artwork lives in the LEFT quarter (x 0-26%) and the RIGHT quarter (x 74-100%)
  as two small separate clusters of similar visual weight.
- No continuous horizon line: the small hillocks exist only under the left and right
  clusters and fade away completely before reaching the central circle.
- Keep the TOP 12%, BOTTOM 12%, LEFT 8% and RIGHT 8% as calm expendable margin.
- Leave the BOTTOM-RIGHT CORNER (about 12% wide and 20% tall) as plain flat empty
  ground with no detail at all.

Scene — the joke is a cover-up in progress:
- LEFT cluster: FIVE small round twin-bell alarm clocks crowded together on a low
  hillock, and a tiny lamb is frantically pulling a soft quilted blanket over ALL of
  them at once. Two clocks are already buried as soft lumps, one bell and one pair of
  little clock legs still poke out, and a thin seam of warm amber light escapes from
  under the fabric along with tiny vibration lines — the brightest thing on the left
  side. The lamb looks straight at the viewer with a wide innocent smile and puffed
  cheeks, utterly unconvincing, wearing a tiny knitted nightcap pushed back high so it
  does NOT cover the face.
- RIGHT cluster: the chubby sheep stands calmly on its own hillock, lifting one corner
  of the blanket with a single hoof and peering underneath with a flat, unimpressed
  expression, one eyebrow line raised, rim-lit from behind by the amber dawn glow. A
  small brass handbell hangs unused from its other hoof.
- Both faces are turned toward the viewer in a gentle three-quarter-FRONT angle — never
  a flat side profile — so BOTH eyes are visible on each character, the same size and
  evenly spaced.

The alarm clocks must have COMPLETELY BLANK faces — no numerals, no digits, no
markings of any kind, at most two simple hands. Do NOT scatter a starfield across the
sky.

Do NOT draw a large clock face, a clock dial, a ring of tick marks, a circular frame, a
moon disc or any circular object in the middle — that entire area is reserved. Do NOT
draw a speech bubble. Do NOT draw any user-interface elements, buttons, pills, panels
or rounded rectangles. The background must be ONE continuous soft gradient — never a
rectangular block, window or box of a different colour, and no straight background
edges anywhere. No text, no letters, no numbers, no logos. No frames, no borders, no
vignette, no rounded corners.
```

---

## 5. C안 · 무캐릭터 안전판 (라이트 기준 + 다크 치환)

A·B 가 계속 가운데를 침범하거나 라이트에서 시커멓게 나올 때 쓰는 **보험**이다.
캐릭터 없이 여명 하늘과 잠든 마을 실루엣만으로 간다 — 눈금 링이 절대 안 죽는다.

```
A wide 16:9 background illustration for a church app card, LIGHT MODE, with NO
characters at all. The card is about 720x392 pixels and is pure WHITE (#ffffff), so
this must read as an almost-white, high-key pastel scene. Style: cozy children's
storybook illustration — soft flat shapes with subtle grain texture, no outlines on the
large forms, gentle airy dawn light.

Subject: the very first light of dawn over a quiet sleeping valley. Two or three layers
of low, soft, rounded hills in barely-there blue-grey, and a handful of tiny simple
house shapes with pitched roofs nestled in the outer left and outer right, so small and
pale they are almost suggestions. A few soft wisps of low mist. Three or four very small
birds rising near the upper right, far from the centre.

Palette: an almost-white sky — warm cream (#fffaf2) at the centre lifting into pale sky
blue (#eef4fd) at the upper corners, with ONE gentle cream-gold glow low on the right.
Everything HIGH-KEY, pastel and low-contrast; the deepest tone anywhere is a soft
blue-grey used only for the furthest hill. No dark masses, no saturated colours, no
strong blue.

Composition is critical:
- A large CIRCLE in the exact CENTRE of the frame — about 46% of the image width and
  82% of the image height — must be COMPLETELY EMPTY: nothing but the smooth, even sky
  gradient. No hills, no mist, no birds, no rays may enter it.
- Everything lives in the LEFT quarter (x 0-26%) and the RIGHT quarter (x 74-100%).
- No continuous horizon line: each hill layer must dip and dissolve away before it
  reaches the central circle, so the middle third of the image is pure empty sky.
- Keep the TOP 12%, BOTTOM 12%, LEFT 8% and RIGHT 8% as calm expendable margin.
- Leave the BOTTOM-RIGHT CORNER (about 12% wide and 20% tall) as plain flat empty area
  with no detail at all.

Do NOT draw a sun disc, a moon, a clock face, a ring of tick marks, a circular frame or
any circular object — the centre is reserved. Do NOT draw people, animals or any
characters. Do NOT draw any user-interface elements, buttons, pills, panels or rounded
rectangles. The background must be ONE continuous soft gradient — never a rectangular
block, window or box of a different colour, and no straight background edges anywhere.
No text, no letters, no numbers, no logos. No frames, no borders, no vignette, no
rounded corners.
```

**다크로 바꿀 때는 위 프롬프트에서 두 문단만 갈아 끼운다** (구도 문단은 그대로 둔다):

```
DARK MODE instead. The card background is a WARM CHARCOAL (#201f1f) — a soft near-black
brown-grey, NOT navy blue and NOT pure black — and the artwork must melt into it.
Palette: #1c1b1b at the corners through #26231f into a faintly mauve-brown #2b2622 low
on the right, with ONE low AMBER glow (#e0a458) hugging the right edge as the first hint
of dawn. NO blue night sky, NO indigo, NO teal, NO starfield. The tiny houses show two
or three pinprick warm amber windows each — the only bright points in the picture — and
the hills read as slightly darker warm grey masses, kept very close in value to the sky
so nothing looks like a hard silhouette against a light grey card.
```

---

## 적용 상태 (2026-09-09) — A안 적용 완료

- **에셋**: `public/images/verse-alarm/hero-{light,dark}.webp` (1376×768, **26.5KB / 21.0KB**).
  제미나이 원본(1376×768, 16:9) → `python docs/verse-alarm-hero-process.py` 한 방이면 끝난다.
  카드가 최대 876×392 라 이 해상도가 그대로 2배수다 — 줄이지 않았다.
- **워터마크 ✦ 제거는 알파 역산이 아니라 라플라스 채우기다.**
  중심 **(1255.5, 647.5)**, 다이아몬드 반폭·반높이 **24×24**(우/하단 모서리에서 각각 120.5px),
  실측 알파 ≈ **0.30**.
  - ★ **여기선 알파 역산(`capsule-banner-process.py` 방식)이 안 통했다.** 별 바로 위에 큰 양의
    그림자 경계가 걸쳐 있어서 배경을 다항식으로 맞추면 별 자리를 1~2 어긋나게 잡고,
    지운 자리에 **별 모양 윤곽이 그대로 남는다**(가장자리 밴드가 둘레보다 8 어두웠다).
    1차 → 2차 확장, 알파 눈금 보정까지 해도 윤곽선이 안 지워졌다.
  - 별이 앉은 자리는 디테일이 전혀 없는 빈 바닥이라, 마스크를 통째로 **이웃값 평균으로 확산**
    (디리클레 경계 라플라스, 900회)시키는 쪽이 훨씬 깨끗하다. 그림자 경계도 좌우 경계값을
    타고 자연스럽게 이어진다. 마스크 위쪽은 **y ≥ 622** 로 자른다 — 그 위가 양의 뒷발굽이다.
  - TELEA 인페인트는 여전히 금지(발굽을 빨아들인다). `scipy` 는 이 환경에 없다 —
    스크립트는 numpy·PIL 만 쓴다.
- **배치**: `cover` + `center`. **중앙 원 마스크는 굽지 않았다.**
  제미나이가 그린 가운데 빈 원(지름 = 폭 **43%** · 높이 **78%**)이 다이얼(44% · 82%)과 거의
  포개져서, 그 원이 그대로 다이얼의 판이 된다. 원 테두리가 부드러운 그라데이션이라
  카드 폭이 516~876 로 변해도 눈금 링과의 어긋남이 눈에 띄지 않는다.
  → **에셋 비율(16:9)이나 `background-position` 을 바꾸면 이 정렬이 깨진다.**

  | | 원 안 | 위에 얹히는 글자 |
  |---|---|---|
  | 라이트 | `rgb(234,235,230)` | `#191722` — 대비 충분 |
  | 다크 | `rgb(36,32,29)` | `#e5e2e1` — 카드(`#201f1f`)와 4 이내라 이음매가 안 보인다 |

- **CSS**: `.va-hero::before` 레이어(`@media (min-width: 1440px)` 안에서만 정의 —
  1024·1280 에선 카드가 400·439px 로 좁아 좌우 131px 씩 잘리고 새끼양이 반토막 난다).
  1024~1439 구간은 삽화 없이 지금까지의 흰/차콜 카드 그대로다.
  `.va-hero` 에 `position: relative` + `overflow: hidden` 을 추가하고,
  `.va-dial-wrap` / `.va-hero-skeleton` 에 `z-index: 1` 을 줘서 다이얼을 삽화 위로 올렸다.
  테마 분기는 `.dark .va-hero::before` — 프로젝트 관례대로 `html.dark` 가 아니라 `.dark` 다.
- **선요청**: `VerseAlarm/heroPrefetch.ts` (Plans/heroPrefetch.ts 와 같은 모양).
  `BibleSideRail` 의 유휴 프리페치에 한 줄 걸어 뒀다. 하단 도크(모바일)에는 넣지 않았고,
  `warmAlarmHero()` 자체가 `matchMedia('(min-width: 1440px)')` 로 걸러내므로
  삽화가 안 깔리는 폭에서는 파일을 받지 않는다.
  도착 전에는 `.va-hero.is-art-ready` 가 없어 삽화가 투명이고, 도착에 맞춰 320ms 페이드인한다.
- **모바일에는 붙이지 않았다.** 거기선 카드 자체가 없고, 카드로 승격해도 다이얼
  (`min(70vw,260px)`)이 꽉 차서 그림이 설 자리가 없다.
  좁은 폭(모바일·1024~1439)에 꼭 넣겠다면 좌우 날개를 버리고 **아래쪽만 얇게 깔리는 별도 크롭**을
  하나 더 만들어야 한다 — 지금 에셋을 그대로 줄여 쓰는 길은 없다.
- **B안·C안은 뽑지 않았다.** 프롬프트만 남겨 둔다.

---

## 부분 수정용 (번외)

잘 나온 장면을 통째로 다시 뽑으면 구도가 바뀐다. Gemini에 **그 이미지를 첨부**하고 한 군데만 고치게 한다.

**가운데에 뭔가 들어갔을 때** (해·달·구름·능선 — 제일 자주 터진다)

```
Keep this image exactly as it is — same characters, same style, same palette, same
lighting, same left and right clusters. Change ONE thing only:

Completely clear the CENTRE of the image. A circular area in the dead centre, about 46%
of the image width and 82% of the image height, must contain nothing but the smooth
empty sky gradient — remove every hill, cloud, ray, sparkle, sun, moon and object that
touches it, and make the hills on the left and right dip down and dissolve away before
they reach it. Everything outside that circle must stay pixel-identical.
```

**다크가 파랗게(남색으로) 나왔을 때**

```
Keep this image exactly as it is — same composition, same characters, same lighting
directions, same shapes. Change ONE thing only:

Shift the entire colour palette from a blue/navy night to a WARM CHARCOAL night. The
sky must become a soft near-black brown-grey (#1c1b1b to #2b2622), with no blue, no
indigo and no teal anywhere. Keep the single amber glow on the right exactly as it is.
The wool stays soft warm grey. Do not move or redraw anything.
```
