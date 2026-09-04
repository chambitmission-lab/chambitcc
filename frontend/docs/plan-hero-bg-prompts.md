# 읽기 플랜 히어로 배경 이미지 프롬프트 (Gemini용)

`/bible/plans` 상단 **히어로**(`Bible/Plans/PlanList.tsx`, `READING PLAN` + "오늘부터, 함께 읽어요"
+ 안내 문구) 뒤에 깔 배경. 라이트/다크 각 1장.
컨셉은 칭호·이어읽기·공지 배너·교육·헌금·소식 배경과 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**,
장면은 **"통독표에 도장 찍는 양"**.

유머는 **도장 크기**에서 나온다 — 큰 양이 오늘 칸에 도장을 꾹 찍는 옆에서, 새끼양이 자기 몸통만 한
나무 도장을 두 발로 낑낑 들고 온다. 칸은 손톱만 한데. 표정은 더없이 진지하다.
이 화면이 파는 값(**매일 분량 · 진행률 · 연속 기록**)이 그대로 그림이 된다 —
줄줄이 찍힌 인주 자국이 연속 기록, 빈 칸이 남은 분량.
장면 소재는 이미 확정된 앱 문법을 그대로 쓴다(성경통독표 도장 격자 · 인장).

> **플랜별 커버 이미지(`docs/plan-cover-prompts.md`)와는 다른 물건이다.**
> 저건 플랜 카드마다 깔리는 수채 사진, 이건 화면 맨 위 히어로 한 장. 화풍도 다르다(수채 vs 동화풍).

## ★ 이 히어로만 다른 점 — 라이트도 남색이다

헌금·소식·공지 히어로는 **흰 카드**라 라이트를 창백한 high-key 로 그렸다. **여기선 그러면 안 된다.**

```
bg-[linear-gradient(120deg,#0b1224_0%,#14306a_58%,#2563eb_125%)]
```

히어로 카드 배경은 `dark:` 분기가 **없다**. 라이트·다크 모두 같은 남색 브랜드 그라데이션이고
글씨는 **항상 흰색**이다. 그래서 두 장의 차이는 밝기가 아니라 **시간대**로 간다.

| | 시간대 | 바탕 | 유일한 따뜻한 광원 |
|---|---|---|---|
| 라이트 | **아침** | `#14306a → #2563eb` 쪽으로 밝아지는 로열 블루 | 오른쪽 아래 크림-골드 햇살 |
| 다크 | **심야** | `#0b1224` 쪽으로 깊어지는 남색 + 잔별 | 앰버 등불 하나 |

**두 장 모두 중간~어두운 톤**이어야 한다. 라이트를 창백하게 뽑으면 흰 글씨가 죽는다
(기도방 히어로에서 겪은 그 사고 — 결국 잉크 색을 갈라야 했다, `docs/group-hero-bg-prompts.md` 참고).
카드를 라이트에서 밝은 카드로 바꾸고 싶다면 그건 배경 이미지가 아니라 **잉크 변경 과제**다. 별건으로 다룰 것.

## 사용법

1. Gemini에 `public/images/title-bg/` 중 아무 이미지나 한 장 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로" 라고 덧붙인 뒤, 아래 프롬프트를 통째로 붙여넣는다.
2. 결과물 저장 위치 (파일명 고정):
   - 라이트: `frontend/public/images/plans/hero-light.webp`
   - 다크:   `frontend/public/images/plans/hero-dark.webp`
3. 제미나이 출력(**1792×592, 3:1**)을 그대로 `~/Downloads/1.png`(라이트) `2.png`(다크)로 두고
   `python docs/plan-hero-process.py` 한 방이면 워터마크 제거 → 캔버스 확장 → 알파 페이드 →
   webp 저장까지 끝난다.
4. 최종 규격: **1536×699 (2.2:1) RGBA WebP**, `quality=80, alpha_quality=92, method=6`,
   한 장 **40KB 이하**(실제 26KB / 23KB).
   **원본은 3:1 로 뽑고 후처리에서 2.2:1 로 늘린다** — 이유는 바로 아래.

## 레이아웃 제약 (프롬프트의 핵심)

