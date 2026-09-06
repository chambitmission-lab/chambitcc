# 공동 묵상방 히어로 배경 이미지 프롬프트 (Gemini용)

`/rooms` 상단 **히어로**(`src/pages/Rooms/RoomList.tsx`, `TOGETHER` + "같은 말씀, / 함께 묵상해요"
+ 안내 문구) 뒤에 깔 배경. 라이트/다크 각 1장.
컨셉은 칭호·이어읽기·플랜·공지 배너·교육·헌금·소식 배경과 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**,
장면은 **"거대한 펼친 성경 앞에 양들이 모여 같은 한 줄을 읽는 모습"**.

유머는 **책갈피 리본**에서 나온다 — 다 큰 양 셋은 리본이 짚어 준 그 한 줄을 진지하게 읽고 있는데,
새끼양 혼자 그 리본에 두 발로 대롱대롱 매달려 있다. 표정은 더없이 진지하다.
이 화면이 파는 값(**같은 본문 · 함께 · 한 줄씩 나눔**)이 그대로 그림이 된다 —
한 권의 책을 여럿이 나눠 보는 게 "같은 말씀", 리본이 짚은 한 줄이 "한 줄씩 마음을 나눠요".

> **기도방 히어로(`docs/group-hero-bg-prompts.md`)와 헷갈리지 말 것.**
> 저건 `/groups/:id` 의 "십자가 아래 함께 기도하는 양들", 이건 `/rooms` 의 "같은 책을 함께 읽는 양들".
> 둘 다 공동체지만 **소품이 다르다**(십자가+등불 / 책+책갈피). 장면을 섞지 말 것.

---

## ★ 방향 — 라이트는 밝게, 다크는 더 깊게 (플랜 히어로 2판과 동일)

지금 `/rooms` 히어로는 **라이트·다크 구분 없이 남색 카드 하나**다
(`linear-gradient(120deg,#0b1224,#14306a,#2563eb)` + 흰 글씨). 이건 플랜 히어로 1판과 같은 코드이고,
같은 이유로 라이트에서 겉돈다 — 회색 캔버스(`#f1f3f6`) + 흰 카드들 한복판에 남색 덩어리 하나만 뜬다.
**2026-09-05 플랜 히어로 2판에서 이미 뒤집힌 결정을 그대로 따른다.**

| | 카드 | 잉크 | 삽화 톤 |
|---|---|---|---|
| **라이트** | 밝은 하늘빛 카드(`#f4f9ff → #cfe3ff`) | **남색 글씨** | 맑은 대낮 high-key |
| **다크** | 심야 남색 카드(`#080f22 → #1a2f60`) | 흰 글씨 | 거의 검은 남색 + 등불 하나 |

**두 장의 차이는 "시간대"가 아니라 "밝기"다.**

