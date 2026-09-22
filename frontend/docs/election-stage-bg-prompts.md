# 선거 발표 화면 좌우 삽화 프롬프트 (Gemini용)

`/admin/elections` → 선거 현황판 → **'발표 화면'** 을 켜면 뜨는 전체 화면
(`src/pages/Admin/components/ElectionStage.tsx` · `ElectionStage.css`)의 **배경**.
라이트/다크 각 1장, 총 2장으로 PC·프로젝터를 다 덮는다.

| | 파일명 |
|---|---|
| 라이트 | `public/images/election/stage-{left,right}-light.webp` |
| 다크 | `public/images/election/stage-{left,right}-dark.webp` |

> ## 2026-09-22 — **B안 채택, 붙였다.** 다시 뽑을 때 먼저 읽을 것
>
> 받아 보고 **설계를 두 군데 고쳤다.** 아래 프롬프트는 그대로 유효하지만, 실측으로 바뀐 값은
> 본문에 반영해 뒀다.
>
> 1. **한 장 → 테마당 두 장(좌/우 패널).** 원래는 /mission 처럼 한 장을 좌우 날개가 끝만
>    잘라 쓰는 **높이맞춤**(`background-size: auto 100%`)이었다. 그런데 받아 온 그림은
>    **왼쪽 무리가 프레임의 48.7%** 를 먹었다 — 날개 폭은 23% 라, 그대로 깔면 돌을 안고 선
>    새끼양(이 그림의 유일한 미소)이 통째로 잘린다.
>    → **폭맞춤**(`100% auto`)으로 바꾸고, `election-stage-process.py` 가 좌우를
>    **가로 720px 로 같게** 잘라 두 장으로 굽는다. 두 패널의 가로가 같아야 배율이 같다.
>    오른쪽 패널의 왼쪽 절반이 빈 하늘인 건 낭비가 아니라 **배율을 맞추는 값**이다.
> 2. **다크 하늘을 다시 칠했다.** 원본 하늘이 슬레이트 블루 `#2b3945` 라 `#131313` 위에
>    **파란 세로 판떼기**로 떴다. 스크립트가 밝기 램프를 태워 하늘만 캔버스로 옮긴다
>    (양털은 안 건드린다). 덤으로 순백 양털(밝기 255)을 219 로 눌렀다 — 안 누르면
>    **양이 카드의 흰 글자보다 밝아서** 눈이 양한테 먼저 간다.
>
> 3. **붙여 놓고 "구도가 안 맞는다"는 지적을 받고 두 군데 더 고쳤다.**
>    - 패널 윗변이 **가로줄로 보여** 삽화가 화면에 붙인 네모 스티커처럼 읽혔다.
>      페이드가 짧았던 탓(`TOP=250` · 16%). **`TOP=120` · 32%** 로 바꿔 하늘을 100px 더 확보하고
>      그 안에서 페이드가 끝나게 했다. **둘은 한 쌍이다** — `TOP` 만 내리면 페이드가 나무를 갉는다.
>    - 좌우 칼럼이 **제목 → 손글씨 → (빈 공간 수백 px) → 삽화** 로 끊겨 손글씨와 삽화가 따로 놀았다.
>      `.els-side` 가 `padding-bottom: calc(var(--els-art-h) * 0.6)` 로 삽화 자리를 비우고
>      손글씨를 `margin-top: auto` 로 그 바로 위에 붙여, **한 칼럼으로 이어지게** 했다.
>      → 날개 폭을 바꾸면 `--els-wing` 하나만 고치면 된다(높이·여백이 따라온다).
>
> 다음에 다시 뽑는다면 프롬프트에 이 한 줄을 더 넣을 것:
> **"each cluster must fit within 12% of the frame width — no cluster wider than that"**.
> 위 1번이 딱 그것 때문이었다. 다크에는 **"the sky must be a NEUTRAL near-black, never slate
> blue or blue-grey"** 를 한 번 더 못 박는다(이미 적혀 있는데도 슬레이트로 나왔다).

컨셉은 앱 전체와 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**.
다만 이 화면은 게임·수집 화면이 아니라 **교회가 직분자를 뽑는 자리**다 —
장난스러우면 안 된다. 톤은 **차분한 장면 + 한 군데만 미소**.