히어로 실측 (`mx-4` + `px-6 py-8`, 본문은 라벨·2줄 제목·2줄 안내로 **높이가 항상 216px 로 같다**):

| | 히어로 크기 | 비율 |
|---|---|---|
| 모바일(390px) | 약 358×216 | **≈1.66 : 1** |
| PC(lg, 레일 펼침) | 약 632×216 | **≈2.93 : 1** |
| PC(lg, 레일 접힘 56px) | 약 752×216 | **≈3.48 : 1** |

`background-size: cover; background-position: right bottom` 으로 깐다.

### ★ 왜 원본은 3:1 인데 에셋은 2.2:1 인가

**카드 높이가 216px 로 고정이라, `cover` 의 배율은 (모바일에서) 오직 에셋의 세로로 정해진다.**
3:1 원본(1792×592)을 그대로 깔면 모바일에서 그림이 **폭 242px**로 확대돼
안내 문구를 통째로 덮는다. 좌우로 밀거나 왼쪽을 더 비워도 소용없다 —
`cover` 는 높이로 맞추므로 **가로 여백을 늘려도 화면 위 크기가 그대로**다.

그래서 후처리에서 **위쪽에 빈 하늘을 덧대 2.2:1 로 늘린다.** 세로가 길어진 만큼
모바일 배율이 떨어져 그림이 작아진다(폭 242px → **176px**). 이게 유일한 레버다.
`plan-hero-process.py` 의 `RATIO` 를 건드리면 모바일 가독성이 그대로 깨진다.

늘린 띠는 맨 윗줄을 **위로 갈수록 더 세게 가로 블러**해서 채운다. 그냥 복제하면
다크의 **등불 광채가 세로 줄무늬**로 천장까지 뻗는다(한 번 겪었다).

보이는 영역:

| | `cover` 기준 | 보이는 영역 |
|---|---|---|
| 모바일 | 높이맞춤 | 오른쪽 **75%** (세로는 전부, 위 27%는 덧댄 빈 하늘) |
| PC 레일 펼침 | 폭맞춤 | 가로 전체, **위 25% 잘림** |
| PC 레일 접힘 | 폭맞춤 | 가로 전체, **위 37% 잘림** |

→ 잘리는 건 전부 덧댄 하늘이라 **원본 그림은 세 경우 다 온전히 보인다.**
그래도 원본 자체의 **위 8%는 여백**으로 두는 게 안전하다(다크 등불이 딱 여기 걸렸다).

### 글자가 지나가는 자리 (제일 중요)

텍스트는 전부 **왼쪽 정렬**이고, 안내 문구는 `max-w-[15rem]`(240px)로 묶여 있다.
즉 **모바일에서 카드 왼쪽 264px 위로 글씨가 지나간다** — 카드 폭의 **74%**.
최종 에셋(2.2:1) 기준으로 좌표를 환산하면:

| 에셋 x | 모바일 카드 x | PC 카드 x |
|---|---|---|
| 0.50 (알파 페이드 시작) | 121 | 316 |
| 0.63 (통독표 왼쪽 끝) | **182** | 398 |
| 0.86 (알파 완전 불투명) | 293 | 543 |

안내 문구가 끝나는 264px 부근에서 삽화는 아직 **80% 남짓만 불투명**하다 —
겹치는 건 통독표의 왼쪽 모서리뿐이고, 그마저 카드 남색에 반쯤 녹아 있다.
실측 밝기(흰 글씨가 얹히는 사각형 평균/상위5%):

| | 라벨 | 제목 | 안내문 |
|---|---|---|---|
| 모바일 | 35 / 43 | 49 / 83 | 75 / **141** |
| PC | 30 / 35 | 40 / 49 | 53 / 60 |

**모바일 안내문 상위5%가 141** 이 한계선이다. 그림을 다시 뽑아 통독표가 더 왼쪽·더 밝게
가면 여기부터 깨진다. 그때는 `FADE` 를 오른쪽으로 밀거나 `RATIO` 를 2.0 으로 키운다.

그래서 규칙은 이렇게 된다.