> ⚠️ **이미지 2장과 카드 CSS·잉크는 반드시 같이 바뀐다.** 새 라이트 삽화를 지금 남색 카드에 얹으면
> 밝은 그림 위 흰 글씨가 죽는다. 아래 [적용할 코드 변경](#적용할-코드-변경-이미지가-나온-뒤-한-번에) 참고.

## 사용법

1. Gemini에 **두 장**을 첨부한다.
   - 캐릭터 참조: `public/images/title-bg/` 중 아무 이미지나 → "이 양 캐릭터와 완전히 같은 캐릭터로"
   - **톤 참조**: 라이트는 `public/images/plans/hero-light.webp`,
     다크는 `public/images/plans/hero-dark.webp` → "이 그림의 밝기·하늘색을 그대로 맞춰서"
   그 뒤 아래 프롬프트를 통째로 붙여넣는다.
2. 결과물 저장 위치 (파일명 고정 — 코드가 이 경로를 참조한다):
   - 라이트: `frontend/public/images/rooms/hero-light.webp`
   - 다크:   `frontend/public/images/rooms/hero-dark.webp`
3. 제미나이 출력(**1792×592, 3:1**)을 `~/Downloads/1.png`(라이트) `2.png`(다크)로 두고
   `python docs/plan-hero-process.py ~/Downloads rooms` 로 돌린다 — 두 번째 인자가 대상 폴더다
   (워터마크 제거 → 캔버스 확장 → 하늘로 녹이기 → webp 저장이 전부 같다. `RATIO`·`FADE`·`WIDTH` 는 손대지 말 것).
4. 최종 규격: **1536×699 (2.2:1) RGBA WebP**, `quality=80, alpha_quality=92, method=6`, 한 장 **40KB 이하**.
   **원본은 3:1 로 뽑고 후처리에서 2.2:1 로 늘린다** — 이유는 바로 아래.

---

## 레이아웃 제약 (프롬프트의 핵심)

히어로 실측 (`mx-4` + `px-6 py-8`, 본문은 라벨·2줄 제목·2줄 안내로 **높이가 항상 약 214px 로 같다**):

| | 히어로 크기 | 비율 |
|---|---|---|
| 모바일(390px) | 약 358×214 | **≈1.67 : 1** |
| PC(lg, 1240 셸 − 312 레일) | 약 832×214 | **≈3.89 : 1** |
| PC(좌측 내비 레일 펼침) | 약 792×214 | **≈3.70 : 1** |

`background-size: cover; background-position: right bottom` 으로 깐다.

### 왜 원본은 3:1 인데 에셋은 2.2:1 인가

**카드 높이가 214px 로 고정이라, `cover` 의 배율은 (모바일에서) 오직 에셋의 세로로 정해진다.**
3:1 원본을 그대로 깔면 모바일에서 그림이 폭 240px 로 확대돼 안내 문구를 통째로 덮는다.
좌우로 밀거나 왼쪽을 더 비워도 소용없다 — `cover` 는 높이로 맞추므로 **가로 여백을 늘려도 화면 위 크기가 그대로**다.
그래서 후처리에서 **위쪽에 빈 하늘을 덧대 2.2:1 로 늘린다**(폭 240px → **118px**). 이게 유일한 레버다.

보이는 영역:

| | `cover` 기준 | 보이는 영역 |
|---|---|---|
| 모바일 | 높이맞춤 | 오른쪽 **76%** (세로는 전부, 위 27%는 덧댄 빈 하늘) |
| PC | 폭맞춤 | 가로 전체, **위 43% 잘림** |

→ PC에서 잘리는 43% 중 27%는 덧댄 하늘이고 나머지 16%는 원본의 빈 윗하늘이다.
**원본에서 주인공 머리가 아래에서 62% 를 넘지 않으면 세 경우 다 온전히 보인다.**
(플랜 히어로보다 PC가 더 넓어서 위가 더 잘린다 — 이 62% 규칙을 플랜보다 더 엄하게 지킬 것.)

### 글자가 지나가는 자리 (제일 중요)

텍스트는 전부 **왼쪽 정렬**이고, 안내 문구는 `max-w-[16rem]`(256px)로 묶여 있다.
즉 **모바일에서 카드 왼쪽 280px 위로 글씨가 지나간다** — 카드 폭의 **78%**.
최종 에셋(2.2:1) 기준 좌표 환산:

| 에셋 x | 모바일 카드 x | PC 카드 x |
|---|---|---|
| 0.29 (글씨 시작) | 24 | 24 |
| 0.50 (녹이기 시작) | 123 | 416 |
| 0.75 (주인공 왼쪽 끝) | 240 | 624 |
| **0.83 (안내 문구 끝)** | **280** | 692 |
| 0.90 (원래 밝기 회복) | 313 | 749 |

규칙:

- **주인공은 원본 오른쪽 25%(x 75%~100%) 안에, 한 덩어리로.** 가로로 펴면 모바일에서 글씨에 먹힌다.
  프롬프트에 **"no wider than 25%"** 를 두 번 넣어 뒀다. 세로로 긴 덩어리(선 책 + 매달린 새끼양)라
  이 폭 안에 들어가기 쉬운 구도다 — 책을 눕히지 말 것.
- **왼쪽 3/4(x 0~75%)은 완전히 빈 하늘 그라데이션.** 잔디·잔가지·작은 점 금지.
- 원본 x 75~83% 구간은 모바일에서 안내 문구 **끝자락과 겹친다** →
  **라이트**는 이 띠를 **가장 밝은 부분**(하늘·햇살)으로, **다크**는 **가장 어두운 부분**
  (책 그림자·언덕)으로 채운다. 라이트에서 짙은 책등이나 언덕이 여기 걸리면 남색 글씨가 죽는다.
- **에셋은 완전 불투명이다 — 왼쪽을 알파로 파지 않는다.** 삽화 자신의 하늘이 곧 카드 바탕이다.
  (플랜 1판의 알파 페이드는 카드 남색이 삽화 하늘을 덮어서 폐기됐다.)
  → 왼쪽 3/4 의 빈 하늘은 **그 자체로 최종 배경**이다. 별·구름 배치와 그라데이션을 그 화면 그대로
  쓸 만하게 그려야 한다. CSS 로 워시를 한 겹 더 까는 방식은 쓰지 말 것(얼룩만 생긴다).
- **오른쪽 위 글로우는 그리지 말 것.** 밝은 덩어리가 하나 더 생기면 모바일 안내문과 싸운다.
- **오른쪽 아래 모서리(폭 10% × 높이 18%)는 평평한 빈 바닥.**
  Gemini 워터마크 ✦ 가 떨어지는 자리다. 주인공은 x 74~92% 에 두고 오른쪽 끝에 붙이지 말 것.
- 글자·숫자·로고 금지. **책 펼침면에도 글자 금지** — 옅은 빈 괘선만.
- 테두리·비네트·모서리 라운드 금지 — 카드 모서리(`rounded-[26px]`)는 CSS가 처리한다.

### 밝기 합격선

라이트는 남색 글씨라 **하한**, 다크는 흰 글씨라 **상한**이다.

| | 합격선 |
|---|---|
| 라이트 | 안내문 사각형 평균 **≥ 205**, 하위5% **≥ 170** |
| 다크 | 안내문 사각형 평균 **≤ 60**, 상위5% **≤ 110** |

⚠️ **에셋의 사각형을 그냥 재면 안 된다.** `cover` 매핑을 흉내 내 **카드 위 글자 사각형**을 재야 실제 값이다.
`docs/plan-hero-check.py` 를 그대로 쓰되 아래 세 줄만 바꾼다:

```python
# hero-{name}.webp 경로를 images/rooms 로, 카드 높이 216 → 214
def sample(name, card_w, card_h=214): ...   # 'plans' → 'rooms'
RECTS={'라벨':(24,32,110,49),'제목':(24,61,240,126),'안내문':(24,138,280,182)}
for cw,tag in ((358,'모바일'),(832,'PC   ')):
```

---

## 라이트 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for the header banner of a
"shared meditation room" page in a mobile church app, LIGHT MODE. IMPORTANT: this
banner is a PALE SKY-BLUE card and DARK NAVY text is laid on top of it, so the whole
image must be bright, airy and HIGH-KEY. There must be no dark navy area, no deep
blue block and no heavy shadow anywhere in the picture. Match the brightness and the
sky colour of the attached daylight reference image exactly.

Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, gentle airy morning light, no black outlines.
Use the SAME small chubby white sheep character as the attached character reference:
stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: pale high-key sky. Soft white and very light sky blue (#f4f9ff through
#dbeafe to #cfe3ff), the deepest tone anywhere is a gentle #93bdf5 used only for
soft shadows and a distant hill. Warm cream sunlight coming from the upper right, a
couple of small fluffy white clouds, light morning haze at the bottom. The ONLY
saturated accent in the whole image is the single coral-red ribbon bookmark — and
even that stays light and sun-washed. Every shadow is a soft blue-grey, never brown,
never black.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight UPRIGHT cluster no wider than 25% of the width — taller than it
is wide, never spread out sideways. The LEFT THREE QUARTERS must be completely
empty: just the smooth pale sky gradient with maybe one faint distant cloud, no
detail at all, because a title and two lines of dark text will be overlaid across
it. Keep the TOP 8% and the BOTTOM 8% as calm empty margin. Leave the BOTTOM-RIGHT
CORNER (about 10% of the width and 18% of the height) as plain flat empty ground
with no detail at all, and do not push the cluster against the right edge.

Scene (right quarter): ONE ENORMOUS open book standing upright on the grass, propped
open like a little screen and tilted slightly toward the viewer — far, far bigger
than the sheep, the size of a small house. Its pages are warm cream and ruled with
faint empty lines. The pages must be completely blank: no letters, no words, no
numbers, no symbols of any kind — only soft empty ruled lines. Its cover is a light
dusty blue, plain and unmarked.

In front of the giant book, THREE chubby white sheep sit together in a small tight
huddle on the grass, shoulder to shoulder, all looking up at the SAME single line of
the page, eyes calm, serene and very slightly smug — a little community reading one
passage together.

The joke is the lamb: a long coral-red RIBBON BOOKMARK hangs down the face of the
open page, and a tiny lamb is dangling from the end of it with both front hooves,
feet kicking in the air, utterly solemn and deeply concentrated — as if hanging on
the line is a perfectly normal way to read it. Nothing in its mouth, no tongue, no
object touching its face.

Keep the characters SMALL — the sheep's heads must not reach higher than 62% up from
the bottom edge, and the top of the giant book must stay below that line too. Keep
the entire cluster, book included, inside the right quarter of the frame.

Do NOT draw any user-interface elements, buttons, pills, panels or rounded
rectangles anywhere. The background must be ONE continuous soft gradient — never a
rectangular block, window or box of a different colour, and no straight background
edges anywhere. No text, no letters, no numbers, no logos. No frames, no borders, no
vignette, no rounded corners. The left three quarters must dissolve into a plain
pale sky-blue gradient, and nothing in the picture may be darker than a soft
mid-blue.
```

## 다크 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for the header banner of a
"shared meditation room" page in a mobile church app, DARK MODE. IMPORTANT: this
banner sits on a VERY DEEP MIDNIGHT-NAVY card with white text laid on top, and the
picture must be just as dark as the attached night reference image — an almost-black
navy night where only a thin crescent moon, a few tiny stars and one small warm lamp
are bright. Do not lighten the sky. Do not add a blue glow.

Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, warm rim lighting only where the lamp
reaches. Use the SAME small chubby white sheep character as the attached character
reference: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep midnight navy. #0A1428 in the upper left, lifting only very slightly
to about #16224a toward the lower right — the sky must stay inside that narrow dark
band across the ENTIRE frame, with a scatter of tiny blue-white stars and one thin
crescent moon high on the right. The mood is "it is very late, but the little group
is still reading the same page together". The ONLY bright thing is one small AMBER
oil lantern and the small pool of warm light it drops on the open page; that pool
must stay compact and must not spread wider than a fifth of the frame. Everything
outside that pool falls back into near-black navy within a short distance.

The sheep's wool must read as DIM WARM GREY (around #b3bdd2), clearly darker than
white — it must never glow or read as a bright white blob. The book's pages are a
muted dim cream only where the lantern touches them, dark navy everywhere else.
Ground and hills are near-black navy silhouettes.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight UPRIGHT cluster no wider than 25% of the width — taller than it
is wide, never spread out sideways. The LEFT THREE QUARTERS must be completely
empty: a smooth near-black navy gradient with a few faint stars and nothing else,
because a title and two lines of white text will be overlaid across it. Keep the TOP
8% and the BOTTOM 8% as calm empty margin. Leave the BOTTOM-RIGHT CORNER (about 10%
of the width and 18% of the height) as plain flat empty ground with no detail at
all, and do not push the cluster against the right edge.

Scene (right quarter): the same ONE ENORMOUS open book standing upright on the
grass, propped open like a little screen and tilted slightly toward the viewer — far
bigger than the sheep. Its pages are ruled with faint empty lines and must be
completely blank: no letters, no words, no numbers, no symbols — only soft empty
ruled lines. A small warm oil lantern hangs from the top corner of the book, washing
only the page and the sheep in gentle amber light.

In front of the book, THREE chubby sheep sit together in a small tight huddle,
shoulder to shoulder, all looking up at the SAME single line of the page, eyes calm,
serene and slightly smug. One of them wears a tiny knitted nightcap flopped over one
eye. Their muzzles are simple closed contented smiles — nothing in their mouths, no
tongues, no objects touching their faces.

The joke is the lamb: a long deep-red RIBBON BOOKMARK hangs down the face of the
page, and the tiny lamb has wound the whole ribbon around itself like a scarf,
round and round until only its face pokes out, and sits there wrapped up in the
bookmark — utterly solemn, eyes half closed, as if this is the correct way to keep
one's place. The ribbon only catches the amber light where the lantern reaches it.

Keep the characters SMALL — the sheep's heads must not reach higher than 62% up from
the bottom edge, and the top of the giant book must stay below that line too. Keep
the entire cluster, book included, inside the right quarter of the frame.

Do NOT draw any user-interface elements, buttons, pills, panels or rounded
rectangles anywhere. The background must be ONE continuous soft gradient — never a
rectangular block, window or box of a different colour, and no straight background
edges anywhere. No text, no letters, no numbers, no logos. No frames, no borders, no
vignette, no rounded corners. The only bright areas in the entire image are the
lantern flame, the small amber pool on the page, the crescent moon and the tiny
stars; everything else stays near-black midnight navy.
```

---

## 뽑고 나서

```
python docs/plan-hero-process.py ~/Downloads rooms   # 1.png(라이트) 2.png(다크)
```

스크립트가 하는 일과 주의점은 `docs/plan-hero-bg-prompts.md` 의 "뽑고 나서"와 **완전히 동일**하다.
요약만:

1. **워터마크 ✦ 제거는 인페인트가 아니라 '알파 역산'.** 좌표는 1792×592 기준 중심 (1671.5, 471.5),
   팔 길이 ≈ 24px — 제미나이는 우하단에서 고정 오프셋으로 찍는다. TELEA 인페인트는 쓰지 말 것
   (주인공 실루엣을 빨아들여 얼룩이 남는다).
2. 위로 캔버스를 늘려 **2.2:1**. 늘린 띠는 맨 윗줄을 위로 갈수록 세게 가로 블러해서 채운다
   (그냥 복제하면 다크의 등불 광채가 세로 줄무늬로 천장까지 뻗는다).
3. `blend_to_sky` — 왼쪽에서 **큰 물체만** 자기 하늘색으로 녹인다(x 0.50→0.90 램프).
   별은 열림 연산 마스크가 지켜 준다.

2026-09-06 이 화면을 뽑으면서 스크립트에 **가로 계단 정리**가 붙었다(플랜에도 그대로 적용된다).

> ⚠️ 프롬프트에 `no straight background edges anywhere` 를 넣어도 제미나이는 배경에
> **자를 대고 그은 듯한 가로선**을 거의 매번 남긴다. 대비가 2~5 밖에 안 되는데도
> 화면을 완벽하게 가로지르는 직선이라 **그림이 아니라 렌더링 이음매로 읽힌다.**
> 히어로 카드가 214px 로 납작해서 더 눈에 띈다. 세 종류 다 `load()` 가 자동으로 처리한다.

- **상단 하늘 띠 잘라내기.** 라이트 원본에 row 49→50 에서 밝기가 9 계단으로 끊기는
  하늘 띠가 있었고, `extend_top` 이 그 띠 색으로 천장을 채워 **모바일 카드에 가로 이음매 한 줄**이
  그대로 보였다(PC 는 그 부분이 잘려 안 보인다 — 모바일에서만 드러난다).
- **맨 아래 1~2행 잘라내기.** 카드는 `background-position: right bottom` 이라 이 몇 줄이
  카드 최하단에 그대로 깔린다. 라이트 1.15 / 다크 2.24 계단이 있었다.
- **중간 지평선 녹이기**(`soften_hstep`). 두 장 다 row 433 에 하늘과 바닥을 가르는
  하드 엣지가 **화면 전폭으로** 있었다(라이트 +2.2 / 다크 −5.3). PC 카드에서 위에서 약 66%
  지점에 가로선으로 떠서 위아래가 다른 판처럼 갈렸다.
  세로 가우시안(σ=hw/2.4)을 계단 ±45행에 스무스스텝 가중치로 먹여 램프로 바꾼다.
  세로 블러는 선형 그라데이션을 보존하므로 하늘은 그대로고 계단만 사라진다.
  **`content_mask` 로 배경인 열에서만** 적용하므로 언덕·책·양의 실루엣은 손대지 않는다
  (계단 5.3 → 1.0 이하, 카드 위 실측도 1.35 이하 = 리샘플 잡음 수준).
- `despeckle()` 의 **별 테두리 윤곽 지우기.** 알파 역산은 ✦ 가장자리 1px 에 얇은 실선을 남긴다.
  마스크를 더 뭉개면 오히려 잔차가 커지므로(0.5→1.4 로 sweep 해 확인했다), 별 둘레 링에서
  **배경이 평평한 화소만** 골라 작은 중앙값으로 누른다. 링 잔차 평균 8.0 → 5.4.
  책 모서리·풀처럼 진짜 엣지가 지나가는 자리는 평탄도 조건에 걸려 손대지 않는다.

---

## 적용한 코드 변경 (2026-09-06 완료)

> 아래는 **이미 적용된 상태**다. 에셋만 갈아 끼우면 안 된다는 기록으로 남긴다.

에셋만 갈아 끼우면 안 된다. **카드 그라데이션·잉크·글로우**가 라이트에서 전부 뒤집힌다.
파일은 `src/pages/Rooms/RoomList.tsx` 히어로 `<section>` 한 곳 + 새 `rooms-hero.css`.

1) **카드 배경 — 라이트/다크 분기 추가** (지금은 분기 없이 남색 하나)

```
// before
bg-[linear-gradient(120deg,#0b1224_0%,#14306a_58%,#2563eb_125%)]
   ring-1 ring-white/[0.08] shadow-[0_10px_34px_-12px_rgba(0,0,0,0.55)]

// after — 삽화 도착 전 자리끼움이므로 삽화의 하늘색과 같게 맞춘다
bg-[linear-gradient(120deg,#eef7ff_0%,#dceefc_58%,#cfe3ff_125%)]
   ring-1 ring-[#3182f6]/15 shadow-[0_10px_30px_-14px_rgba(49,130,246,0.45)]
dark:bg-[linear-gradient(120deg,#060d1c_0%,#0c162e_58%,#1a2f60_125%)]
   dark:ring-white/[0.08] dark:shadow-[0_10px_34px_-12px_rgba(0,0,0,0.6)]
```

2) **라디얼 글로우 두 겹은 삭제.** 불투명 삽화 아래라 보이지도 않으면서 페이드인 동안만 파랗게 번쩍인다
   (플랜 2판에서 같은 이유로 지웠다).

