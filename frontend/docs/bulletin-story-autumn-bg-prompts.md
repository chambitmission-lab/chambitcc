# 디지털 주보(넘겨보기) 가을 배경 프롬프트 (Gemini용)

`/news?tab=bulletin` 의 **넘겨보기 주보**(`News/components/BulletinStory.tsx`) 각 장 뒤에 깔
가을 배경. 장마다 1장씩, **라이트/다크 각각**. 콘셉트는 세 가지(A·B·C) — 하나를 골라
그 안의 장면을 전부 같은 세션에서 뽑는다.

> 이 문서는 "공지 아카이브·소식 히어로" 문서와 달리 **가로 띠가 아니라 정사각형**이다.
> 주보 무대(`.bs-deck`)는 모바일에선 세로로 길고, PC에선 가로로 넓기 때문이다. 아래 "레이아웃" 필독.

---

## 0. 장 구성과 바탕 톤 (지금 코드 기준)

| # | 장 (`key`) | 톤 | 위에 얹히는 글자 | 내용 배치 | 배경 파일 슬롯 |
|---|---|---|---|---|---|
| 1 | 표지 `cover` | cover | 흰 글씨 | **아래쪽** 표어·말씀 | (선택) 지금은 계절 사진 `autumn-morning.webp` |
| 2 | 예배 `worship` | blue | 흰 글씨 (라이트·다크 모두) | **가운데** 예배 시간 카드 | `worship-{light,dark}` |
| 3 | 설교 `sermon` | paper | 라이트=진한 글씨 / 다크=흰 글씨 | 위→아래, 중간에 양 교회 삽화 | `sermon-{light,dark}` |
| 4 | 기도 `prayer` | deep | 흰 글씨 | **가운데** 기도자 아바타 | `prayer-{light,dark}` |
| 5 | 소식 `news` (+추가 안내 `extra-*`) | paper | 라이트=진한 / 다크=흰 | 위→아래 **글이 가장 많음** | `news-{light,dark}` |
| 6 | 이번 주 `week` | blue | 흰 글씨 | **가운데** 요일 목록 | `week-{light,dark}` |
| 7 | 모임 `groups` | paper | 라이트=진한 / 다크=흰 | 위→아래 카드 격자 | `groups-{light,dark}` |
| 8 | 마무리 `end` | end | 흰 글씨 | 위 메달(양 얼굴) + 퀴즈 보기 | `end-{light,dark}` |

- paper 바탕: 라이트 `#ffffff`, 다크 따뜻한 차콜 `#201f1f` (남색 아님).
- blue / deep / end 는 지금 **라이트·다크 같은 색**(브랜드 블루 그라데이션 `#3182f6 → #163a86`,
  밤 남색 `#0f2350`)에 흰 글씨다. 그래서 이 세 장은 라이트=**맑은 낮의 푸른 가을 하늘**,
  다크=**해 질 녘·달밤**으로 나눠도 둘 다 흰 글씨가 읽혀야 한다.
- 추가 안내(`extra-*`)는 소식 배경을 같이 쓴다. 표지는 지금 사진이 예뻐서 **선택**으로 둔다.

**저장 위치(제안)**: `frontend/src/assets/bulletin/autumn/<장>-<light|dark>.webp`
→ `public/` 이 아니라 `src/assets` (해시 URL). `public/` 그림은 SW 캐시 탓에 고쳐도 안 바뀐다.
나중에 봄·여름·겨울을 더하면 `assets/bulletin/<season>/` 로 늘리고 `getNaturalSeason()` 으로 고른다
(표지가 이미 이 방식이다).

---

## 1. 레이아웃 — 정사각형 하나로 모바일·PC 둘 다 (프롬프트의 핵심)

| | 무대 크기(근사) | 비율 |
|---|---|---|
| 모바일(390px) | 358 × 520~760 | **세로 ≈ 0.5~0.7 : 1** |
| PC(lg, 목차 옆) | 800~950 × 560~800 | **가로 ≈ 1.1~1.6 : 1** |

CSS 는 전 장 공통으로 `background-size: cover; background-position: center bottom;` 하나만 쓴다.
그러면 **모바일은 좌우가 잘리고(가운데 50~70%만 보임), PC 는 위가 잘린다(아래 70~90%만 보임).**
그래서 정사각형 안의 구역을 이렇게 나눈다 (아래 기준 % / 왼쪽 기준 %):

```
 ┌───────────────────────────────┐  ← 위 20%: PC에서 잘릴 수 있음 → 비워 둔다
 │                               │
 │   ·  (작은 잎·잠자리·달 정도)   │  ← 72~85%: 작은 소품만, 가운데 쪽
 │                               │
 │        글자 구역(평평)         │  ← 28~72%: 거의 빈 매끈한 하늘/종이
 │                               │
 │ ░░옆 장식░░ ███장면███ ░░옆░░ │  ← 6~28%: 주인공 장면 (가로 25~75% 안에 핵심)
 │▁▁▁▁▁▁▁▁ 평평한 바닥 ▁▁▁▁▁▁▁▁│  ← 아래 6%: 무늬 없는 바닥 (워터마크 ✦ 자리)
 └───────────────────────────────┘
   0%   25%         75%   100%
```