> **삽화가 없어도 화면은 이미 선다.** `ElectionStage.css` 의 그라데이션 바탕이 기본값이고,
> webp 가 도착하면 그 위에 좌우 날개로 얹혀 페이드인한다. 파일이 없으면 조용히 404 나고 끝이다 —
> 그러니 **급하게 아무거나 붙이지 말 것.** 마음에 안 들면 안 붙인 상태가 기준선이다.

미리 보기: **`npm run dev` → `http://localhost:5173/#/dev/election-stage`**
(진행 중인 선거·로그인 없이 표본 데이터로 실물 컴포넌트를 그대로 띄운다.
'득표 가리기'도 거기서 진짜로 동작한다.)

---

## 이 화면의 성격 = "회중이 함께 보는 자리"

같은 데이터를 두 화면이 쓴다.

| | 화면 | 성격 |
|---|---|---|
| 관리자 현황판 | `ElectionBoard` | **일하는 화면.** 회차 열고 닫기·종이 표·미투표자 명단 |
| 발표 화면 | `ElectionStage` | **같이 보는 화면.** 도구가 없다. 큰 숫자와 여백뿐 |

그래서 좌우 여백이 생겼다. 프로젝터에서 원래 버려지는 자리다.
거기에 **제목·손글씨·삽화**를 둬서 "표를 세는 화면"이 아니라 **"함께 세우는 자리"** 로 읽히게 한다.

### 소품이 겹치면 안 된다 (같은 마을 연작이라 특히)

| 화면 | 이미 쓴 소품 | 여기서 |
|---|---|---|
| 홈 공지 배너 | 마을 알림판 · 압정 · 펄럭이는 종이 | **금지** |
| 교회소식(`/news`) | 종이 확성기 · 놋쇠 손종 · 종이비행기 | **금지** |
| 헌금 | 양들의 헌금함 | **금지** — 투표함과 모양이 너무 비슷하다 |
| 공지 아카이브 | 나무 서류함 · 종이 묶음 · 고무 도장 | **금지** |
| **발표 화면** | **언덕 위 작은 예배당 · 낮은 돌담 · 들풀과 잎사귀 · 구름** | 여기 전용 |

★ **투표함(ballot box)을 그리지 말 것.** 화면 안에 이미 투표함 선화 아이콘이 두 번 나온다
(`.els-badge`). 삽화에 또 그리면 같은 상징이 세 번이다.
헌금함 삽화와도 형태가 겹쳐서, 다크에서 두 화면이 같은 그림으로 보인다.

---

## 레이아웃 제약 (프롬프트의 핵심)

### 한 장이 어떻게 두 장이 되는가 — **좌우 패널**

제미나이에서는 **테마당 한 장(16:9)** 을 받는다. 그걸 `election-stage-process.py` 가
**좌우 패널 두 장(각 720×518)** 으로 자르고, 의사요소 두 개(`::before` 왼쪽 /
`::after` 오른쪽)가 각각 **폭맞춤**으로 깐다.

```css
--els-wing: clamp(240px, 26vw, 500px);           /* ★ 크기 손잡이는 이거 하나 */
--els-art-h: calc(var(--els-wing) / 1.111);      /* 패널 비율 720×648 */

width: var(--els-wing);
background-size: 100% auto;                      /* 상자 폭에 맞춰 줄인다 */
background-position: left bottom;   /* ::before → stage-left-*.webp  */
background-position: right bottom;  /* ::after  → stage-right-*.webp */

.els-side { padding-bottom: calc(var(--els-art-h) * 0.6); }  /* 손글씨가 삽화 위에서 끝나게 */
```

- **두 패널의 가로가 같아야 한다(720px).** 폭맞춤은 패널 폭으로 배율이 정해지므로,
  폭이 다르면 오른쪽 예배당이 왼쪽 양들보다 커져 원근이 깨진다.
- 위·안쪽 모서리 페이드는 **CSS 마스크가 아니라 알파로 구워져 있다.** 무대 배경에
  라디얼 워시가 깔려 있어서, 캔버스색으로 덮으면 그 워시 위에 네모가 뜬다.
- 패널이 화면에서 차지하는 높이 = 날개 폭 ÷ 1.39. 1920 기준 **470 × 338px**(높이의 31%).

