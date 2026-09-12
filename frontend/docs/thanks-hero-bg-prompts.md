# /thanks 오늘의 말씀 히어로 배경 이미지 프롬프트 (Gemini용)

`/thanks` 맨 위 **오늘의 말씀 히어로**(`src/pages/Thanks/Thanks.tsx` — `.thanks-hero` 안 `.thanks-hero-art` 레이어,
`TODAY’S BIBLE` 라벨 + `“여호와께 감사하라 그는 선하시며”` + `시 107:1`) 뒤에 깔 배경.
라이트/다크 각 1장.

컨셉은 칭호·이어읽기·플랜·묵상방·알림장 배경과 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**,
장면은 **"양이 감사 항아리에 오늘의 감사 쪽지를 한 장 넣는 순간"**.

## 왜 바꾸나 (2026-09-12)

지금 히어로는 `src/assets/hero/gratitude.webp` **실사 일출 사진 한 장**을 라이트·다크가 공용으로 쓰고,
다크에서는 `rgba(19,19,19,.35)` 를 한 겹 더 얹어 누르기만 한다. 두 가지가 어긋난다.

- **문법이 다르다.** 앱의 히어로·카드 배경은 전부 같은 양 캐릭터의 동화풍 삽화인데 이 화면만 사진이다.
- **다크가 사진 뜬다.** 웜 차콜 카드(`#201f1f`) 위에 대낮 하늘 사진이 얹히니, 눌러도 밝은 직사각형으로 뜬다.

| | 카드 바탕 | 잉크 | 삽화 톤 | 유일한 광원 |
|---|---|---|---|---|
| **라이트** | 흰색 `--surface-container: #ffffff` | 남색 먹 `#191722` / 보조 `#7d7887` | **하이키 파스텔**(거의 흰 아침) | 오른쪽 위 크림-골드 햇살 |
| **다크** | **따뜻한 차콜 `#201f1f`** | `#e5e2e1` / 보조 `#938f9a` | **저채도 웜 차콜**(밤이되 갈회색) | 감사 항아리 속 앰버 빛 |

> ★ **다크는 남색이 아니다.** `resume-dark.webp`·`plans/hero-dark.webp` 의 남색 밤하늘(`#0A1428` 계열)을
> 그대로 가져오면 `#201f1f` 카드 위에서 **파란 직사각형**으로 뜬다.
> 이 화면의 다크는 `home/live-reading-dark.webp` 와 같은 **따뜻한 회갈색 밤**이다.
> 라이트도 마찬가지 — 흰 카드보다 어두워지는 순간 **회색 판떼기**가 된다.

> **다른 화면과 겹치지 말 것.** 펼친 큰 성경책은 `/rooms`(모인 양들)·이어읽기 카드가 이미 쓴다.
> 코르크 게시판·쪽지 압정은 `/classes` 알림장이다.
> 이 화면의 소품은 **유리 감사 항아리 + 접힌 쪽지**다. 책은 그리지 않는다.

---

## 사용법

1. Gemini에 **두 장**을 첨부한다.
   - 캐릭터 참조: `public/images/title-bg/` 중 아무 이미지나 → "이 양 캐릭터와 완전히 같은 캐릭터로"
   - 톤 참조: 라이트는 `public/images/home/live-reading-light.webp`,
     다크는 `public/images/home/live-reading-dark.webp`
     → "이 그림의 밝기와 색온도를 그대로 맞춰서" (특히 다크는 **웜 차콜** 형제 그림이다)

   그 뒤 아래 프롬프트를 통째로 붙여넣는다. **한 세션에서 라이트 → 다크 순으로 이어서 뽑아야 톤이 맞는다.**
2. 출력 비율은 자유롭게 받아도 된다(3:1 로 받아도 되고, 8:1 배너로 받아도 된다).
   최종 규격은 **1536×426 · 3.6:1** 이고, 세로가 모자라면 후처리가 위로 하늘을 덧대 맞춘다.
