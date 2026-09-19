# 좌석 예약 히어로 배경 이미지 프롬프트 (Gemini용)

`/seats` 상단 **히어로**(`src/pages/Seats/SeatEventList.tsx`, `SEATS` + "원하는 자리를 / 직접 골라보세요"
+ 안내 문구) 뒤에 깔 배경. 라이트/다크 각 1장.
컨셉은 설문·플랜·공동 묵상방·소식 배경과 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**,
장면은 **"공연장 객석의 양들"** — 시안 3종(A·B·C) 중 하나를 골라 라이트·다크 한 쌍으로 뽑는다.

유머는 시리즈 규칙대로 **다 큰 양은 태연하고, 새끼양이 진지하게 과하다**에서 나온다.
이 화면이 파는 값(**자리를 직접 고른다 · 일행과 나란히 앉는다 · 입장할 때 티켓을 보여준다**)이
그대로 그림이 되게 골랐다.

> **다른 화면의 장면과 소품을 섞지 말 것.**
> - 플랜(`docs/plan-hero-bg-prompts.md`) = 통독표 + **도장·인주**
> - 설문(`docs/survey-hero-bg-prompts.md`) = 의견함 + **접은 쪽지·두루마리·연필**
> - 문화교실(`docs/culture-hero-bg-prompts.md`) = **무대 위 발표회**
> - 좌석 예약(이 문서) = **객석 의자 + 빈 티켓 반쪽 + (시안별) 오페라글라스·손전등**
>
> 이 그림은 **무대가 아니라 객석**이다. 커튼·조명탑·공연하는 양은 그리지 않는다(문화교실과 겹친다).
> 쪽지·투입구·도장도 넣지 않는다.

---

## 방향 — 라이트는 밝게, 다크는 더 깊게 (설문·플랜 2판·묵상방과 동일)

지금 `/seats` 히어로는 **이미 설문 히어로와 같은 카드**다 — 라이트 하늘빛 그라데이션 + 남색 글씨,
다크 심야 남색 + 흰 글씨. 삽화만 비어 있고, 오른쪽 아래에 **의자 점 15개(그중 2개 파랑)** 장식이
자리를 지키고 있다. 삽화가 들어오면 이 점 장식은 지운다(아래 적용 코드 참고).

| | 카드 | 잉크 | 삽화 톤 |
|---|---|---|---|
| **라이트** | 밝은 하늘빛 카드(`#d4eafc → #ebf5ff`) | **남색 글씨** | 맑은 대낮 high-key |
| **다크** | 심야 남색 카드(`#071222 → #0b1730`) | 흰 글씨 | 거의 검은 남색 + 작은 불빛 하나 |

**두 장의 차이는 "시간대"가 아니라 "밝기"다.**

### ★ 앱과 이어지는 색 약속 — "파란 의자 두 개"

앱 배치도에서 **내가 고른 좌석은 파란색(브랜드 블루)**, 빈 좌석은 흰색이다.
지금 히어로 장식도 흰 점들 사이에 파란 점 두 개다. 그래서 삽화의 객석도
**크림색 의자 줄 사이에 코발트·콘플라워 블루 의자 딱 두 개**로 그린다(시안 A는 필수, B·C는 권장).
성도가 배치도에 들어가기 전에 이미 "파란 자리 = 내 자리"를 한 번 보고 들어가게 하려는 것이다.
**초록은 쓰지 않는다** — 앱에서 초록은 "이미 예약한 내 좌석"이라 뜻이 섞인다.

## 사용법

1. Gemini에 **두 장**을 첨부한다.
   - 캐릭터 참조: `public/images/title-bg/` 중 아무 이미지나 → "이 양 캐릭터와 완전히 같은 캐릭터로"
   - **톤 참조**: 라이트는 `public/images/survey/hero-light.webp`,
     다크는 `public/images/survey/hero-dark.webp` → "이 그림의 밝기·하늘색을 그대로 맞춰서"
     (같은 카드 색이라 설문 그림이 가장 정확한 참조다. 묵상방 `public/images/rooms/hero-*.webp` 도 대체 가능)
   그 뒤 아래 시안 하나의 프롬프트를 통째로 붙여넣는다.
   **라이트를 먼저 뽑고, 다크는 라이트 결과물을 세 번째 첨부로 넣어 "같은 구도·같은 캐릭터로"라고 한 줄 붙이면**
   두 장의 배치가 어긋나지 않는다.
2. 결과물 저장 위치 (파일명 고정 — 코드가 이 경로를 참조한다):
   - 라이트: `frontend/public/images/seats/hero-light.webp`
   - 다크:   `frontend/public/images/seats/hero-dark.webp`
3. 제미나이 출력(**1792×592, 3:1**)을 그대로 `~/Downloads/1.png`(라이트) `2.png`(다크)로 두고
   ```
   python docs/plan-hero-process.py ~/Downloads seats
   ```
   한 방이면 워터마크 제거 → 캔버스 확장(2.2:1) → 왼쪽 녹이기 → webp 저장까지 끝난다.
   `FADE` 는 먼저 기본값 `(0.50, 0.90)` 으로 돌리고, **의자 줄 왼쪽이 안개처럼 반투명해지면**
   설문과 같은 **`(0.42, 0.72)`** 로 다시 돌린다(의자 줄은 가로로 길어서 이 증상이 나기 쉽다).
