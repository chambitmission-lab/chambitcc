# 읽기 플랜 히어로 배경 이미지 프롬프트 (Gemini용) — 2판

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

---

## ★ 2판에서 뒤집힌 것 — 라이트는 밝게, 다크는 더 깊게

1판(2026-09-04)은 **라이트도 남색 카드**로 갔다. 실제로 깔아 보니 라이트 화면(회색 캔버스 `#f1f3f6`
+ 흰 카드들) 한복판에 남색 덩어리 하나만 떠서 겉돌았고, 다크는 반대로 카드가 충분히 어둡지 않아
`/bible` 이어읽기 밤 배너보다 밝게 떠 버렸다. **2026-09-05 사용자 결정으로 방향을 바꾼다.**

기준은 **`/bible` 이어 읽기 카드**(`docs/resume-card-bg-prompts.md`,
`public/images/bible/resume-{light,dark}.webp`)다. 같은 성경 계열 화면이니 같은 문법으로 간다.

| | 카드 | 잉크 | 삽화 톤 |
|---|---|---|---|
| **라이트** | 밝은 하늘빛 카드(`#eaf2ff → #cfe3ff`) | **남색 글씨** | 맑은 대낮 high-key |
| **다크** | 심야 남색 카드(`#0A1428` 계열) | 흰 글씨 | 거의 검은 남색 + 등불 하나 |

**즉 이번엔 두 장의 차이가 "시간대"가 아니라 "밝기"다.** 1판의
"라이트도 중간~어두운 톤이어야 한다"는 문장은 **폐기**다 — 그 제약은 카드가 남색일 때만 유효했다.

