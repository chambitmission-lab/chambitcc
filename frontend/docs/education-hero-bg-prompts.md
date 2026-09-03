# 교육과 훈련 히어로 배경 이미지 프롬프트 (Gemini용)

`/education` 상단 **히어로 카드**(`Education/education.css` `.edu-hero`) 뒤에 깔 배경.
라이트/다크 각 1장. 컨셉은 칭호·이어읽기·기도방 배경과 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**,
장면은 "양들의 주일학교 교실" — 이 화면만큼은 대놓고 **유머러스하게**(가르치는 양 한 마리,
배우는 새끼양 세 마리, 그 중 하나는 자고 있다). 라이트는 맑은 아침 교실, 다크는 **밤에도 불 켜진**
공부방.

## 사용법

1. Gemini에 `public/images/title-bg/` 중 아무 이미지나 한 장 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로" 라고 덧붙인 뒤, 아래 프롬프트를 통째로 붙여넣는다.
2. 결과물 저장 위치 (파일명 고정):
   - 라이트: `frontend/public/images/education/hero-light.webp`
   - 다크:   `frontend/public/images/education/hero-dark.webp`
3. 규격: **2:1 가로 (1536×768 권장)**, `cwebp -q 78 원본.png -o hero-light.webp`, 한 장 60KB 이하.
   크게 뽑았으면 `magick in.png -resize 1536x768^ -gravity south -extent 1536x768 out.png`
   로 **아래쪽 기준** 크롭(위가 아니라 아래가 기준 — 아래 크롭 계산 참고).
   Gemini 워터마크(우하단 ✦)는 OpenCV TELEA inpaint로 제거, 마스크는 배경 안쪽으로만.

## 레이아웃 제약 (프롬프트의 핵심)

히어로가 **모바일에서 라운드 카드, PC에서 페이지 카드 윗면 띠**라 비율이 크게 달라진다.
실측: 모바일 약 358×345(**≈1.04:1**), PC 약 1200×258(**≈4.65:1**). `cover; center bottom` 기준 크롭:

| | 보이는 영역 |
|---|---|
| 모바일 | 세로 **전체**, 가로는 **가운데 52%** |
| PC | 가로 **전체**, 세로는 **아래 43%** |

→ 두 크롭의 교집합은 **"아래쪽 띠 × 가운데"**. 그래서:

- **핵심 장면(선생 양 + 새끼양들)은 화면 아래 40% 띠의 가운데 절반 안에.**
- 왼쪽·오른쪽 바깥 1/4은 **PC에서만 보이는 보너스 소품** 자리(책 더미, 화분, 종이비행기 등).
- **위쪽 60%는 거의 비워 둔다** — 배지·제목·부제·바로가기 칩이 그 위에 올라간다.
- 히어로 글씨는 **어두운 잉크**(`--text-strong`)다. 흰 글씨 히어로(랜딩·/about)와 반대로,
  **라이트는 아주 창백한 high-key**여야 한다. 위쪽 텍스트 존은 거의 흰색에 가깝게.
- 아래 띠는 '한눈에 보기' 스탯 박스 2개(반투명 브랜드 틴트)가 덮는다 →
  **바닥은 단순하게, 캐릭터는 머리만 스탯 박스 위로 빼꼼 나오는 높이**로.
- 글자·숫자·로고 금지(칠판에도 **글씨 대신 낙서**). 테두리·비네트 금지 — 카드 모서리는 CSS가 처리.
- 다크 카드 바탕은 남색이 아니라 **차콜 `#201f1f`** → 다크는 남색 밤하늘이 아니라
  **따뜻한 차콜 + 앰버 스탠드 불빛**으로 이어져야 한다.

---

## 라이트 테마 프롬프트