4. 최종 규격: **1536×699 (2.2:1) RGBA WebP**, `quality=80, alpha_quality=92, method=6`,
   한 장 **20KB 안팎**(설문 15.7/26.5KB).
   **원본은 3:1 로 뽑고 후처리에서 2.2:1 로 늘린다** — 이유는 설문 문서의
   ["왜 원본은 3:1 인데 에셋은 2.2:1 인가"](survey-hero-bg-prompts.md#왜-원본은-31-인데-에셋은-221-인가)와 같다.

> 여러 시안을 받아 보고 싶으면 파일명을 `A1.png/A2.png`, `B1.png/B2.png` 처럼 주면 된다.
> 고른 한 쌍만 `1.png/2.png` 로 바꿔 스크립트를 돌린다.

---

## 레이아웃 제약 (프롬프트의 핵심)

설문 히어로와 **같은 카드 규격**으로 맞춘다(적용 시 `py-7 → py-8`, 안내문 `13rem → 14rem`).

| | 히어로 크기 | 비율 |
|---|---|---|
| 모바일(390px) | 약 358×214 | **≈1.67 : 1** |
| PC(lg, 1240 컨테이너 + 312 레일) | 약 832×214 | **≈3.89 : 1** |

`background-size: cover; background-position: right 85%` 로 깐다(설문과 동일 — PC 상단 크롭에서 양 귀를 살린다).

> ★ **카피는 항상 "2줄 제목 + 2줄 안내문"** 이다. 히어로 문구 세 가지(`예약한 행사\nN개가 기다려요` /
> `원하는 자리를\n직접 골라보세요` / `지금은 예약 받는\n행사가 없어요`)가 전부 `\n` 로 2줄 고정이라
> 카드 높이가 214px 로 같다. 새 카피를 1줄·3줄로 넣으면 배율 계산이 어긋난다.

### 글자가 지나가는 자리 (제일 중요)

텍스트는 전부 **왼쪽 정렬**, 안내 문구는 `max-w-[14rem]`(224px). 모바일에서 **카드 왼쪽 약 248px 위로
글씨가 지나간다** — 카드 폭의 69%. 에셋 x 0.63 이 주인공 왼쪽 끝, 0.72 가 안내문 끝이다(설문과 동일 표).

규칙:

- **주인공은 원본 오른쪽 25%(x 75%~100%) 안에, 한 덩어리로.** ★의자 줄은 가로로 늘어나려는 성질이
  있다 — **의자는 최대 3~4개, 한 줄, 서로 붙여서**. 객석 전체를 그리면 모바일에서 글씨에 먹힌다.
  프롬프트에 **"no wider than 25%"** 를 두 번 넣어 뒀다.
- **왼쪽 3/4(x 0~75%)은 완전히 빈 하늘 그라데이션.** 뒷줄 의자·객석 실루엣·잔점 금지.
- 원본 x 75~86% 구간은 모바일에서 안내 문구 끝자락과 겹친다 →
  **라이트**는 이 띠를 **가장 밝은 부분**(크림색 의자·햇살)으로, **다크**는 **가장 어두운 부분**
  (의자 그림자)으로. 라이트에서 짙은 파란 의자가 여기 걸리면 남색 글씨가 죽는다 →
  **파란 의자 두 개는 무리의 오른쪽**에 둔다.
- **★에셋은 완전 불투명이다.** 삽화 자신의 하늘이 곧 카드 바탕이다 — 왼쪽 3/4 은 그대로 최종 배경이 된다.
- **오른쪽 위 글로우 금지**(다크의 달·손전등 빛이 번지면 안내문과 싸운다).
- **오른쪽 아래 모서리(폭 10% × 높이 18%)는 평평한 빈 바닥.** Gemini 워터마크 ✦ 자리다
  (지금까지 세 세대 연속 우하단에서 (120.5, 120.5) 오프셋).
- **글자·숫자·로고 금지. ★티켓·의자 등받이에 좌석 번호(A1·D3 등)를 절대 그리지 않는다** —
  제미나이가 "좌석"이라는 말만 들으면 거의 항상 번호판을 붙인다. 티켓은 민무늬 크림색 종이 + 절취선 점선만.
- 테두리·비네트·모서리 라운드 금지 — 카드 모서리(`rounded-[26px]`)는 CSS가 처리한다.

### 밝기 합격선 (설문과 동일)

모바일 안내문이 얹히는 사각형(에셋 기준 x 0.63~0.86 / 아래쪽 절반), `cover` 매핑을 흉내 내 잰다:

| | 합격선 | 깨졌을 때 |
|---|---|---|
| 라이트 | 평균 **≥ 205**, 하위5% **≥ 170** | 삽화를 더 옅게 / 파란 의자를 오른쪽으로 / `FADE` 를 오른쪽으로 |
| 다크 | 평균 **≤ 60**, 상위5% **≤ 110** | 불빛 반경을 줄이고 양털을 회색으로 |

`docs/plan-hero-check.py` 를 설문 문서의 `RECTS` 그대로, 경로만 `public/images/seats/hero-{name}.webp` 로 바꿔 쓴다.

---

## 시안 한눈에

| | 장면 | 웃음 포인트 | 다크 버전의 반전 |
|---|---|---|---|
| **A. 명당 사수** (추천) | 크림색 의자 한 줄 + 파란 의자 2개. 다 큰 양은 파란 의자에 태연히 앉아 빈 티켓을 들고 있다 | 새끼양이 옆 의자들을 **온몸으로 대자로 뻗어** "가족 자리"를 맡고 있다 — 진지하다 | 공연 전날 밤인데 벌써 와서 의자 두 칸에 걸쳐 **잠들었다** |
| **B. 맨 앞줄 오페라글라스** | 맨 앞줄 의자 두 개 + 뒤로 작은 금빛 오르간 파이프 몇 개(오르겔 콘서트) | 무대 바로 코앞인데 새끼양이 **자기 얼굴만 한 오페라글라스**로 초집중 | 오페라글라스를 이마에 올린 채 **팸플릿을 이불 삼아** 곯아떨어졌다 |
| **C. 좌석 안내 양** | 나비넥타이 한 다 큰 양이 안내원처럼 빈 파란 의자를 공손히 가리킨다 | 새끼양이 **티켓을 거꾸로 든 채** 자기보다 훨씬 큰 의자에 기어오르는 중 — 귀만 보인다 | 안내원 양의 **작은 손전등 불빛**이 딱 그 의자만 동그랗게 비춘다(스포트라이트 개그) |

---

## 시안 A — 명당 사수 (추천)

"원하는 자리를 직접 골라보세요" + "나란히 N석"이 한 장면에 다 들어간다.

### A · 라이트

```
A very wide 3:1 panoramic background illustration for the header banner of a "church
concert seat booking" page in a mobile church app, LIGHT MODE. IMPORTANT: this banner
is a PALE SKY-BLUE card and DARK NAVY text is laid on top of it, so the whole image
must be bright, airy and HIGH-KEY. There must be no dark navy area, no deep blue block
and no heavy shadow anywhere in the picture. Match the brightness and the sky colour
of the attached daylight reference image exactly.

Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, gentle airy morning light, no black outlines.
Use the SAME small chubby white sheep character as the attached character reference:
stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: pale high-key sky. Soft white and very light sky blue (#f4f9ff through
#dbeafe to #cfe3ff), the deepest tone anywhere is a gentle #93bdf5 used only for soft
shadows. Warm cream sunlight from the upper right, one or two small fluffy clouds,
light morning haze at the bottom. The ONLY saturated accent in the whole image is the
cornflower-blue velvet of exactly TWO seats — and even that stays light and sun-washed.
Every shadow is a soft blue-grey, never brown, never black.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight cluster no wider than 25% of the width — do not spread the seats or
the characters horizontally. The LEFT THREE QUARTERS must be completely empty: just the
smooth pale sky gradient with maybe one faint distant cloud, no detail at all, because
a title and two lines of dark text will be overlaid across it. Keep the TOP 8% and the
BOTTOM 8% as calm empty margin. Leave the BOTTOM-RIGHT CORNER (about 10% of the width
and 18% of the height) as plain flat empty ground with no detail at all.

Scene (right quarter): ONE short row of FOUR plump, rounded theatre seats standing on
the grass, pressed close together like a little sofa — two of them in soft cream
velvet on the left, and the two on the RIGHT in cornflower-blue velvet. The seats are
chubby and friendly, with rounded backs and small armrests, like furniture in a
picture book. No numbers, no plates and no labels on the seats.

On the rightmost blue seat, one grown sheep sits upright and perfectly composed,
holding a single small blank ticket stub in both front hooves, eyes closed, serene and
very slightly smug, as if it arrived first and knows it.

The joke is the lamb: a tiny lamb is lying stretched out flat on its back across the
two cream seats AND the other blue seat at once, all four stubby legs spread wide, with
its knitted scarf draped over one armrest and a small round cushion on another —
solemnly "saving" every seat in the row for the whole family, eyes open and very
serious. Nothing in its mouth, no tongue, no object touching its face.

The ticket stub is completely blank cream paper with only a small dotted perforation
line: no letters, no numbers, no barcode, no symbols of any kind. Keep the characters
SMALL — their heads must not reach higher than 62% up from the bottom edge — and keep
the entire cluster, seats included, inside the right quarter of the frame.

Do NOT draw a stage, curtains, spotlights, other audience or rows of seats behind.
Do NOT draw any user-interface elements, buttons, pills, panels or rounded rectangles
anywhere. The background must be ONE continuous soft gradient — never a rectangular
block, window or box of a different colour, and no straight background edges anywhere.
No text, no letters, no numbers, no logos. No frames, no borders, no vignette, no
rounded corners. The left three quarters must dissolve into a plain pale sky-blue
gradient, and nothing in the picture may be darker than a soft mid-blue.
```

### A · 다크

```
A very wide 3:1 panoramic background illustration for the header banner of a "church
concert seat booking" page in a mobile church app, DARK MODE. IMPORTANT: this banner
sits on a VERY DEEP MIDNIGHT-NAVY card with white text laid on top, and the picture
must be just as dark as the attached night reference image — an almost-black navy
night where only a thin crescent moon, a few tiny stars and one small warm lantern are
bright. Do not lighten the sky. Do not add a blue glow.

Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, warm rim lighting only where the lantern
reaches. Use the SAME small chubby white sheep character as the attached character
reference: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep midnight navy. #0A1428 in the upper left, lifting only very slightly to
about #16224a toward the lower right — the sky must stay inside that narrow dark band
across the ENTIRE frame, with a scatter of tiny blue-white stars and one thin crescent
moon high on the right. The mood is "the concert is tomorrow, but the lamb came
tonight to be first in line". The ONLY bright thing is one small AMBER oil lantern
standing on the ground beside the seats and the small pool of warm light it drops on
them; that pool must stay compact and must not spread wider than a fifth of the frame.
Everything outside that pool falls back into near-black navy within a short distance.

The sheep's wool must read as DIM WARM GREY (around #b3bdd2), clearly darker than
white — it must never glow or read as a bright white blob. The seats are deep in
shadow: the cream ones read as dusky grey-beige, the two blue ones as deep dusky
cobalt, and they only warm up where the lantern light touches them. Ground is a
near-black navy silhouette.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight cluster no wider than 25% of the width — do not spread the seats or
the characters horizontally. The LEFT THREE QUARTERS must be completely empty: a smooth
near-black navy gradient with a few faint stars and nothing else, because a title and
two lines of white text will be overlaid across it. Keep the TOP 8% and the BOTTOM 8%
as calm empty margin. Leave the BOTTOM-RIGHT CORNER (about 10% of the width and 18% of
the height) as plain flat empty ground with no detail at all.

Scene (right quarter): the same ONE short row of FOUR plump, rounded theatre seats on
the grass, pressed close together like a little sofa — two cream seats on the left and
two cornflower-blue seats on the right. No numbers, no plates and no labels on the
seats.

On the rightmost blue seat the same grown sheep sits upright, wearing a tiny knitted
nightcap flopped over one eye, holding its small blank ticket stub against its chest,
eyes closed, serene and slightly smug — it is keeping watch. Its muzzle is a simple
closed contented smile — nothing in its mouth, no tongue, no object touching the face.

The joke is the lamb: it has fallen fast asleep sprawled across the other three seats
at once, belly up, all four stubby legs in the air, a small round cushion under its
head and its knitted scarf trailing to the ground, with one small round snore bubble —
still "saving" the whole row for the family.

The ticket stub is completely blank paper with only a small dotted perforation line:
no letters, no numbers, no barcode, no symbols of any kind. Keep the characters SMALL
— their heads must not reach higher than 62% up from the bottom edge — and keep the
entire cluster, seats and lantern included, inside the right quarter of the frame.

Do NOT draw a stage, curtains, spotlights, other audience or rows of seats behind.
Do NOT draw any user-interface elements, buttons, pills, panels or rounded rectangles
anywhere. The background must be ONE continuous soft gradient — never a rectangular
block, window or box of a different colour, and no straight background edges anywhere.
No text, no letters, no numbers, no logos. No frames, no borders, no vignette, no
rounded corners. The only bright areas in the entire image are the lantern flame, the
small amber pool on the seats, the crescent moon and the tiny stars; everything else
stays near-black midnight navy.
```

---

## 시안 B — 맨 앞줄 오페라글라스

교회 오르겔 콘서트라는 원래 출발점을 살린 버전. 오르간 파이프는 **작게, 의자 뒤에 몇 개만** — 무대 전체를
그리면 문화교실 발표회와 겹치고 가로로 퍼진다.

### B · 라이트

```
A very wide 3:1 panoramic background illustration for the header banner of a "church
concert seat booking" page in a mobile church app, LIGHT MODE. IMPORTANT: this banner
is a PALE SKY-BLUE card and DARK NAVY text is laid on top of it, so the whole image
must be bright, airy and HIGH-KEY. There must be no dark navy area, no deep blue block
and no heavy shadow anywhere in the picture. Match the brightness and the sky colour
of the attached daylight reference image exactly.

Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, gentle airy morning light, no black outlines.
Use the SAME small chubby white sheep character as the attached character reference:
stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: pale high-key sky. Soft white and very light sky blue (#f4f9ff through
#dbeafe to #cfe3ff), the deepest tone anywhere is a gentle #93bdf5 used only for soft
shadows. Warm cream sunlight from the upper right, light morning haze at the bottom.
The ONLY saturated accents are the cornflower-blue velvet of two seats and the pale
sunlit gold of a few small organ pipes — both light and sun-washed. Every shadow is a
soft blue-grey, never brown, never black.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight cluster no wider than 25% of the width — do not spread anything
horizontally. The LEFT THREE QUARTERS must be completely empty: just the smooth pale
sky gradient with maybe one faint distant cloud, no detail at all, because a title and
two lines of dark text will be overlaid across it. Keep the TOP 8% and the BOTTOM 8%
as calm empty margin. Leave the BOTTOM-RIGHT CORNER (about 10% of the width and 18% of
the height) as plain flat empty ground with no detail at all.

Scene (right quarter): TWO plump, rounded cornflower-blue velvet theatre seats side by
side on the grass — the front row. Just behind them rises a small cluster of five or
six short, rounded, pale-gold pipe-organ pipes of different heights, like a tiny
storybook organ, no taller than the seated sheep's head plus a little. No numbers,
plates or labels anywhere.

In the left seat one grown sheep sits upright and perfectly composed, front hooves
folded on its lap over a small blank folded programme, eyes closed, serene and very
slightly smug, simply enjoying the music.

The joke is the lamb: in the right seat, sitting in the very front row with the organ
right in front of its nose, a tiny lamb is peering through a pair of ENORMOUS brass
opera glasses almost as big as its own head, held up with both front hooves, utterly
solemn and concentrating hard — as if the organ were a mile away. The opera glasses
only touch the area around its eyes; nothing in its mouth, no tongue.

The programme is completely blank cream paper: no letters, no numbers, no musical
notes, no symbols of any kind. Keep the characters SMALL — their heads must not reach
higher than 62% up from the bottom edge — and keep the entire cluster, pipes included,
inside the right quarter of the frame.

Do NOT draw a stage floor, curtains, spotlights, a performer, other audience or rows
of seats behind. Do NOT draw any user-interface elements, buttons, pills, panels or
rounded rectangles anywhere. The background must be ONE continuous soft gradient —
never a rectangular block, window or box of a different colour, and no straight
background edges anywhere. No text, no letters, no numbers, no logos, no musical note
symbols. No frames, no borders, no vignette, no rounded corners. The left three
quarters must dissolve into a plain pale sky-blue gradient, and nothing in the picture
may be darker than a soft mid-blue.
```

### B · 다크

```
A very wide 3:1 panoramic background illustration for the header banner of a "church
concert seat booking" page in a mobile church app, DARK MODE. IMPORTANT: this banner
sits on a VERY DEEP MIDNIGHT-NAVY card with white text laid on top, and the picture
must be just as dark as the attached night reference image — an almost-black navy
night where only a thin crescent moon, a few tiny stars and one small warm candle
glow are bright. Do not lighten the sky. Do not add a blue glow.

Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, warm rim lighting only where the candle light
reaches. Use the SAME small chubby white sheep character as the attached character
reference: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep midnight navy. #0A1428 in the upper left, lifting only very slightly to
about #16224a toward the lower right — the sky must stay inside that narrow dark band
across the ENTIRE frame, with a scatter of tiny blue-white stars and one thin crescent
moon high on the right. The mood is "the evening concert has gone on a little long".
The ONLY bright thing is one small candle in a brass holder standing on top of the
little organ, and the small pool of warm amber light it drops on the organ pipes and
the two sheep; that pool must stay compact and must not spread wider than a fifth of
the frame. Everything outside it falls back into near-black navy within a short
distance.

The sheep's wool must read as DIM WARM GREY (around #b3bdd2), clearly darker than
white — never a bright white blob. The two seats read as deep dusky cobalt, the organ
pipes as dark bronze that only glint where the candle touches them. Ground is a
near-black navy silhouette.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight cluster no wider than 25% of the width — do not spread anything
horizontally. The LEFT THREE QUARTERS must be completely empty: a smooth near-black
navy gradient with a few faint stars and nothing else, because a title and two lines
of white text will be overlaid across it. Keep the TOP 8% and the BOTTOM 8% as calm
empty margin. Leave the BOTTOM-RIGHT CORNER (about 10% of the width and 18% of the
height) as plain flat empty ground with no detail at all.

Scene (right quarter): the same TWO plump, rounded blue velvet theatre seats side by
side — the front row — with the same small cluster of five or six short rounded organ
pipes just behind them, a small candle burning on top. No numbers, plates or labels
anywhere.

In the left seat the same grown sheep sits upright, eyes closed, serene and slightly
smug, gently swaying to the music, wearing a tiny knitted nightcap flopped over one
eye. Its muzzle is a simple closed contented smile — nothing in its mouth, no tongue,
no object touching the face.

The joke is the lamb: it has fallen fast asleep curled up in the right seat, the
ENORMOUS brass opera glasses pushed up onto its forehead like goggles, a blank folded
programme spread over its tummy like a tiny blanket, with one small round snore bubble.

The programme is completely blank paper: no letters, no numbers, no musical notes, no
symbols of any kind. Keep the characters SMALL — their heads must not reach higher
than 62% up from the bottom edge — and keep the entire cluster, pipes included, inside
the right quarter of the frame.

Do NOT draw a stage floor, curtains, spotlights, a performer, other audience or rows
of seats behind. Do NOT draw any user-interface elements, buttons, pills, panels or
rounded rectangles anywhere. The background must be ONE continuous soft gradient —
never a rectangular block, window or box of a different colour, and no straight
background edges anywhere. No text, no letters, no numbers, no logos, no musical note
symbols. No frames, no borders, no vignette, no rounded corners. The only bright areas
in the entire image are the candle flame, the small amber pool on the organ and the
sheep, the crescent moon and the tiny stars; everything else stays near-black
midnight navy.
```

---

## 시안 C — 좌석 안내 양

"입장할 때 티켓을 보여주세요"와 관리자 현황판(안내·입장 확인)까지 이어지는 버전.
다크의 손전등 빛은 **짧고 좁게** — 밝기 상한을 가장 깨기 쉬운 시안이다.

### C · 라이트

```
A very wide 3:1 panoramic background illustration for the header banner of a "church
concert seat booking" page in a mobile church app, LIGHT MODE. IMPORTANT: this banner
is a PALE SKY-BLUE card and DARK NAVY text is laid on top of it, so the whole image
must be bright, airy and HIGH-KEY. There must be no dark navy area, no deep blue block
and no heavy shadow anywhere in the picture. Match the brightness and the sky colour
of the attached daylight reference image exactly.

Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, gentle airy morning light, no black outlines.
Use the SAME small chubby white sheep character as the attached character reference:
stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: pale high-key sky. Soft white and very light sky blue (#f4f9ff through
#dbeafe to #cfe3ff), the deepest tone anywhere is a gentle #93bdf5 used only for soft
shadows. Warm cream sunlight from the upper right, light morning haze at the bottom.
The ONLY saturated accents are the cornflower-blue velvet of two seats and one small
vermilion bow tie — both light and sun-washed. Every shadow is a soft blue-grey, never
brown, never black.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight cluster no wider than 25% of the width — do not spread anything
horizontally. The LEFT THREE QUARTERS must be completely empty: just the smooth pale
sky gradient with maybe one faint distant cloud, no detail at all, because a title and
two lines of dark text will be overlaid across it. Keep the TOP 8% and the BOTTOM 8%
as calm empty margin. Leave the BOTTOM-RIGHT CORNER (about 10% of the width and 18% of
the height) as plain flat empty ground with no detail at all.

Scene (right quarter): ONE short row of THREE plump, rounded theatre seats on the
grass, pressed close together — one cream seat and, to its right, two cornflower-blue
velvet seats. The seats are chubby and friendly like picture-book furniture. No
numbers, plates or labels anywhere.

Standing beside the row, one grown sheep acts as a very proper usher: upright on its
hind legs, a tiny vermilion bow tie at its neck, one front hoof extended in a polite,
graceful "right this way" gesture toward the blue seats, eyes closed, serene and very
slightly smug.

The joke is the lamb: a tiny lamb is clambering up into one of the blue seats, which is
far too big for it — only its round bottom, stubby back legs and two ears are
visible over the cushion — while one front hoof still holds its small blank ticket
stub proudly aloft, UPSIDE DOWN. Nothing in its mouth, no tongue, no object touching
its face.

The ticket stub is completely blank cream paper with only a small dotted perforation
line: no letters, no numbers, no barcode, no symbols of any kind. Keep the characters
SMALL — their heads must not reach higher than 62% up from the bottom edge — and keep
the entire cluster, seats included, inside the right quarter of the frame.

Do NOT draw a stage, curtains, spotlights, other audience or rows of seats behind.
Do NOT draw any user-interface elements, buttons, pills, panels or rounded rectangles
anywhere. The background must be ONE continuous soft gradient — never a rectangular
block, window or box of a different colour, and no straight background edges anywhere.
No text, no letters, no numbers, no logos. No frames, no borders, no vignette, no
rounded corners. The left three quarters must dissolve into a plain pale sky-blue
gradient, and nothing in the picture may be darker than a soft mid-blue.
```

### C · 다크

```
A very wide 3:1 panoramic background illustration for the header banner of a "church
concert seat booking" page in a mobile church app, DARK MODE. IMPORTANT: this banner
sits on a VERY DEEP MIDNIGHT-NAVY card with white text laid on top, and the picture
must be just as dark as the attached night reference image — an almost-black navy
night where only a thin crescent moon, a few tiny stars and one small warm flashlight
beam are bright. Do not lighten the sky. Do not add a blue glow.

Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, warm rim lighting only where the flashlight
reaches. Use the SAME small chubby white sheep character as the attached character
reference: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep midnight navy. #0A1428 in the upper left, lifting only very slightly to
about #16224a toward the lower right — the sky must stay inside that narrow dark band
across the ENTIRE frame, with a scatter of tiny blue-white stars and one thin crescent
moon high on the right. The mood is "the lights are down, the concert is about to
start". The ONLY bright thing is a small brass flashlight held by the usher sheep,
casting ONE short, narrow, soft AMBER beam pointing DOWNWARD that ends in a small oval
spot on exactly one seat. The beam must be short and narrow, must point down and to
the side (never up into the sky), and the lit spot must not spread wider than a
seventh of the frame. Everything outside it falls back into near-black navy.

The sheep's wool must read as DIM WARM GREY (around #b3bdd2), clearly darker than
white — never a bright white blob. The seats are deep in shadow, the blue ones dusky
cobalt, and only the one seat inside the spot warms up. Ground is a near-black navy
silhouette.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight cluster no wider than 25% of the width — do not spread anything
horizontally. The LEFT THREE QUARTERS must be completely empty: a smooth near-black
navy gradient with a few faint stars and nothing else, because a title and two lines
of white text will be overlaid across it. Keep the TOP 8% and the BOTTOM 8% as calm
empty margin. Leave the BOTTOM-RIGHT CORNER (about 10% of the width and 18% of the
height) as plain flat empty ground with no detail at all.

Scene (right quarter): the same ONE short row of THREE plump, rounded theatre seats —
one cream seat and two blue velvet seats — pressed close together on the grass. No
numbers, plates or labels anywhere.

The same grown sheep stands beside the row as a very proper usher, tiny bow tie at its
neck, eyes closed, serene and slightly smug, holding the small flashlight low and
pointing its beam at one blue seat like a tiny spotlight. Its muzzle is a simple
closed contented smile — nothing in its mouth, no tongue, no object touching the face.

The joke is the lamb: it sits bolt upright in the lit seat, right in the middle of the
little oval spotlight, clutching its blank ticket stub (still upside down) to its
chest with both front hooves, eyes wide and shining, looking utterly delighted and a
little dazzled — as if it were the star of the show.

The ticket stub is completely blank paper with only a small dotted perforation line:
no letters, no numbers, no barcode, no symbols of any kind. Keep the characters SMALL
— their heads must not reach higher than 62% up from the bottom edge — and keep the
entire cluster inside the right quarter of the frame.

Do NOT draw a stage, curtains, other audience or rows of seats behind.
Do NOT draw any user-interface elements, buttons, pills, panels or rounded rectangles
anywhere. The background must be ONE continuous soft gradient — never a rectangular
block, window or box of a different colour, and no straight background edges anywhere.
No text, no letters, no numbers, no logos. No frames, no borders, no vignette, no
rounded corners. The only bright areas in the entire image are the flashlight, its
short downward beam, the small oval spot on one seat, the crescent moon and the tiny
stars; everything else stays near-black midnight navy.
```

---

## 자주 깨지는 곳 (재생성 말고 부분 수정)

**의자·티켓에 좌석 번호나 글씨가 들어갔을 때** (제미나이가 거의 항상 그린다)

```
Keep this image exactly as it is — same composition, same lighting, same colors, same
characters, same seats. Change ONE thing only:

Remove every number, letter, plate and label from the seats, and redraw the ticket stub
and any paper so they are completely blank: plain paper with only a small dotted
perforation line, no letters, no numbers, no barcode, no symbols of any kind.
Everything else must stay pixel-identical.
```

**의자가 객석처럼 여러 줄로 퍼졌을 때**

```
Keep the same characters, the same style and the same palette, but redraw the layout:
there must be only ONE short row of seats, pressed close together, and the entire scene
must fit inside the RIGHT QUARTER of the frame as ONE tight cluster no wider than 25% of
the width. No rows of seats behind, no audience. The left three quarters must be nothing
but the empty sky gradient.
```

**무대·커튼·조명이 생겼을 때**

```
Keep everything identical — same composition, same characters, same seats, same
lighting. Only remove the stage, the curtains and any spotlights or lighting rigs, and
fill their place with the same smooth sky gradient as the rest of the background.
```

**파란 의자가 너무 진하거나 두 개가 아닐 때**

```
Keep everything identical — same composition, same characters, same lighting. Only
recolour the seats: exactly TWO seats are soft cornflower-blue velvet (the two on the
right), every other seat is soft cream velvet. The blue must stay light and sun-washed,
never deep navy.
```

**라이트가 너무 어둡게/파랗게 나왔을 때** — 남색 글씨가 죽는다.

```
Keep everything identical — same composition, same characters, same props. Only change
the lighting: raise the whole image to a bright high-key daylight palette. The sky must
be pale (#f4f9ff to #cfe3ff), every shadow must be a soft light blue-grey, and no area
of the picture may be darker than a soft mid-blue.
```

**다크가 너무 밝게 나왔을 때** (시안 C 손전등 빛이 번졌을 때 포함)

```
Keep everything identical — same composition, same characters, same props. Only change
the lighting: make the night much darker. The sky must stay between #0A1428 and
#16224a everywhere, the sheep's wool must be dim warm grey rather than white, and the
single warm light source must shrink so it only touches the seats and the sheep — any
beam must be short, narrow and point downward. Everything else falls into near-black
midnight navy.
```

**왼쪽이 안 비었을 때** — 다시 그리게 하지 말고 후처리의 `FADE` 를 오른쪽으로 민다.
왼쪽에 큰 물체(뒷줄 의자 등)가 들어왔을 때만 위 "여러 줄로 퍼졌을 때"로 다시 그린다.

---

## 적용할 코드 변경 (이미지가 나온 뒤 한 번에)

카드 그라데이션·잉크는 **이미 설문과 같은 값**이라 그대로 둔다. 바뀌는 건 삽화 레이어·점 장식·규격 세 줄이다.

### 1) `src/pages/Seats/SeatEventList.tsx` 히어로

- **★오른쪽 아래 의자 점 장식(`grid grid-cols-5` 15칸)은 삭제한다.** 삽화와 두 겹이 된다.
- 삽화 레이어 추가: `<div className={`seats-hero-art absolute inset-0${artReady ? ' is-ready' : ''}`} aria-hidden />`
  (`const artReady = useThemeArt(SEATS_HERO)`, `import './seats-hero.css'`)
- 규격을 설문과 통일: `py-7 → py-8`, 안내문 `max-w-[13rem] → max-w-[14rem]`.
- 제목에 다크 전용 그림자 추가: `dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]` (라이트엔 넣지 않는다).
- 카드 그라데이션은 **완성된 삽화의 하늘색을 실측**해 필요하면 미세 조정(삽화 도착 전 자리끼움 색).

### 2) `src/pages/Seats/seats-hero.css` 신규

`src/pages/Survey/survey-hero.css` 를 복사해 클래스명 `survey-hero-art → seats-hero-art`,
경로 `/images/survey/ → /images/seats/` 만 바꾼다(`background-position: right 85%` 유지).

### 3) `src/utils/themeAssets.ts`

```ts
/** /seats 히어로 (seats-hero.css) */
export const SEATS_HERO: ThemePair = { light: '/images/seats/hero-light.webp', dark: '/images/seats/hero-dark.webp' }
// 라우트 매니페스트에
{ match: /^\/seats$/, pairs: [SEATS_HERO] },
```

메뉴에서 `/seats` 청크를 받는 순간 현재 테마 즉시·반대 테마 유휴 시간에 데워진다.

### 4) 확인

- 라이트/다크 토글을 두 번 왕복해 두 장 다 즉시 뜨는지.
- `docs/plan-hero-check.py` 로 밝기 합격선(위 표) 확인.
- 히어로 문구 세 가지가 모두 2줄인지(제목·안내문).

---

## 적용 상태

- **2026-09-19 (적용 완료, 시안 A "명당 사수")** — 에셋 `public/images/seats/hero-{light,dark}.webp`,
  1536×699 RGBA(전면 불투명), **14.6KB / 14.9KB**.
  - 후처리는 `docs/seats-hero-process.py`(plan-hero-process 를 불러 쓰는 드라이버). 원본 위에 ~50px 색 띠가
    있어 **워터마크를 원본 좌표에서 먼저 지우고 위 52줄을 잘라낸 뒤** 확장했다. 다크는 띠 대비(2.4)가
    자동 절단 기준(4)보다 작아 안 잘렸고, 그 띠의 별이 늘린 하늘에 세로 줄무늬로 번졌었다.
  - 워터마크 ✦ 는 이번에도 **(1671.5, 471.5)**, 알파 **0.293** — 어미 양 발굽 아래 의자 다리 옆. 깨끗이 제거.
  - `FADE` 없음 — 의자 줄이 **0.59~0.98(40%)** 로 규격(25%)보다 넓어 녹이면 왼쪽 의자가 반투명해진다.
  - **★안내문 폭 `14rem → 11rem`.** 14rem 이면 긴 카피("콘서트·특별 행사 좌석을 앱에서…") 첫 줄이 다크의
    회색 의자 위를 지나 p95 131. 11rem 이면 두 줄 유지에 첫 줄이 x≈200 안에서 끝난다.
    실측(모바일, 글자 실제 영역): 라이트 1줄 232 / p5 215, 2줄 240 · 다크 1줄 42 / p95 110, 2줄 41 / p95 79.
    다크 등불 후광은 안내문 둘째 줄 끝 아래에 오지만 p95 79 로 문제없어 그림은 손대지 않았다.
  - 코드: `SeatEventList.tsx` 히어로(삽화 레이어 + **의자 점 장식 삭제** + `py-8` + 다크 제목 그림자 + `max-w-[11rem]`),
    `seats-hero.css`, `themeAssets.ts` 의 `SEATS_HERO` + `/seats` 라우트 매니페스트.
- **2026-09-19 (상세 표지 띠, 시안 C "좌석 안내 양")** — `/seats/:id` 정보 카드 위 표지 띠에 적용.
  에셋 `public/images/seats/detail-{light,dark}.webp`, 1536×462(확장 없음, 3.3:1), **12.2KB / 12.0KB**.
  - 카드는 왼쪽 전체가 글씨(제목·일시·장소·게이지)라 배경으로 깔지 않고, **카드 맨 위 띠(모바일 128px · PC 184px)** 로 두고
    상태 칩만 띠 왼쪽 위 빈 하늘에 얹었다. 띠 아래 32px 는 카드 바탕으로 녹인다. `background-position: right 70%`
    (PC 폭맞춤에서 세로 74% 만 보이는데 캐릭터가 에셋 세로 24~85% 에 있다).
  - ★4.png 는 ✦ 가 **밝은 양 다리 위**에 떨어져 알파 추정에 다리 테두리가 섞였다(면적 1448, 다리에 별 모양 구멍).
    ✦ 모양·자리는 세대마다 같으므로 평평한 배경에서 뜬 알파를 **`docs/gemini-wm-alpha.npz`** 로 저장해 두 작업 모두 그걸 쓴다
    (피크 0.294, 면적 984, 중심 (1671.5, 471.5)). 원본을 지워도 재처리할 수 있다.
  - 처리: `python docs/seats-hero-process.py detail`.
  - **같은 날 보정** — 처음엔 카드 본문을 앱 기본 카드색(흰색 / `card-dark #201f1f`)으로 두고 띠 아래만 녹였더니,
    다크에서 남색 표지 + 회색 본문으로 갈라져 "사진을 붙인 카드"처럼 보였다(사용자 지적).
    → **카드 전체를 삽화 바닥 실측색**(라이트 `#eef5fe` · 다크 `#071222`)으로 칠하고, 잉크를 목록 히어로와 같은
    남색(`#152648`/`#41527a`/`#7a8bb0`) · 흰색 계열로 맞췄다. 테두리·그림자도 목록 히어로 카드와 같은 값.
  - **재보정(같은 날)** — 표지 띠 방식은 카드 높이를 128~184px 늘려서 폐기(사용자: "이미지 때문에 높이까지 키우지 말 것").
    ★**카드 높이는 삽화 전과 같게.** 삽화는 카드 안 오른쪽 상자에 `cover · right bottom` 으로 깐다 —
    모바일은 오른쪽 위 `64% × 112px`(칩·제목 옆, 제목·소개는 `pr-[42%]`), PC 는 오른쪽 `62%` 전체 높이(제목·소개 `max-w-[45%]`,
    게이지 `max-w-[48%]`). 상자 왼쪽(모바일 30% · PC 18% — 더 넓으면 크림색 의자가 녹는다)과 모바일 아래 28px 를 카드색으로 녹인다.
  - **모바일 재보정** — 오른쪽 위 `64% × 112px` 상자는 의자가 50px 남짓으로 너무 작았다(사용자 지적).
    → 모바일은 **카드 윗부분 전체 폭 148px** 에 깔고(삽화 왼쪽은 빈 하늘이라 칩·제목이 얹혀도 된다) 아래 40px 만 녹인다.
    의자·양은 폭과 무관하게 오른쪽 약 200px 을 차지하므로 제목·소개는 `%` 가 아니라 **`pr-[180px]`** 로 비킨다(358px 폭에서도 한 줄).
