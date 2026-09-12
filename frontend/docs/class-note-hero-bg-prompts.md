# 우리반 알림장 히어로 배경 이미지 프롬프트 (Gemini용)

`/classes` 상단 **히어로**(`src/pages/ClassRoom/ClassList.tsx` — `CLASS NOTE` 라벨 +
"참여 중인 반 N곳" / "반에 참여해 보세요" + 안내 한 줄) 뒤에 깔 배경. 라이트/다크 각 1장.

컨셉은 칭호·이어읽기·플랜·공지 배너·교육·묵상방 배경과 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**,
장면은 **"교실 한쪽 알림 게시판 앞에 모인 우리 반"**.
이 화면은 게임 화면이 아니라 **주일학교 알림장**이다 — 톤은 밝고 유쾌해도 좋지만
슬랩스틱·과장된 표정·말풍선은 쓰지 않는다. 장면이 먼저 보이고, 두 번째로 볼 때 웃는 정도.

## 왜 바꾸나 (2026-09-12)

지금 히어로는 `src/assets/hero/class-note.webp` **한 장**을 깔고 그 위에
브랜드 블루 워시(`rgba(20,66,158,.82) → rgba(49,130,246,.16)`) + 하단 스크림 두 겹을 덮는다.
라이트·다크 구분이 없다. 문제는 **수채화 실사풍 그림을 파란 워시로 눌러서** 왼쪽은 파란 덩어리,
오른쪽만 그림이 남는 얼룩이 된다는 것 — 앱 어디에도 없는 문법이고, 그래서 어색하다.

**플랜 히어로 2판(2026-09-05) · 묵상방 히어로와 같은 방식으로 뒤집는다.**

| | 카드 | 잉크 | 삽화 톤 |
|---|---|---|---|
| **라이트** | 밝은 하늘빛 카드(`#f4f9ff → #cfe3ff`) | **남색 글씨** | 맑은 대낮 high-key |
| **다크** | 심야 남색 카드(`#060d1c → #1a2f60`) | 흰 글씨 | 거의 검은 남색 + 교실 등 하나 |

**두 장의 차이는 "시간대"가 아니라 "밝기"다.**

