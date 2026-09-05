# 문화교실 히어로 배경 이미지 프롬프트 (Gemini용)

`/culture` 최상단 **타이틀 밴드**(`Culture/Culture.tsx` 의 `<header className="px-4 pt-5 pb-3">` —
`CULTURE CLASS` / `문화교실` / 안내 한 줄) 뒤에 깔 배경. 라이트/다크 각 1장.

컨셉은 칭호·교육·헌금·소식 배경과 **같은 코지-에픽 동화풍 + 같은 양 캐릭터**.
장면은 **"양들의 문화교실 종강 발표회"** — 시리즈 규칙대로 웃음은 *정성 > 결과*에서 나온다.

| | 장면 | 유머(정성 > 결과) | 고유 소품 |
|---|---|---|---|
| 문화교실 | 뜨개·악기·수채화가 한 자리에 | 12주 내내 뜬 목도리가 **끝나지 않아** 새끼양 하나가 통째로 감겨 있다 | 뜨개바늘·실뭉치·우쿨렐레·수채 팔레트·컵케이크·꽃병 |

> **다른 화면과 소품이 겹치면 안 된다.**
> 교육(`docs/education-hero-bg-prompts.md`) = 칠판 이젤 · 책상 · 졸업모 · 주판 · 크레용.
> 행사 앨범(`docs/news-hero-bg-prompts.md`) = 카메라 · 삼각대 · 가랜드 · 사진 카드.
> 소식 = 확성기 · 손종 · 종이비행기 / 공지 = 알림판 · 압정.
> → 문화교실 프롬프트에는 **칠판·책상·졸업모·카메라·확성기 금지**를 못 박아 두었다.
> 강좌 카테고리(`cultureAccents.ts`: 수채화 · 캘리 · 베이킹 · 커피 · 악기 · 요가 · 공예 · 꽃꽂이)
> 안에서만 소품을 고른 것도 같은 이유다.

## 사용법

1. Gemini에 `public/images/title-bg/` 중 아무 이미지나 한 장 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로" 라고 덧붙인 뒤, 아래 프롬프트를 통째로 붙여넣는다.
   **라이트 → 다크 순서로 한 세션에서 이어 뽑는 게 톤이 가장 잘 맞는다.**
2. 결과물 저장 위치 (파일명 고정):
   - 라이트: `frontend/public/images/culture/hero-light.webp`
   - 다크:   `frontend/public/images/culture/hero-dark.webp`
3. 규격: **2:1 가로 (1536×768 권장)**, 한 장 **50KB 이하**.
   `magick in.png -resize 1536x768^ -gravity center -extent 1536x768 out.png` →
   `cwebp -q 78 out.png -o hero-light.webp`.
4. 후처리(Gemini 워터마크 제거 · 왼쪽 알파 페이드)는 **소식·헌금 문서와 동일**하다.
   `docs/news-hero-process.py` 를 파일명만 바꿔 재사용하면 된다.
   워터마크(우하단 ✦)는 **TELEA 인페인트 말고 알파 역산**으로 지운다.

---

## 레이아웃 제약 (프롬프트의 핵심)

이 밴드는 **카드가 아니라 페이지 최상단 띠**라 아주 납작하고, 모바일↔PC 폭이 2배 넘게 변한다. 실측:

| | 폭 × 높이 | 비율 |
|---|---|---|
| 모바일(390px) | 약 390×109 | **≈3.6:1** |
| PC(lg 본문 열, 1240 − 312 레일) | 약 864×109 | **≈7.9:1** |

너무 납작해서 `cover` 로 깔면 **캐릭터의 몸통 한 줄만 남는다.**
그래서 소식 히어로와 같은 방식으로 간다:

```css
background-size: auto 100%;      /* 높이 맞춤 */
background-position: right center;
background-repeat: no-repeat;
```

→ 2:1 원본이 높이 109px에 맞춰 **218px 폭**으로 그려지고, **이미지 오른쪽 끝 = 화면 오른쪽 끝**.
모바일에서는 오른쪽 56%, PC에서는 오른쪽 25%를 차지한다. **세로는 항상 100% 다 보인다** —
교육 히어로처럼 "아래 40%만 보인다"가 아니라, **위아래가 전부 보이는 대신 가로가 좁다**.