- **꼭 보여야 할 것(캐릭터 얼굴, 주인공 소품)은 가로 25~75%, 높이 6~28% 안.**
  바깥 25%는 PC 에서만 보이는 "있으면 좋은" 장식(낙엽 더미, 들꽃).
- **paper 장(설교·소식·모임)은 장면 높이를 22% 이하로 더 낮게**, 아주 옅게.
  글이 아래까지 내려오고, 다크에선 흰 글씨가 그 위를 지나간다.
- 가운데 글자 구역에는 **진한 덩어리 금지**. 하늘·종이는 하나의 연속 그라데이션.
  사각형 하늘 패널·창문을 그리면 다크에서 뜬다(소식 히어로에서 2회 발생).
- 글자·숫자·로고 금지. 간판·책·종이에도 글씨 대신 낙서(물결선 세 줄·하트·작은 별).
- 테두리·비네트·모서리 라운드 금지 — 모서리는 CSS 가 깎는다.
- **UI 요소를 그리지 말 것.** "카드가 얹힌다"를 묘사로 읽고 흰 카드를 그린 전례가 있다.
  그래서 프롬프트에는 카드 얘기를 아예 안 쓰고 "빈 하늘/빈 종이"라고만 쓴다.

---

## 2. 사용법

1. Gemini 새 채팅. **A안이라면** `public/images/title-bg/` 중 아무 양 그림 한 장을 첨부한다
   (B·C안은 첨부 없음).
2. 고른 안의 **"① 세션 시작(공통 규칙)"** 블록을 먼저 보낸다. Gemini 가 "알겠다"고 하면,
3. 장면 블록을 **한 장씩, 라이트 → 다크 순서로** 이어서 보낸다. 세션을 나누면 양 얼굴·붓결이
   달라져서 테마를 바꿀 때 티가 난다.
4. 몇 장 지나 규칙을 잊는 것 같으면(글자가 생기거나 가운데에 큰 나무가 서면) 공통 규칙 블록을
   한 번 더 보내고 이어 간다.
5. 원본은 **정사각형 1:1, PNG** 로 받는다. 파일 이름은 `worship-light.png` 처럼 장 이름으로.
6. 후처리는 맨 아래 "후처리 · 적용" 참고 (워터마크 제거 → 1200px webp).

**고르는 법 한 줄 요약**

| 안 | 한 줄 | 이런 분께 |
|---|---|---|
| **A. 양들의 가을 주일** (추천) | 우리 앱의 그 양들이 가을 주일 하루를 보낸다. 장마다 작은 유머 하나 | 아이부터 어르신까지 "어머 귀여워" — 기존 삽화와 연작 |
| **B. 가을 수채 화첩** | 사람·동물 없이 단풍·은행·감·코스모스 수채 정물 | 가장 차분하고 글이 제일 잘 읽힘. 품위 있는 주보 |
| **C. 종이 오림 추수 들녘** | 여러 겹 종이를 오려 겹친 입체 디오라마. 황금 들녘·감나무 | 따뜻하고 손맛 있는 느낌. 11월 추수감사주일까지 쓰기 좋음 |

섞어 써도 된다 — 예: blue·deep·end 장은 A, paper 장은 B(글 많은 장을 가장 조용하게).
단, **한 장 안의 라이트/다크는 반드시 같은 안**으로.

---

# A안 — 양들의 가을 주일 (추천)

우리 앱의 그 통통한 흰 양들이 **가을 주일 하루**를 보낸다. 예배 가는 길 → 말씀 → 달밤 기도 →
동네 소식 → 한 주 → 모임 → 추수의 기쁨. 장마다 **아주 작은 웃음 하나**(머리에 붙은 단풍잎,
감을 세다 헷갈린 새끼양)를 넣어 "흐뭇하다"가 나오게 한다.

## A ① 세션 시작 (공통 규칙) — 먼저 이것만 보낸다

```
I am going to ask you for a SERIES of square background illustrations for a
mobile church app's digital Sunday bulletin. Each image sits behind one "page"
of the bulletin, and text is laid over it. Please read these rules and follow
ALL of them for every image in this chat. Reply "OK" and wait for the first scene.

STYLE: cozy-epic children's storybook illustration — soft flat shapes with
subtle paper-grain texture, rounded friendly forms, gentle light, a warm and
tender autumn mood that makes everyone smile. Use the SAME small chubby white
sheep character as the attached reference image in every picture: stubby legs,
tiny round black hooves, serene slightly smug smile, small lambs alongside.
Autumn palette: maple red, persimmon orange, ginkgo yellow, golden rice-field
ochre, chestnut brown, with soft sky blue. Nothing harsh, nothing flashy.

FORMAT: square 1:1 image.

LAYOUT (critical — the image is cropped differently on phones and on desktop):
1. The main scene lives ONLY in the bottom part of the image, between 6% and 28%
   from the bottom edge. Everything important (sheep faces, the key object) must
   be inside the horizontal middle half (from 25% to 75% of the width). The outer
   left and right quarters may only hold optional soft decoration such as leaf
   piles or wild flowers.
2. The very bottom 6% is plain flat ground with no detail at all.
3. The band from 28% to 72% from the bottom is the text area: keep it almost
   empty — only a smooth, continuous sky or paper gradient, with at most two or
   three tiny drifting leaves near the edges.
4. Between 72% and 85% from the bottom you may place one or two SMALL accents
   (a dragonfly, a leaf, a soft moon) inside the middle half.
5. The top 15% stays empty (it is cropped away on desktop).
6. The background is ONE continuous soft gradient — never a rectangular panel,
   window, block or box of a different colour, no straight background edges.

ALWAYS: no text, no letters, no numbers, no logos, no signs with writing (use
tiny doodles — three wavy lines, a heart, a small star — if something needs
markings). No frames, no borders, no vignette, no rounded corners. Do not draw
any user-interface elements, cards, buttons, pills or panels.

LIGHT MODE images: bright, airy, high-key and low-contrast.
DARK MODE images: muted and low-contrast, warm glow accents only; the sheep's
wool reads as soft warm grey, never bright white.
```