★ 왜 높이맞춤(`auto 100%`, /mission 방식)이 아닌가 — 위 2026-09-22 기록 참고.
한 장으로 쓰려면 **무리가 프레임의 12% 안에** 들어와야 하는데 실제로는 48.7% 로 나왔다.
폭맞춤 + 패널 분리는 그 제약에서 자유롭다(무리가 넓으면 그만큼 더 줄여 깔면 그만이다).

### 자르는 자리 (1376×768 원본 기준 · 실측)

| | 값 | 왜 |
|---|---|---|
| `PANEL_W` | 720 | 좌우 공통. **이 값이 곧 배율이다** — 바꾸면 좌우가 같이 커지고 작아진다 |
| `TOP` | 120 | 위는 빈 하늘. 768−120=648 → 패널 1.111:1. **`TOP_FADE`(32%)와 한 쌍** |
| 왼쪽 패널 | x 0~720 | 왼쪽 무리가 x 0~670 이라 뒤로 50px 여유 |
| 오른쪽 패널 | x 656~1376 | 오른쪽 무리가 x 925~ 라 패널 안에서 269부터 시작 |

**다시 뽑으면 이 숫자를 다시 재야 한다.** 스크립트가 원본이 1376×768 이 아니면 경고한다.

### 가로 구역표

| 구간 | 규칙 |
|---|---|
| x **0~16%** | 왼쪽 무리 — 주인공이 여기 다 들어와야 한다 |
| x **16~20%** | 여운만 (풀·잎사귀 끄트머리). 잘려도 되는 것 |
| x **20~80%** | **완전히 비운다.** 매끈한 하늘 그라데이션만 |
| x **80~84%** | 여운만 |
| x **84~100%** | 오른쪽 무리 |

- 프롬프트에는 **12% / 88%** 로 더 빡빡하게 적어 뒀다. Gemini 는 이 선을 안 지키고 밀고 들어오는데,
  **날개 방식에서는 그래도 된다** — 안 쓰는 만큼만 잘려 나간다. 느슨하게 적으면 가운데까지 온다.
- **능선(지평선)을 화면 가로로 관통시키지 말 것.** 두 언덕은 가운데로 오면서 완전히 사라진다.

### 세로 구역표 — ★ 여기가 이 화면만의 제약

좌우 여백에는 **글씨가 얹힌다.** 왼쪽은 제목("2026년 교회 선거")과 손글씨 두 덩이,
오른쪽은 손글씨 두 덩이. 실측으로 **위에서 52%** 까지 글씨가 내려온다.

| 구간 | 규칙 |
|---|---|
| 위 **0~60%** | **완전히 빈 하늘.** 제목·손글씨가 지나간다. 구름 한 조각도 금지 |
| **60~97%** | 장면 구역. 세로로는 안 잘리므로 여기를 다 써도 된다 |
| 아래 **97~100%** | 땅으로 자연스럽게 끝낸다. 여기는 **화면 맨 아랫변**이라 페이드가 없다 |

★ **아래로 스크림(어둡게 덮는 띠)이 없다.** 그림의 아랫변이 곧 화면의 아랫변이다.
그러니 **바닥은 잘린 단면이 아니라 "땅"으로 끝나야 한다** — 풀밭·흙·돌 같은.
공중에 뜬 물체가 아랫변에 걸리면 잘린 티가 난다.

### 좌우 바깥 모서리 = 화면 바깥 모서리

안쪽(가운데 쪽) 모서리는 CSS 마스크가 흘려보내 준다. 바깥은 아니다.
**그림의 왼쪽 끝·오른쪽 끝은 곧 프로젝터 화면의 끝**이므로, 거기서 색이 페이지 캔버스 색과
어긋나면 화면 양옆에 **세로 판떼기**가 뜬다. 하늘은 **정확히 캔버스 색에서 시작**해야 한다.

### 제미나이 워터마크 ✦ 자리

✦ 는 **오른쪽 아래에서 고정 오프셋** (중심 = W−120.5, H−120.5)에 찍힌다.
1376×768 원본이면 x≈91%, y≈84% — **하필 오른쪽 무리의 한가운데**다.