그래서 프롬프트 규칙이 정반대다:

- **장면은 세로로 꽉 채우고, 가로로는 한 덩어리로 뭉친다.** 옆으로 늘어놓으면 안 된다.
- **왼쪽 45%는 완전히 빈 배경**(그라데이션만). 여기에 제목이 얹히는 게 아니라 —
  모바일에서는 안내 문구 "아름다운 배움과 즐거운 만남이 있는 참빛 문화교실입니다"가
  **이미지 왼쪽 절반 위를 실제로 지나간다.** 후처리 알파 페이드도 이 구간에 건다.
- **위 10% · 아래 10%는 여백**. 위는 헤더 상단 여백에서 잘리고, 아래는 칩 탭
  (`강좌 · 신청 내역 · 공지사항 · 문의`)의 경계선과 맞닿는다. 머리끝·발끝이 선에 닿으면 지저분하다.
- 히어로 글씨는 라이트에서 **어두운 잉크**(`--text-strong`) → 라이트는 **아주 창백한 high-key**.
  다크는 흰 글씨 → 저채도.
- 다크 배경은 카드(`#201f1f`)가 아니라 **앱 캔버스 `#131313`** 이다. 다른 화면 다크보다 **한 단계 더 어둡게**.
- 글자·숫자·로고 금지. 악보에도 음표만, 그림에도 낙서만.
- 테두리·비네트·라운드 모서리 금지 — 카드 모서리는 CSS가 처리한다.

---

## 라이트 테마 프롬프트

```
A wide 2:1 background illustration for the title band at the top of a "culture
class / hobby class" page in a mobile church app, LIGHT MODE, very pale and
high-key (dark navy text will be laid on top, so the whole image must stay bright
and low-contrast). Style: cozy-epic children's storybook illustration — soft flat
shapes with subtle grain texture, rounded friendly forms, gentle airy morning
light. Use the SAME small chubby white sheep character as the attached reference
image: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: pale high-key sky blue and warm cream (the deepest tone around #3182f6,
used only in tiny accents), soft honey-wood, and small pastel notes of rose, mint
and apricot. Everything washed in bright morning haze. Warm and cheerful, never
flashy.

Composition is critical, follow every rule:
1. The LEFT 45% of the frame must be completely empty from top to bottom — just a
   smooth pale blue-to-cream gradient. A line of text will pass over it.
2. The ENTIRE scene is ONE tight cluster inside the RIGHT 55% of the width. Do NOT
   spread the characters out sideways — they overlap and lean on each other like a
   small group photo.
3. The cluster fills the height: it may run from about 12% down to about 90% of the
   frame height. Nothing at all in the top 10% or the bottom 10%.
4. The background is ONE continuous soft gradient. Never draw a rectangular block,
   panel, window or box of a different colour — no straight background edges
   anywhere.
5. Do NOT draw any user-interface elements, buttons, pills, panels, cards or
   rounded rectangles.

Main scene (that tight cluster on the right): the last day of a little hobby class.
One grown sheep sits upright and KNITS, holding two slim wooden needles in its
stubby hooves, eyes closed, serene and very slightly smug, a plump ball of rose
yarn resting against its side.

The joke: the scarf it has been knitting for twelve weeks is ABSURDLY long. It
spills down in soft loops and has completely wrapped up a tiny lamb standing beside
it — the lamb is cocooned from hooves to chin, only its round face and two ears
poking out of the wool, utterly solemn and quietly proud to have been chosen. One
loose end of the scarf trails off toward the bottom of the cluster and stops.

Around them, pressed close into the same cluster: a second tiny lamb hugging a
honey-wood UKULELE that is almost bigger than its whole body, one hoof mid-strum,
cheeks puffed, eyes squeezed shut with feeling. Behind them a small watercolour
PALETTE with three pastel paint dabs and a jar holding two brushes, one crooked
CUPCAKE whose cream swirl is taller than the cupcake itself, and a tiny glass jar
with three pale blossoms. A few tiny sparkle dots and two drifting petals float in
the air just above the group.

Do NOT draw a chalkboard, school desks, a graduation cap, a camera or a megaphone —
those scenes belong to other screens.

No text, no letters, no numbers, no musical notation, no logos anywhere. No frames,
no borders, no vignette, no rounded corners. The left 45% must fade into a plain
almost-white pale blue gradient.
```

