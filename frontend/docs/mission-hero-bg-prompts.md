# 선교 히어로 좌우 삽화 프롬프트 (Gemini용)

`/mission` 맨 위 **「땅 끝까지 / 복음의 빛을」 히어로**(`pages/Mission/Mission.tsx` — `.mission-hero`,
`.hero-eyebrow` + `.hero-title` 2줄 + `.hero-verse` 사도행전 1:8 카드) **좌우 빈자리**에 깔 삽화.
라이트/다크 각 1장, 총 2장으로 PC·모바일을 다 덮는다.

컨셉은 앱 전체와 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**다.
다만 이 화면은 게임·수집 화면이 아니라 **선교 현황**이다 — 개그가 앞에 서면 안 된다.
톤은 **진지한 장면 + 한 군데만 미소**. 장면이 먼저 마음을 붙들고, 두 번째로 볼 때
"저건 좀 귀엽네" 하고 웃는 정도. 슬랩스틱·표정 과장·말풍선은 쓰지 않는다.

장면의 뼈대는 **좌우 두 언덕, 가운데는 빈 하늘**이다.
왼쪽은 **보내는 쪽**(참빛교회), 오른쪽은 **닿은 쪽**(선교지).
그 사이를 비워 두는 것이 이 그림의 주제다 — **가운데 빈 하늘이 곧 "땅 끝"까지의 거리**이고,
그 자리에 제목과 사도행전 1:8 이 앉는다. 좌우를 다리·빛줄기·점선으로 잇지 말 것.
(거리감이 사라지고, 무엇보다 그 선이 글자 위를 지나간다.)

**2026-09-11 — A안 채택, 붙였다.** 실제로 쓰는 파일은 `src/assets/mission/hero-{light,dark}.webp`
(A안 · 「보내는 언덕, 닿은 언덕」). B안(「시차 너머의 기도」)은 붙여 보고 떨어졌다 —
왼쪽 촛불 기도는 좋았는데 **오른쪽 오두막이 프레임보다 커서 날개 폭에서 잘리고**,
라이트에서 큰 덩어리로 떴다. C안(무캐릭터)은 쓰지 않았다.
아래 프롬프트·제약은 그대로 유효하다(다시 뽑을 때 쓴다). 실측으로 바뀐 값은 본문에 반영해 뒀다.


> **참조 이미지 두 장을 반드시 같이 붙인다.**
> - 캐릭터·화풍: `public/images/title-bg/gospel_witness.webp` (모닥불 앞에서 말씀을 전하는 양 —
>   이 화면과 주제가 같은 형제 그림이다. 다만 **저건 남색 밤하늘이고 이 히어로는 아니다.**)
> - 레이아웃·라이트 톤: `public/images/education/hero-light.webp`
>   (하늘은 거의 비우고 **아래쪽에만** 물건과 양을 늘어놓는 문법이 그대로 필요하다.)

## 사용법

1. Gemini 에 위 참조 2장을 첨부하고 "이 양 캐릭터와 완전히 같은 캐릭터로, 같은 화풍으로"
   라고 덧붙인 뒤 아래 프롬프트를 통째로 붙여넣는다.
   **한 세션에서 라이트 → 다크 순으로 이어서 뽑아야 톤이 맞는다.**
2. 비율은 **16:9 그대로** 받는다(받아 보니 1376×768). 자르지 않고 그대로 후처리로 넘긴다 —
   위쪽 빈 하늘은 굽는 단계에서 잘라 낸다.
3. 원본은 `~/Downloads/3.png`(라이트) · `4.png`(다크) 로 두고 아래 스크립트를 돌린다.
   결과 파일명은 고정이다:
   - 라이트: `frontend/src/assets/mission/hero-light.webp`
   - 다크:   `frontend/src/assets/mission/hero-dark.webp`

   ★ `public/` 이 아니라 **`src/assets/`** 다. `public/` 은 URL 이 고정이라 `sw.js` 의
   stale-while-revalidate 가 옛 그림을 계속 내주고, 다시 구워 배포해도 화면이 안 바뀐다.
   `src/assets` 는 번들러가 콘텐츠 해시를 붙여 주므로 다시 구우면 URL 이 같이 바뀐다.
   (`utils/themeAssets.ts` 주석 · `VerseAlarmPage.css` 의 같은 경고 참고.)
4. 후처리: **`python docs/mission-hero-process.py`** — 워터마크 ✦ 제거 + 위 하늘 110px 크롭 +
   webp 저장까지 한 번에 한다.
   - ✦ 는 인페인트가 아니라 **알파 역산**으로 지운다(흰색 고정 알파 합성 → `a=(obs-bg)/(255-bg)`).
     실측 알파 ≈0.33, 중심 (1255, 647.5), 초타원 반지름 23.5×25 · 지수 0.7.
   - 알파는 **탈락한 B안 다크(2.png)** 에서 잰다. 네 장 중 별 둘레가 유일하게 평평한 돌계단이라
     배경 복원이 정확하다 — A안은 ✦ 가 고슴도치 몸통 위라 거기서는 못 잰다.
     **그래서 2.png 는 버리지 말 것.** 다시 구우려면 필요하다.
   - 반지름 프로파일 근사와 상하 거울 반사는 둘 다 **별 테두리를 링으로 남긴다**(해 보고 버렸다).
     픽셀 단위로 잰 알파 맵을 그대로 쓴다.