> ⚠️ **이미지 2장과 카드 CSS·잉크는 반드시 같이 바뀐다.** 새 라이트 삽화를 지금 카드(남색)에 얹으면
> 밝은 그림 위 흰 글씨가 죽고, 지금 삽화를 밝은 카드에 얹으면 오른쪽만 남색 덩어리로 남는다.
> 아래 [적용할 코드 변경](#적용할-코드-변경-이미지가-나온-뒤-한-번에) 참고.

## 사용법

1. Gemini에 **두 장**을 첨부한다.
   - 캐릭터 참조: `public/images/title-bg/` 중 아무 이미지나 → "이 양 캐릭터와 완전히 같은 캐릭터로"
   - **톤 참조**: 라이트는 `public/images/bible/resume-light.webp`,
     다크는 `public/images/bible/resume-dark.webp` → "이 그림의 밝기·하늘색을 그대로 맞춰서"
   그 뒤 아래 프롬프트를 통째로 붙여넣는다.
2. 결과물 저장 위치 (파일명 고정 — 코드가 이 경로를 참조한다):
   - 라이트: `frontend/public/images/plans/hero-light.webp`
   - 다크:   `frontend/public/images/plans/hero-dark.webp`
3. 제미나이 출력(**1792×592, 3:1**)을 그대로 `~/Downloads/1.png`(라이트) `2.png`(다크)로 두고
   `python docs/plan-hero-process.py` 한 방이면 워터마크 제거 → 캔버스 확장 → 알파 페이드 →
   webp 저장까지 끝난다. 그 다음 `python docs/plan-hero-check.py` 로 밝기 합격선을 확인한다.
4. 최종 규격: **1536×699 (2.2:1) RGBA WebP**, `quality=80, alpha_quality=92, method=6`,
   한 장 **40KB 이하**(1판 실측 26KB / 23KB).
   **원본은 3:1 로 뽑고 후처리에서 2.2:1 로 늘린다** — 이유는 바로 아래.

---

## 레이아웃 제약 (프롬프트의 핵심 — 1판에서 그대로 유효)

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
다크의 **등불 광채가 세로 줄무늬**로 천장까지 뻗는다(1판에서 한 번 겪었다).

보이는 영역:

| | `cover` 기준 | 보이는 영역 |
|---|---|---|
| 모바일 | 높이맞춤 | 오른쪽 **75%** (세로는 전부, 위 27%는 덧댄 빈 하늘) |
| PC 레일 펼침 | 폭맞춤 | 가로 전체, **위 25% 잘림** |
| PC 레일 접힘 | 폭맞춤 | 가로 전체, **위 37% 잘림** |

→ 잘리는 건 전부 덧댄 하늘이라 **원본 그림은 세 경우 다 온전히 보인다.**
그래도 원본 자체의 **위 8%는 여백**으로 두는 게 안전하다(1판 다크 등불이 딱 여기 걸렸다).

### 글자가 지나가는 자리 (제일 중요)

텍스트는 전부 **왼쪽 정렬**이고, 안내 문구는 `max-w-[15rem]`(240px)로 묶여 있다.
즉 **모바일에서 카드 왼쪽 264px 위로 글씨가 지나간다** — 카드 폭의 **74%**.
최종 에셋(2.2:1) 기준 좌표 환산:

| 에셋 x | 모바일 카드 x | PC 카드 x |
|---|---|---|
| 0.50 (녹이기 시작) | 121 | 316 |
| 0.63 (통독표 왼쪽 끝) | **182** | 398 |
| 0.86 (안내 문구 끝) | 293 | 543 |
| 0.90 (원래 밝기 회복) | 316 | 568 |

규칙:

- **주인공은 원본 오른쪽 25%(x 75%~100%) 안에, 한 덩어리로.** 가로로 펴면 모바일에서 글씨에 먹힌다.
  (1판 에셋은 x 63%부터 시작했다 — 프롬프트보다 넓게 나와 알파 페이드로 겨우 살렸다.
  2판에선 이 문장을 더 세게 밀 것. 프롬프트에 **"no wider than 25%"** 를 두 번 넣어 뒀다.)
- **왼쪽 3/4(x 0~75%)은 완전히 빈 하늘 그라데이션.** 잔디·잔가지·작은 점 금지.
- 원본 x 75~86% 구간은 모바일에서 안내 문구 **끝자락과 겹친다** →
  **라이트**는 이 띠를 **가장 밝은 부분**(하늘·햇살)으로, **다크**는 **가장 어두운 부분**
  (도장판 그림자·언덕)으로 채운다. 라이트에서 짙은 나무판이나 언덕이 여기 걸리면 남색 글씨가 죽는다.
- **★에셋은 완전 불투명이다 — 왼쪽을 알파로 파지 않는다.**
  1판은 x 0~50% 를 투명하게 만들어 카드 그라데이션이 비치게 했는데, **그 남색이 삽화의 별밤
  하늘을 덮어 버려** 폐기했다(2026-09-05 사용자 지적). 지금은 삽화 자신의 하늘이 곧 카드 바탕이다.
  대신 통독표 왼쪽 끝만 **자기 하늘색으로 녹인다**(x 0.50→0.90 램프, `blend_to_sky`).
  → 프롬프트에서 **왼쪽 3/4 의 빈 하늘은 그 자체로 최종 배경**이 된다. 카드가 가려 줄 거라고
  기대하지 말고, 별·구름 배치와 그라데이션을 그 화면 그대로 쓸 만하게 그려야 한다.
- CSS 로 워시를 한 겹 더 까는 방식은 쓰지 말 것 — 삽화가 이미 전면을 덮고 있어 얼룩만 생긴다.
- **오른쪽 위 글로우는 그리지 말 것.** 밝은 덩어리가 하나 더 생기면 모바일 안내문과 싸운다.
- **오른쪽 아래 모서리(폭 10% × 높이 18%)는 평평한 빈 바닥.**
  Gemini 워터마크 ✦ 가 떨어지는 자리다. 주인공을 오른쪽 끝에 딱 붙이면 워터마크가 얼굴에 얹힌다.
- 글자·숫자·로고 금지. **통독표 칸에도 숫자·체크·날짜 금지** — 민무늬 인주 원반만.
- 테두리·비네트·모서리 라운드 금지 — 카드 모서리(`rounded-[26px]`)는 CSS가 처리한다.

### 밝기 합격선 (2판에서 뒤집힌 부분)

1판은 흰 글씨였으니 **밝기 상한**만 봤다. 2판은 라이트가 남색 글씨라 **라이트는 하한, 다크는 상한**이다.
모바일 안내문이 얹히는 사각형(에셋 기준 x 0.63~0.86 / 아래쪽 절반)을 잰다:

| | 합격선 | 1판 | **2판 실측** | 깨졌을 때 |
|---|---|---|---|---|
| 라이트 | 평균 **≥ 205**, 하위5% **≥ 170** | (남색이라 해당 없음) | **227 / 214** ✅ | 삽화를 더 옅게 곱연산으로 띄우거나 `FADE` 를 오른쪽으로 |
| 다크 | 평균 **≤ 60**, 상위5% **≤ 110** | 75 / **141** | **34 / 110** ✅ | 등불 광채 반경을 줄이고 양털을 회색으로 |

⚠️ **에셋의 사각형(x 0.63~0.86 × 아래 절반)을 그냥 재면 안 된다.** 그 상자는 통독표의 밝은 부분까지
포함해 다크가 실제보다 훨씬 밝게 나온다(그렇게 재면 74/171 로 불합격처럼 보인다).
`cover` 매핑을 그대로 흉내 내 **카드 위 글자 사각형 3개**를 재야 실제 값이다.

후처리 뒤 이렇게 잰다 (`cover` + `right bottom` 을 그대로 재현해 글자 사각형만 본다):

```python
# docs/plan-hero-check.py
import numpy as np
from PIL import Image
def sample(name, card_w, card_h=216):
    a=np.asarray(Image.open(f'public/images/plans/hero-{name}.webp').convert('RGBA')).astype(float)
    H,W=a.shape[:2]; s=max(card_w/W, card_h/H)            # cover
    ox,oy=W*s-card_w, H*s-card_h                          # right bottom
    yy,xx=np.mgrid[0:card_h,0:card_w].astype(float)
    ax=np.clip(((xx+ox)/s).astype(int),0,W-1); ay=np.clip(((yy+oy)/s).astype(int),0,H-1)
    rgb=a[...,:3].mean(2)[ay,ax]; al=a[...,3][ay,ax]/255
    return rgb*al+(226 if name=='light' else 16)*(1-al)   # 카드 그라데이션 대표 밝기
RECTS={'라벨':(24,32,204,46),'제목':(24,58,224,124),'안내문':(24,140,264,186)}
for name in ('light','dark'):
    for cw,tag in ((358,'모바일'),(632,'PC   ')):
        v=sample(name,cw)
        print(name, tag, ' | '.join(
            f"{k} 평균{v[y0:y1,x0:x1].mean():4.0f} p5{np.percentile(v[y0:y1,x0:x1],5):4.0f}"
            f" p95{np.percentile(v[y0:y1,x0:x1],95):4.0f}" for k,(x0,y0,x1,y1) in RECTS.items()))
```

---

## 라이트 테마 프롬프트

```
A very wide 3:1 panoramic background illustration for the header banner of a "Bible
reading plan" page in a mobile church app, LIGHT MODE. IMPORTANT: this banner is a
PALE SKY-BLUE card and DARK NAVY text is laid on top of it, so the whole image must
be bright, airy and HIGH-KEY. There must be no dark navy area, no deep blue block
and no heavy shadow anywhere in the picture. Match the brightness and the sky colour
of the attached daylight reference image exactly.

Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, gentle airy morning light, no black outlines.
Use the SAME small chubby white sheep character as the attached character reference:
stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: pale high-key sky. Soft white and very light sky blue (#f4f9ff through
#dbeafe to #cfe3ff), the deepest tone anywhere is a gentle #93bdf5 used only for
soft shadows and a distant hill. Warm cream sunlight coming from the upper right, a
couple of small fluffy white clouds, light morning haze at the bottom. The ONLY
saturated accents in the whole image are the small vermilion red ink stamps, a
little dish of red ink, and the honey-wood tone of the board — and even those stay
light and sun-washed. Every shadow is a soft blue-grey, never brown, never black.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight cluster no wider than 25% of the width — do not spread the
characters horizontally. The LEFT THREE QUARTERS must be completely empty: just the
smooth pale sky gradient with maybe one faint distant cloud, no detail at all,
because a title and two lines of dark text will be overlaid across it. Keep the TOP
8% and the BOTTOM 8% as calm empty margin. Leave the BOTTOM-RIGHT CORNER (about 10%
of the width and 18% of the height) as plain flat empty ground with no detail at all.

Scene (right quarter): a READING CHART — a small honey-wood board hanging at a
slight tilt, its face ruled into a neat grid of little empty squares. The squares in
the first rows are already filled with round vermilion INK STAMPS in one continuous
unbroken run, and the rest are still empty. The squares and the stamps must be
completely blank: no letters, no numbers, no ticks, no dates — just plain circles of
red ink on plain ruled squares. Keep the wood light and sunlit, like pale beech, not
dark walnut.

In front of the board one grown sheep stands upright on its hind legs, pressing a
small round wooden stamp firmly into today's square with both front hooves, eyes
closed, serene and very slightly smug. A shallow dish of vermilion ink sits by its
feet.

The joke is the lamb: beside it a tiny lamb is hauling up an ENORMOUS round wooden
stamp, almost as big as its whole body, with both front hooves — utterly solemn,
cheeks puffed with effort — and the stamp is OBVIOUSLY far too big for the tiny
squares on the chart. Nothing in its mouth, no tongue, no object touching its face.

One closed book with a soft ribbon marker rests on the ground next to them, its
cover completely plain and blank and in a light dusty blue. Keep the characters
SMALL — their heads must not reach higher than 62% up from the bottom edge — and
keep the entire cluster, board included, inside the right quarter of the frame.

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
A very wide 3:1 panoramic background illustration for the header banner of a "Bible
reading plan" page in a mobile church app, DARK MODE. IMPORTANT: this banner sits on
a VERY DEEP MIDNIGHT-NAVY card with white text laid on top, and the picture must be
just as dark as the attached night reference image — an almost-black navy night
where only a thin crescent moon, a few tiny stars and one small warm lamp are
bright. Do not lighten the sky. Do not add a blue glow.

Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, warm rim lighting only where the lamp
reaches. Use the SAME small chubby white sheep character as the attached character
reference: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep midnight navy. #0A1428 in the upper left, lifting only very slightly
to about #16224a toward the lower right — the sky must stay inside that narrow dark
band across the ENTIRE frame, with a scatter of tiny blue-white stars and one thin
crescent moon high on the right. The mood is "it is very late, but the lamb is
finishing today's reading anyway". The ONLY bright thing is one small AMBER oil
lantern and the small pool of warm light it drops on the chart; that pool must stay
compact and must not spread wider than a fifth of the frame. Everything outside that
pool falls back into near-black navy within a short distance.

The sheep's wool must read as DIM WARM GREY (around #b3bdd2), clearly darker than
white — it must never glow or read as a bright white blob. The honey-wood board is
dark walnut in shadow and only warms up where the lantern light touches it. Ground
and hills are near-black navy silhouettes.

Composition is critical: the whole scene sits inside the RIGHT QUARTER of the frame,
drawn as ONE tight cluster no wider than 25% of the width — do not spread the
characters horizontally. The LEFT THREE QUARTERS must be completely empty: a smooth
near-black navy gradient with a few faint stars and nothing else, because a title
and two lines of white text will be overlaid across it. Keep the TOP 8% and the
BOTTOM 8% as calm empty margin. Leave the BOTTOM-RIGHT CORNER (about 10% of the
width and 18% of the height) as plain flat empty ground with no detail at all.

Scene (right quarter): the same small READING CHART hanging at a slight tilt, its
face ruled into a grid of little empty squares, the first rows already filled with
round vermilion INK STAMPS in one continuous unbroken run. A small warm oil lantern
hangs just beside it, washing only the board and the sheep in gentle amber light.
The squares and the stamps must be completely blank: no letters, no numbers, no
ticks, no dates.

In front of the board the same grown sheep stands upright on its hind legs, pressing
a small round wooden stamp into today's square with both front hooves, eyes closed,
serene and slightly smug, wearing a tiny knitted nightcap flopped over one eye. Its
muzzle is a simple closed contented smile — nothing in its mouth, no tongue, no
object touching the face.

The joke is the lamb: beside it a tiny lamb has given up and fallen fast asleep,
curled up hugging its ENORMOUS round wooden stamp, almost as big as its whole body,
with one small round snore bubble. The huge stamp is OBVIOUSLY far too big for the
tiny squares on the chart.

One closed book with a soft ribbon marker rests on the ground beside them, almost
entirely in shadow, its cover completely plain and blank. Keep the characters SMALL
— their heads must not reach higher than 62% up from the bottom edge — and keep the
entire cluster, board included, inside the right quarter of the frame.

Do NOT draw any user-interface elements, buttons, pills, panels or rounded
rectangles anywhere. The background must be ONE continuous soft gradient — never a
rectangular block, window or box of a different colour, and no straight background
edges anywhere. No text, no letters, no numbers, no logos. No frames, no borders, no
vignette, no rounded corners. The only bright areas in the entire image are the
lantern flame, the small amber pool on the chart, the crescent moon and the tiny
stars; everything else stays near-black midnight navy.
```

---

## 뽑고 나서

```
python docs/plan-hero-process.py           # ~/Downloads/1.png(라이트) 2.png(다크)
```

스크립트가 하는 일:

1. **워터마크 ✦ 제거 — 인페인트가 아니라 '알파 역산'.**
   ✦ 는 순수 흰색(255)을 **거의 일정한 알파(2판 실측 0.2995)** 로 올린 하드 글리프이고,
   모양은 **x↔y 스왑에 대칭인 4각 별**이다. 이 두 성질이 복원의 전부다.
   - 좌표(**1792×592 기준**): 중심 **(1671.5, 471.5)**, 팔 길이 ≈ 24px. **두 세대 연속 같은 자리**였다
     — 제미나이는 우하단에서 고정 오프셋으로 찍는다. 재생성해도 이 좌표를 먼저 의심하지 말 것.
   - **1판의 '별 둘레 2차 다항식 맞춤'은 폐기.** 2판은 별이 **책 위**(그것도 책 윗모서리의 밝은
     하이라이트)에 걸려 맞춤이 무너졌다 → 알파 0.535(정상의 두 배) → **책 표지에 검은 얼룩**.
     배경이 평평하다는 가정 자체가 위험하다.
   - 지금 방식(`watermark_alpha`): ① 반경 25 원반 **중앙값**으로 대략의 배경 → 잔차(얇은 별은
     지워지고 긴 엣지는 남으므로 바닥이 뭐든 후보는 잡힌다), ② 알파 레벨은 **세로 팔**에서만
     중앙값으로 측정, ③ 행별 반폭 `H(|t|)` 를 재서 위/아래를 접어 **큰 쪽**을 취한다(오염된 띠는
     짧게 잘리므로 자동 탈락), ④ x↔y 대칭이므로 **"행 조건 ∪ 열 조건"** 으로 4배 슈퍼샘플
     래스터라이즈 → 가운데 오염 띠까지 정확히 메워진다.
   - 검산: 남색 바닥 44 위의 별은 107(=44·0.7+255·0.3), 책 표지 100 위의 별은 146.5.
     둘 다 알파 0.30 으로 떨어지면 제대로 잡힌 것이다. 복원 후 그 자리는 주변과 ±3 이내.
   - TELEA 인페인트는 여전히 쓰지 말 것. 주인공 실루엣을 빨아들여 얼룩이 남는다.
2. 위로 캔버스를 늘려 **2.2:1** 로 만든다(위 "왜 2.2:1 인가").
3. `blend_to_sky` — 왼쪽에서 **큰 물체만** 자기 하늘색으로 녹이고(x 0.50→0.90 램프),
   알파는 255 그대로 둔 채 1536 폭 webp 로 저장한다.
   - 하늘색은 통독표가 없는 x 5~58% 구간에서 **행별 1차식**을 맞춰 오른쪽으로 외삽한다
     (위아래 그라데이션과 아래쪽 바닥이 행마다 다르므로 단색으로 잡으면 안 된다).
   - ★x 램프만으로 녹이면 **왼쪽 별밤의 별까지 매끈한 하늘로 지워진다**(실제로 한 번 지웠다).
     그래서 "하늘과 다른 화소" 마스크를 만들고 **열림 연산(반경 4)으로 작은 점=별을 떨어뜨린 뒤**
     그 마스크 안에서만 램프를 먹인다. 별은 어디 있든 남는다.

---

## 적용한 코드 변경 (2026-09-05 반영 완료)

에셋만 갈아 끼우면 안 된다. **카드 그라데이션·잉크·글로우·링/그림자**가 라이트에서 전부 뒤집힌다.
파일은 `src/pages/Bible/Plans/PlanList.tsx` 히어로 `<section>` 한 곳(+ `plan-hero.css` 는 그대로).

1) **카드 배경 — 라이트/다크 분기 추가** (지금은 분기 없이 남색 하나)