- 되도록 그 자리(x 88~95%, y 80~90%)를 **결이 단순한 면**(평평한 풀밭·흙)으로 둔다.
  털결·꽃·잎맥 같은 미세 구조가 걸리면 복원 오차가 눈에 띈다.
- 어차피 **`docs/gemini-unwatermark.py` 로 지운다** (인페인트가 아니라 알파 역산이라
  아래 그림의 결이 그대로 되살아난다). 그래도 단순한 면이면 더 깨끗하다.

### 라이트 / 다크 — 바탕색이 전부다

| | 페이지 캔버스 | 글씨 | 그림 하늘 | 유일한 광원 |
|---|---|---|---|---|
| 라이트 | **`#f1f3f6`** (차가운 밝은 회색) | `#191722` | `#f1f3f6` 에서 시작해 땅 쪽만 살짝 따뜻하게 | 왼쪽 예배당 창의 작은 노란 불 |
| 다크 | **`#131313`** (중성 근-검정) | `#e5e2e1` | `#131313` ~ `#1b1a19` | 같은 창의 앰버 불빛 |

- ★ 라이트는 **크림색이 아니다.** 차가운 회색 캔버스다. 크림으로 시작하면 노란 띠가 생긴다.
- ★ 다크는 **남색이 아니다.** 남색 밤하늘을 그대로 가져오면 `#131313` 위에서 파란 판떼기로 뜬다.
- **브랜드 파랑(`#3182f6`)을 덩어리로 쓰지 말 것.** 가운데 카드의 진행 막대·숫자가 전부
  브랜드 파랑이라 **파랑끼리 먹힌다.** 파랑은 하늘의 아주 옅은 톤으로만.
- **앰버(주황·노랑)는 작게 한 군데만.** 이 화면에서 앰버는 **당선 기준선**의 색이다
  (막대 위의 주황 선 · "▲ 당선 기준 N표" 칩). 삽화에서 크게 쓰면 뜻이 흐려진다.
  여백의 형광펜 자국(`.els-swash`)도 이미 앰버다.

### 이 화면만의 금지 목록

- **사람(인물) 금지** — 이 앱의 화자는 양이다.
- **투표함·헌금함·기표소·투표용지·도장 금지** — 화면 안 아이콘·다른 화면과 겹친다.
- **저울·왕관·메달·트로피 금지** — 직분자 선출이지 경연이 아니다.
- **숫자·글자·막대그래프·파이차트 금지** — 가운데에 진짜가 있다.
- 십자가는 **왼쪽 예배당 지붕 위 한 개**까지. 빛줄기 십자가·거대한 십자가 금지.
- 손 들기·환호·박수 장면 금지 — 개표 결과가 나오기 전부터 분위기를 몰아간다.

---

## 사용법

1. Gemini 에 `public/images/title-bg/` 중 아무 이미지나 한 장 첨부하고
   **"이 양 캐릭터와 완전히 같은 캐릭터로, 같은 화풍으로"** 라고 덧붙인 뒤,
   아래 프롬프트 하나를 통째로 붙여넣는다.
2. **한 세션에서 라이트 → 다크 순으로 이어서** 뽑는다.
   세션을 나누면 양 얼굴과 색감이 미묘하게 달라져 테마를 전환할 때 티가 난다.
3. 비율은 **16:9 그대로** 받는다. 자르지 말고 그대로 후처리로 넘긴다.
4. 원본을 `~/Downloads/1.png`(라이트) · `2.png`(다크) 로 두고:

   ```bash
   # 워터마크 ✦ 가 남아 있을 때만 (2026-09-22 자산은 손으로 지워 와서 건너뛰었다)
   python docs/gemini-unwatermark.py ~/Downloads/1.png
   python docs/gemini-unwatermark.py ~/Downloads/2.png

   python docs/election-stage-process.py   # → public/images/election/stage-{left,right}-{light,dark}.webp
   ```

   스크립트는 **하늘 재칠 → 좌우 패널 자르기 → 알파 페이드 굽기 → webp** 까지 하고,
   끝에 **검사값**을 찍는다 — 패널 바깥 끝의 하늘색이 캔버스와 맞는지, 아랫변이 '땅'으로
   이어지는지. 빨간 ✗ 가 뜨면 붙이지 말고 값을 고치거나 다시 뽑는 게 빠르다.