- **주인공은 원본 오른쪽 25%(x 75%~100%) 안에, 한 덩어리로.** 가로로 펴면 모바일에서 글씨에 먹힌다.
  (지금 에셋은 x 63%부터 시작한다 — 프롬프트보다 넓게 나왔지만 알파 페이드로 겨우 살렸다.
  다시 뽑는다면 이 문장을 더 세게 밀 것.)
- **왼쪽 3/4(x 0~75%)은 완전히 빈 하늘 그라데이션.** 잔디·잔가지·작은 점 금지.
- 원본 x 75~86% 구간은 모바일에서 안내 문구 **끝자락과 겹친다** → 그 띠는 **가장 어두운 부분**
  (도장판 그림자·언덕)으로 채우고, 밝은 하이라이트는 x 86% 오른쪽에만 둔다.
- **왼쪽 알파 페이드를 에셋에 굽는다** — x 0~50% 완전 투명, 50~86% smoothstep 으로 불투명.
  카드 자신의 남색 그라데이션이 그대로 비쳐 경계선이 안 생긴다(헌금 히어로와 같은 방식).
  CSS 로 워시를 한 겹 더 까는 방식은 여기선 쓰지 말 것 — 카드 그라데이션이 **120deg 대각선**이라
  가로 워시와 각도가 어긋나 띠가 보인다.
- **오른쪽 위 글로우는 그리지 말 것.** CSS 가 이미 `radial-gradient(circle at 82% 18%, ...)` 로
  브랜드 글로우를 깔고 있다. 그림에 또 넣으면 겹쳐서 뿌예진다.
- **오른쪽 아래 모서리(폭 10% × 높이 18%)는 평평한 빈 바닥.**
  Gemini 워터마크 ✦ 가 떨어지는 자리다. 주인공을 오른쪽 끝에 딱 붙이면 워터마크가 얼굴에 얹힌다.
- 글자·숫자·로고 금지. **통독표 칸에도 숫자·체크·날짜 금지** — 민무늬 인주 원반만.
- 테두리·비네트·모서리 라운드 금지 — 카드 모서리(`rounded-[26px]`)는 CSS가 처리한다.

---

## 라이트 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for the header banner of a "Bible
reading plan" page in a mobile church app. IMPORTANT: this banner is a DEEP BLUE
card in BOTH light and dark mode and WHITE text sits on top of it, so this "light"
version must be a bright MORNING BLUE — never pale, never white, never high-key.
Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, gentle airy morning light. Use the SAME small
chubby white sheep character as the attached reference image: stubby legs, tiny
round black hooves, serene slightly smug smile.