3) **잉크 — 라이트는 남색, 다크는 지금 그대로**

| | 라이트 | 다크 |
|---|---|---|
| 라벨 `Together` | `text-[#2563eb]` | `dark:text-white/65` |
| 제목 | `text-[#152648]` + `drop-shadow` 제거 | `dark:text-white` + 기존 drop-shadow |
| 안내 문구 | `text-[#41527a]` | `dark:text-white/80` |

제목의 `drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]` 는 **라이트에서 반드시 뺀다** —
밝은 배경 위 남색 글씨에 검은 그림자가 붙으면 지저분하다. `dark:drop-shadow-[...]` 로 옮긴다.

4) **삽화 레이어 + CSS** (`src/pages/Rooms/rooms-hero.css`, `plan-hero.css` 와 같은 구조)

```css
.rooms-hero-art {
  background-image: url('/images/rooms/hero-light.webp');
  background-size: cover;
  background-position: right bottom;
  background-repeat: no-repeat;
  opacity: 0;
  transition: opacity 320ms ease-out;
}
.dark .rooms-hero-art { background-image: url('/images/rooms/hero-dark.webp'); }
.rooms-hero-art.is-ready { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .rooms-hero-art { transition: none; } }
```

`<div className="absolute inset-0 rooms-hero-art" />` 를 글로우 자리에 넣고, 본문은 `relative z-10` 유지.