## 다크 테마 프롬프트

```
A wide 2:1 background illustration for the title band at the top of a "culture
class / hobby class" page in a mobile church app, DARK MODE. Style: cozy-epic
children's storybook illustration — soft flat shapes with subtle grain texture,
rounded friendly forms, warm rim lighting. Use the SAME small chubby white sheep
character as the attached reference image: stubby legs, tiny round black hooves,
serene slightly smug smile.

Palette: deep warm near-black CHARCOAL (around #131313) with a faint cool blue tint
in the upper area — NOT navy blue, NOT pure black, and darker than a typical card
background. The mood is "class ended hours ago, but nobody wants to pack up yet":
the only bright accents are one small AMBER lamp glow and a faint rose highlight on
the yarn. Keep everything muted and low-contrast so light text stays readable, and
let the sheep's wool read as soft warm grey, never bright white.

Composition is critical, follow every rule:
1. The LEFT 45% of the frame must be flat empty charcoal from top to bottom. A line
   of text will pass over it.
2. The ENTIRE scene is ONE tight cluster inside the RIGHT 55% of the width. Do NOT
   spread the characters out sideways — they overlap and lean on each other.
3. The cluster fills the height: about 12% down to about 90% of the frame height.
   Nothing at all in the top 10% or the bottom 10%.
4. The background is ONE continuous soft gradient. Never draw a rectangular block,
   panel, window or box of a different colour — no straight background edges
   anywhere.
5. Do NOT draw any user-interface elements, buttons, pills, panels, cards or
   rounded rectangles.

Main scene (that tight cluster on the right): the same little hobby class, late at
night. One grown sheep still sits upright KNITTING with two slim wooden needles,
eyes closed, serene and slightly smug, wearing a tiny knitted nightcap flopped over
one eye, a plump ball of rose yarn glowing faintly beside it. Its muzzle is a simple
closed contented smile — nothing in its mouth, no tongue, no object touching the
face.

The joke: the scarf is ABSURDLY long and has completely wrapped up a tiny lamb
standing beside it — cocooned from hooves to chin, only its round face and two ears
out, utterly solemn, and now fast asleep standing up inside the wool with one small
round snore bubble.

Pressed into the same cluster: a second tiny lamb hugging a honey-wood UKULELE
almost bigger than its body, one hoof resting on the strings, dozing against it. A
small brass desk LAMP leans over the group, pooling warm amber light down over the
wool and the yarn — this is the only real light source. Behind them, mostly in
shadow, a watercolour palette with three faint paint dabs, a jar with two brushes,
one crooked cupcake, and a tiny glass jar with three pale blossoms. A few dust motes
drift through the lamplight.

Do NOT draw a chalkboard, school desks, a graduation cap, a camera or a megaphone —
those scenes belong to other screens.

No text, no letters, no numbers, no musical notation, no logos anywhere. No frames,
no borders, no vignette, no rounded corners. The only bright areas are the lamp
cone, the yarn highlight and the rim light on the wool; the left 45% must be flat
#131313 charcoal.
```

---

## 제미나이가 자주 틀리는 것 (재생성 때 확인)

소식 히어로 6장에서 반복된 실패다. 위 프롬프트에 이미 방어 문장을 넣어 두었으니 **결과만 확인**하면 된다.

1. **UI 요소를 진짜로 그린다** — "a UI pill sits there" 같은 문장을 묘사로 읽는다. (규칙 5로 차단)
2. **하늘을 사각형 패널로 그린다** — 다크에서 밝은 직사각형이 그대로 뜬다. (규칙 4로 차단)
3. **장면을 가로로 넓게 편다** — 가장 자주 틀린다. 이 화면은 가로가 특히 좁으니
   결과가 옆으로 퍼졌으면 **다시 뽑는 편이 빠르다**(잘라 쓰면 캐릭터가 잘린다).

## 적용 상태 (2026-09-05)

두 장 모두 적용 완료. 후처리는 **`docs/culture-hero-process.py` 한 방**이면 재현된다
(원본을 `~/Downloads/3.png`(라이트) `4.png`(다크) 로 받아두고 `python3 docs/culture-hero-process.py`).