5. 용량 예산: **한 장 45KB 이하**(실측 라이트 42.2 / 다크 28.1KB, q82).
   넘으면 하늘의 노이즈·별가루를 줄인다(디테일을 줄이는 게 화질을 줄이는 것보다 낫다).

---

## 레이아웃 제약 (프롬프트의 핵심)

### 히어로 실측

`.mission-shell` 은 모바일 `max-width: 28rem`(448), PC(≥1024) `1180`. 히어로는 셸 폭 전체를 쓰고
글자는 가운데 정렬이다. PC 좌측 전역 레일은 1024~1279 에서 76, ≥1280 에서 248 을 먹는다.

| 뷰포트 | 레일 | 히어로 폭 | 텍스트 칼럼 | **한쪽 여백** |
|---|---|---|---|---|
| 390 (폰) | — | 390 | 350 (성구 카드가 폭을 다 쓴다) | **0** |
| 768 (태블릿) | — | 448 | 352 | 48 |
| 1024 | 76 | 948 | 480 | **234** |
| 1280 | 248 | 1032 | 480 | **276** |
| 1440 이상 | 248 | 1180 (셸 상한) | 480 | **350** |

- 텍스트 칼럼 480 = 성구 카드 `max-width: 30rem`. 제목에도 같은 상한을 걸어 **언어와 무관하게
  가운데 칼럼을 480 으로 고정**한다(영어 제목 "With the Light of the Gospel" 은 3rem/800 에서
  한 줄이 700px 을 넘는다 — 안 묶으면 좌우 날개가 통째로 먹힌다). CSS 는 아래 "붙이는 법" 참고.
- 히어로 높이는 PC **≈370px**, 모바일 **≈323px** (성구 줄 수에 따라 ±20).

### 한 장으로 PC·모바일을 다 쓰는 법 (실제로 붙인 방식)

에셋은 **한 장(테마당)** 이고, 폭에 따라 쓰임이 둘로 갈린다.

★ **PC — 글자 좌우에 '날개' 두 장으로 세운다.**
의사요소 두 개(`::before` 왼쪽 / `::after` 오른쪽)가 같은 그림을 `background-size: auto 100%` 로
깔고, **상자 폭이 곧 크롭 폭**이 된다(왼쪽은 `left bottom`, 오른쪽은 `right bottom`).
그림은 히어로 높이에 맞춰 줄고, 가운데 부분은 아예 그려지지 않는다.
날개 폭은 `clamp(180px, 25%, 300px)`.

★ **모바일·태블릿(<1024) — 성구 카드 아래 띠 한 장.**
텍스트 좌우에는 자리가 없다(성구 카드가 폭을 다 쓴다). 히어로에 `padding-bottom: 48%` 로
자리를 내고 `background-size: 100% auto` 로 장면 전체를 바닥에 깐다.
**48% 는 에셋 비율(2.09:1)의 역수**라, 폰이든 태블릿이든 장면이 세로로 딱 떨어진다.

### ★ 여기서 한 번 크게 틀렸다 — 폭맞춤(`100% auto`)으로 깔면 안 된다

처음엔 PC 도 `background-size: 100% auto; background-position: center bottom` 으로 깔았다.
"가로는 안 잘리고 위 하늘만 잘린다"는 계산이었는데, **그림이 히어로보다 세로로 훨씬 커진다.**
히어로 폭 1180 × 비율 0.5625 = 664px 인데 히어로 높이는 370px 이라, 실제로 보이는 건 아래 56% 뿐 —
예배당 지붕과 십자가가 히어로 위에서 목이 날아갔다. 스케일을 줄이면 이번엔 그림이 히어로 폭을
못 채운다. **장면이 프레임 세로를 다 쓰는 그림은 폭에 맞춰 깔 수 없다.**

날개 방식은 이 문제가 없다 — 높이를 먼저 맞추고 폭은 잘라 쓰기 때문에, 그림은 **한 번도 세로로
잘리지 않는다.** 대신 가운데가 버려질 뿐이고, 가운데는 원래 비워 둘 자리였다.

### 세로 구역표 (16:9 원본 기준)

| 구간 | 규칙 |
|---|---|
| 아래 **0~8%** | 평평한 빈 바닥. CSS 스크림이 이 띠를 페이지 배경색으로 녹인다. 발밑 그림자 정도만. |
| **8~82%** | 장면 구역. 세로로는 안 잘리므로 프레임을 다 써도 된다. |
| 위 **82~100%** | 빈 하늘. `mission-hero-process.py` 가 위 110px(≈14%)을 잘라 낸다. |

- 굽고 나면 에셋은 **1376×658 (2.09:1)** 이 된다. 이 비율이 모바일 띠 높이 48% 와 짝이다 —
  **하나를 바꾸면 다른 하나도 바꿔야 한다.**