> ⚠️ **이미지 2장과 카드 CSS·잉크는 반드시 같이 바뀐다.** 새 라이트 삽화를 지금 파란 카드에 얹으면
> 밝은 그림 위 흰 글씨가 죽는다. 워시·스크림 두 겹도 같이 지워야 한다.
> 아래 [적용할 코드 변경](#적용할-코드-변경-이미지가-나온-뒤-한-번에) 참고.

> **묵상방 히어로(`docs/rooms-hero-bg-prompts.md`)와 헷갈리지 말 것.**
> 저건 `/rooms` 의 "거대한 펼친 성경 앞에 모인 양들"이다. 여기서 **큰 책·펼친 성경을 그리면
> 두 화면이 같은 그림이 된다.** 이 화면의 소품은 **코르크 알림 게시판 + 쪽지 + 도장**이다.
> 책은 쓰지 않는다.

---

## 사용법

1. Gemini에 **두 장**을 첨부한다.
   - 캐릭터 참조: `public/images/title-bg/` 중 아무 이미지나 → "이 양 캐릭터와 완전히 같은 캐릭터로"
   - **톤 참조**: 라이트는 `public/images/education/hero-light.webp`(주일학교 화면이라 형제 그림이다),
     다크는 `public/images/rooms/hero-dark.webp` 또는 `/images/plans/hero-dark.webp`
     → "이 그림의 밝기를 그대로 맞춰서"
   그 뒤 아래 프롬프트를 통째로 붙여넣는다. **한 세션에서 라이트 → 다크 순으로 이어서 뽑아야 톤이 맞는다.**
2. 출력 비율은 자유롭게 받아도 된다. **2026-09-12 실제로 받은 건 2928×352 (8.3:1) 배너**였고,
   왼쪽 68%가 빈 하늘·오른쪽에 장면이 모인 형태라 그대로 후처리로 넘겼다.
   (3:1 로 받아도 된다 — 어느 쪽이든 아래 후처리가 세로를 늘려 비율을 맞춘다.)
3. `~/Downloads/1.png`(라이트) `2.png`(다크)로 두고

   ```
   python docs/class-hero-process.py
   ```

   가로 계단 정리 → **위로 빈 하늘을 덧대 3.6:1** → 1536 폭 webp 저장 → 카드 위 글자 자리 밝기 실측까지
   한 번에 한다. 결과 파일명은 고정이다:
   - 라이트: `frontend/src/assets/classes/hero-light.webp`
   - 다크:   `frontend/src/assets/classes/hero-dark.webp`

   ★ `public/` 이 아니라 **`src/assets/`** 다. `public/` 은 URL 이 고정이라
   `sw.js` 의 stale-while-revalidate 가 옛 그림을 계속 내주고, 다시 구워 배포해도 화면이 안 바뀐다.
   `src/assets` 는 번들러가 콘텐츠 해시를 붙여 준다(`utils/themeAssets.ts` 주석과 같은 이유).
4. 최종 규격: **1536×426 (3.6:1) WebP**, `quality=82, method=6`.
   실측 **라이트 12.3KB / 다크 11.1KB** — 빈 하늘이 넓어서 아주 가볍다.

---

## 레이아웃 제약 (프롬프트의 핵심)

히어로 실측 (`mx-4` + `px-6 py-7 min-h-[168px]`):

| | 히어로 크기 | 비율 |
|---|---|---|
| 모바일(390px) | 약 358×187 | **≈1.91 : 1** |
| PC(lg, 1240 셸 − 312 레일 − gap) | 약 832×187 | **≈4.45 : 1** |

`background-size: cover; background-position: right bottom` 으로 깐다.
높이는 문구 줄 수에 따라 **168~200** 사이에서 움직인다(위 187은 "최근 소식 · 반이름 · N시간 전" 한 줄 기준).
아래 계산은 전부 187 기준이고, 200까지 가도 어긋나지 않도록 여유를 두고 잡았다.

### 왜 최종 에셋은 3.6:1 인가 (제일 중요한 수치)

**카드가 납작해서, `cover` 의 배율은 모바일에서 오직 에셋의 세로로 정해진다.**
받은 원본은 8.3:1 이라 그대로 깔면 장면이 폭 **380px** 로 확대돼 카드를 통째로 덮는다.
가로 여백을 아무리 늘리거나 왼쪽을 잘라내도 소용없다 — `cover` 는 높이로 맞추므로
**세로를 늘리는 것만이 장면 크기를 정하는 유일한 손잡이**다(`class-hero-process.py` 의 `RATIO`).

후처리가 **위쪽에 빈 하늘을 덧대 3.6:1(2928×352 → 2928×813)** 로 만든다.
장면은 최종 에셋의 **아래 43%** 에만 있고 위 57%는 덧댄 하늘이다.

| | `cover` 기준 | 보이는 영역 | 장면 폭 |
|---|---|---|---|
| 모바일(358×187) | 높이맞춤 | 오른쪽 **53%** (세로는 전부) | **166px** (카드의 46%) |
| PC(832×187) | 폭맞춤 | 가로 전체, **위 19% 잘림** | 205px (카드의 25%) |

→ 장면이 아래 43% 에 있으므로 PC 에서 잘리는 19% 는 전부 덧댄 빈 하늘이다. 온전히 보인다.
**PC 는 폭맞춤이라 RATIO 와 무관하게 장면 폭이 205px 로 같다 — 이 값은 오직 모바일만 움직인다.**

> ★ **2026-09-12 한 번 틀렸다 — 처음엔 2.6:1(장면 120px)로 구웠다가 다시 구웠다.**
> 모바일에서 글씨와 겹치지 않는 것만 보고 잡았더니 "너무 작아 답답하다"는 지적을 받았다.
> 겹침 회피가 목적이 되면 삽화가 구석에 박힌다. 기준값: **2.6=120px / 3.0=138px / 3.6=166px / 3.8=175px.**
> 3.8 은 작은 폰(358)에서 비참여 안내 문단과 확실히 겹친다 — **3.6 이 상한**이다.

### 글자가 지나가는 자리 (제일 중요)

텍스트는 전부 **왼쪽 정렬**, 안내 문구는 `max-w-[14rem]`(224px)로 묶여 있다.
즉 **모바일에서 카드 왼쪽 248px 위로 글씨가 지나간다** — 카드 폭의 **69%**.
최종 에셋(3.6:1) 기준 좌표 환산:

| 에셋 x | 모바일 카드 x | PC 카드 x |
|---|---|---|
| 0.50 (글씨 시작) | 24 | 24 |
| **0.75 (장면 왼쪽 끝)** | **192** | 627 |
| 0.84 (안내 문구 끝) | 248 | 700 |
| 1.00 (오른쪽 끝) | 358 | 832 |

안내 문구는 삽화를 키우면서 `max-w-[17rem]`(272) → **`max-w-[14rem]`(224)** 로 좁혔다.
작은 폰에서 비참여 안내 3줄이 왼쪽 새끼양들 위로 올라타는 것을 막는 값이다.

규칙:

- **주인공은 원본 오른쪽 25%(x 75%~100%) 안에, 한 덩어리로.** 가로로 펴면 모바일에서 글씨에 먹힌다.
  프롬프트에 **"no wider than 25%"** 를 두 번 넣어 뒀다. 세로로 선 게시판 + 그 앞의 양들이라
  이 폭 안에 들어가기 쉬운 구도다 — **게시판을 눕히거나 벽처럼 가로로 늘이지 말 것.**
- **왼쪽 3/4(x 0~75%)은 완전히 빈 하늘 그라데이션.** 잔디·책상·창문·작은 점 금지.
- 원본 x 75~85% 구간은 모바일에서 안내 문구 **끝자락과 겹친다** →
  **라이트**는 이 띠를 **가장 밝은 부분**(하늘·햇살)으로, **다크**는 **가장 어두운 부분**
  (게시판 그림자)으로 채운다. 라이트에서 짙은 나무 프레임이 여기 걸리면 남색 글씨가 죽는다.
- **에셋은 완전 불투명이다 — 왼쪽을 알파로 파지 않는다.** 삽화 자신의 하늘이 곧 카드 바탕이다.
  → 왼쪽 3/4 의 빈 하늘은 **그 자체로 최종 배경**이다. CSS 로 워시를 한 겹 더 까는 방식은 쓰지 말 것
  (지금 어색한 이유가 정확히 그것이다).
- **오른쪽 위 글로우는 그리지 말 것.** 밝은 덩어리가 하나 더 생기면 모바일 안내문과 싸운다.
- **오른쪽 아래 모서리(폭 10% × 높이 18%)는 평평한 빈 바닥.**
  Gemini 워터마크 ✦ 가 떨어지는 자리다. 주인공은 x 74~92% 에 두고 오른쪽 끝에 붙이지 말 것.
- 글자·숫자·로고 금지. **게시판 쪽지·아이 그림에도 글자 금지** — 색 면과 크레용 낙서만.
- 테두리·비네트·모서리 라운드 금지 — 카드 모서리(`rounded-[26px]`)는 CSS가 처리한다.

### 밝기 합격선

라이트는 남색 글씨라 **하한**, 다크는 흰 글씨라 **상한**이다.

| | 합격선 |
|---|---|
| 라이트 | 안내문 사각형 평균 **≥ 205**, 하위5% **≥ 170** |
| 다크 | 안내문 사각형 평균 **≤ 60**, 상위5% **≤ 110** |

⚠️ **에셋의 사각형을 그냥 재면 안 된다.** `cover` 매핑을 흉내 내 **카드 위 글자 사각형**을 재야 실제 값이다.
`docs/class-hero-process.py` 가 구운 직후 이 값을 자동으로 찍어 준다(`sample()`).

2026-09-12 실측(안내문 사각형, 3.6:1 기준):

| | 모바일(358) | PC(832) |
|---|---|---|
| 라이트 | 평균 **225.8** / p5 169.7 | 평균 230.0 / p5 227.7 |
| 다크 | 평균 **33.2** / p95 139.3 | 평균 19.4 / p95 24.7 |

모바일 값이 합격선에 걸치는 건 **비참여 상태(안내 3줄)에서 문단 끝이 왼쪽 새끼양 둘에 닿기 때문**이다.
삽화를 키우기로 한 대가이고(위 ★ 참고), 다크는 `.class-hero-ink` 의 text-shadow 가 흰 글씨를 받쳐 준다.
참여 중 상태("최근 소식 · 반이름 · N시간 전" 한 줄)는 폭이 200px 이하라 장면(192부터)에 거의 닿지 않는다.
더 줄이려면 RATIO 를 3.0 으로 낮춘다 — 장면이 138px 로 작아진다.

### 이 화면만의 금지 목록

- **큰 펼친 책·성경 금지** — `/rooms` 히어로와 같은 그림이 된다. 소품은 게시판·쪽지·도장이다.
- **칠판 가득한 글씨 금지.** 제미나이가 제일 자주 어기는 항목이고, 글자가 들어가면 무조건 다시 뽑아야 한다.
- 사람(어린이·교사) 금지 — 이 앱의 화자는 양이다. 선생님도 **조금 큰 양**으로 그린다.
- 학용품을 늘어놓지 말 것(가방·크레용 상자·주사위…). 덩어리가 가로로 퍼지는 제일 흔한 원인이다.
- 브랜드 파랑(`#3182f6`)을 큰 덩어리로 쓰지 말 것 — 라벨과 카드 링이 브랜드색이라 파랑끼리 먹힌다.

---

## A안 · 「게시판 앞 우리 반」 (메인)

세로로 선 작은 **코르크 알림 게시판**. 선생님 양이 발끝을 세워 쪽지 한 장을 더 붙이고 있고,
새끼양들이 그 앞에 앉아 올려다본다.
유머는 **도장**에서 나온다 — 새끼양 하나가 커다란 빨간 도장을 두 앞발로 들고
**제 이마에 꾹 찍어** 놓았다. 이마에 빨간 동그라미가 선명한데, 표정은 더없이 진지하고 뿌듯하다.
(앱의 '확인 도장 · 출석 도장' 문법이 그대로 그림이 된다.)

### 라이트 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for the header banner of a
"class notice board" page in a mobile church app, LIGHT MODE. IMPORTANT: this banner
is a PALE SKY-BLUE card and DARK NAVY text is laid on top of it, so the whole image
must be bright, airy and HIGH-KEY. There must be no dark navy area, no deep blue
block and no heavy shadow anywhere in the picture. Match the brightness and the
sky colour of the attached daylight reference image exactly.

Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, gentle airy morning light, no black outlines.
Use the SAME small chubby white sheep character as the attached character reference:
stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: pale high-key sky. Soft white and very light sky blue (#f4f9ff through
#dbeafe to #cfe3ff), the deepest tone anywhere is a gentle #93bdf5 used only for
soft shadows. Warm cream sunlight coming from the upper right, a couple of small
fluffy white clouds, light morning haze at the bottom. The only saturated accents in
the whole image are the one small red rubber stamp and a few pastel paper notes —
and even those stay light and sun-washed. Every shadow is a soft blue-grey, never
brown, never black.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight UPRIGHT cluster no wider than 25% of the width — taller than it
is wide, never spread out sideways. The LEFT THREE QUARTERS must be completely
empty: just the smooth pale sky gradient with maybe one faint distant cloud, no
detail at all, because a title and a line of dark text will be overlaid across it.
Keep the TOP 8% and the BOTTOM 8% as calm empty margin. Leave the BOTTOM-RIGHT
CORNER (about 10% of the width and 18% of the height) as plain flat empty ground
with no detail at all, and do not push the cluster against the right edge.

Scene (right quarter): ONE small upright CORK NOTICE BOARD standing on two slim
wooden legs, like a little easel, tilted very slightly toward the viewer — about
twice as tall as the sheep, never wider than it is tall. Its frame is pale warm
wood, its surface is soft light cork. Pinned to it with round coloured pins are five
or six small paper notes and children's crayon drawings — a yellow sun, a red
flower, a tiny house, a wobbly rainbow — drawn as simple childlike shapes. The
papers must be completely blank of writing: no letters, no words, no numbers, no
symbols of any kind, only colour shapes and soft wobbly crayon lines.

In front of the board, a slightly LARGER sheep — the teacher — stands up on tiptoe
with one front hoof raised, pressing one more little note onto the cork. Two small
lambs sit on the ground below, shoulder to shoulder, looking up at the board with
calm, serene, very slightly smug eyes.

The joke is the third lamb: it holds a big round RED RUBBER STAMP with both front
hooves and has just pressed it onto its OWN FOREHEAD — a crisp red circle sits on
its forehead, and it looks utterly solemn and quietly proud of itself, as if this
is exactly how attendance is meant to work. The red circle must be a plain empty
ring with nothing written inside. Nothing in its mouth, no tongue, no object
touching its face.

Keep the characters SMALL — every sheep's head and the top of the notice board must
stay below 62% up from the bottom edge. Keep the entire cluster, board included,
inside the right quarter of the frame.

Do NOT draw any user-interface elements, buttons, pills, panels or rounded
rectangles anywhere. Do not draw a blackboard, a classroom wall, a window or a
floor — the board stands in the open air. The background must be ONE continuous soft
gradient — never a rectangular block, window or box of a different colour, and no
straight background edges anywhere. No text, no letters, no numbers, no logos. No
frames, no borders, no vignette, no rounded corners. The left three quarters must
dissolve into a plain pale sky-blue gradient, and nothing in the picture may be
darker than a soft mid-blue.
```

### 다크 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for the header banner of a
"class notice board" page in a mobile church app, DARK MODE. IMPORTANT: this banner
sits on a VERY DEEP MIDNIGHT-NAVY card with white text laid on top, and the picture
must be just as dark as the attached night reference image — an almost-black navy
night where only a few tiny stars and one small warm lamp are bright. Do not lighten
the sky. Do not add a blue glow.

Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, warm rim lighting only where the lamp
reaches. Use the SAME small chubby white sheep character as the attached character
reference: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep midnight navy. #0A1428 in the upper left, lifting only very slightly
to about #16224a toward the lower right — the sky must stay inside that narrow dark
band across the ENTIRE frame, with a scatter of tiny blue-white stars. The mood is
"it is very late, but the notes for tomorrow are going up anyway". The ONLY bright
thing is one small AMBER clip-on lamp at the top of the notice board and the small
pool of warm light it drops on the cork; that pool must stay compact and must not
spread wider than a fifth of the frame. Everything outside it falls back into
near-black navy within a short distance.

The sheep's wool must read as DIM WARM GREY (around #b3bdd2), clearly darker than
white — it must never glow or read as a bright white blob. The cork board is a muted
dim tan only where the lamp touches it, dark navy everywhere else. The ground is a
near-black navy silhouette.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight UPRIGHT cluster no wider than 25% of the width — taller than it
is wide, never spread out sideways. The LEFT THREE QUARTERS must be completely
empty: a smooth near-black navy gradient with a few faint stars and nothing else,
because a title and a line of white text will be overlaid across it. Keep the TOP 8%
and the BOTTOM 8% as calm empty margin. Leave the BOTTOM-RIGHT CORNER (about 10% of
the width and 18% of the height) as plain flat empty ground with no detail at all,
and do not push the cluster against the right edge.

Scene (right quarter): the same ONE small upright CORK NOTICE BOARD standing on two
slim wooden legs, about twice as tall as the sheep, with a little amber lamp clipped
to its top rail. Pinned to the cork are five or six small paper notes and childlike
crayon drawings — a sun, a flower, a tiny house — their colours dimmed to soft muted
tones, glowing only where the lamp reaches. The papers must be completely blank of
writing: no letters, no words, no numbers, no symbols, only colour shapes and soft
wobbly crayon lines.

In front of the board, a slightly LARGER sheep — the teacher — stands up on tiptoe
pressing one more little note onto the cork. Two small lambs sit below, shoulder to
shoulder, looking up; one of them wears a tiny knitted nightcap flopped over one
eye. Their muzzles are simple closed contented smiles — nothing in their mouths, no
tongues, no objects touching their faces.

The joke is the third lamb: it holds a big round DEEP-RED RUBBER STAMP with both
front hooves and has just pressed it onto its OWN FOREHEAD — a dark red circle sits
on its forehead, catching the amber lamplight only at its edge, and the lamb looks
utterly solemn and quietly proud, eyes half closed. The circle must be a plain empty
ring with nothing written inside.

Keep the characters SMALL — every sheep's head and the top of the notice board must
stay below 62% up from the bottom edge. Keep the entire cluster, board included,
inside the right quarter of the frame.

Do NOT draw any user-interface elements, buttons, pills, panels or rounded
rectangles anywhere. Do not draw a blackboard, a classroom wall, a window or a
floor — the board stands in the open air. The background must be ONE continuous soft
gradient — never a rectangular block, window or box of a different colour, and no
straight background edges anywhere. No text, no letters, no numbers, no logos. No
frames, no borders, no vignette, no rounded corners. The only bright areas in the
entire image are the little lamp, the small amber pool on the cork and the tiny
stars; everything else stays near-black midnight navy.
```

---

## B안 · 「암송 시간, 손 든 새끼양들」 (대안)

알림장의 **암송요절** 기능 쪽으로 붙인 안. 게시판 대신 **작은 이젤 하나**를 세우고,
새끼양 셋이 앞발을 번쩍 들어 "저요!" 하고 있다.
유머는 **맨 끝 새끼양** — 너무 열심히 들다가 그대로 물구나무를 서서, 거꾸로 뒤집힌 채
뒷발 두 짝을 번쩍 들고 있다. 표정은 더없이 진지하다.

A안이 한 번에 통과하면 쓰지 않는다. 장면 묘사 문단만 바꾸고 **나머지 제약 문단(구도·밝기·금지)은
A안 프롬프트를 그대로 복사해 쓴다.** 아래는 갈아 끼울 문단만 적는다.

**라이트 — 장면 문단 교체분**

```
Scene (right quarter): ONE small wooden EASEL standing upright on the grass, holding
a plain pale card, tilted slightly toward the viewer — about twice as tall as the
sheep, never wider than it is tall. The card is completely blank: no letters, no
words, no numbers, no symbols, only two or three soft empty ruled lines.

In front of the easel, a slightly LARGER sheep — the teacher — stands calmly with
one hoof resting on the easel leg. THREE small lambs sit in a tight row facing it,
each stretching ONE front hoof straight up in the air, eager but serene, eyes calm
and very slightly smug.

The joke is the lamb at the end of the row: it has tried so hard that it has tipped
over into a handstand, balanced upside down on its two front hooves with both back
legs pointing straight up — utterly solemn, deeply concentrated, as if answering
from upside down is perfectly normal. Nothing in its mouth, no tongue, no object
touching its face.
```

**다크 — 장면 문단 교체분**

```
Scene (right quarter): the same ONE small wooden EASEL standing upright, holding a
plain card, with a little amber lamp clipped to its top rail washing only the card
and the lambs. The card is completely blank: no letters, no words, no numbers, no
symbols, only two or three soft empty ruled lines.

In front of the easel, a slightly LARGER sheep — the teacher — stands calmly with
one hoof on the easel leg. THREE small lambs sit in a tight row facing it, each
stretching ONE front hoof straight up, eager but serene; one of them wears a tiny
knitted nightcap flopped over one eye.

The joke is the lamb at the end of the row: it has tipped over into a handstand,
balanced upside down on its two front hooves with both back legs pointing straight
up — utterly solemn, eyes half closed, as if answering from upside down is perfectly
normal. Nothing in its mouth, no tongue, no object touching its face.
```

---

## 자주 깨지는 곳 (재생성 말고 부분 수정)

**쪽지·그림에 글자가 들어갔을 때** (제미나이가 거의 항상 그린다)

```
Keep this image exactly as it is — same composition, same lighting, same colors,
same characters, same board. Change ONE thing only:

Redraw every piece of paper so it is completely blank — no letters, no words, no
numbers, no symbols of any kind, only flat colour shapes and soft wobbly crayon
lines. Everything else must stay pixel-identical.
```

**장면이 가로로 넓게 퍼졌을 때** (게시판을 벽처럼 그리면 항상 그렇게 된다)

```
Keep the same characters, the same style and the same palette, but redraw the
layout: push the entire scene into the RIGHT QUARTER of the frame and draw it as ONE
tight upright cluster that fits inside a box no wider than 25% of the width — taller
than it is wide. Make the notice board a narrow upright board on legs, not a wide
wall panel, and move every sheep close in around it. The left three quarters must be
nothing but the empty sky gradient.
```

**주인공이 너무 커서 위가 잘릴 때** (PC에서 위 42%가 잘린다 — 8.3:1 배너로 받으면 이 문제는 거의 안 난다)

```
Keep everything identical — same composition, same characters, same props. Only
change the scale: make the whole cluster smaller, so that the top of the notice
board and every sheep's head stay below 62% of the frame height measured from the
bottom edge. The upper third of the picture must be nothing but empty sky.
```

**도장 개그가 안 읽힐 때** (이마의 빨간 동그라미가 흐릿하게 나온다)

```
Keep everything identical — same composition, same lighting, same characters. Only
change the lamb holding the stamp: make the round red ink mark on its own forehead
larger and crisper, a clean empty red ring with nothing written inside, clearly
readable as a freshly pressed stamp. Keep its expression completely solemn and
proud, and keep the stamp itself held in both front hooves, away from its face.
```

**라이트가 너무 어둡게/파랗게 나왔을 때** — 남색 글씨가 죽는다.

```
Keep everything identical — same composition, same characters, same props. Only
change the lighting: raise the whole image to a bright high-key daylight palette.
The sky must be pale (#f4f9ff to #cfe3ff), every shadow must be a soft light
blue-grey, and no area of the picture may be darker than a soft mid-blue.
```

**다크가 너무 밝게 나왔을 때**

```
Keep everything identical — same composition, same characters, same props. Only
change the lighting: make the night much darker. The sky must stay between #0A1428
and #16224a everywhere, the sheep's wool must be dim warm grey rather than white,
and the lamp's pool of light must shrink so it only touches the cork board and the
lambs. Everything else falls into near-black midnight navy.
```

**왼쪽이 안 비었을 때** — 왼쪽 3/4 은 삽화 자신의 하늘이 곧 카드 바탕이므로 큰 물체가 들어오면 다시 뽑아야 한다.
(구름·별 정도는 괜찮다. 2026-09-12 라이트에는 장면 왼쪽에 구름 두어 개가 들어왔는데 그대로 썼다.)

---

## 적용한 코드 변경 (2026-09-12 완료)

> 아래는 **이미 적용된 상태**다. 에셋만 갈아 끼우면 안 된다는 기록으로 남긴다.

에셋만 갈아 끼우면 안 된다. **카드 그라데이션·워시·잉크**가 라이트에서 전부 뒤집힌다.
파일은 `src/pages/ClassRoom/ClassList.tsx` 히어로 `<section>` 한 곳 + 새 `class-hero.css`.

1) **카드 배경 — 라이트/다크 분기** (지금은 `bg-brand` 하나)

```
// before
bg-brand text-white shadow-[0_12px_32px_-16px_var(--brand-glow)]
   ring-1 ring-white/[0.14] dark:ring-white/[0.1]

// after — 그라데이션 색은 삽화 하늘에서 역산했다(페이드인 동안 색이 튀지 않게)
bg-[linear-gradient(180deg,#c8e5ee_0%,#daecf0_100%)]
   ring-1 ring-[#3182f6]/15 shadow-[0_10px_30px_-14px_rgba(49,130,246,0.45)]
dark:bg-[linear-gradient(180deg,#07173b_0%,#050c20_100%)]
   dark:ring-white/[0.08] dark:shadow-[0_10px_34px_-12px_rgba(0,0,0,0.6)]
```

2) **브랜드 워시·하단 스크림 두 겹은 삭제.** 불투명 삽화 위에 덮이는 파란 워시가
   지금 이 화면이 어색한 원인이다. 본문 래퍼의 `textShadow` 도 라이트에서는 뺀다
   (`dark:` 로만 남긴다 — 밝은 배경 위 남색 글씨에 검은 그림자가 붙으면 지저분하다).