5) **선요청**은 `Bible/Plans/heroPrefetch.ts` 를 그대로 복제해 경로만 `/images/rooms/` 로 바꾼다.
   CSS 배경은 preload 스캐너 사각지대라 "청크 → CSS → 렌더 → 요청"으로 한 왕복을 더 기다린다
   (`docs/` 의 CSS background late discovery 항목과 같은 함정).
   호출 지점은 `/rooms` 로 들어오는 길목 — 성경 하단 도크·`RoomList` 진입.
   **반대 테마도 유휴 시간에 데울 것**(토글 순간 그라데이션만 남는다).

---

## 자주 깨지는 곳 (재생성 말고 부분 수정)

**책 펼침면에 글자가 들어갔을 때** (제미나이가 거의 항상 그린다)

```
Keep this image exactly as it is — same composition, same lighting, same colors,
same characters, same book. Change ONE thing only:

Redraw the open pages so they are completely blank — no letters, no words, no
numbers, no symbols of any kind, only soft faint empty ruled lines. Everything else
must stay pixel-identical.
```

**장면이 가로로 넓게 퍼졌을 때** (책이 크니까 특히 자주 그런다)

```
Keep the same characters, the same style and the same palette, but redraw the
layout: push the entire scene into the RIGHT QUARTER of the frame and draw it as ONE
tight upright cluster that fits inside a box no wider than 25% of the width — taller
than it is wide. Stand the giant book up instead of laying it flat. The left three
quarters must be nothing but the empty sky gradient.
```

**주인공이 너무 커서 위가 잘릴 때** (PC에서 위 43%가 잘린다)

```
Keep everything identical — same composition, same characters, same props. Only
change the scale: make the whole cluster smaller, so that the top of the giant book
and every sheep's head stay below 62% of the frame height measured from the bottom
edge. The upper third of the picture must be nothing but empty sky.
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
and the lantern's pool of light must shrink so it only touches the page and the
sheep. Everything else falls into near-black midnight navy.
```

**왼쪽이 안 비었을 때** — 다시 그리게 하지 말고 후처리의 `FADE` 를 오른쪽으로 민다(기본 `(0.50, 0.90)`).
별·잔점은 마스크가 지켜 주므로 지워지지 않는다 — 왼쪽에 큰 물체가 들어왔을 때만 듣는다.

---

## 적용 상태

- **2026-09-06**: 프롬프트만 작성. 에셋 미생성, `RoomList.tsx` 미변경(아직 라이트·다크 공용 남색 카드).