```
// before
bg-[linear-gradient(120deg,#0b1224_0%,#14306a_58%,#2563eb_125%)]
   ring-1 ring-white/[0.08] shadow-[0_10px_34px_-12px_rgba(0,0,0,0.55)]

// after
bg-[linear-gradient(120deg,#f4f9ff_0%,#dbeafe_58%,#cfe3ff_125%)]
   ring-1 ring-[#3182f6]/15 shadow-[0_10px_30px_-14px_rgba(49,130,246,0.45)]
dark:bg-[linear-gradient(120deg,#080f22_0%,#0f1c3d_58%,#1a2f60_125%)]
   dark:ring-white/[0.08] dark:shadow-[0_10px_34px_-12px_rgba(0,0,0,0.6)]
```

다크 그라데이션의 끝 색을 `#2563eb → #1a2f60` 으로 낮추는 게 "더 어둡게"의 절반이다
(나머지 절반이 삽화). 이어읽기 다크 카드(`#091128`)와 같은 계열로 맞춘 값이다.

2) **라디얼 글로우 두 겹 — 라이트에서는 거의 지운다**

```
// 우상단
bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.55),transparent_58%)]
dark:bg-[radial-gradient(circle_at_82%_18%,rgba(96,165,250,0.30),transparent_55%)]
// 좌하단
bg-[radial-gradient(circle_at_18%_105%,rgba(49,130,246,0.10),transparent_52%)]
dark:bg-[radial-gradient(circle_at_18%_105%,rgba(49,130,246,0.22),transparent_52%)]
```