## A-2 예배 `worship` — "예배 가는 길, 높고 푸른 가을 하늘"

코스모스 길을 줄지어 예배 가는 양 가족. **웃음: 맨 뒤 막내 머리에 단풍잎이 한 장 붙었는데 혼자 모른다.**

### worship-light

```
Scene 1 — LIGHT MODE. White text will be laid over the middle of this image.
The sky is the famous high, clear Korean autumn sky: a smooth gradient from
bright brand blue #3182f6 at the top to a softer, deeper blue #1d4fb8 lower
down, saturated enough that white text reads well on it. Two small red
dragonflies hover in the upper accent area, wings catching the light.

Main scene (bottom band, middle half): a gentle path lined with pink and white
cosmos flowers, and a family of three sheep walking along it in a neat little
line on their way to Sunday worship — the parent in front, calm and slightly
smug, one lamb trotting proudly, and the tiniest lamb at the back with one red
maple leaf stuck on top of its head, completely unaware, looking very serious.
The outer quarters hold soft clusters of cosmos and a few fallen leaves.
Bright, fresh, morning light. Follow all layout rules from the style guide.
```

### worship-dark

```
Scene 1 — DARK MODE, the same scene at golden dusk after the evening service.
White text will be laid over the middle. The sky is a smooth gradient from deep
evening blue #163a86 at the top to a muted indigo near the horizon, with only a
low warm amber glow just above the ground line. One small dragonfly silhouette
in the upper accent area.

Main scene (bottom band, middle half): the same cosmos path and the same three
sheep walking home in a line, wool in soft warm grey; the parent carries a tiny
lantern that pools warm amber light on the path. The tiniest lamb at the back
still has the red maple leaf on its head, now yawning. Muted, low contrast,
quiet and content. Follow all layout rules from the style guide.
```

## A-3 설교 `sermon` — "낙엽 방석 위에서 귀 기울이기" (paper, 아주 옅게)

이 장엔 이미 양 교회 삽화가 중간에 들어간다. 그래서 배경은 **바닥에 아주 낮게, 양 한 마리만.**

### sermon-light

```
Scene 2 — LIGHT MODE. Dark text will be laid over most of this image, so it must
be VERY pale and very quiet. Background: a smooth warm white gradient that is
pure white #ffffff at the top and only a hint of cream near the ground.

Main scene — keep it extra low, no higher than 20% from the bottom, inside the
middle half: one small lamb sitting on a soft cushion of fallen ginkgo and maple
leaves, ears perked up, eyes shining, listening with complete attention, a tiny
open book (pages blank) beside it. A few acorns and a chestnut burr on the
ground. Very pale washed colours. Outer quarters: only a few scattered leaves.
Follow all layout rules from the style guide.
```

### sermon-dark

```
Scene 2 — DARK MODE. White text will be laid over most of this image.
Background: flat deep warm charcoal #201f1f across the whole image (NOT navy,
NOT black), with only a faint warm amber glow near the ground.

Main scene — no higher than 20% from the bottom, inside the middle half: the
same small lamb on a cushion of fallen leaves, listening with ears perked up,
a tiny blank open book beside it, lit by a soft warm candle glow. Wool in soft
warm grey. Leaves in muted rust and ochre. Everything else stays flat charcoal.
Follow all layout rules from the style guide.
```

## A-4 기도 `prayer` — "한가위 달 아래, 서로를 위해"

감나무 가지 아래 두 양이 기대어 기도한다. 가장 따뜻하고 조용한 장.

### prayer-light

```
Scene 3 — LIGHT MODE. White text will be laid over the middle. Early autumn
evening: the sky is a smooth gradient from rich twilight blue #2a5fc4 at the top
to a deeper blue #0f2350 near the ground, with a soft lavender-peach glow along
the horizon. A large soft full harvest moon sits in the upper accent area,
slightly right of centre, with a gentle halo — pale and calm, not glaring.

Main scene (bottom band, middle half): two sheep sitting close together on a
small grassy rise, leaning gently against each other, heads bowed and front
hooves folded together in prayer. A low persimmon branch with a few glowing
orange persimmons arches in from one side. A tiny lamb sits between them, eyes
closed, copying them as seriously as it can. Peaceful and tender.
Follow all layout rules from the style guide.
```

### prayer-dark