3. `~/Downloads/1.png`(라이트) `2.png`(다크)로 두고

   ```
   python docs/gemini-unwatermark.py ~/Downloads/1.png ~/Downloads/1-clean.png
   python docs/gemini-unwatermark.py ~/Downloads/2.png ~/Downloads/2-clean.png
   python docs/thanks-hero-process.py     # -clean 이 있으면 그걸 집는다
   ```

   1536 폭 webp 저장 + 카드 위 글자 자리 밝기 실측까지 한 번에 한다. 결과 파일명은 고정이다.
   - 라이트: `frontend/src/assets/thanks/hero-light.webp`
   - 다크:   `frontend/src/assets/thanks/hero-dark.webp`

   ★ `public/` 이 아니라 **`src/assets/`** 다(번들러 해시 URL → 다시 구워도 SW 옛 캐시를 비켜 간다).
   한 장 **35KB 이하**를 목표로 한다(`cwebp -q 76`).

---

## 레이아웃 제약 (프롬프트의 핵심)

### 카드 실측

| 위치 | 카드 폭 | 높이 | 비율 |
|---|---|---|---|
| 모바일 (`max-w-md` 448 − `px-4`) | **416** | 168 | 2.48 : 1 |
| PC(lg+) 좌측 단 (`max-w-[1100px]` − `px-6` − 레일 340 − gap 24) | **688** | 168 | 4.10 : 1 |

CSS는 이렇게 깐다(`Thanks.css` `.thanks-hero-art` — 카드 안 절대배치 삽화 레이어, useThemeArt 도착 후 `.is-loaded` 페이드인):

```css
background-image:
  linear-gradient(90deg, var(--surface-container) 38%, transparent 78%),  /* 좌측 스크림 */
  var(--thanks-hero-image);
background-position: left center, right 40%;
background-size: auto, cover;
```

삽화(3.6:1)를 `cover` 로 깔면 **잘리는 방향이 화면마다 반대다.**

| | 배율 기준 | 잘리는 곳 |
|---|---|---|
| 모바일 2.48:1 | 높이 맞춤 | **왼쪽 31%** 가 통째로 날아간다(오른쪽 정렬) |
| PC 4.10:1 | 폭 맞춤 | **위 5% · 아래 8%** 가 날아간다(세로 40% 정렬) |

### 구역표 — ★ 프롬프트가 지켜야 하는 건 이 표다 (삽화 기준 %)

| 삽화 영역 | 규칙 |
|---|---|
| x **0~35%** | 모바일에서 통째로 잘린다. 매끈한 하늘·풀밭 그라데이션만. 디테일 금지 |
| x **35~78%** | **글자가 지나간다.** 흐린 원경(먼 언덕·안개)만, 대비 낮게. 스크림이 왼쪽 38%까지 카드색으로 덮고 78%에서 완전히 투명해진다 |
| x **78~98%** | **주인공 구역.** 여기에 전부 몰아넣는다 |
| x 92~100% · y 78~100% | Gemini 워터마크 ✦ 자리. **주인공 발밑을 여기 두지 말 것** — 평평한 풀밭으로 비운다 |
| 위 6% · 아래 9% | PC에서 잘린다. 하늘·풀밭 여유분으로만 |

- **주인공 구역과 글자 구역 사이에 딱딱한 세로 경계를 만들지 말 것.** 왼쪽으로 갈수록 안개에 녹아
  사라져야 한다. CSS가 스크림을 한 겹 더 얹지만, 그림 자체가 부드럽지 않으면 카드 한가운데에 세로줄이 생긴다.
- 카드 위 글자 사각형(카드 좌표, 세로 가운데 정렬):

  | 요소 | 카드 x | 카드 y |
  |---|---|---|
  | `TODAY’S BIBLE` 라벨 (11px/800, 자간 .12em) | 24px ~ 62% | 18~26% |
  | 말씀 (20px/700, **2줄까지 감김**) | 24px ~ 62% | 28~62% |
  | 장절 (13px/600) | 24px ~ 40% | 66~80% |