5. 용량 예산: **한 장 60KB 이하** (실측 19~21KB, 네 장 합계 82KB). 넘으면 하늘의 노이즈·풀 디테일을 줄인다
   (디테일을 줄이는 게 화질을 줄이는 것보다 낫다).

   ★ `public/` 이라 URL 이 고정이다 — `sw.js` 의 stale-while-revalidate 가 옛 그림을 한 번 더
   내줄 수 있다. 다시 구웠는데 화면이 그대로면 **강력 새로고침(Ctrl+Shift+R)** 부터 해 본다.
   (`docs/` 의 다른 프롬프트 문서에 있는 같은 경고 참고.)

---

## A안 · 「언덕 위의 교회, 그 앞에 모인 우리」 (메인)

왼쪽은 **교회**, 오른쪽은 **그 교회를 둘러싼 자연**이다.
장면의 뜻은 "누가 이기나"가 아니라 **"이 자리를 함께 지킨다"** 쪽이다.

미소는 딱 한 군데: **왼쪽 돌담 위에 앉은 새끼양 하나가, 어른 양들처럼 앞발을 모아
기도하는 흉내를 내는데 한쪽 눈만 살짝 떠서 예배당 쪽을 보고 있다.**
울지도, 장난치지도 않는다. 그냥 조용히 한쪽 눈이 떠 있다.

### 1. A안 · 라이트 테마 프롬프트

```
A very wide 16:9 background illustration for a church election results screen that is
projected on a large screen, LIGHT MODE. It sits directly on the page canvas, whose
colour is exactly #f1f3f6 — a cool, light blue-grey. The artwork must begin FROM that
exact colour at the top and at both outer edges so it melts into the screen with no
visible rectangle. Style: cozy-epic children's storybook illustration — soft flat shapes
with a subtle grain texture, rounded friendly forms, gentle airy light, thin soft
grey-blue line work, no black outlines. Use the SAME chubby white sheep character as the
attached reference image: cream-white wool, tiny round hooves, small calm closed smiles.

Mood: quiet, sincere and steady — a congregation keeping watch over its own church on a
clear morning. Reverent, not festive. Tender rather than funny.

Composition is critical — the centre and the whole upper half are reserved for large type:
- The CENTRE of the frame, from 12% to 88% of the width, top to bottom, must be
  COMPLETELY EMPTY: nothing but a smooth, even sky gradient. No hills, no ground, no
  clouds, no birds, no light rays, no dotted lines, no texture, no detail at all.
- The TOP 60% of the frame must ALSO be completely empty across the entire width —
  plain sky only. Large headline text and handwritten notes are drawn over it.
- ALL the artwork lives in the BOTTOM 40% of the frame, inside the LEFT edge strip
  (x 0-12%) and the RIGHT edge strip (x 88-100%), as two small separate clusters of
  similar visual weight.
- Each cluster must fit within its own strip — no single object wider than 10% of the
  frame width.
- Do NOT draw a horizon line that runs across the whole picture. The two low grassy
  hillocks exist only under the left and right clusters and must fade away completely
  before they reach 15% / 85% — the central 70% of the image has no ground at all.
- The very BOTTOM edge of the frame is the bottom edge of the projected screen, and it
  is NOT faded or covered. End the picture on solid ground — grass, soil, low stones —
  so nothing looks cut off. No object may float against the bottom edge.
- Keep the area around x 88-95%, y 80-90% as a plain, simple, low-detail surface (flat
  grass or soil) with no fine texture such as fur, petals or leaf veins.
- Nothing important within 2% of the left or right edge.

Palette: a pale, cool clear morning. The sky is exactly #f1f3f6 at the top and at both
outer edges, warming very slightly toward a pale cream-grey near the two hillocks. Keep
everything HIGH-KEY, pastel and very low-contrast — dark charcoal headline text is drawn
over the upper half. The deepest tone anywhere is a soft grey-blue used only for thin
outlines and long soft shadows. No dark masses, no saturated colours, and NO strong blue
anywhere — a bright blue progress bar and bright blue numbers are drawn in the middle of
the screen and must not have to compete with the artwork.

Scene:
- LEFT cluster (the church): a very small white chapel with a pitched roof and ONE tiny
  cross on the ridge, standing on a low grassy hillock, its round window glowing a soft
  warm yellow. A low dry-stone wall runs a short way in front of it. Two grown sheep
  stand quietly by the wall with their front hooves folded, heads gently bowed, eyes
  closed as soft curved lines. Sitting on top of the wall beside them is one TINY lamb
  copying the grown-ups with its own hooves folded — but one eye is open a little,
  peeking toward the chapel. That small detail is the only touch of humour in the whole
  picture; keep it understated and easy to miss at first glance.
- RIGHT cluster (the land around the church): a low grassy bank with two or three slender
  young trees, a cluster of broad soft leaves and a few small white wildflowers. One
  chubby sheep lies resting in the grass, facing the viewer at a gentle
  three-quarter-FRONT angle, both eyes visible, the same size and evenly spaced, with a
  calm closed smile. A small watering can rests beside it on the grass.

Do NOT draw a ballot box, a ballot paper, a voting booth, a stamp, an offering box, a
scale, a crown, a medal, a trophy, a podium, or raised hooves in celebration. Do NOT draw
humans. Do NOT draw speech bubbles. Do NOT draw any bar charts, pie charts, numbers,
letters or logos. Do NOT draw any user-interface elements, buttons, pills, panels or
rounded rectangles. The background must be ONE continuous soft gradient — never a
rectangular block, window or box of a different colour, and no straight background edges
anywhere. No frames, no borders, no vignette, no rounded corners.
```