```
Scene 3 — DARK MODE. White text will be laid over the middle. Deep autumn night:
a smooth gradient from midnight blue #0f2350 at the top to near-black navy
#0a1733 at the bottom, a few faint stars, and the full harvest moon in the
upper accent area with a soft muted glow.

Main scene (bottom band, middle half): the same two sheep leaning together in
prayer and the tiny lamb between them — who has fallen asleep mid-prayer,
leaning on its parent, with one small round snore bubble. A small paper lantern
on the ground casts a warm amber circle around them. Persimmons on the branch
catch faint amber light. Wool in soft warm grey, everything muted.
Follow all layout rules from the style guide.
```

## A-5 소식 `news` (+추가 안내) — "낙엽 더미에 뛰어들기" (paper, 가장 옅게)

글이 제일 많은 장. **바닥 18% 이하, 아주 옅게.**
※ 다른 화면 소품(알림판·확성기·종·종이비행기·카메라·가랜드)은 금지.

### news-light

```
Scene 4 — LIGHT MODE. This page carries the most text, so the image must be the
palest and quietest of the whole series. Background: pure white #ffffff at the
top melting into the faintest cream near the ground.

Main scene — no higher than 18% from the bottom, inside the middle half: a small
heap of fallen maple and ginkgo leaves, and one lamb who has just jumped into it
joyfully — only its head and two tiny hooves pop out of the leaves, eyes
squeezed shut with delight, a few leaves flying up around it. A grown sheep sits
next to the heap holding a little rake, calm and slightly smug. Very pale washed
colours. Do NOT draw a notice board, pushpins, a megaphone, a hand bell, paper
planes, a camera or bunting. Follow all layout rules from the style guide.
```

### news-dark

```
Scene 4 — DARK MODE. This page carries the most text, so keep it the quietest
of the series. Background: flat deep warm charcoal #201f1f (NOT navy, NOT black).

Main scene — no higher than 18% from the bottom, inside the middle half: the
same leaf heap with the lamb popping out of it, and the grown sheep with the
little rake, in muted rust, ochre and warm grey, lit only by a faint warm amber
glow from one side. A couple of leaves drift in the air catching amber edges.
Do NOT draw a notice board, pushpins, a megaphone, a hand bell, paper planes, a
camera or bunting. Follow all layout rules from the style guide.
```

## A-6 이번 주 `week` — "감 일곱 개, 하루에 하나씩"

감나무 가지에 감이 **일곱 개(일주일)**. **웃음: 새끼양이 발굽으로 감을 세다가 헷갈려 눈이 빙글.**

### week-light

```
Scene 5 — LIGHT MODE. White text will be laid over the middle. Bright autumn
afternoon: a smooth sky gradient from brand blue #3182f6 at the top to a deeper
#1d4fb8 near the horizon, saturated enough that white text reads well.

Main scene (bottom band, middle half): a golden rice field along the ground and
a small persimmon tree whose low branch holds exactly SEVEN round orange
persimmons in a row. A grown sheep stands under it, serene and slightly smug.
A lamb stands on its tiptoes pointing at the persimmons one by one with a tiny
hoof, trying to count them — its eyes have gone into little swirls because it
lost count. A small scarecrow wearing a knitted sheep-wool hat stands in the
outer quarter of the field. Follow all layout rules from the style guide.
```

### week-dark

```
Scene 5 — DARK MODE. White text will be laid over the middle. The same place at
sunset turning to night: a smooth gradient from deep blue #163a86 at the top to
muted indigo, with a low warm amber band above the golden field.

Main scene (bottom band, middle half): the same persimmon tree with SEVEN
persimmons glowing softly like little lanterns, the grown sheep, and the lamb
who has given up counting and fallen asleep hugging the tree trunk. The
scarecrow with the wool hat stands in the outer quarter, a firefly or two nearby.
Muted, warm, low contrast. Follow all layout rules from the style guide.
```

## A-7 모임 `groups` — "군고구마 나눠 먹기" (paper, 옅게)

둘러앉아 군고구마·밤을 나누는 양들 — **공동체**. **웃음: 한 양이 너무 뜨거워 고구마를 저글링.**

### groups-light

```
Scene 6 — LIGHT MODE. Dark text will be laid over most of this image, so keep it
pale and quiet. Background: pure white #ffffff at the top melting into a hint of
warm cream near the ground.

Main scene — no higher than 22% from the bottom, inside the middle half: four
sheep sitting in a small circle on a picnic blanket around a little basket of
roasted sweet potatoes and chestnuts, sharing them happily. One sheep is
juggling a sweet potato between its hooves because it is too hot, cheeks puffed;
the others smile serenely. A thin curl of steam rises. Pale washed autumn
colours; outer quarters hold only a few leaves. Follow all layout rules.
```

### groups-dark

```
Scene 6 — DARK MODE. White text will be laid over most of this image.
Background: flat deep warm charcoal #201f1f (NOT navy, NOT black).

Main scene — no higher than 22% from the bottom, inside the middle half: the
same four sheep in a circle around a tiny glowing charcoal brazier roasting
sweet potatoes and chestnuts, faces lit by soft warm amber light, one still
juggling a hot sweet potato. Wool in soft warm grey, everything muted, the rest
of the image flat charcoal. Follow all layout rules from the style guide.
```