3) **잉크**

| | 라이트 | 다크 |
|---|---|---|
| 라벨 `Class Note` | `text-[#2563eb]` | `dark:text-white/70` |
| 제목 | `text-[#152648]` | `dark:text-white` |
| 안내 문구 / 최근 소식 | `text-[#41527a]` | `dark:text-white/85` |
| 구분선 `w-px` | `bg-[#152648]/20` | `dark:bg-white/30` |

4) **삽화 레이어 + CSS** (`src/pages/ClassRoom/class-hero.css`, `rooms-hero.css` 와 같은 구조)

```css
.class-hero-art {
  background-image: url('...hero-light.webp');   /* import 한 URL 을 인라인 스타일로 주거나 CSS 변수로 */
  background-size: cover;
  background-position: right bottom;
  background-repeat: no-repeat;
  opacity: 0;
  transition: opacity 320ms ease-out;
}
.dark .class-hero-art { background-image: url('...hero-dark.webp'); }
.class-hero-art.is-ready { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .class-hero-art { transition: none; } }
```

`src/assets` 에 두므로 경로는 번들러 해시 URL 이다 — `import classHeroLight from '../../assets/classes/hero-light.webp'`
로 받아 `MISSION_HERO` 처럼 `themeAssets.ts` 에서 쌍을 만들고, CSS 는 그 변수를 읽게 한다.

