# 설문 히어로 배경 이미지 프롬프트 (Gemini용)

`/survey` 상단 **히어로**(`src/pages/Survey/SurveyList.tsx`, `SURVEY` + "참여를 기다리는 / 설문 N개"
+ 안내 문구) 뒤에 깔 배경. 라이트/다크 각 1장.
컨셉은 칭호·이어읽기·플랜·공동 묵상방·공지 배너·교육·헌금·소식 배경과 같은
**코지-에픽 동화풍 + 같은 양 캐릭터**, 장면은 **"의견함에 쪽지를 넣는 양"**.

유머는 **쪽지 크기**에서 나온다 — 다 큰 양은 곱게 접은 쪽지 한 장을 투입구에 쏙 넣는데,
그 옆에서 새끼양은 자기 몸통보다 큰 **돌돌 말린 두루마리**를 두 발로 낑낑 끌고 온다.
투입구는 손바닥만 한데. 표정은 더없이 진지하다(할 말이 아주 많다).
이 화면이 파는 값(**잠깐이면 끝나요 · 남겨주신 답이 교회의 결정이 됩니다**)이 그대로 그림이 된다 —
접은 쪽지 한 장이 "잠깐이면 끝나요", 상자에 쌓인 쪽지들이 "모인 의견이 결정이 된다".

> **다른 화면의 장면과 소품을 섞지 말 것.**
> - 플랜(`docs/plan-hero-bg-prompts.md`) = 통독표 + **도장·인주**
> - 공동 묵상방(`docs/rooms-hero-bg-prompts.md`) = 펼친 성경 + **책갈피 리본**
> - 설문(이 문서) = 의견함 + **접은 쪽지·두루마리·연필**
>
> 설문 그림에 **도장·인주는 넣지 않는다**(플랜의 상징이다). 반대로 쪽지·투입구는 여기 전용이다.

---

## 방향 — 라이트는 밝게, 다크는 더 깊게 (플랜 2판 · 묵상방과 동일)

지금 `/survey` 히어로는 **라이트·다크 구분 없이 토스 블루 카드 하나**다
(`linear-gradient(118deg,var(--brand-dim),var(--brand),#4593fc)` + 흰 글씨 + 오른쪽 아래 클립보드 글리프).
이건 플랜 히어로 1판·묵상방 구버전과 같은 코드이고, 같은 이유로 라이트에서 겉돈다 —
회색 캔버스(`#f1f3f6`) + 흰 카드들 한복판에 파란 덩어리 하나만 뜬다.
**2026-09-05 플랜 2판, 2026-09-06 묵상방에서 이미 뒤집힌 결정을 그대로 따른다.**

| | 카드 | 잉크 | 삽화 톤 |
|---|---|---|---|
| **라이트** | 밝은 하늘빛 카드(`#eef7ff → #cfe3ff`) | **남색 글씨** | 맑은 대낮 high-key |
| **다크** | 심야 남색 카드(`#060d1c → #1a2f60`) | 흰 글씨 | 거의 검은 남색 + 등불 하나 |

**두 장의 차이는 "시간대"가 아니라 "밝기"다.**