## A-8 마무리 `end` — "추수의 기쁨"

메달·퀴즈가 가운데에 얹히므로 **가운데는 완전히 비우고**, 아래에 추수 바구니와 기뻐하는 양들.

### end-light

```
Scene 7 — LIGHT MODE, the final celebratory page. White text and a round medal
will be laid over the middle, so keep the middle completely empty. Sky: a smooth
radial glow from bright blue #2d5fc0 near the top to a deep blue #0d1f47 lower
down, with a few maple and ginkgo leaves drifting down near the left and right
edges like gentle confetti.

Main scene (bottom band, middle half): a big woven harvest basket overflowing
with apples, persimmons, chestnuts and golden rice stalks. Three sheep around it
celebrating — one hopping with joy, one hugging the basket proudly, and a tiny
lamb who has climbed INTO the basket and sits on top of the fruit, beaming as if
it were part of the harvest. Joyful, grateful, warm. Follow all layout rules.
```

### end-dark

```
Scene 7 — DARK MODE, the final page. White text and a round medal will be laid
over the middle, so keep the middle completely empty. Sky: a smooth gradient
from deep blue #163a86 at the top to near-black navy #0d1f47, a few faint stars
and a handful of leaves drifting near the edges catching amber light.

Main scene (bottom band, middle half): the same harvest basket and three sheep,
now under a short string of small warm lanterns along the ground, the tiny lamb
still sitting in the basket, now dozing contentedly on top of the persimmons.
Muted, warm, low contrast. Follow all layout rules from the style guide.
```

## A-1 표지 `cover` (선택)

지금 계절 사진이 잘 어울리면 건너뛴다. 삽화 표지로 통일하고 싶을 때만.
표지는 **글이 아래**에 얹히고 위에서 아래로 어두운 스크림이 깔린다 → 장면을 **위·가운데**로.

```
Scene 0 (optional cover) — LIGHT MODE. EXCEPTION to the layout rules for this
one image only: white text will be laid over the BOTTOM 40%, which will be
darkened by an overlay, so place the scene in the middle of the image (between
40% and 80% from the bottom), inside the middle half of the width, and keep the
bottom 40% a calm, simple golden field. Scene: a wide view of a gentle hill
covered in golden rice fields under a high blue autumn sky, a small white
countryside church with a tiny cross far away on the hill, and a family of
sheep standing together on a path looking toward it, morning sunlight.
```

```
Scene 0 (optional cover) — DARK MODE. Same exception: scene between 40% and 80%
from the bottom, inside the middle half, bottom 40% calm and simple. The same
hill and the same small church far away at dusk, its windows glowing warm
amber, under a deep blue sky with a soft harvest moon. The sheep family on the
path, wool in soft warm grey. Muted and low contrast.
```

---

# B안 — 가을 수채 화첩

사람·동물 없이 **수채 정물**만. 종이에 물감이 번진 결, 여백 많은 동양화풍 구도.
글이 가장 잘 읽히고 가장 품위 있다. 어르신들이 특히 좋아할 톤.

## B ① 세션 시작 (공통 규칙)

```
I am going to ask you for a SERIES of square background illustrations for a
mobile church app's digital Sunday bulletin. Each image sits behind one page of
the bulletin and text is laid over it. Follow ALL of these rules for every image
in this chat. Reply "OK" and wait for the first scene.

STYLE: delicate hand-painted watercolour on textured cold-press paper — soft
wet-in-wet blooms, gentle pigment granulation, loose but refined brushwork, lots
of breathing space in the spirit of an East Asian ink-and-wash painting. Autumn
botanicals only: maple leaves, ginkgo leaves, persimmons on a branch, cosmos,
silver grass (eulalia), chestnuts, acorns, golden rice stalks. NO people and NO
animals except where a scene explicitly asks for a dragonfly or small birds.
Tender, peaceful and quietly joyful.

FORMAT: square 1:1 image.

LAYOUT (critical — cropped differently on phones and on desktop):
1. The main arrangement lives ONLY in the bottom part, between 6% and 28% from
   the bottom edge, with its most important part inside the horizontal middle
   half (25%–75% of the width). The outer quarters hold only lighter, optional
   sprigs and stray leaves.
2. The very bottom 6% is plain, with no detail.
3. From 28% to 72% from the bottom keep it almost empty — only a smooth,
   continuous wash, at most two or three tiny falling leaves near the edges.
4. Between 72% and 85% from the bottom you may place one or two small accents
   inside the middle half.
5. The top 15% stays empty.
6. ONE continuous wash for the background — never a rectangular panel, block,
   window or box, no straight background edges, no paper edge visible.

ALWAYS: no text, no letters, no numbers, no seals or stamps, no logos, no
signature. No frames, no borders, no vignette, no rounded corners. No
user-interface elements, cards, buttons or panels.

LIGHT MODE: bright, airy, high-key, pale washes, low contrast.
DARK MODE: muted, low contrast; colours glow softly out of the dark as if lit by
a single warm lamp.
```

## B 장면

각 장 라이트/다크 한 쌍. 바탕색 지시만 다르고 정물은 같게 해서 테마 전환 때 자연스럽다.