- 내용이 y≈134(17%)보다 위로 올라가면 크롭 값(`TOP_CROP`)을 줄여야 한다.

### 가로 구역표

| 구간 | 규칙 |
|---|---|
| x **0~38%** | 왼쪽 무리 — **보내는 쪽** |
| x **38~62%** | **완전히 비운다.** 매끈한 하늘 그라데이션만. |
| x **62~100%** | 오른쪽 무리 — **닿은 쪽** |
| 우하단 모서리 (폭 10% × 높이 10%) | Gemini 워터마크 ✦ 자리. 평평하게 비운다 |

- 프롬프트에는 **24% / 76%** 로 더 빡빡하게 적어 두었다(위 A~C안). Gemini 는 그 선을 안 지키고
  38% 까지 밀고 들어왔는데, **날개 방식에서는 그래도 된다** — 안 쓰는 만큼만 잘려 나간다.
  프롬프트 쪽 숫자는 일부러 안 풀어 뒀다. 느슨하게 적으면 가운데까지 침범한다.
- 무리가 **가로로 38% 안에 모여 있어야** 한다. 좌우로 길게 늘어지면 날개 폭(최대 300px)에서 잘린다.
  B안이 여기서 떨어졌다 — 오른쪽 오두막이 혼자 프레임의 30% 를 먹었다.
- **능선(지평선)을 화면 가로로 관통시키지 말 것.** 두 언덕은 가운데로 오면서 완전히 사라진다.
  (모바일 띠에서는 가운데도 보이기 때문에, 이건 모바일에서 특히 티가 난다.)
- 좌·우 무리는 **시각적 무게가 비슷해야** 한다. 한쪽만 무거우면 가운데 정렬된 제목이 밀려 보인다.

### 라이트 / 다크 — 바탕색이 전부다

히어로는 **카드가 아니다.** 페이지 캔버스(`--app-canvas`) 위에 바로 얹힌다.
그림의 하늘색이 캔버스와 어긋나면 히어로 자리에 **직사각형 판떼기**가 뜬다.

| | 페이지 캔버스 | 글씨 | 그림 하늘 | 유일한 광원 |
|---|---|---|---|---|
| 라이트 | **`#f1f3f6`** (차가운 밝은 회색) | `#191722` | `#f1f3f6` 에서 시작해 지평선 쪽만 살짝 따뜻하게 | 오른쪽의 작은 등불 |
| 다크 | **`#131313`** (중성 근-검정) | `#e5e2e1` | `#131313` ~ `#1b1a19` | 오른쪽의 작은 등불(앰버) |

- ★ 라이트는 **크림색이 아니다.** `education/hero-light.webp` 는 흰 카드 안에 있어서 크림이지만,
  여기는 **차가운 회색 캔버스**다. 크림으로 시작하면 노란 띠가 생긴다.
- ★ 다크는 **남색도 아니고 따뜻한 차콜도 아니다.** `gospel_witness.webp` 의 남색 밤하늘(`#1b2440` 계열)을
  그대로 가져오면 `#131313` 위에서 **파란 직사각형**으로 뜬다. 중성 근-검정으로 번역해야 한다.
- 브랜드 파랑(`#3182f6`)을 덩어리로 쓰지 말 것. 눈썹 텍스트와 성구 따옴표가 브랜드색이라
  **파랑끼리 먹힌다.** 파랑은 하늘의 아주 옅은 톤으로만.
- 앰버(등불빛)는 **작게 한 군데**만. 이 화면의 `--amber` 는 국내 협력 섹션이 쓰는 색이라
  히어로에서 크게 쓰면 위계가 흔들린다.

### 이 화면만의 금지 목록

- **지구본·세계지도를 크게 그리지 말 것.** 바로 아래에 실제 인터랙티브 지구본 카드(`WorldGlobe`)가 있다.
  같은 그림이 두 번 나오면 진짜 지구본이 장식처럼 보인다. (지도는 **작은 소품**으로만 허용 — B안 참고.)
  A안 오른쪽의 오두막·나무가 그 자리를 대신한다.
- 국기·특정 국가를 알아볼 수 있게 그리지 말 것. 실제 파송국 목록이 아래에 데이터로 뜬다.
- 십자가는 **왼쪽 예배당 지붕 위 한 개**까지. 빛줄기 십자가·거대한 십자가 금지.
- 사람(인물) 금지 — 이 앱의 화자는 양이다.

---

## A안 · 「보내는 언덕, 닿은 언덕」 (메인)

왼쪽은 참빛교회 언덕, 오른쪽은 지구 반대편 언덕. 하늘은 **왼쪽이 새벽, 오른쪽이 저녁**이다 —
같은 하늘 아래 다른 시각이라는 것이 가운데 빈 공간의 의미가 된다.

미소는 딱 한 군데: **배웅하던 새끼양 하나가 여행 가방 손잡이를 붙들고 안 놓는다.**
울지도, 넘어지지도 않는다. 그냥 조용히 붙들고 있다.

### 1. A안 · 라이트 테마 프롬프트