라이트에서 파란 글로우를 그대로 두면 밝은 카드가 얼룩진다 → 흰 하이라이트로 바꾼다.
다크 글로우는 `0.42 → 0.30` 으로 내린다(밝기 상한을 넘기는 주범이었다).

3) **잉크 — 라이트는 남색, 다크는 지금 그대로**

| | 라이트 | 다크 |
|---|---|---|
| 라벨 `READING PLAN` | `text-[#2563eb]` | `dark:text-white/65` |
| 제목 | `text-[#152648]` + `drop-shadow` 제거 | `dark:text-white` + 기존 drop-shadow |
| 안내 문구 | `text-[#41527a]` | `dark:text-white/80` |

제목의 `drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]` 는 **라이트에서 반드시 뺀다** —
밝은 배경 위 남색 글씨에 검은 그림자가 붙으면 지저분하다. `dark:drop-shadow-[...]` 로 옮긴다.

4) 히어로 아래의 **CTA·칩·플랜 카드**가 이 히어로 색을 참조하지 않는지 확인.
   (`PlanList.tsx` 안에서 `text-white` 로 히어로 밖까지 물려 쓴 곳이 없는지 grep)

5) `plan-hero.css` · `heroPrefetch.ts` · `index.html` 선요청은 **손댈 필요 없다** —
   파일명이 같고 `.dark` 분기 구조도 그대로다.

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