```
A wide 2:1 background illustration for the header card of an "education & training"
page in a mobile church app, LIGHT MODE, very pale and high-key (dark navy text will
be laid on top, so the whole image must stay bright and low-contrast). Style:
cozy-epic children's storybook illustration — soft flat shapes with subtle grain
texture, rounded friendly forms, gentle airy morning light. Use the SAME small
chubby white sheep character as the attached reference image: stubby legs, tiny
round black hooves, serene slightly smug smile.

Palette: pale high-key sky blue and warm cream (the deepest tone around #3182f6,
used only in tiny accents), soft honey-wood furniture, a few pastel mint and apricot
props. Everything washed in bright morning haze.

Composition is critical: ALL of the artwork sits in the BOTTOM 40% of the frame, and
the MAIN SCENE must be inside the CENTER HALF of the width. The TOP 60% must be
almost completely empty — just a smooth pale blue-to-cream gradient with maybe two
faint clouds and a few tiny floating sparkle dots, because a title and buttons will
be overlaid there.

Main scene (center, bottom band): a tiny Sunday-school classroom. One grown sheep
plays TEACHER: standing upright on its hind legs beside a small honey-wood easel
chalkboard, wearing little round spectacles, holding a pointer stick that is
comically far too long for its stubby hoof. On the chalkboard there is only a
childish chalk DOODLE — a heart, a wobbly little cross, a curly arrow — absolutely
no letters or numbers. In front of the teacher, THREE tiny lambs sit at miniature
wooden desks: the first stands up on its desk with one hoof shot straight into the
air, desperate to answer; the second wears an oversized graduation cap that has
slid down over its eyes so it is facing the wrong way entirely; the third is fast
asleep face-down on its desk with one small round snore bubble floating above it.
Keep all of them SMALL and light — their heads should reach no higher than the
midline of the image.

Bonus props spread into the far LEFT and far RIGHT quarters, along the same bottom
band, low and simple: a leaning stack of picture books with a red apple on top, a
potted little plant, a wooden abacus with pastel beads, a scattering of fat crayons,
one paper airplane gliding in from the edge.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette. The top edge must fade into a plain almost-white pale blue gradient.
```

## 다크 테마 프롬프트

```
A wide 2:1 background illustration for the header card of an "education & training"
page in a mobile church app, DARK MODE. Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain texture, rounded friendly forms,
warm rim lighting. Use the SAME small chubby white sheep character as the attached
reference image: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep warm CHARCOAL (around #201f1f) with a faint cool blue tint in the
upper area — NOT navy blue, NOT black. The mood is "it is late at night, but the
study lamp is still on": the only bright accents are AMBER lamp light and one small
candle, pooling warmly over the desks. Keep everything muted and low-contrast so
light text stays readable across the top.

Composition is critical: ALL of the artwork sits in the BOTTOM 40% of the frame, and
the MAIN SCENE must be inside the CENTER HALF of the width. The TOP 60% must be
almost completely empty — just a smooth dark charcoal gradient with a few faint dust
motes catching the lamplight, because a title and buttons will be overlaid there.

Main scene (center, bottom band): the same tiny Sunday-school classroom at night.
The same grown sheep TEACHER stands upright beside the small easel chalkboard in
little round spectacles, holding the comically over-long pointer, mid-lesson and
quietly proud of itself. The chalkboard shows only a soft glowing chalk DOODLE — a
heart, a wobbly little cross, a curly arrow — no letters or numbers. In front, THREE
tiny lambs at miniature desks: the first still standing on its desk with a hoof
raised, wide awake and unstoppable; the second wearing the oversized graduation cap
slid over its eyes, now dozing upright inside it; the third completely asleep
face-down with a tiny knitted blanket over its back and one small round snore
bubble. A little brass desk lamp with a warm amber cone of light sits on the corner
of the front desk, and one short candle burns beside the chalkboard. Their wool
catches the warm rim light against the dark room.

Bonus props spread into the far LEFT and far RIGHT quarters, along the same bottom
band, low and simple and mostly in shadow: a leaning stack of picture books, a
potted little plant, a wooden abacus, a few crayons, one paper airplane gliding in
from the edge with a faint amber glint.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette. The only bright areas are the lamp, the candle and the glowing chalk
doodle — everything else stays deep charcoal.
```

---

## 적용할 때 (이미지 나온 뒤)

- `.edu-hero` 의 `background-image` 를 `url(...)` + 기존 그라데이션으로 겹치고,
  `background-size: cover; background-position: center bottom;` (라이트/다크는
  `[data-theme="dark"] .edu-hero` 로 분기).
- 지금 히어로에 있는 **`::before` 블루 blur 원**은 배경 위에서 뿌옇게 뜨므로 같이 정리할 것.
- 라이트 결과물이 프롬프트보다 어둡게 나오면(기도방 배경 때처럼) 잉크를 흰색으로 뒤집지 말고
  **이미지를 더 밝게 다시 뽑는다** — 이 화면은 본문 카드들이 전부 어두운 잉크라 히어로만
  흰 글씨가 되면 어긋난다.