```
A very wide 16:9 background illustration for the top of a church mission page,
LIGHT MODE. It sits directly on the page canvas, whose colour is exactly #f1f3f6 — a
cool, light blue-grey. The artwork must begin FROM that exact colour at the top and
outer edges so it melts into the page with no visible rectangle. Style: cozy-epic
children's storybook illustration — soft flat shapes with a subtle grain texture,
rounded friendly forms, gentle airy light, thin soft grey-blue line work, no black
outlines. Use the SAME chubby white sheep character as the attached reference image:
cream-white wool, tiny round hooves, small calm closed smiles.

Mood: quiet, sincere and warm — a sending-off at first light, not a joke. Tender
rather than funny.

Composition is critical — the middle of the picture is reserved for large type:
- The CENTRE of the frame, from 24% to 76% of the width, top to bottom, must be
  COMPLETELY EMPTY: nothing but a smooth, even sky gradient. No hills, no ground, no
  clouds, no birds, no light rays, no dotted lines, no texture, no detail at all.
- All the artwork lives in the LEFT quarter (x 0-24%) and the RIGHT quarter
  (x 76-100%) as two small separate clusters of similar visual weight.
- Everything important must sit in the BOTTOM 42% of the frame. The upper half is
  plain empty sky and will be cropped away.
- Keep the BOTTOM 10% of the frame as flat, plain, empty ground — only soft contact
  shadows there.
- Do NOT draw a horizon line that runs across the whole picture. The two low grassy
  hillocks exist only under the left and right clusters and must fade away completely
  before they reach the middle — the central half of the image has no ground at all.
- Leave the BOTTOM-RIGHT CORNER (about 10% of the width and 10% of the height) as
  plain flat empty ground with no detail at all.
- Nothing important within 3% of the left or right edge.

Palette: a pale, cool morning. The sky is #f1f3f6 at the top and outer corners,
warming very slightly toward a pale cream-grey near the two hillocks. Keep everything
HIGH-KEY, pastel and low-contrast — dark charcoal headline text is drawn on top of the
middle. The deepest tone anywhere is a soft grey-blue used only for thin outlines and
long soft shadows. No dark masses, no saturated colours, no strong blue.

Scene — the left hill sends, the right hill receives:
- LEFT cluster (the home church, just before dawn): a very small white chapel with a
  pitched roof and ONE tiny cross on the ridge, its round window glowing a soft warm
  yellow. In front of it, one chubby sheep stands ready to leave with a small round
  suitcase and a rolled blanket on its back, its face turned toward the viewer in a
  gentle three-quarter-FRONT angle with a calm, resolute little smile. Two older sheep
  stand beside it with one hoof each resting on its shoulder, heads bowed in prayer,
  eyes closed as soft curved lines. And one TINY lamb is quietly holding on to the
  suitcase handle with both hooves, not crying, not being dragged — just not letting
  go. That small detail is the only touch of humour in the whole picture; keep it
  understated.
- RIGHT cluster (far away, early evening): a low hill with two or three simple
  round-roofed huts and one broad-leaved tree. The travelling sheep has arrived and
  kneels on one knee holding a small brass oil lamp with a warm flame; a tiny rabbit
  and a small hedgehog lean in, and the rabbit is lighting its own even smaller lamp
  from that flame. Their faces are turned toward the viewer in a gentle
  three-quarter-FRONT angle, both eyes visible, the same size and evenly spaced. A soft
  warm pool of light falls on the ground around them — the ONLY warm accent in the
  picture, and it must stay small and low.

Do NOT draw a globe, a world map, an aeroplane, a ship, a dotted travel route, a bridge,
a rainbow or a beam of light connecting the two sides — the middle stays empty. Do NOT
draw humans, flags, or any recognisable country. Do NOT draw speech bubbles. Do NOT
draw any user-interface elements, buttons, pills, panels or rounded rectangles. The
background must be ONE continuous soft gradient — never a rectangular block, window or
box of a different colour, and no straight background edges anywhere. No text, no
letters, no numbers, no logos. No frames, no borders, no vignette, no rounded corners.
```

### 2. A안 · 다크 테마 프롬프트