**장면이 가로로 넓게 퍼졌을 때** (1판·소식 히어로에서 매번 그랬다)

```
Keep the same characters, the same style and the same palette, but redraw the
layout: push the entire scene into the RIGHT QUARTER of the frame and draw the
characters as ONE tight cluster that fits inside a box no wider than 25% of the
width. The left three quarters must be nothing but the empty sky gradient.
```

**라이트가 너무 어둡게/파랗게 나왔을 때** — 남색 글씨가 죽는다.

```
Keep everything identical — same composition, same characters, same props. Only
change the lighting: raise the whole image to a bright high-key daylight palette.
The sky must be pale (#f4f9ff to #cfe3ff), every shadow must be a soft light
blue-grey, and no area of the picture may be darker than a soft mid-blue.
```

**다크가 너무 밝게 나왔을 때** (2판에서 제일 자주 볼 실패)

```
Keep everything identical — same composition, same characters, same props. Only
change the lighting: make the night much darker. The sky must stay between #0A1428
and #16224a everywhere, the sheep's wool must be dim warm grey rather than white,
and the lantern's pool of light must shrink so it only touches the board and the
sheep. Everything else falls into near-black navy.
```

**왼쪽이 안 비었을 때** — 다시 그리게 하지 말고 `plan-hero-process.py` 의 `FADE` 를 오른쪽으로
민다(기본 `(0.50, 0.90)`). 그 단계에서 하늘색으로 녹여 지우는 자리다.
단 **별·잔점은 마스크가 지켜 주므로 지워지지 않는다** — 왼쪽에 큰 물체가 들어왔을 때만 듣는다.