- 글자·숫자·로고 금지. **쪽지·항아리 라벨에도 글자 금지** — 접힌 종이의 색 면과 잉크 얼룩만.
- 테두리·비네트·모서리 라운드 금지 — 카드 모서리(`border-radius: 20px`)는 CSS가 처리한다.
- **브랜드 파랑(#3182f6) 덩어리 금지.** 파랑은 라이트 하늘의 옅은 톤으로만.

### 밝기 합격선

라이트는 남색 글씨라 **하한**, 다크는 흰 글씨라 **상한**이다. 글자 사각형에서 잰다.

| | 합격선 |
|---|---|
| 라이트 | 평균 **≥ 205**, 하위5% **≥ 170** |
| 다크 | 평균 **≤ 58**, 상위5% **≤ 105** |

---

## 라이트 테마 프롬프트

```
A very wide 3.6:1 panoramic background illustration for a "verse of the day" hero card
in a Korean church app's gratitude page, LIGHT MODE. The card is short and wide (about
416x168 px on mobile, 688x168 px on desktop) and its background is pure WHITE
(#ffffff), so this artwork must read as an almost-white, high-key pastel scene that
melts into white on the left. Style: cozy-epic children's storybook illustration — soft
flat shapes with a subtle grain texture, rounded friendly forms, gentle airy morning
light. Use the SAME small chubby white sheep character as the attached reference image:
cream-white wool, stubby legs, tiny round hooves, a small serene smile, soft blue-grey
line work.

Palette: an early-morning meadow just after sunrise. The sky is an almost-white wash —
very light warm cream (#fffaf2) near the horizon lifting into pale sky blue (#eef4fd)
at the top — over a soft pale sage-green meadow with a few tiny white and pale-yellow
wildflowers. Keep everything HIGH-KEY and low-contrast — pastel, airy, almost washed
out — because dark charcoal text is drawn over the left side. The deepest tone anywhere
is a soft blue-grey used only for thin outlines and long soft shadows. No dark masses,
no saturated colours, no black outlines, and no strong or bright blue anywhere.

Composition is critical:
- Everything interesting lives in the RIGHT FIFTH of the frame (x 78-98%).
- The LEFT 35% of the frame must be nearly EMPTY — just a smooth pale sky-to-meadow
  gradient with at most one faint distant cloud. It is cropped away entirely on narrow
  screens.
- The middle band (x 35-78%) holds only faint, hazy distance: one or two very soft,
  very pale rolling hills dissolving into mist, and a few thin diagonal sunbeams. No
  hard edges, no detail, no vertical boundary — the scene must fade gradually into the
  empty left side, never stop at a line.
- Keep the TOP 6% and BOTTOM 9% as calm expendable margin (plain sky, plain grass) —
  they get cropped on wide screens.
- Leave the very bottom-right corner (x 92-100%, y 78-100%) flat, plain grass with no
  object, no highlight and no texture detail.

Scene (right fifth): the small sheep kneels on the grass in a gentle
three-quarter-FRONT angle — never a flat side profile, both eyes visible, the same size
and evenly spaced — beside a rounded glass jar about as tall as the sheep. The jar is
already half full of small folded paper notes in soft pastel colours (blush, butter
yellow, mint, pale blue). The sheep is dropping ONE more folded note in, holding it up
with a tiny hoof, eyes closed in a happy contented smile. A soft warm sunbeam falls
diagonally across the jar and the glass catches a gentle cream highlight. Two or three
notes rest on the grass at the jar's base. A slender olive tree and one small round
bush may stand at the outer right edge; two tiny birds drift high in the upper right.

No text, no letters, no numbers, no writing on the paper notes, no label on the jar, no
logos. No speech bubbles, no thought bubbles, no hearts, no sparkle symbols. Do NOT draw
any user-interface elements, buttons, pills, panels or rounded rectangles. The
background must be ONE continuous soft gradient — never a rectangular block, window or
box of a different colour, and no straight background edges anywhere. No frames, no
borders, no vignette, no rounded corners.
```

## 다크 테마 프롬프트

```
A very wide 3.6:1 panoramic background illustration for a "verse of the day" hero card
in a Korean church app's gratitude page, DARK MODE. Same scene and same character as the
light version, but now at night. The card background is a WARM CHARCOAL (#201f1f) — a
soft near-black brown-grey, NOT navy blue and NOT pure black — and the artwork must melt
into that warm charcoal on the left. Style: cozy-epic children's storybook illustration
— soft flat shapes with a subtle grain texture, rounded friendly forms, warm rim
lighting. Use the SAME small chubby sheep character as the attached reference image:
stubby legs, tiny round hooves, a small serene smile — but here its wool reads as soft
warm grey, never bright white.

Palette: a warm charcoal evening meadow. The sky goes from #1c1b1b at the top through
#26231f into a faintly mauve-brown #2b2622 near the horizon, over a deep warm grey-green
meadow. NO blue night sky, NO indigo, NO teal, NO stars — the usual navy night sky must
be re-translated into this warm brown-grey. The ONLY bright thing in the whole picture
is the soft AMBER glow (#e0a458) coming from INSIDE the glass jar, as if the folded notes
gathered there were glowing like fireflies; it lights the sheep's face and chest from
below and lays one short warm pool of light on the grass. Add only a thin warm rim light
along the sheep's back. Everything else stays muted, dark and low-contrast, because light
grey text is drawn over the left side.

Composition is critical:
- Everything interesting lives in the RIGHT FIFTH of the frame (x 78-98%).
- The LEFT 35% of the frame must be nearly EMPTY — a smooth dark warm-grey gradient with
  no stars and no detail. It is cropped away entirely on narrow screens.
- The middle band (x 35-78%) holds only faint, hazy distance: one or two very soft dark
  hill silhouettes dissolving into the murk, barely a shade lighter than the sky. No hard
  edges, no detail, no vertical boundary — the scene must fade gradually into the empty
  left side, never stop at a line. The amber glow must NOT reach past x 70%.
- Keep the TOP 6% and BOTTOM 9% as calm expendable margin (plain sky, plain grass).
- Leave the very bottom-right corner (x 92-100%, y 78-100%) flat and featureless, with no
  glow and no highlight.

Scene (right fifth): the small sheep kneels on the grass in a gentle three-quarter-FRONT
angle — never a flat side profile, both eyes visible — beside the same rounded glass jar,
about as tall as the sheep, half full of small folded paper notes that glow softly amber
from within. The sheep is dropping ONE more folded note in, holding it up with a tiny
hoof; the note catches the glow and its face is lit warmly from below, eyes closed in a
peaceful contented smile. Two or three unlit notes rest in shadow at the jar's base. A
slender olive tree and one small round bush stand as dark silhouettes at the outer right
edge, one edge of each catching a faint amber rim.

No text, no letters, no numbers, no writing on the paper notes, no label on the jar, no
logos. No speech bubbles, no thought bubbles, no hearts, no sparkle symbols. Do NOT draw
any user-interface elements, buttons, pills, panels or rounded rectangles. The background
must be ONE continuous soft gradient — never a rectangular block, window or box of a
different colour, and no straight background edges anywhere. No frames, no borders, no
vignette, no rounded corners.
```

---

## 워터마크

제미나이 ✦ 는 **우하단 고정 오프셋(≈120.5px)** 에 찍힌다. 인페인트로 뭉개지 말고
`docs/gemini-unwatermark.py` 의 **알파 역산**을 쓴다 — 다만 ★모양·알파는 매번 실측한다
(예전 값을 그대로 재사용하면 검은 얼룩이 남는다). 워터마크가 아예 안 찍혀 오는 경우도 있으니
먼저 해당 자리를 확대해 확인할 것.

## 코드 배선 (적용 완료 — 다시 구울 때 그대로 둔다)

`/classes` 히어로와 같은 문법이다. **인라인 CSS 변수로 테마를 고르지 않는다** —
테마 선택은 CSS 셀렉터가 해야 토글 크로스페이드에 이미지가 같이 실린다.

1. `Thanks.css` — `.thanks-hero` 가 `url('../../assets/thanks/hero-light.webp')`,
   `html.dark .thanks-hero` 가 `hero-dark.webp`. 좌측 스크림(`38% → 78%`)은 두 테마 공통이고,
   **다크 누름막은 없다**(삽화가 이미 어둡다 — 겹치면 오른쪽 장면이 죽는다).
2. `themeAssets.ts` — `THANKS_HERO: ThemePair` + `ROUTE_ASSETS` 에 `/thanks` 등록(청크와 함께 선요청).
3. `Thanks.tsx` — `useThemeArt(THANKS_HERO)` 로 마운트 동안 등록(토글 직전 반대 테마 선요청).

## 적용 상태 (2026-09-12)

- 두 장 모두 적용 완료. 받은 원본은 **1968×544 (3.62:1)** 이라 비율 조정 없이 1536 폭으로만 줄였다.
  - `src/assets/thanks/hero-light.webp` **1536×425 · 15.2KB**
  - `src/assets/thanks/hero-dark.webp` **1536×425 · 10.6KB**
- 워터마크는 `docs/gemini-unwatermark.py` 알파 역산으로 제거(인페인트 아님).
  실측값: 라이트 astroid S=28.5 P=0.61 · 코어 알파 0.307, 다크 S=28.0 P=0.62 · 알파 0.301, 둘 다 글로우 없음.
  링 잔차 초과분 라이트 +2.99 → −0.39, 다크 +15.73 → +0.19 (자국 없음).
- 글자 자리 밝기 실측(합격):

  | | 라벨 | 말씀 | 장절 |
  |---|---|---|---|
  | 라이트 모바일 | 246.0 (p5 243) | 243.5 (p5 231) | 233.5 (p5 209) |
  | 라이트 PC | 245.3 | 245.6 | 250.4 |
  | 다크 모바일 | 37.1 (p95 45) | 55.6 (p95 83) | 43.7 (p95 51) |
  | 다크 PC | 32.2 | 41.7 | 39.2 |

- 삽화 왼쪽 가장자리: 라이트 `#f8f9f8`(카드 `#ffffff`), 다크 `#242119`(카드 `#201f1f`) — 스크림 안에서 붙는다.
- 코드: `Thanks.css` 가 `url('../../assets/thanks/hero-{light,dark}.webp')` 두 규칙으로 깔고
  (인라인 `--thanks-hero-image` 삭제, **다크 누름막 `rgba(19,19,19,.35)` 삭제**),
  `themeAssets.ts` 에 `THANKS_HERO` + `/thanks` 라우트 등록, `Thanks.tsx` 는 `useThemeArt(THANKS_HERO)`.
  옛 `src/assets/hero/gratitude.webp`(실사 일출 사진)는 삭제했다.

## 체크리스트

- [ ] 라이트 왼쪽 가장자리 색이 `#ffffff` 에 붙는가 / 다크가 `#201f1f` 에 붙는가
- [ ] 다크에 파란 하늘·별이 섞이지 않았는가 (웜 차콜인가)
- [ ] 삽화 x 35~78% 에 대비 강한 물체가 없는가 (글자 자리)
- [ ] 카드 한가운데 세로 경계선이 보이지 않는가
- [ ] 우하단 코너가 평평한가 (워터마크 제거 자국이 안 보이는가)
- [ ] 모바일 416 / PC 688 두 폭에서 주인공이 잘리지 않는가