```
A very wide 16:9 background illustration for the top of a church mission page, DARK
MODE. It sits directly on the page canvas, whose colour is exactly #131313 — a NEUTRAL
near-black, NOT navy blue, NOT warm brown charcoal, NOT pure black. The artwork must
begin FROM that exact colour at the top and outer edges so it melts into the page with
no visible rectangle. Style: cozy-epic children's storybook illustration — soft flat
shapes with a subtle grain texture, rounded friendly forms, warm rim lighting, no black
outlines. Use the SAME chubby white sheep character as the attached reference image,
but here its wool reads as a soft warm grey, never bright white.

Mood: quiet, sincere and warm — a sending-off in the blue hour, not a joke.

Composition is critical — the middle of the picture is reserved for large type:
- The CENTRE of the frame, from 24% to 76% of the width, top to bottom, must be
  COMPLETELY EMPTY: nothing but a smooth, even dark gradient. No hills, no ground, no
  stars, no clouds, no light rays, no dotted lines, no texture, no detail at all.
- All the artwork lives in the LEFT quarter (x 0-24%) and the RIGHT quarter
  (x 76-100%) as two small separate clusters of similar visual weight.
- Everything important must sit in the BOTTOM 42% of the frame. The upper half is
  plain empty sky and will be cropped away.
- Keep the BOTTOM 10% of the frame as flat, plain, empty ground.
- Do NOT draw a horizon line that runs across the whole picture. The two low hillocks
  exist only under the left and right clusters and must fade away completely before
  they reach the middle — the central half of the image has no ground at all.
- Leave the BOTTOM-RIGHT CORNER (about 10% wide and 10% tall) as plain flat empty
  ground with no detail at all.
- Nothing important within 3% of the left or right edge.

Palette: a neutral near-black night. #131313 at the top and outer corners, opening only
slightly to #1b1a19 and a faint grey-taupe #232120 just above the two hillocks. NO navy,
NO indigo, NO teal — the reference image's blue night sky must be re-translated into
neutral near-black. Keep everything muted and very low-contrast; light grey headline
text is drawn on top of the middle. The ONLY bright accents are two small warm amber
lights (#e0a458): the chapel window on the left and the oil lamp on the right. They must
stay small, low and local — no large glow, no god rays, no bloom across the sky.

Scene — the left hill sends, the right hill receives:
- LEFT cluster (the home church, deep blue hour): a very small dark chapel with a
  pitched roof and ONE tiny cross on the ridge, its round window glowing warm amber and
  spilling a short pool of light on the ground. In front of it, one sheep stands ready
  to leave with a small round suitcase and a rolled blanket on its back, rim-lit warmly
  from the window, face turned toward the viewer in a gentle three-quarter-FRONT angle
  with a calm, resolute little smile. Two older sheep stand beside it with one hoof each
  on its shoulder, heads bowed in prayer, eyes closed as soft curved lines. And one TINY
  lamb is quietly holding on to the suitcase handle with both hooves, not crying, not
  being dragged — just not letting go. That small detail is the only touch of humour in
  the whole picture; keep it understated.
- RIGHT cluster (far away, night): a low hill with two or three simple round-roofed
  huts and one broad-leaved tree, all in near-black silhouette. The travelling sheep
  kneels on one knee holding a small brass oil lamp whose warm flame is the brightest
  point of the picture; a tiny rabbit and a small hedgehog lean into that light, and the
  rabbit is lighting its own even smaller lamp from the flame. Their faces are turned
  toward the viewer in a gentle three-quarter-FRONT angle, both eyes visible, the same
  size and evenly spaced.

A few very faint stars are allowed ONLY in the outer top corners of the left and right
quarters — never in the central half, and never as a scattered starfield.

Do NOT draw a globe, a world map, an aeroplane, a ship, a dotted travel route, a bridge
or a beam of light connecting the two sides — the middle stays empty. Do NOT draw
humans, flags, or any recognisable country. Do NOT draw speech bubbles. Do NOT draw any
user-interface elements, buttons, pills, panels or rounded rectangles. The background
must be ONE continuous soft gradient — never a rectangular block, window or box of a
different colour, and no straight background edges anywhere. No text, no letters, no
numbers, no logos. No frames, no borders, no vignette, no rounded corners.
```

---

## B안 · 「시차 너머의 기도」  *(뽑아 봤고 탈락 — 2026-09-11)*

> 왼쪽 촛불 기도 장면은 A안보다 좋았다. 떨어진 이유는 오른쪽이다 —
> **오두막 하나가 프레임의 30% 를 먹어** 날개 폭(최대 300px)에서 잘렸고, 라이트에서 큰 덩어리로 떴다.
> 다시 쓴다면 오른쪽 오두막을 "작게, 뒤로" 라고 못 박아야 한다.

같은 좌우 구조인데 장면이 **기도와 편지**다. 왼쪽은 한밤중 교회에서 선교 편지를 펼쳐 놓고 기도하는 양들,
오른쪽은 지구 반대편의 아침, 그 편지를 받아 읽는 선교사 양.
미소는 역시 한 군데 — **옆의 새끼양이 봉투를 거꾸로 털어 보고 있다.** (뭐 더 없나.)

히어로 아래 CTA("선교를 위해 함께 기도해주세요")와 그림이 그대로 이어지는 안이다.

### 3. B안 · 라이트 테마 프롬프트