> ⚠️ **이미지 2장과 카드 CSS·잉크는 반드시 같이 바뀐다.** 새 라이트 삽화를 지금 파란 카드에 얹으면
> 밝은 그림 위 흰 글씨가 죽고, 지금 클립보드 글리프를 그대로 두면 삽화와 겹쳐 두 겹이 된다.
> 아래 [적용할 코드 변경](#적용할-코드-변경-이미지가-나온-뒤-한-번에) 참고.

## 사용법

1. Gemini에 **두 장**을 첨부한다.
   - 캐릭터 참조: `public/images/title-bg/` 중 아무 이미지나 → "이 양 캐릭터와 완전히 같은 캐릭터로"
   - **톤 참조**: 라이트는 `public/images/rooms/hero-light.webp`,
     다크는 `public/images/rooms/hero-dark.webp` → "이 그림의 밝기·하늘색을 그대로 맞춰서"
     (플랜 히어로 `public/images/plans/hero-{light,dark}.webp` 도 같은 톤이라 대체 가능)
   그 뒤 아래 프롬프트를 통째로 붙여넣는다.
2. 결과물 저장 위치 (파일명 고정 — 코드가 이 경로를 참조한다):
   - 라이트: `frontend/public/images/survey/hero-light.webp`
   - 다크:   `frontend/public/images/survey/hero-dark.webp`
3. 제미나이 출력(**1792×592, 3:1**)을 그대로 `~/Downloads/1.png`(라이트) `2.png`(다크)로 두고
   ```
   python docs/plan-hero-process.py ~/Downloads survey     # ★FADE 는 (0.42, 0.72) 로 두고 돌린다
   ```
   한 방이면 워터마크 제거 → 캔버스 확장(2.2:1) → 왼쪽 녹이기 → webp 저장까지 끝난다.
   (플랜·묵상방과 **같은 규격**이라 스크립트를 그대로 쓴다. `RATIO` 는 2.2 그대로,
   `FADE` 만 이 화면은 **(0.42, 0.72)** 로 약하게 쓴다 — 아래 [적용 상태](#적용-상태) 참고)
4. 최종 규격: **1536×699 (2.2:1) RGBA WebP**, `quality=80, alpha_quality=92, method=6`,
   한 장 **20KB 안팎**(플랜 19.4/19.0KB, 묵상방 11.4/12.8KB).
   **원본은 3:1 로 뽑고 후처리에서 2.2:1 로 늘린다** — 이유는 바로 아래.

---

## 레이아웃 제약 (프롬프트의 핵심)

히어로 실측 (`mx-4` + `px-6 py-8`, 본문은 라벨·**2줄 제목**·**2줄 안내문**으로 높이가 항상 같다):

| | 히어로 크기 | 비율 |
|---|---|---|
| 모바일(390px) | 약 358×214 | **≈1.67 : 1** |
| PC(lg, 1240 컨테이너 + 312 레일) | 약 832×214 | **≈3.89 : 1** |

`background-size: cover; background-position: right 85%` 로 깐다.
(★`bottom` 이 아닌 이유는 아래 [적용 상태](#적용-상태)의 실측 메모 참고 — 제미나이가 캐릭터를
규격보다 크게 그려서, PC 에서 위가 잘릴 때 큰 양의 귀·연필 끝이 날아간다)

> ★ **카피는 항상 "2줄 제목 + 2줄 안내문"이어야 한다.** 히어로 문구는 참여 대기 수에 따라
> 네 가지로 바뀌는데(`참여를 기다리는\n설문 N개` / `진행 중인 설문에\n모두 참여했어요` /
> `지금은 열린\n설문이 없어요` / `성도님의 의견을\n들려주세요`), **전부 `\n` 로 2줄이 고정**이라
> 카드 높이가 214px 로 같다. 새 카피를 1줄이나 3줄로 넣으면 아래 배율 계산이 통째로 어긋난다.

### 왜 원본은 3:1 인데 에셋은 2.2:1 인가

**카드 높이가 214px 로 고정이라, `cover` 의 배율은 (모바일에서) 오직 에셋의 세로로 정해진다.**
3:1 원본을 그대로 깔면 모바일에서 그림이 **폭 642px**로 확대돼 안내 문구를 통째로 덮는다.
좌우로 밀거나 왼쪽을 더 비워도 소용없다 — `cover` 는 높이로 맞추므로 **가로 여백을 늘려도
화면 위 크기가 그대로**다.

그래서 후처리에서 **위쪽에 빈 하늘을 덧대 2.2:1 로 늘린다.** 세로가 길어진 만큼 모바일 배율이
떨어져 그림이 작아진다(폭 642px → **471px**, 그중 주인공은 오른쪽 25% = **118px**). 이게 유일한 레버다.

보이는 영역:

| | `cover` 기준 | 보이는 영역 |
|---|---|---|
| 모바일 | 높이맞춤 | 오른쪽 **76%** (세로는 전부, 위 27%는 덧댄 빈 하늘) |
| PC | 폭맞춤 | 가로 전체, **위 43% 잘림** |

→ PC 에서 43%나 잘리지만 그중 27%가 덧댄 하늘이라, **실제로 잘리는 건 원본 위쪽 22%뿐**이다.
아래 "머리 끝은 바닥에서 62% 아래" 규칙을 지키면 세 경우 다 온전히 보인다.
그래도 원본 자체의 **위 8%는 여백**으로 두는 게 안전하다.

### 글자가 지나가는 자리 (제일 중요)

텍스트는 전부 **왼쪽 정렬**이고, 안내 문구는 `max-w-[14rem]`(224px)로 묶여 있다.
즉 **모바일에서 카드 왼쪽 248px 위로 글씨가 지나간다** — 카드 폭의 **69%**.
(처음엔 묵상방과 같은 `16rem` 이었는데, 실측에서 안내문 끝이 의견함까지 닿아 밝기 하한을
깨뜨렸다 → `14rem` 으로 좁혔다. 두 줄 유지는 그대로다)
최종 에셋(2.2:1) 기준 좌표 환산:

| 에셋 x | 모바일 카드 x | PC 카드 x |
|---|---|---|
| 0.50 (녹이기 시작) | 123 | 416 |
| 0.63 (주인공 왼쪽 끝) | **184** | 524 |
| 0.72 (안내 문구 끝) | 249 | 599 |
| 0.90 (원래 밝기 회복) | 311 | 749 |

(모바일은 높이맞춤이라 에셋이 카드보다 넓어 왼쪽이 잘리고, PC는 폭맞춤이라 가로 전체가 보인다.
즉 **글자와 그림이 겹치는 건 모바일뿐**이고, PC에선 주인공이 x 624px 부터라 안내문과 멀찍이 떨어진다.)

규칙:

- **주인공은 원본 오른쪽 25%(x 75%~100%) 안에, 한 덩어리로.** 가로로 펴면 모바일에서 글씨에 먹힌다.
  프롬프트에 **"no wider than 25%"** 를 두 번 넣어 뒀다.
- **왼쪽 3/4(x 0~75%)은 완전히 빈 하늘 그라데이션.** 잔디·잔가지·작은 점 금지.
- 원본 x 75~86% 구간은 모바일에서 안내 문구 **끝자락과 겹친다** →
  **라이트**는 이 띠를 **가장 밝은 부분**(하늘·햇살)으로, **다크**는 **가장 어두운 부분**
  (상자 그림자·언덕)으로 채운다. 라이트에서 짙은 나무 상자가 여기 걸리면 남색 글씨가 죽는다.
- **★에셋은 완전 불투명이다 — 왼쪽을 알파로 파지 않는다.**
  삽화 자신의 하늘이 곧 카드 바탕이다. 카드 그라데이션은 **삽화 도착 전 자리끼움**일 뿐이다.
  → 프롬프트에서 **왼쪽 3/4 의 빈 하늘은 그 자체로 최종 배경**이 된다. 카드가 가려 줄 거라고
  기대하지 말고, 별·구름 배치와 그라데이션을 그 화면 그대로 쓸 만하게 그려야 한다.
- CSS 로 워시를 한 겹 더 까는 방식은 쓰지 말 것 — 삽화가 이미 전면을 덮고 있어 얼룩만 생긴다.
- **오른쪽 위 글로우는 그리지 말 것.** 밝은 덩어리가 하나 더 생기면 모바일 안내문과 싸운다.
- **오른쪽 아래 모서리(폭 10% × 높이 18%)는 평평한 빈 바닥.**
  Gemini 워터마크 ✦ 가 떨어지는 자리다. 주인공을 오른쪽 끝에 딱 붙이면 워터마크가 얼굴에 얹힌다.
- 글자·숫자·로고 금지. **쪽지·두루마리·클립보드 종이에도 글씨·줄·체크 금지** — 민무늬 종이만.
- 테두리·비네트·모서리 라운드 금지 — 카드 모서리(`rounded-[26px]`)는 CSS가 처리한다.

### 밝기 합격선

라이트는 남색 글씨라 **하한**, 다크는 흰 글씨라 **상한**을 본다.
모바일 안내문이 얹히는 사각형(에셋 기준 x 0.63~0.86 / 아래쪽 절반) 기준:

| | 합격선 | 깨졌을 때 |
|---|---|---|
| 라이트 | 평균 **≥ 205**, 하위5% **≥ 170** | 삽화를 더 옅게 띄우거나 후처리 `FADE` 를 오른쪽으로 |
| 다크 | 평균 **≤ 60**, 상위5% **≤ 110** | 등불 광채 반경을 줄이고 양털을 회색으로 |

⚠️ **에셋의 사각형을 그냥 재면 안 된다.** `cover` 매핑을 그대로 흉내 내
**카드 위 글자 사각형**을 재야 실제 값이다. `docs/plan-hero-check.py` 를 이 화면 규격으로
고쳐 쓴다 (`card_h=214`, 카드 폭 358/832, 사각형은 아래 값):

```python
RECTS = {'라벨': (24, 32, 96, 49), '제목': (24, 61, 230, 126), '안내문': (24, 138, 224, 182)}
# 파일 경로도 public/images/survey/hero-{name}.webp 로, 카드 대표 밝기는 라이트 238 / 다크 12
```

---

## 라이트 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for the header banner of a "church
survey" page in a mobile church app, LIGHT MODE. IMPORTANT: this banner is a PALE
SKY-BLUE card and DARK NAVY text is laid on top of it, so the whole image must be
bright, airy and HIGH-KEY. There must be no dark navy area, no deep blue block and no
heavy shadow anywhere in the picture. Match the brightness and the sky colour of the
attached daylight reference image exactly.

Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, gentle airy morning light, no black outlines.
Use the SAME small chubby white sheep character as the attached character reference:
stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: pale high-key sky. Soft white and very light sky blue (#f4f9ff through
#dbeafe to #cfe3ff), the deepest tone anywhere is a gentle #93bdf5 used only for soft
shadows and a distant hill. Warm cream sunlight coming from the upper right, a couple
of small fluffy white clouds, light morning haze at the bottom. The ONLY saturated
accents in the whole image are the honey-wood tone of the box and one small vermilion
pencil — and even those stay light and sun-washed. Every shadow is a soft blue-grey,
never brown, never black.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight cluster no wider than 25% of the width — do not spread the
characters horizontally. The LEFT THREE QUARTERS must be completely empty: just the
smooth pale sky gradient with maybe one faint distant cloud, no detail at all,
because a title and two lines of dark text will be overlaid across it. Keep the TOP
8% and the BOTTOM 8% as calm empty margin. Leave the BOTTOM-RIGHT CORNER (about 10%
of the width and 18% of the height) as plain flat empty ground with no detail at all.

Scene (right quarter): a small SUGGESTION BOX — a rounded honey-wood box standing on
short legs, with one narrow horizontal slot on its top, like a friendly little
mailbox. Keep the wood light and sunlit, like pale beech, not dark walnut. A few
neatly folded cream paper notes are stacked on the ground beside it, and a plain
clipboard leans against its side.

In front of the box one grown sheep stands upright on its hind legs, posting a single
small folded note into the slot with both front hooves, eyes closed, serene and very
slightly smug, with a short vermilion pencil tucked behind one ear.

The joke is the lamb: beside it a tiny lamb is hauling an ENORMOUS rolled-up paper
scroll, longer and fatter than its whole body, gripped with both front hooves —
utterly solemn, cheeks puffed with effort — and the scroll is OBVIOUSLY far too big
to ever fit through the small slot. Nothing in its mouth, no tongue, no object
touching its face.

All the paper in the picture — the folded notes, the scroll, the clipboard sheet —
must be completely blank: no letters, no numbers, no ruled lines, no tick marks, no
symbols of any kind. Keep the characters SMALL — their heads must not reach higher
than 62% up from the bottom edge — and keep the entire cluster, box included, inside
the right quarter of the frame.

Do NOT draw any user-interface elements, buttons, pills, panels or rounded
rectangles anywhere. The background must be ONE continuous soft gradient — never a
rectangular block, window or box of a different colour, and no straight background
edges anywhere. No text, no letters, no numbers, no logos. No frames, no borders, no
vignette, no rounded corners. The left three quarters must dissolve into a plain pale
sky-blue gradient, and nothing in the picture may be darker than a soft mid-blue.
```

## 다크 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for the header banner of a "church
survey" page in a mobile church app, DARK MODE. IMPORTANT: this banner sits on a VERY
DEEP MIDNIGHT-NAVY card with white text laid on top, and the picture must be just as
dark as the attached night reference image — an almost-black navy night where only a
thin crescent moon, a few tiny stars and one small warm lantern are bright. Do not
lighten the sky. Do not add a blue glow.

Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, warm rim lighting only where the lantern
reaches. Use the SAME small chubby white sheep character as the attached character
reference: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep midnight navy. #0A1428 in the upper left, lifting only very slightly to
about #16224a toward the lower right — the sky must stay inside that narrow dark band
across the ENTIRE frame, with a scatter of tiny blue-white stars and one thin crescent
moon high on the right. The mood is "it is very late, but the lamb is dropping in its
answer anyway". The ONLY bright thing is one small AMBER oil lantern and the small
pool of warm light it drops on the box; that pool must stay compact and must not
spread wider than a fifth of the frame. Everything outside that pool falls back into
near-black navy within a short distance.

The sheep's wool must read as DIM WARM GREY (around #b3bdd2), clearly darker than
white — it must never glow or read as a bright white blob. The honey-wood box is dark
walnut in shadow and only warms up where the lantern light touches it. Ground and
hills are near-black navy silhouettes.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight cluster no wider than 25% of the width — do not spread the
characters horizontally. The LEFT THREE QUARTERS must be completely empty: a smooth
near-black navy gradient with a few faint stars and nothing else, because a title and
two lines of white text will be overlaid across it. Keep the TOP 8% and the BOTTOM 8%
as calm empty margin. Leave the BOTTOM-RIGHT CORNER (about 10% of the width and 18%
of the height) as plain flat empty ground with no detail at all.

Scene (right quarter): the same small SUGGESTION BOX — a rounded wooden box on short
legs with one narrow horizontal slot on top, like a friendly little mailbox. A small
warm oil lantern hangs just beside it, washing only the box and the sheep in gentle
amber light. A few folded paper notes rest on the ground beside it, almost entirely in
shadow, and a plain clipboard leans against its side.

In front of the box the same grown sheep stands upright on its hind legs, posting a
single small folded note into the slot with both front hooves, eyes closed, serene and
slightly smug, wearing a tiny knitted nightcap flopped over one eye. Its muzzle is a
simple closed contented smile — nothing in its mouth, no tongue, no object touching
the face.

The joke is the lamb: beside it a tiny lamb has given up and fallen fast asleep,
curled up hugging its ENORMOUS rolled-up paper scroll, longer and fatter than its whole
body, with one small round snore bubble. The huge scroll is OBVIOUSLY far too big to
ever fit through the small slot.

All the paper in the picture — the folded notes, the scroll, the clipboard sheet —
must be completely blank: no letters, no numbers, no ruled lines, no tick marks, no
symbols of any kind. Keep the characters SMALL — their heads must not reach higher
than 62% up from the bottom edge — and keep the entire cluster, box included, inside
the right quarter of the frame.

Do NOT draw any user-interface elements, buttons, pills, panels or rounded rectangles
anywhere. The background must be ONE continuous soft gradient — never a rectangular
block, window or box of a different colour, and no straight background edges anywhere.
No text, no letters, no numbers, no logos. No frames, no borders, no vignette, no
rounded corners. The only bright areas in the entire image are the lantern flame, the
small amber pool on the box, the crescent moon and the tiny stars; everything else
stays near-black midnight navy.
```

---

## 자주 깨지는 곳 (재생성 말고 부분 수정)

**종이에 글씨·줄·체크가 들어갔을 때** (제미나이가 거의 항상 그린다)

```
Keep this image exactly as it is — same composition, same lighting, same colors, same
characters, same box. Change ONE thing only:

Redraw every piece of paper — the folded notes, the big scroll and the clipboard sheet
— so they are completely blank: no letters, no numbers, no ruled lines, no tick marks,
no symbols of any kind, just plain cream paper. Everything else must stay
pixel-identical.
```

**장면이 가로로 넓게 퍼졌을 때** (플랜·소식 히어로에서 매번 그랬다)

```
Keep the same characters, the same style and the same palette, but redraw the layout:
push the entire scene into the RIGHT QUARTER of the frame and draw the characters as
ONE tight cluster that fits inside a box no wider than 25% of the width. The left
three quarters must be nothing but the empty sky gradient.
```

**상자가 선거 투표함처럼 딱딱하게 나왔을 때**

```
Keep everything identical — same composition, same characters, same lighting. Only
redraw the box itself: make it a small, rounded, friendly honey-wood suggestion box on
short legs with one narrow slot on top, like a cosy little mailbox in a storybook. It
must not look like a hard rectangular ballot box, and it must carry no sign, no label
and no lettering of any kind.
```

**라이트가 너무 어둡게/파랗게 나왔을 때** — 남색 글씨가 죽는다.

```
Keep everything identical — same composition, same characters, same props. Only change
the lighting: raise the whole image to a bright high-key daylight palette. The sky must
be pale (#f4f9ff to #cfe3ff), every shadow must be a soft light blue-grey, and no area
of the picture may be darker than a soft mid-blue.
```

**다크가 너무 밝게 나왔을 때**

```
Keep everything identical — same composition, same characters, same props. Only change
the lighting: make the night much darker. The sky must stay between #0A1428 and
#16224a everywhere, the sheep's wool must be dim warm grey rather than white, and the
lantern's pool of light must shrink so it only touches the box and the sheep.
Everything else falls into near-black midnight navy.
```

**왼쪽이 안 비었을 때** — 다시 그리게 하지 말고 후처리의 `FADE` 를 오른쪽으로 민다(기본 `(0.50, 0.90)`).
별·잔점은 마스크가 지켜 주므로 지워지지 않는다 — 왼쪽에 큰 물체가 들어왔을 때만 듣는다.

---

## 적용할 코드 변경 (이미지가 나온 뒤 한 번에)

에셋만 갈아 끼우면 안 된다. **카드 그라데이션·잉크·글리프·타이포 규격**이 라이트에서 전부 뒤집힌다.
플랜(2판)·묵상방과 완전히 같은 순서다.

### 1) `src/pages/Survey/SurveyList.tsx` 히어로 `<section>` 교체

```tsx
// before — 파란 카드 + 흰 글씨 + 오른쪽 아래 클립보드 글리프
<section className="relative overflow-hidden mx-4 mt-5 px-6 py-7 rounded-[26px]
  bg-[linear-gradient(118deg,var(--brand-dim)_0%,var(--brand)_62%,#4593fc_100%)]
  text-white ring-1 ring-white/[0.14] shadow-[0_12px_32px_-16px_var(--brand-glow)]">
  <span aria-hidden className="absolute -right-3 -bottom-4 text-white/[0.16]">
    <ClipboardIcon size={132} />
  </span>
  …

// after — 삽화 카드 (그라데이션 값은 **완성된 삽화의 하늘색을 실측**해 맞춘다)
<section className="relative overflow-hidden mx-4 mt-5 px-6 py-8 rounded-[26px]
  bg-[linear-gradient(120deg,#d4eafc_0%,#dff1ff_58%,#ebf5ff_125%)]
  ring-1 ring-[rgba(49,130,246,0.15)] shadow-[0_10px_30px_-14px_rgba(49,130,246,0.45)]
  dark:bg-[linear-gradient(120deg,#071222_0%,#0a1a35_58%,#0b1730_125%)]
  dark:ring-white/[0.08] dark:shadow-[0_10px_34px_-12px_rgba(0,0,0,0.6)]">
  <div className={`survey-hero-art absolute inset-0${artReady ? ' is-ready' : ''}`} aria-hidden />
  …
```

- **★ 클립보드 글리프(`<span … ClipboardIcon size={132} />`)는 삭제한다.** 삽화와 두 겹이 된다.
  (목록 카드·홈 배너·`CenterNote` 의 작은 클립보드 아이콘은 그대로 둔다 — 그건 UI 글리프다)
- `text-white` 를 `<section>` 에서 뺀다. 잉크는 아래 3)에서 요소별로 지정한다.
- 라디얼 글로우는 **새로 넣지 않는다** — 불투명 삽화 아래라 보이지도 않으면서 페이드인 320ms
  동안만 파랗게 번쩍인다(플랜·묵상방에서 같은 이유로 지웠다).

### 2) 타이포 규격을 플랜·묵상방과 통일 (카드 높이 214px 고정의 근거)

| | 지금 | 바꿀 값 |
|---|---|---|
| 패딩 | `py-7` | **`py-8`** |
| 제목 | `text-[24px] leading-[1.3] mt-2.5` | **`text-[26px] leading-[1.25] mt-3`** |
| 안내문 | `mt-2.5 max-w-[17rem]` | **`mt-3 max-w-[14rem]`** |

이 세 줄이 위 "레이아웃 제약"의 214px·248px 을 만든다. 바꾸면 밝기 사각형을 다시 재야 한다.
안내문은 **어떤 카피든 두 줄**이어야 한다(카드 높이 214px 의 전제).

### 3) 잉크 — 라이트는 남색, 다크는 지금 그대로

| | 라이트 | 다크 |
|---|---|---|
| 라벨 `Survey` | `text-[#2563eb]` | `dark:text-white/65` |
| 제목 | `text-[#152648]` (drop-shadow 없음) | `dark:text-white` + `dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]` |
| 안내 문구 | `text-[#41527a]` | `dark:text-white/80` |

제목의 `drop-shadow` 는 **라이트에서 반드시 뺀다** — 밝은 배경 위 남색 글씨에 검은 그림자가
붙으면 지저분하다.

### 4) `src/pages/Survey/survey-hero.css` 신규 (묵상방 것과 같은 구조)

```css
/* /survey 히어로 배경 삽화 — "의견함에 쪽지를 넣는 양"
   에셋 생성/후처리는 docs/survey-hero-bg-prompts.md · docs/plan-hero-process.py
   (`python docs/plan-hero-process.py ~/Downloads survey`).
   - 카드 높이는 214px 고정, 폭만 358(모바일)→832(PC). cover 는 높이로 스케일이 정해지므로
     에셋을 2.2:1 로 만들어 두었다. 이 비율을 바꾸면 모바일이 깨진다.
   - 세로 정렬 85% 는 PC(폭맞춤)에서 위 131px 이 잘릴 때 큰 양의 귀·연필을 살리려고
     15% 를 아래 빈 바닥에서 대신 자르는 것이다. 모바일은 높이맞춤이라 영향 없다.
   - 에셋은 완전 불투명이다. 카드 그라데이션은 삽화 도착 전 자리끼움일 뿐이라
     삽화의 하늘색과 같은 값으로 맞춰 두었다. 위에 워시를 한 겹 더 깔지 말 것. */
.survey-hero-art {
  background-image: url('/images/survey/hero-light.webp');
  background-size: cover;
  background-position: right 85%;   /* ★bottom 이 아니다 — PC 상단 크롭에서 양 머리를 살린다 */
  background-repeat: no-repeat;
  opacity: 0;
  transition: opacity 320ms ease-out;
}
.dark .survey-hero-art {
  background-image: url('/images/survey/hero-dark.webp');
}
.survey-hero-art.is-ready {
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .survey-hero-art {
    transition: none;
  }
}
```

### 5) `src/pages/Survey/heroPrefetch.ts` 신규

`src/pages/Rooms/heroPrefetch.ts` 를 그대로 복사하고 경로·함수명만 바꾼다
(`/images/survey/hero-{light,dark}.webp`, `isSurveyHeroWarm` / `warmSurveyHero`).
CSS 배경은 preload 스캐너 사각지대라 엘리먼트가 렌더된 뒤에야 요청이 나가고,
브라우저는 현재 테마 한 장만 받는다 — **반대 테마도 유휴 시간에 데워야** 테마 토글에서
히어로가 그라데이션만 남지 않는다.

호출 지점:
- `SurveyList` 진입 (`const [artReady, setArtReady] = useState(isSurveyHeroWarm)` + effect)
- `utils/routePreload.ts` 의 `routeDataPrefetchers['/survey']` — 헤더 메뉴 호버·유휴 프리로드로
  청크를 받는 그 순간 삽화도 같이 데운다. (홈 `SurveyBanner` 는 상세로 가므로 데울 필요 없다)

### 6) 확인

- 히어로 아래 **CTA·칩·카드가 이 히어로 색을 참조하지 않는지** grep
  (`SurveyList.tsx` 안에서 `text-white` 가 히어로 밖까지 물려 쓰이지 않는지).
- 라이트/다크 토글을 두 번 왕복해 두 장 다 즉시 뜨는지.
- `docs/plan-hero-check.py` 를 위 `RECTS`·경로로 고쳐 밝기 합격선 확인.

---

## 적용 상태

- **2026-09-06 (적용 완료)** — 에셋 `public/images/survey/hero-{light,dark}.webp`,
  1536×699 RGBA(전면 불투명), **15.7KB / 18.0KB**.
  - 워터마크 ✦ 는 다크에만 보였고(라이트는 밝은 하늘 위라 +3레벨이라 눈에 안 띈다) 같은 자리
    **(1671.5, 471.5)**, 알파 **0.271** 로 잡혀 깨끗이 지워졌다 — 이번에도 **새끼양 엉덩이 위**에
    떨어졌는데 털이 평평해 복원이 잘 먹었다. 마스크는 다크에서 떠서 두 장에 같이 먹인다.
    (세 세대 연속 같은 좌표 = 우하단에서 (120.5, 120.5) 오프셋. 재생성해도 여기부터 보면 된다)
  - **다크 2판으로 교체(같은 날)** — 사용자가 새로 뽑은 `3.png` 로 갈아 끼웠다. 알파 **0.283**,
    같은 자리·같은 방식으로 제거. 파일 **26.5KB**(디테일이 늘어 1판 18KB보다 크지만 40KB 안).
    밝기 실측(모바일): 안내문 **45 / p95 93**, 제목 28 / p95 34 — 합격선 안.
    ★이 판은 프롬프트의 두 규칙을 벗어나 있다(사용자가 그림을 보고 선택): **클립보드에 낙서 줄과
    체크 표시**가 있고, **의견함·등불에 표정**이 있으며 나뭇가지에 작은 거미가 있다. 카드 크기에선
    질감으로 읽혀 문제되지 않지만, 지우려면 위 "종이에 글씨·줄·체크가 들어갔을 때" 프롬프트를 쓴다.
  - **★`FADE` 는 (0.42, 0.72)** — 기본값 `(0.50, 0.90)` 으로 돌렸더니 의견함 왼쪽 절반과
    쪽지 더미가 안개처럼 반투명해져 "덜 그린 그림"으로 보였다(다크에서 특히). 램프를 앞으로
    당기고 짧게 끊어, 맨 왼쪽 쪽지 더미에만 옅은 헤이즈가 걸리고 의견함부터는 원본 그대로다.
  - **★안내문 폭을 `16rem → 14rem`** 으로 좁혔다. 삽화가 프롬프트의 "오른쪽 25%"를 어기고
    **0.63~0.98(35%)** 로 넓게 나와, 16rem 이면 안내문 끝이 의견함·쪽지에 얹혀 밝기 하한을
    깼다(라이트 p5 161 < 170). 14rem 이면 글줄이 의견함 앞에서 끝난다.
  - **★`background-position` 은 `right bottom` 이 아니라 `right 85%`.** PC(폭맞춤)에서는
    원본 위 131px 이 잘리는데(이 값은 에셋 비율과 무관하다 — `592 − 214·1792/832`),
    제미나이가 큰 양의 머리를 y≈140 까지 올려 그려서 귀·연필 끝이 날아갔다.
    15% 를 아래 빈 바닥에서 대신 잘라 머리를 살렸다. 모바일은 높이맞춤이라 영향 없다.
  - 밝기 실측(모바일 글자 사각형): 라이트 안내문 **229 / p5 170**, 제목 235 / p5 233 —
    다크 안내문 **41 / p95 84**, 제목 27 / p95 34. PC 는 세 사각형 모두 빈 하늘만 얹힌다.
  - 코드: `SurveyList.tsx` 히어로(카드 그라데이션 라이트/다크 분기 + 삽화 레이어 + 잉크 남색화
    + `py-8`·`26px`·`max-w-[14rem]`, **클립보드 글리프 삭제**), `survey-hero.css`,
    `heroPrefetch.ts` 신설, `routePreload.ts` 의 `routeDataPrefetchers['/survey']` 등록
    (헤더 메뉴에서 청크를 받는 순간 삽화도 같이 데운다).