### B-2 예배 `worship` — 코스모스와 고추잠자리

```
Scene 1 — LIGHT MODE. White text goes over the middle. Background: a smooth
watercolour sky wash from clear brand blue #3182f6 at the top to deeper #1d4fb8
lower down, saturated enough for white text. Bottom band: a soft bed of pink and
white cosmos swaying in the breeze, a few stems of silver grass. Upper accent:
two small red dragonflies painted with a few delicate strokes. Follow all rules.
```

```
Scene 1 — DARK MODE. White text goes over the middle. Background: smooth wash
from deep evening blue #163a86 to muted indigo, a faint warm amber glow just
above the flowers. The same cosmos and silver grass, muted, petals catching
soft amber light; one dragonfly silhouette in the upper accent. Follow all rules.
```

### B-3 설교 `sermon` — 펼친 책 위 은행잎 (paper)

```
Scene 2 — LIGHT MODE. Dark text covers most of the image — keep it the palest.
Background: pure white #ffffff with only a faint cream bloom near the bottom.
Bottom band (no higher than 20%, middle half): a small open book with blank
pages lying on the ground, two golden ginkgo leaves resting on it as a
bookmark, a sprig of maple leaves beside it. Very pale washes. Follow all rules.
```

```
Scene 2 — DARK MODE. White text covers most of the image. Background: flat deep
warm charcoal #201f1f (NOT navy, NOT black). The same open blank book with
ginkgo leaves and maple sprig, softly lit by a warm candle glow from one side,
muted ochre and rust. Everything else flat charcoal. Follow all rules.
```

### B-4 기도 `prayer` — 감나무 가지와 둥근 달

```
Scene 3 — LIGHT MODE. White text goes over the middle. Background: twilight wash
from #2a5fc4 at the top to #0f2350 near the bottom, a soft peach glow along the
lower edge. Bottom band: a graceful persimmon branch reaching in from one side
with five glowing orange persimmons and a few red leaves, and a small clay oil
lamp on the ground with a gentle flame. Upper accent: a pale full moon with a
watercolour halo. Follow all rules.
```

```
Scene 3 — DARK MODE. White text goes over the middle. Background: deep night
wash from #0f2350 to #0a1733, a few faint stars. The same persimmon branch and
clay oil lamp, the lamp casting a warm amber glow that lights the persimmons
from below; the full moon soft and muted. Follow all rules.
```

### B-5 소식 `news` — 바람에 흩날리는 낙엽 (paper, 가장 옅게)

```
Scene 4 — LIGHT MODE. This page carries the most text, keep it the quietest of
all. Background: pure white #ffffff, faintest cream near the bottom. Bottom band
(no higher than 18%, middle half): a loose drift of fallen maple, ginkgo and oak
leaves on the ground with three or four leaves lifting into the breeze. Very
pale. Follow all rules.
```

```
Scene 4 — DARK MODE. Keep it the quietest of all. Background: flat deep warm
charcoal #201f1f. The same drift of fallen leaves, muted rust and ochre, a few
lifting into the air with faint amber edges. Follow all rules.
```

### B-6 이번 주 `week` — 감 일곱 개와 황금 들녘

```
Scene 5 — LIGHT MODE. White text goes over the middle. Background: clear sky wash
from #3182f6 to #1d4fb8. Bottom band: a soft golden rice field with heavy bowed
stalks, and a single persimmon branch carrying exactly SEVEN orange persimmons in
a gentle row. Upper accent: two tiny swallows. Follow all rules.
```

```
Scene 5 — DARK MODE. White text goes over the middle. Background: sunset-to-night
wash from #163a86 to muted indigo with a low amber band over the field. The same
rice field and the branch of SEVEN persimmons glowing softly like small
lanterns. Follow all rules.
```

### B-7 모임 `groups` — 바구니 가득 밤과 고구마 (paper)

```
Scene 6 — LIGHT MODE. Dark text covers most of the image — keep it pale.
Background: pure white #ffffff, a hint of warm cream near the bottom. Bottom band
(no higher than 22%, middle half): a small woven basket of chestnuts and roasted
sweet potatoes with a linen cloth, a few cups of steaming tea beside it, maple
leaves around. Very pale washes. Follow all rules.
```

```
Scene 6 — DARK MODE. White text covers most of the image. Background: flat deep
warm charcoal #201f1f. The same basket, tea cups with soft steam, lit warmly from
one side, muted. Follow all rules.
```

### B-8 마무리 `end` — 추수 정물

```
Scene 7 — LIGHT MODE. White text and a round medal go over the middle — keep the
middle completely empty. Background: smooth wash from bright blue #2d5fc0 to deep
#0d1f47, a few maple and ginkgo leaves floating down near the edges like gentle
confetti. Bottom band: an abundant harvest still life — a woven basket of
apples, persimmons, pomegranates and grapes, a bundle of golden rice stalks
tied with twine. Joyful and grateful. Follow all rules.
```

```
Scene 7 — DARK MODE. Keep the middle completely empty. Background: wash from deep
blue #163a86 to #0d1f47 with a few faint stars and drifting leaves catching amber
light. The same harvest still life lit by a warm lamp glow. Follow all rules.
```

---

# C안 — 종이 오림 추수 들녘