5) **`src/utils/themeAssets.ts` 등록** (테마 토글 시 반대 테마가 늦게 뜨는 것을 막는 단일 출처)

```ts
import classHeroLight from '../assets/classes/hero-light.webp'
import classHeroDark from '../assets/classes/hero-dark.webp'

/** /classes 히어로 (class-hero.css) */
export const CLASS_HERO: ThemePair = { light: classHeroLight, dark: classHeroDark }

// ROUTE_ASSETS
{ match: /^\/classes$/, pairs: [CLASS_HERO] },
```

그리고 `ClassList` 에서 `const ready = useThemeArt(CLASS_HERO)` 로 받아 `is-ready` 를 건다.

6) **옛 에셋 삭제** — `src/assets/hero/class-note.webp` 와 `ClassList.tsx` 의 `classNoteHero` import.

---

## 적용 상태

- **2026-09-12**: A안으로 두 장 생성·적용 완료.
  - 받은 원본에 **제미나이 ✦ 워터마크가 없었다**(우하단 고정 자리 ±120.5px·전체 이미지 매치드 필터 모두 음성).
    다크의 밤하늘 작은 별들은 그림에 그려진 반짝이다. 다음에 워터마크가 찍혀 오면
    `docs/mission-hero-process.py` 의 알파 역산을 그대로 가져다 쓸 것(인페인트 금지).
  - `src/assets/classes/hero-{light,dark}.webp` (**1536×426 · 3.6:1**, 12.3 / 11.1KB)
    — 2.6:1(장면 120px)로 먼저 구웠다가 "너무 작다"는 지적으로 3.6:1(166px)로 다시 구웠다.
  - `ClassList.tsx` 카드 그라데이션·잉크 교체, 워시·스크림 두 겹 삭제, `class-hero.css` 신설,
    `themeAssets.ts` 에 `CLASS_HERO` + `/classes` 등록, 옛 `src/assets/hero/class-note.webp` 삭제,
    안내 문구 `max-w-[17rem]` → `max-w-[14rem]`.