```
A very wide 16:9 background illustration for the top of a church mission page, LIGHT
MODE. It sits directly on the page canvas, whose colour is exactly #f1f3f6 — a cool,
light blue-grey — and the artwork must begin FROM that exact colour at the top and outer
edges so it melts into the page with no visible rectangle. Style: cozy-epic children's
storybook illustration — soft flat shapes with subtle grain, rounded friendly forms,
thin soft grey-blue line work, no black outlines. Use the SAME chubby white sheep
character as the attached reference image.

Mood: quiet devotion across a time difference — sincere and warm, not comic.

Composition is critical — the middle of the picture is reserved for large type:
- The CENTRE of the frame, from 24% to 76% of the width, top to bottom, must be
  COMPLETELY EMPTY: nothing but a smooth, even sky gradient, no detail whatsoever.
- All the artwork lives in the LEFT quarter (x 0-24%) and the RIGHT quarter
  (x 76-100%) as two small separate clusters of similar visual weight.
- Everything important sits in the BOTTOM 42% of the frame; the upper half is plain
  empty sky that will be cropped away.
- Keep the BOTTOM 10% flat, plain and empty. No horizon line crosses the middle — the
  two low hillocks fade out completely before they reach the centre.
- Leave the BOTTOM-RIGHT CORNER (about 10% wide and 10% tall) plain and empty.
- Nothing important within 3% of the left or right edge.

Palette: pale and cool. Sky #f1f3f6 at the top and outer corners, warming slightly to a
pale cream-grey near the ground. HIGH-KEY, pastel, low-contrast — dark charcoal headline
text is drawn over the middle. No dark masses, no saturated colours, no strong blue.

Scene — the same prayer, twelve hours apart:
- LEFT cluster (night at the home church): three sheep kneel close together around a
  single small candle set on a low wooden bench, heads bowed, eyes closed as soft curved
  lines. A few handwritten letters lie open on the bench beside the candle, and a small
  folded paper map is pinned to a short board behind them with two or three tiny pins —
  keep that map SMALL, plain and unreadable, no continents, no country shapes. The
  candle's warm light is the only warm accent on this side.
- RIGHT cluster (morning far away): the missionary sheep sits on a low step in front of
  a simple round-roofed hut, holding an opened letter with both hooves and reading it
  with a soft, moved smile, eyes shining. Beside it a tiny lamb holds the empty envelope
  upside-down and shakes it, checking whether anything else is inside — that is the only
  touch of humour in the picture, and it must stay small and quiet. A small enamel mug
  sits on the step. Both faces are turned toward the viewer in a gentle
  three-quarter-FRONT angle, both eyes visible, the same size and evenly spaced.

Do NOT draw a globe, a large world map, an aeroplane, a dotted travel route, a bridge or
a beam of light connecting the two sides — the middle stays empty. Do NOT draw humans,
flags, or any recognisable country. Do NOT draw speech bubbles. Do NOT draw any
user-interface elements, buttons, pills, panels or rounded rectangles. The background
must be ONE continuous soft gradient — never a rectangular block, window or box of a
different colour, and no straight background edges anywhere. No text, no letters, no
numbers, no logos. No frames, no borders, no vignette, no rounded corners.
```

### 4. B안 · 다크 테마 프롬프트

```
A very wide 16:9 background illustration for the top of a church mission page, DARK
MODE. It sits directly on the page canvas, whose colour is exactly #131313 — a NEUTRAL
near-black, NOT navy, NOT warm brown charcoal, NOT pure black — and the artwork must
begin FROM that exact colour at the top and outer edges so it melts into the page with
no visible rectangle. Style: cozy-epic children's storybook illustration — soft flat
shapes with subtle grain, rounded friendly forms, warm rim lighting, no black outlines.
Use the SAME chubby white sheep character as the attached reference image, but here its
wool reads as soft warm grey, never bright white.

Mood: quiet devotion across a time difference — sincere and warm, not comic.

Composition is critical — the middle of the picture is reserved for large type:
- The CENTRE of the frame, from 24% to 76% of the width, top to bottom, must be
  COMPLETELY EMPTY: nothing but a smooth, even dark gradient — no stars, no clouds, no
  detail whatsoever.
- All the artwork lives in the LEFT quarter (x 0-24%) and the RIGHT quarter
  (x 76-100%) as two small separate clusters of similar visual weight.
- Everything important sits in the BOTTOM 42% of the frame; the upper half is plain
  empty sky that will be cropped away.
- Keep the BOTTOM 10% flat, plain and empty. No horizon line crosses the middle — the
  two low hillocks fade out completely before they reach the centre.
- Leave the BOTTOM-RIGHT CORNER (about 10% wide and 10% tall) plain and empty.
- Nothing important within 3% of the left or right edge.

Palette: neutral near-black. #131313 at the top and outer corners, opening only slightly
to #1b1a19 and a faint grey-taupe #232120 just above the ground. NO navy, NO indigo, NO
teal. Very low contrast — light grey headline text is drawn over the middle. The ONLY
bright accents are two small warm amber lights (#e0a458): the candle on the left and the
early sunlight on the right, both small, low and local. No bloom across the sky.

Scene — the same prayer, twelve hours apart:
- LEFT cluster (deep night at the home church): three sheep kneel close together around
  a single small candle on a low wooden bench, heads bowed, eyes closed as soft curved
  lines, their faces and wool rim-lit warmly by that one flame. A few handwritten letters
  lie open on the bench, and a small folded paper map is pinned to a short board behind
  them with two or three tiny pins — keep that map SMALL, plain and unreadable, no
  continents, no country shapes.
- RIGHT cluster (first light far away): the missionary sheep sits on a low step in front
  of a simple round-roofed hut, holding an opened letter with both hooves and reading it
  with a soft, moved smile; a narrow band of warm amber dawn light hugs the right edge
  behind the hut and rim-lights its back. Beside it a tiny lamb holds the empty envelope
  upside-down and shakes it, checking whether anything else is inside — the only touch of
  humour, small and quiet. Both faces are turned toward the viewer in a gentle
  three-quarter-FRONT angle, both eyes visible, the same size and evenly spaced.

A few very faint stars are allowed ONLY in the outer top corner of the left quarter —
never in the central half, never as a scattered starfield.

Do NOT draw a globe, a large world map, an aeroplane, a dotted travel route, a bridge or
a beam of light connecting the two sides — the middle stays empty. Do NOT draw humans,
flags, or any recognisable country. Do NOT draw speech bubbles. Do NOT draw any
user-interface elements, buttons, pills, panels or rounded rectangles. The background
must be ONE continuous soft gradient — never a rectangular block, window or box of a
different colour, and no straight background edges anywhere. No text, no letters, no
numbers, no logos. No frames, no borders, no vignette, no rounded corners.
```