여러 겹 색종이를 **오려 겹친 입체 디오라마**. 겹마다 작은 그림자가 져서 손으로 만든 따뜻함이
있다. 작은 종이 양이 장면 속 "점"처럼 등장한다(A안처럼 주인공은 아님).
11월 **추수감사주일**까지 그대로 쓰기 좋다.

## C ① 세션 시작 (공통 규칙)

```
I am going to ask you for a SERIES of square background illustrations for a
mobile church app's digital Sunday bulletin. Each image sits behind one page of
the bulletin and text is laid over it. Follow ALL of these rules for every image
in this chat. Reply "OK" and wait for the first scene.

STYLE: layered paper-cut diorama — several layers of cut coloured paper stacked
with soft, short drop shadows between layers, visible paper fibre texture, gently
rounded cut edges, a handmade and cosy feeling, like a shadow-box craft. A Korean
countryside in autumn: rolling golden rice fields, persimmon trees, cosmos,
maple trees, low thatched-roof stone walls. Tiny white paper-cut sheep with
round black hooves appear as small, charming details. Palette: persimmon orange,
maple red, ginkgo yellow, golden ochre, chestnut brown, soft sky blue.

FORMAT: square 1:1 image.

LAYOUT (critical — cropped differently on phones and on desktop):
1. The paper layers of land and the main scene rise ONLY up to 28% from the
   bottom edge; the most important part sits inside the horizontal middle half
   (25%–75% of the width). The outer quarters are lower, simpler layers.
2. The very bottom 6% is one plain flat paper layer with no detail.
3. From 28% to 72% from the bottom: almost empty — one smooth, continuous sky
   gradient, at most two or three tiny paper leaves near the edges.
4. Between 72% and 85% from the bottom you may hang one or two small paper
   accents inside the middle half.
5. The top 15% stays empty.
6. The sky is ONE continuous gradient — never a rectangular panel, window or box,
   no straight background edges, no visible frame of the shadow box.

ALWAYS: no text, no letters, no numbers, no logos. No frames, no borders, no
vignette, no rounded corners. No user-interface elements, cards, buttons or
panels.

LIGHT MODE: bright, airy, high-key, soft shadows, low contrast in the sky.
DARK MODE: muted night paper colours, low contrast; warm glow comes from small
paper lanterns placed between layers, as if lit from behind.
```

## C 장면

### C-2 예배 `worship` — 종이 들녘 너머 작은 교회

```
Scene 1 — LIGHT MODE. White text goes over the middle. Sky: smooth gradient from
brand blue #3182f6 at the top to #1d4fb8. Bottom layers: rolling golden paper
rice fields, a winding paper path lined with cosmos, a tiny white paper church
with a small cross on a low hill in the middle, and three tiny paper sheep
walking along the path toward it. Upper accent: two tiny red paper dragonflies on
thin threads. Follow all rules.
```

```
Scene 1 — DARK MODE. White text goes over the middle. Sky: smooth gradient from
deep blue #163a86 to muted indigo. The same paper fields and path at dusk, the
tiny church's windows glowing warm amber from behind the paper, the three paper
sheep with one tiny lantern. Follow all rules.
```

### C-3 설교 `sermon` — 낙엽 몇 장 (paper, 아주 낮게)

```
Scene 2 — LIGHT MODE. Dark text covers most of the image — keep it the palest.
Background: pure white #ffffff paper with a hint of cream. Bottom (no higher than
20%, middle half): just two or three low layers of pale cut paper leaves and
grass, one tiny paper lamb sitting among them looking up attentively. Very pale
paper colours, very soft shadows. Follow all rules.
```

```
Scene 2 — DARK MODE. White text covers most of the image. Background: flat deep
warm charcoal #201f1f paper. The same low layers of paper leaves and the tiny
paper lamb, muted, a soft warm glow from behind one leaf layer. Follow all rules.
```

### C-4 기도 `prayer` — 종이 등불과 달

```
Scene 3 — LIGHT MODE. White text goes over the middle. Sky: gradient from twilight
blue #2a5fc4 to #0f2350 with a soft peach band low down. Bottom layers: a
paper-cut persimmon tree with orange paper persimmons, a low stone wall, two tiny
paper sheep sitting close with heads bowed. Upper accent: a round pale paper moon
hanging on a thin thread. Follow all rules.
```

```
Scene 3 — DARK MODE. White text goes over the middle. Sky: gradient from #0f2350
to #0a1733 with a few tiny paper stars. The same scene with small paper lanterns
glowing warm amber between the layers, the paper moon muted, the two praying
sheep softly backlit. Follow all rules.
```

### C-5 소식 `news` — 낙엽 쌓인 돌담 길 (paper, 가장 옅게)

```
Scene 4 — LIGHT MODE. This page carries the most text — keep it the quietest.
Background: pure white #ffffff paper. Bottom (no higher than 18%, middle half):
low pale paper layers of a stone-wall lane with drifts of paper leaves and one
tiny paper lamb leaping into a leaf pile. Do NOT draw a notice board, pushpins,
a megaphone, a hand bell, paper planes, a camera or bunting. Follow all rules.
```