### 2. A안 · 다크 테마 프롬프트

```
A very wide 16:9 background illustration for a church election results screen that is
projected on a large screen, DARK MODE. It sits directly on the page canvas, whose colour
is exactly #131313 — a NEUTRAL near-black, NOT navy blue, NOT warm brown charcoal, NOT
pure black. The artwork must begin FROM that exact colour at the top and at both outer
edges so it melts into the screen with no visible rectangle. Style: cozy-epic children's
storybook illustration — soft flat shapes with a subtle grain texture, rounded friendly
forms, warm rim lighting, no black outlines. Use the SAME chubby white sheep character as
the attached reference image, but here its wool reads as a soft warm grey, never bright
white.

Mood: quiet, sincere and steady — a congregation keeping watch over its own church in the
blue hour. Reverent, not festive.

Composition is critical — the centre and the whole upper half are reserved for large type:
- The CENTRE of the frame, from 12% to 88% of the width, top to bottom, must be
  COMPLETELY EMPTY: nothing but a smooth, even dark gradient. No hills, no ground, no
  stars, no clouds, no light rays, no texture, no detail at all.
- The TOP 60% of the frame must ALSO be completely empty across the entire width —
  plain sky only. Large headline text and handwritten notes are drawn over it.
- ALL the artwork lives in the BOTTOM 40% of the frame, inside the LEFT edge strip
  (x 0-12%) and the RIGHT edge strip (x 88-100%), as two small separate clusters of
  similar visual weight.
- Each cluster must fit within its own strip — no single object wider than 10% of the
  frame width.
- Do NOT draw a horizon line that runs across the whole picture. The two low hillocks
  exist only under the left and right clusters and must fade away completely before they
  reach 15% / 85%.
- The very BOTTOM edge of the frame is the bottom edge of the projected screen, and it is
  NOT faded or covered. End the picture on solid ground so nothing looks cut off. No
  object may float against the bottom edge.
- Keep the area around x 88-95%, y 80-90% as a plain, simple, low-detail surface with no
  fine texture.
- Nothing important within 2% of the left or right edge.

Palette: a neutral near-black night. Exactly #131313 at the top and at both outer edges,
opening only slightly to #1b1a19 and a faint grey-taupe #232120 just above the two
hillocks. NO navy, NO indigo, NO teal — any blue night sky from the reference image must
be re-translated into neutral near-black. Keep everything muted and very low-contrast;
light grey headline text is drawn over the upper half. The ONLY bright accent is ONE small
warm amber light (#e0a458): the chapel window on the left. It must stay small, low and
local — no large glow, no god rays, no bloom across the sky. Do not use amber anywhere
else: an amber threshold line and an amber label are drawn in the middle of the screen and
must stay unique.

Scene:
- LEFT cluster (the church): a very small dark chapel with a pitched roof and ONE tiny
  cross on the ridge, standing on a low grassy hillock, its round window glowing warm
  amber and spilling a short pool of light on the grass. A low dry-stone wall runs a short
  way in front of it. Two grown sheep stand quietly by the wall with their front hooves
  folded, heads gently bowed, eyes closed as soft curved lines, rim-lit warmly by the
  window. Sitting on top of the wall beside them is one TINY lamb copying the grown-ups
  with its own hooves folded — but one eye is open a little, peeking toward the chapel.
  That is the only touch of humour; keep it understated.
- RIGHT cluster (the land around the church): a low grassy bank with two or three slender
  young trees and a cluster of broad soft leaves, all in near-black silhouette with a
  faint cool rim light. One sheep lies resting in the grass, facing the viewer at a gentle
  three-quarter-FRONT angle, both eyes visible, the same size and evenly spaced, with a
  calm closed smile. A small watering can rests beside it.

A few very faint stars are allowed ONLY in the outer top corners of the left and right
strips — never in the central 70%, and never as a scattered starfield.

Do NOT draw a ballot box, a ballot paper, a voting booth, a stamp, an offering box, a
scale, a crown, a medal, a trophy, a podium, or raised hooves in celebration. Do NOT draw
humans. Do NOT draw speech bubbles. Do NOT draw any bar charts, pie charts, numbers,
letters or logos. Do NOT draw any user-interface elements, buttons, pills, panels or
rounded rectangles. The background must be ONE continuous soft gradient — never a
rectangular block, window or box of a different colour, and no straight background edges
anywhere. No frames, no borders, no vignette, no rounded corners.
```