---

## C안 · 무캐릭터 안전판  *(쓰지 않았다 — A안이 한 번에 통과)*

A·B 가 계속 가운데를 침범하거나, 라이트에서 노랗게/다크에서 파랗게 나올 때 쓰는 **보험**이다.
캐릭터 없이 두 언덕의 실루엣과 불빛만으로 간다 — 글자가 절대 안 죽는다.
(캐릭터가 빠지면 유머도 빠진다. 그래서 A·B 가 먼저다.)

### 5. C안 · 라이트 테마 프롬프트

```
A very wide 16:9 background illustration for the top of a church mission page, LIGHT
MODE, with NO characters at all. It sits directly on the page canvas, whose colour is
exactly #f1f3f6 — a cool, light blue-grey — and the artwork must begin FROM that exact
colour at the top and outer edges so it melts into the page with no visible rectangle.
Style: cozy children's storybook illustration — soft flat shapes with subtle grain, no
outlines on the large forms, gentle airy light.

Subject: two distant hills at first light, one on each side of an empty sky.
- LEFT (x 0-24%): a tiny village on a low hill — four or five very simple house shapes
  with pitched roofs, and among them ONE small chapel with a single tiny cross on its
  ridge and a round window glowing soft warm yellow. Two or three slim trees.
- RIGHT (x 76-100%): another low hill far away — three or four simple round-roofed huts
  and one broad-leaved tree, with two or three tiny warm window lights. A few very small
  birds rising near its outer upper edge.
Everything is small, pale and distant, like something seen from very far away.

Composition is critical:
- The CENTRE of the frame, from 24% to 76% of the width, top to bottom, must be
  COMPLETELY EMPTY: nothing but a smooth, even sky gradient. No hills, no mist, no
  birds, no rays may enter it.
- Everything important sits in the BOTTOM 42% of the frame; the upper half is plain
  empty sky that will be cropped away.
- No continuous horizon line: each hill must dip and dissolve away completely before it
  reaches the middle, so the central half of the image is pure empty sky.
- Keep the BOTTOM 10% flat, plain and empty, and leave the BOTTOM-RIGHT CORNER (about
  10% wide and 10% tall) with no detail at all.
- Nothing important within 3% of the left or right edge.

Palette: sky #f1f3f6 at the top and outer corners, warming very slightly to a pale
cream-grey near the two hills. HIGH-KEY, pastel and low-contrast; the deepest tone is a
soft grey-blue used only for the furthest hill. No dark masses, no saturated colours, no
strong blue. The two clusters of tiny warm window lights are the only warm accents.

Do NOT draw a sun disc, a moon, a globe, a world map, an aeroplane, a dotted route, a
bridge or a beam of light connecting the two sides. Do NOT draw people, animals or any
characters. Do NOT draw flags or any recognisable country. Do NOT draw any
user-interface elements, buttons, pills, panels or rounded rectangles. The background
must be ONE continuous soft gradient — never a rectangular block, window or box of a
different colour, and no straight background edges anywhere. No text, no letters, no
numbers, no logos. No frames, no borders, no vignette, no rounded corners.
```

### 6. C안 · 다크 테마 프롬프트