---

## 적용 상태

- **2026-09-04 (1판, 폐기)**: 라이트·다크 모두 남색 카드 + 흰 글씨. 왼쪽 절반은 알파로 파서
  카드 그라데이션이 비치게 했다. 라이트가 겉돌고 다크가 충분히 어둡지 않아 2판으로 교체.
- **2026-09-05 (2판, 적용 완료)**
  - 에셋 `public/images/plans/hero-{light,dark}.webp` — 1536×699 RGBA(전면 불투명), **19.4KB / 19.0KB**.
  - 워터마크는 '프로파일 + 대칭' 방식으로 제거(알파 0.2995, 복원 오차 ±3). 위 "뽑고 나서" 1번.
  - **★알파 페이드 폐기.** 카드 남색이 삽화의 별밤 하늘을 덮는다는 지적을 받고, 삽화를 전면
    불투명으로 깔고 통독표 왼쪽 끝만 자기 하늘색으로 녹이는 방식으로 바꿨다. 카드 배경은
    이제 **삽화 도착 전 자리끼움**일 뿐이라 색을 삽화 하늘색과 같게 맞춰 뒀고
    (라이트 `#dceefc→#eef7ff`, 다크 `#060d1c→#0c162e`), **라디얼 글로우 두 겹은 삭제**했다
    (불투명 삽화 아래라 보이지도 않으면서 페이드인 동안만 파랗게 번쩍였다).
  - 밝기 실측(글자 사각형): 라이트 안내문 **240 / p5 222**, 다크 안내문 **42 / p95 105**.
    PC 는 세 사각형 모두 빈 하늘만 얹히므로 여유가 크다(다크 23 / p95 29).
  - `plan-hero.css` · `heroPrefetch.ts` · `index.html` 선요청은 손대지 않았다.