---

## B안 · 「함께 세운 담장」

A안이 "지켜본다"라면 B안은 **"같이 짓는다"** 다. 선거의 뜻(직분자를 세운다)에 더 가깝고,
가운데 카드의 진행 막대("함께 채워 간다")와 은유가 맞물린다.

왼쪽: 양 셋이 낮은 돌담을 쌓고 있다. 오른쪽: 다 쌓인 담 끝에 작은 문 하나가 서 있고
그 너머로 예배당 지붕이 조금 보인다.
미소는 한 군데 — **새끼양이 자기 몸통만 한 돌 하나를 들고 오다가 멈춰 서서 숨을 고른다.**

라이트/다크 프롬프트는 A안을 그대로 쓰되 `Scene:` 아래 두 덩이만 바꾼다.

```
Scene:
- LEFT cluster (building together): three sheep are building a low dry-stone wall on a
  grassy hillock. One kneels to set a flat stone in place, one holds the next stone ready
  with both hooves, and one small lamb has carried a stone almost as big as itself and has
  stopped to catch its breath, the stone resting on its front hooves. Their faces are
  turned toward the viewer at a gentle three-quarter-FRONT angle, both eyes visible, the
  same size and evenly spaced, with calm closed smiles. The lamb's pause is the only touch
  of humour in the picture; keep it understated.
- RIGHT cluster (the finished end): the far end of the same low wall, where a simple
  wooden gate stands open on a grassy bank. Behind and above it, only the pitched roof and
  ONE tiny cross of a small chapel are visible, mostly hidden by two slender young trees.
  A few small white wildflowers grow at the foot of the gate. No sheep on this side — the
  open gate is the whole subject.
```

- 오른쪽에 캐릭터가 없어 **무게가 왼쪽으로 쏠린다.** 가운데 카드가 화면 중앙에 있으니
  실제로는 괜찮지만, 라이트에서 오른쪽이 휑하면 나무를 한 그루 더 넣는다.
- **문을 활짝 열어 둘 것.** 닫힌 문은 이 화면에서 뜻이 정반대가 된다.

---

## C안 · 무캐릭터 안전판

A·B 가 계속 가운데를 침범하거나, 라이트에서 노랗게 / 다크에서 파랗게 나올 때 쓰는 **보험**이다.
캐릭터 없이 언덕 실루엣과 불빛만으로 간다 — 글자가 절대 안 죽는다.
(캐릭터가 빠지면 온기도 빠진다. 그래서 A·B 가 먼저다.)

A안 프롬프트에서 `Scene:` 이하를 통째로 아래로 바꾸고, 첫 문단에 `with NO characters at all`
을 덧붙인다.