```
A very wide 16:9 background illustration for the top of a church mission page, DARK
MODE, with NO characters at all. It sits directly on the page canvas, whose colour is
exactly #131313 — a NEUTRAL near-black, NOT navy, NOT warm brown charcoal, NOT pure
black — and the artwork must begin FROM that exact colour at the top and outer edges so
it melts into the page with no visible rectangle. Style: cozy children's storybook
illustration — soft flat shapes with subtle grain, no outlines on the large forms.

Subject: two distant hills at night, one on each side of an empty sky.
- LEFT (x 0-24%): a tiny village on a low hill in near-black silhouette — four or five
  very simple house shapes with pitched roofs, and among them ONE small chapel with a
  single tiny cross on its ridge and a round window glowing warm amber. Two or three
  slim trees.
- RIGHT (x 76-100%): another low hill far away — three or four simple round-roofed huts
  and one broad-leaved tree, with two or three tiny warm window lights.
Everything is small and distant, like something seen from very far away.

Composition is critical:
- The CENTRE of the frame, from 24% to 76% of the width, top to bottom, must be
  COMPLETELY EMPTY: nothing but a smooth, even dark gradient. No hills, no mist, no
  stars, no rays may enter it.
- Everything important sits in the BOTTOM 42% of the frame; the upper half is plain
  empty sky that will be cropped away.
- No continuous horizon line: each hill dips and dissolves away completely before it
  reaches the middle.
- Keep the BOTTOM 10% flat, plain and empty, and leave the BOTTOM-RIGHT CORNER (about
  10% wide and 10% tall) with no detail at all.
- Nothing important within 3% of the left or right edge.

Palette: #131313 at the top and outer corners, opening only slightly to #1b1a19 and a
faint grey-taupe #232120 just above the two hills. NO navy, NO indigo, NO teal. Very low
contrast. The small warm amber window lights (#e0a458) are the only accents — tight and
local, with no glow spreading into the sky.

A few very faint stars are allowed ONLY in the outer top corners of the left and right
quarters — never in the central half, never as a scattered starfield.

Do NOT draw a moon, a globe, a world map, an aeroplane, a dotted route, a bridge or a
beam of light connecting the two sides. Do NOT draw people, animals or any characters.
Do NOT draw flags or any recognisable country. Do NOT draw any user-interface elements,
buttons, pills, panels or rounded rectangles. The background must be ONE continuous soft
gradient — never a rectangular block, window or box of a different colour, and no
straight background edges anywhere. No text, no letters, no numbers, no logos. No
frames, no borders, no vignette, no rounded corners.
```

---

## 붙인 코드 (지금 돌아가는 것)

세 파일이 한 세트다 — 하나만 빠지면 테마 토글 때 그림이 한 박자 늦게 뜨거나 첫 진입에서 깜빡인다.

### 1) `src/pages/Mission/Mission.css`

`.mission-hero` 가 `--mission-canvas`(페이지 캔버스 색을 RGB 3값으로) 와 `--mission-hero-art` 를 들고,
`::before`/`::after` 가 날개를 그린다. 모바일 미디어쿼리에서 `::after` 를 끄고 `::before` 를 바닥 띠로 바꾼다.

- 히어로는 카드가 아니라 **페이지 캔버스 위에 바로** 얹히므로, 그림의 안쪽·바닥(모바일은 네 변 전부)을
  캔버스 색 그라데이션으로 녹여야 직사각형 판떼기로 안 보인다.
- 날개 안쪽 모서리는 `mask-image: linear-gradient(90deg, #000 0 58%, transparent 100%)` 로 흘려보낸다.
- 모바일 띠는 마스크 대신 **캔버스 색 배경 레이어 3장**(위·아래·좌우)을 그림 위에 얹는다.
  마스크 두 장을 겹치려면 `mask-composite` 가 필요해서, 지원 폭이 넓은 쪽을 골랐다.
- `.hero-title` 에 `max-width: 30rem` — 언어와 무관하게 가운데 칼럼을 480px 로 묶는다.

### 2) `src/utils/themeAssets.ts`

```ts
import missionHeroLight from '../assets/mission/hero-light.webp'
import missionHeroDark from '../assets/mission/hero-dark.webp'

/** /mission 히어로 좌우 삽화 (Mission.css) — 한 장이 PC 날개 · 모바일 바닥 띠를 겸한다 */
export const MISSION_HERO: ThemePair = { light: missionHeroLight, dark: missionHeroDark }
```

`ROUTE_ASSETS` 에 `{ match: /^\/mission$/, pairs: [MISSION_HERO] }` 한 줄 — 첫 화면에 항상 뜨는 배경이라
매니페스트에 올린다(테마 토글 직전 반대 테마 파일을 미리 받아 크로스페이드에 같이 싣는다).

### 3) `src/pages/Mission/Mission.tsx`

```tsx
const heroArtReady = useThemeArt(MISSION_HERO)
...
<section className={`mission-hero${heroArtReady ? ' is-art-ready' : ''}`}>
```

---

## 붙이고 확인한 것 (2026-09-11)

- [x] 라이트/다크 모두 히어로 자리에 **네모난 판떼기**가 안 보인다
- [x] 다크가 파랗지 않다 — `#131313` 위에서 중성으로 앉는다
- [x] 1568 / 1371 / 1224 폭에서 글자·성구 카드에 그림이 안 겹친다
- [x] 세로로 안 잘린다(예배당 십자가·나무 꼭대기까지 다 보인다)
- [x] 모바일 띠에서 두 무리가 온전히 들어오고, 네 변이 캔버스로 녹는다
- [x] 히어로 아래 통계 카드와의 경계에 가로줄이 없다
- [x] 워터마크 ✦ 가 지워졌다(4배 확대에서 아주 옅은 얼룩만 남음, 등배에서는 안 보인다)
- [x] 한 장 45KB 이하 (42.2 / 28.1KB)

다음에 다시 뽑는다면 프롬프트에 한 줄 더 넣을 것:
**"each cluster must fit within its own third of the frame — no single object wider than 15% of the width"**.
B안이 떨어진 이유가 딱 그거였다.