Palette: brand blue. Deep navy (#0b1224) at the upper left, warming through royal
blue (#14306a) into a brighter #2563eb toward the right, with ONE soft cream-gold
morning sunbeam low on the right side. Keep every tone in the MID-TO-DEEP range so
white text stays readable everywhere — the sky must never go pale or washed out. The
only warm accents are that sunbeam and a small vermilion red ink pad.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight cluster no wider than 25% of the width — do not spread the
characters horizontally. The LEFT THREE QUARTERS must be completely empty: just the
smooth blue gradient with a few faint sparkle dots, no detail at all, because a
title and two lines of body text will be overlaid across it. Keep the TOP 8% and the
BOTTOM 8% as calm empty margin. Leave the BOTTOM-RIGHT CORNER (about 10% of the
width and 18% of the height) as plain flat empty ground with no detail at all.

Scene (right quarter): a READING CHART — a small honey-wood board hanging at a
slight tilt, its face ruled into a neat grid of little empty squares. The squares in
the first rows are already filled with round vermilion INK STAMPS in one continuous
unbroken run, and the rest are still empty. The squares and the stamps must be
completely blank: no letters, no numbers, no ticks, no dates — just plain circles of
red ink on plain ruled squares.

In front of the board one grown sheep stands upright on its hind legs, pressing a
small round wooden stamp firmly into today's square with both front hooves, eyes
closed, serene and very slightly smug. A shallow dish of vermilion ink sits by its
feet.

The joke is the lamb: beside it a tiny lamb is hauling up an ENORMOUS round wooden
stamp, almost as big as its whole body, with both front hooves — utterly solemn,
cheeks puffed with effort — and the stamp is OBVIOUSLY far too big for the tiny
squares on the chart. Nothing in its mouth, no tongue, no object touching its face.

One closed book with a soft ribbon marker rests on the ground next to them, its
cover completely plain and blank. Keep the characters SMALL — their heads must not
reach higher than 62% up from the bottom edge.

Do NOT draw any user-interface elements, buttons, pills, panels or rounded
rectangles anywhere. The background must be ONE continuous soft gradient — never a
rectangular block, window or box of a different colour, and no straight background
edges anywhere. No text, no letters, no numbers, no logos. No frames, no borders, no
vignette, no rounded corners. The left three quarters must dissolve into a plain
deep royal-blue gradient.
```

## 다크 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for the header banner of a "Bible
reading plan" page in a mobile church app, DARK MODE. The banner is a DEEP NAVY card
with WHITE text laid on top, so keep everything muted and low-contrast. Style:
cozy-epic children's storybook illustration — soft flat shapes with subtle grain
texture, rounded friendly forms, warm rim lighting. Use the SAME small chubby white
sheep character as the attached reference image: stubby legs, tiny round black
hooves, serene slightly smug smile.

Palette: deep midnight navy — near #0b1224 at the upper left, lifting only slightly
through #14306a toward the right, with a scatter of tiny blue-white stars and one
thin crescent moon high on the right. The mood is "it is very late, but the lamb is
finishing today's reading anyway". The ONLY bright accents are a small AMBER lantern
and the warm pool of light it throws on the chart. Let the sheep's wool read as soft
warm grey, never bright white.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight cluster no wider than 25% of the width — do not spread the
characters horizontally. The LEFT THREE QUARTERS must be completely empty: a smooth
dark navy gradient with a few faint stars and nothing else, because a title and two
lines of body text will be overlaid across it. Keep the TOP 8% and the BOTTOM 8% as
calm empty margin. Leave the BOTTOM-RIGHT CORNER (about 10% of the width and 18% of
the height) as plain flat empty ground with no detail at all.

Scene (right quarter): the same small honey-wood READING CHART hanging at a slight
tilt, its face ruled into a grid of little empty squares, the first rows already
filled with round vermilion INK STAMPS in one continuous unbroken run. A small warm
oil lantern hangs just above it, washing the board and the sheep in gentle amber
light. The squares and the stamps must be completely blank: no letters, no numbers,
no ticks, no dates.

In front of the board the same grown sheep stands upright on its hind legs, pressing
a small round wooden stamp into today's square with both front hooves, eyes closed,
serene and slightly smug, wearing a tiny knitted nightcap flopped over one eye. Its
muzzle is a simple closed contented smile — nothing in its mouth, no tongue, no
object touching the face.

The joke is the lamb: beside it a tiny lamb has given up and fallen fast asleep,
curled up hugging its ENORMOUS round wooden stamp, almost as big as its whole body,
with one small round snore bubble. The huge stamp is OBVIOUSLY far too big for the
tiny squares on the chart.

One closed book with a soft ribbon marker rests on the ground beside them, mostly in
shadow, its cover completely plain and blank. Keep the characters SMALL — their
heads must not reach higher than 62% up from the bottom edge.

Do NOT draw any user-interface elements, buttons, pills, panels or rounded
rectangles anywhere. The background must be ONE continuous soft gradient — never a
rectangular block, window or box of a different colour, and no straight background
edges anywhere. No text, no letters, no numbers, no logos. No frames, no borders, no
vignette, no rounded corners. The only bright areas are the lantern, the moon, the
stars and the amber pool on the chart; the left three quarters must stay flat deep
navy.
```

---

## 뽑고 나서

```
python docs/plan-hero-process.py           # ~/Downloads/1.png(라이트) 2.png(다크)
```

스크립트가 하는 일:

1. **워터마크 ✦ 제거 — 인페인트가 아니라 '알파 역산'.**
   ✦ 는 순수 흰색(255)을 고정 알파로 올린 합성이다. 다크 원본에서 별 둘레의 평평한 남색 바닥을
   2차 다항식으로 맞춰 배경을 복원하면 `a = (obs-bg)/(255-bg)` 로 풀린다 → **피크 0.310**
   (헌금·소식 때와 같은 값). 그 알파 맵으로 두 장 모두 `bg = (obs-255a)/(1-a)` 를 적용한다.
   - 좌표(**1792×592 기준**): 중심 **(1671.5, 471.5)**, 반경 ≈ 27px. 우하단 책 모서리에 걸쳐 있다.
   - 별의 **왼쪽 아래가 책과 겹쳐** 배경 복원이 안 되므로, ✦ 가 좌우 대칭인 걸 이용해
     **오른쪽 절반에서만 알파를 재고 미러링**한다. 미러 경계는 `gx > 0` 으로 잡아야 한다 —
     `gx >= 2` 로 잡으면 가운데 2px 이 비어 **세로 검은 실선**이 남는다.
   - TELEA 인페인트는 쓰지 말 것. 주인공 실루엣을 빨아들여 얼룩이 남는다.
2. 위로 캔버스를 늘려 **2.2:1** 로 만든다(위 "왜 2.2:1 인가").
3. 왼쪽 알파 페이드(50%→86%)를 굽고 1536 폭 webp 로 저장한다.

## 적용 상태 (2026-09-04) — 적용 완료

- **에셋**: `public/images/plans/hero-{light,dark}.webp` (1536×699 RGBA, **26KB / 23KB**).
- **CSS**: `src/pages/Bible/Plans/plan-hero.css` 의 `.plan-hero-art`
  (`cover` + `right bottom`, 다크는 `.dark .plan-hero-art` 로 교체).
  Tailwind `bg-[url(...)]` 대신 CSS 파일로 뺐다 — 이 저장소엔 `bg-[url(` 선례가 없다.
- **JSX**: `PlanList.tsx` 히어로 `<section>` 안, 라디얼 글로우 두 겹 **뒤에** `absolute inset-0` 한 장.
  글로우 두 겹은 **그대로 뒀다**. 삽화가 불투명한 오른쪽에선 어차피 가려지고,
  알파 페이드 구간(카드 가운데)에선 이음매를 메워 준다.
- **워시·비네트 추가 금지.** 카드 그라데이션이 `120deg` 대각선이라 가로 워시를 얹으면 각도가
  어긋나 띠가 보인다. 왼쪽을 더 눌러야 하면 워시가 아니라 **에셋의 `FADE` 를 오른쪽으로 민다**.
- 삽화를 다시 뽑으면 **모바일 안내문 밝기(상위5% ≤ 141)** 를 다시 재고,
  넘으면 `max-w-[15rem]` 을 `max-w-[13rem]` 으로 줄이는 게 제일 빠르다.

---

## 자주 깨지는 곳 (재생성 말고 부분 수정)

**통독표 칸에 숫자·체크·날짜가 들어갔을 때** (제미나이가 거의 항상 그린다)

```
Keep this image exactly as it is — same composition, same lighting, same colors,
same characters, same board. Change ONE thing only:

Redraw the reading chart so that its squares are completely blank — no numbers, no
letters, no tick marks, no dates, no symbols of any kind. The filled squares hold
nothing but a plain round smudge of red ink. Everything else must stay
pixel-identical.
```

**장면이 가로로 넓게 퍼졌을 때** (소식 히어로에서 세 장 다 그랬다)

```
Keep the same characters, the same style and the same palette, but redraw the
layout: push the entire scene into the RIGHT QUARTER of the frame and draw the
characters as ONE tight cluster that fits inside a box no wider than 25% of the
width. The left three quarters must be nothing but the empty blue gradient.
```

**라이트가 너무 밝게 나왔을 때** — 흰 글씨가 죽는다. 고쳐 그리게 하지 말고
텍스트 영역(원본 왼쪽 86%)의 밝기를 재서 평균이 **140 아래**로 내려가게 곱연산으로 눌러라.
기도방 히어로는 이걸 놓쳐서 라이트 잉크를 네이비로 갈라야 했다.

**왼쪽이 안 비었을 때** — 다시 그리게 하지 말고 `plan-hero-process.py` 의 `FADE` 를 오른쪽으로
민다(기본 `(0.50, 0.86)`). 어차피 그 단계에서 알파로 지우는 자리다.