```
Subject: two quiet pieces of the same hillside, one at each bottom corner, with an empty
sky between them.
- LEFT (x 0-12%, bottom 40%): a low grassy hillock with a very small chapel — a simple
  pitched roof, ONE tiny cross on the ridge, and a round window glowing soft warm yellow.
  A low dry-stone wall runs a short way in front of it. Two slim trees stand behind.
- RIGHT (x 88-100%, bottom 40%): another low grassy bank with three slender young trees,
  a cluster of broad soft leaves and a few small white wildflowers.
Everything is small, pale and distant, like something seen from very far away.

Do NOT draw people, animals or any characters. Do NOT draw a sun disc or a moon.
```

---

## 붙인 코드 (지금 돌아가는 것)

세 조각이 한 세트다.

### 1) `src/pages/Admin/components/ElectionStage.css`

`.els-stage` 가 `--els-art-left` / `--els-art-right` 를 들고, `::before`/`::after` 가
좌우 패널을 그린다. `[data-theme="dark"] .els-stage` 가 다크 파일로 갈아 끼운다.
**삽화가 없어도 서야 하므로**, 바탕 그라데이션은 이 규칙 안에 따로 들어 있다 — 지우지 말 것.
`<1280px` 에서는 패널을 끄고 한 칼럼으로 접는다(좌우 여백이 없다).

### 2) `src/utils/themeAssets.ts`

```ts
export const ELECTION_STAGE_LEFT: ThemePair = { light: '…/stage-left-light.webp',  dark: '…/stage-left-dark.webp' }
export const ELECTION_STAGE_RIGHT: ThemePair = { light: '…/stage-right-light.webp', dark: '…/stage-right-dark.webp' }
```

`ROUTE_ASSETS` 에는 **넣지 않았다.** 관리자가 '발표 화면'을 켤 때만 쓰는 그림이라
성도에게 파일을 물릴 이유가 없다 — `ElectionStage` 가 `useThemeArt` 로 마운트 동안 등록한다.

### 3) `src/pages/Admin/components/ElectionStage.tsx`

```tsx
// 좌우 둘 다 도착해야 켠다 — 한쪽만 먼저 뜨면 화면이 한쪽으로 기울어 보인다
const artReady = useThemeArt(ELECTION_STAGE_LEFT) && useThemeArt(ELECTION_STAGE_RIGHT)
...
<div className={`els-stage${artReady ? ' is-art-ready' : ''}`}>
```

---

## 붙이고 확인한 것 (2026-09-22)

`#/dev/election-stage` 에서 라이트·다크 둘 다:

- [x] 화면 좌우 끝에 **세로 판떼기**가 안 보인다 (하늘색 = 캔버스색)
- [x] 다크가 파랗지 않다 — 하늘을 다시 칠해 `#131313` 위에서 중성으로 앉는다
- [x] 제목("2026년 교회 선거")과 좌우 손글씨 **위로 그림이 안 올라온다**
- [x] 화면 맨 아랫변에서 그림이 **잘린 단면이 아니라 땅으로** 끝난다
- [x] 브랜드 파랑 막대·88% 숫자가 그림에 안 먹힌다
- [x] 주황 기준선과 "▲ 당선 기준 N표" 칩이 **화면에서 유일한 주황**이다
- [x] 다크에서 **양털이 카드의 흰 글자보다 밝지 않다** (255 → 219 로 눌렀다)
- [x] 돌을 안은 새끼양이 카드 뒤로 안 숨는다 (날개 26vw, 1958 기준 500px · 새끼양 끝 444 < 카드 449)
- [x] **패널 윗변이 가로줄로 안 보인다** (페이드가 빈 하늘 안에서 끝난다)
- [x] **좌우가 "제목 → 손글씨 → 삽화" 한 칼럼으로 읽힌다** (손글씨와 삽화 사이가 안 벌어진다)
- [x] 한 장 60KB 이하 (20~23KB)

다시 구울 때도 이 목록을 그대로 쓴다. 굽고 나서 화면이 안 바뀌면 `public/` 이라
**강력 새로고침(Ctrl+Shift+R)** 부터 — 서비스 워커가 옛 그림을 한 번 더 내준다.