- **에셋**: `public/images/culture/hero-{light,dark}.webp` (837×504 RGBA, 27.8KB / 25.9KB).
  원본 1456×720 → 알파 0 인 왼쪽(x<260)을 잘라내고 0.70 배 축소. 잘라도 `right center`
  정렬이라 화면 결과는 같다.
- **워터마크 제거는 인페인트가 아니라 알파 역산**(피크 **0.306**, 중심 **(1335.5, 599.5)**,
  반지름 ≈24px). 다만 이번엔 캡슐·소식 방식을 그대로 쓸 수 없었다 —
  **별의 왼쪽 위 절반이 우쿨렐레 양의 양털에 겹쳐** 있어서 별 둘레에 배경을 회귀시킬 수가 없다
  (둘레의 절반이 배경이 아니다). 그래서 **별이 평평한 어둠 위에만 있는 오른쪽-아래 사분면에서
  알파를 재고 좌우·상하 대칭으로 나머지를 복원**했다. 중심은 대칭 오차 최소화로 0.25px 단위로 맞췄다.
  → 겹침이 있는 원본에서도 재현 가능한 방법이니, 다음 장에서도 이 순서를 먼저 시도할 것.
- **알파 페이드는 세 방향**(왼쪽 x300→665 · 위 라이트 120px/다크 48px · 아래 692→720).
  다크의 위쪽 페이드가 짧은 건 **y≈61 에 스탠드 갓**이 있어서다. 여기는 카드가 아니라 페이지
  최상단 띠라, 페이드가 없으면 라이트의 하늘색·크림색이 캔버스(`#f1f3f6`)와 가로줄 이음매를 만든다.
- **CSS 는 `src/pages/Culture/culture-hero.css` 의 `.culture-hero`** — `auto 100%` + `right center`,
  `min-height: 8rem`. 높이맞춤이라 **밴드 높이가 곧 삽화 크기**다. 안내 문구가 모바일 두 줄 /
  PC 한 줄이라 밴드가 갈리는 걸 8rem 으로 묶어 양 크기를 같게 했다.
- **PC(lg+)는 `min-height: 13rem`** — 본문 열이 864 로 넓어지면 213px 삽화가 작아 보인다.
  배율(`auto 115%` 같은)로 키우면 위아래가 잘리는데 **다크는 y≈8.5% 에 스탠드 갓**이 있어
  잘라선 안 된다 → **밴드를 키워서** 삽화를 키운다(약 345px). 늘어난 여백은 글 묶음을
  세로 가운데(`flex` + `justify-content: center`)로 보내 삽화와 축을 맞춘다.
- **안내 문구는 `max-w-[62%] lg:max-w-none`.** 안 묶으면 모바일에서 문구(약 320px)가
  삽화 왼쪽 절반을 지나 목도리에 감긴 새끼양 위까지 올라탄다.
- 반대 테마 삽화는 `Culture.tsx` 의 `requestIdleCallback` 으로 미리 데운다
  (CSS 배경은 preload 스캐너 사각지대 — 테마 토글 순간 빈 밴드가 되는 걸 막는다).
- 제미나이가 이번엔 세 가지 실패(UI 요소·사각 패널·가로로 퍼짐)를 **하나도 하지 않았다.**
  구도(왼쪽 46% 비움 · 오른쪽 한 덩어리 · 위아래 여백)도 프롬프트대로 나왔다.

---

## 적용할 때 (이미지 나온 뒤)

- `Culture.tsx` 의 `<header>` 에 `culture-hero` 클래스를 만들어 붙이고,
  `background-image` + `auto 100% / right center / no-repeat`,
  다크는 `[data-theme="dark"] .culture-hero` 로 분기한다.
- **칩 탭(`nav`)에는 배경을 깔지 않는다.** 지금처럼 `bg-surface/95` 로 두어야 스크롤 시
  sticky 상태에서 글자가 깨끗하다.
- 안내 문구는 모바일에서 이미지 위를 지나가므로, 겹침이 남으면
  **문구에 `max-w-[62%]`** 를 걸거나 후처리 알파 페이드를 더 길게 굽는다(소식과 같은 처방).
- CSS 배경은 preload 스캐너 사각지대라 첫 진입에서 늦게 뜬다
  (`docs`/메모의 *CSS background late discovery*) → 반대 테마 이미지는 유휴 시간에 미리 데운다.