```
Scene 4 — DARK MODE. Keep it the quietest. Background: flat deep warm charcoal
#201f1f paper. The same low layers, muted, a faint amber glow behind the wall.
Do NOT draw a notice board, pushpins, a megaphone, a hand bell, paper planes, a
camera or bunting. Follow all rules.
```

### C-6 이번 주 `week` — 허수아비와 감 일곱 개

```
Scene 5 — LIGHT MODE. White text goes over the middle. Sky: gradient from #3182f6
to #1d4fb8. Bottom layers: golden paper rice field, a paper scarecrow wearing a
tiny wool hat, a persimmon branch with exactly SEVEN paper persimmons, and a tiny
paper lamb on tiptoe counting them. Follow all rules.
```

```
Scene 5 — DARK MODE. White text goes over the middle. Sky: gradient from #163a86
to muted indigo, low amber band. The same field and scarecrow; the SEVEN paper
persimmons glow softly from behind like lanterns; the tiny lamb asleep against
the scarecrow's pole. Follow all rules.
```

### C-7 모임 `groups` — 둘러앉은 종이 양들 (paper)

```
Scene 6 — LIGHT MODE. Dark text covers most of the image — keep it pale.
Background: pure white #ffffff paper. Bottom (no higher than 22%, middle half):
low pale paper layers of a grassy yard, four tiny paper sheep sitting in a
circle around a little paper basket of chestnuts and sweet potatoes, a curl of
paper steam rising. Follow all rules.
```

```
Scene 6 — DARK MODE. White text covers most of the image. Background: flat deep
warm charcoal #201f1f paper. The same circle of paper sheep around a small paper
brazier glowing amber from behind. Muted. Follow all rules.
```

### C-8 마무리 `end` — 추수감사 종이 잔치

```
Scene 7 — LIGHT MODE. White text and a round medal go over the middle — keep the
middle completely empty. Sky: gradient from bright blue #2d5fc0 to #0d1f47, small
paper maple and ginkgo leaves floating near the edges on thin threads like a
mobile. Bottom layers: a paper harvest basket overflowing with paper fruit and
rice stalks, three tiny paper sheep celebrating around it, a little paper-cut
garland of leaves along the ground line. Follow all rules.
```

```
Scene 7 — DARK MODE. Keep the middle completely empty. Sky: gradient from #163a86
to #0d1f47, tiny paper stars. The same harvest scene with small paper lanterns
glowing amber between the layers. Muted, warm. Follow all rules.
```

---

## 자주 생기는 실패 → 다시 요청할 문장

| 증상 | Gemini 에 이어서 보낼 문장 |
|---|---|
| 가운데에 나무·교회가 크게 섰다 | `Move everything down: nothing may rise above 28% from the bottom edge. The middle of the image must be empty sky.` |
| 글자·숫자가 생겼다 | `Remove every letter, number and sign. Use only tiny doodles if anything needs markings.` |
| 하늘에 네모난 패널/창이 생겼다 | `The background must be one continuous gradient with no rectangle or panel of a different colour.` |
| 다크인데 남색이 됐다 (paper 장) | `The background must be warm charcoal #201f1f, not navy and not black.` |
| 다크 양털이 새하얗게 빛난다 | `Make the sheep's wool soft warm grey, low contrast — not bright white.` |
| 주인공이 한쪽 끝에 몰렸다 | `Keep the main characters inside the middle half of the width (25% to 75%).` |
| 정사각형이 아니다 | `Please make it a square 1:1 image.` |

---

## 후처리 · 적용

1. **워터마크**: `python docs/gemini-unwatermark.py 받은파일.png` (우하단 ✦ 고정 오프셋 —
   그래서 아래 6%를 평평하게 비워 달라고 했다). 정사각형은 처음 쓰는 규격이니 결과를 확대해서
   검은 얼룩이 없는지 꼭 확인할 것.
2. **크기·인코딩**: 1200×1200 webp, 품질 82 전후 (장당 100~180KB 목표).
   `frontend/src/assets/bulletin/autumn/<장>-<light|dark>.webp` 로 저장.
3. **적용(받으면 맡겨 주세요)**: `BulletinStory.tsx` 에서 장 `key` → 배경을 고르는 표
   (`isDark` 이미 있음)를 두고 `<section style={{ backgroundImage }}>` 에 얹는다.
   CSS 는 `background-size: cover; background-position: center bottom;` 하나.
   - 장 톤 색(`.bs-tone-*`)은 **그대로 둔다** — 그림 로딩 전·실패 때 바탕이 되고, 그림 위쪽 색과 이어진다.
   - paper 장 위 글자 대비가 부족하면 그림을 바꾸기 전에 `::before` 로 위쪽 흰/차콜 스크림을 살짝 깐다.
   - PC 목차 썸네일(`.bs-thumb`)에도 같은 그림을 쓰면 장 구분이 한눈에 된다.
   - 이미지 16장이 한 번에 받아지지 않게 **현재 장 ±1 만** 배경을 붙인다(지연 로딩).
4. 확인: 라이트·다크 × 모바일(390)·PC(1440) 네 조합에서 넘겨 보며
   (1) 제목·목록이 읽히는지 (2) 모바일에서 양 얼굴이 잘리지 않는지 (3) PC 에서 위가 잘려도 어색하지 않은지.
