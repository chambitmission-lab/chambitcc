# 공지 아카이브 히어로 배경 이미지 프롬프트 (Gemini용)

`/news?tab=notice` 의 **히어로 카드**(`News/components/NoticeArchiveSection.tsx`) 뒤에 깔 배경.
라이트/다크 각 1장. 컨셉은 헌금·공지 배너·칭호·교육·소식 허브 배경과 **같은 코지-에픽 동화풍 +
같은 양 캐릭터**.

| | 파일명 |
|---|---|
| 라이트 | `frontend/public/images/news/notice-archive-light.webp` |
| 다크 | `frontend/public/images/news/notice-archive-dark.webp` |

## 이 화면의 성격 = "지나간 공지가 쌓여 있는 보관함"

홈 배너는 **지금 띄울 공지**, 알림함은 **개인 알림**, 그리고 여기는 **지난 공지의 서고**다.
카드 문구도 "홈에서 지나간 안내도 여기에 그대로 남아 있어요"다. 그래서 장면은
**"붙인다"가 아니라 "모아 둔다 · 꺼내 본다 · 다시 읽는다"** 쪽이어야 한다.

### 소품이 겹치면 안 된다 (같은 마을 연작이라 특히)

| 화면 | 이미 쓴 소품 | 여기서 |
|---|---|---|
| 홈 공지 배너 | 마을 알림판 · 압정 · 펄럭이는 종이 | **금지** |
| 교회소식(`/news`) | 종이 확성기 · 놋쇠 손종 · 종이비행기 | **금지** |
| 행사 앨범 | 상자 카메라 · 삼각대 · 가랜드 · 사진 카드 | **금지** |
| 새가족 | 클로버 아치 문 · 너무 짧은 카펫 · 보따리 | **금지** |
| 헌금 | 양들의 헌금함 | **금지** |
| **공지 아카이브** | **나무 서류함 · 종이 묶음 · 고무 도장 · 선반과 사다리 · 돋보기** | 여기 전용 |

아래 프롬프트에는 전부 `Do NOT draw a notice board, pushpins, a megaphone, a hand bell or
paper planes — those belong to other screens.` 한 줄이 들어가 있다. **빼지 말 것.**

## 사용법

1. Gemini에 `public/images/title-bg/` 중 아무 이미지나 한 장 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로" 라고 덧붙인 뒤, 아래 프롬프트 하나를 통째로 붙여넣는다.
2. **A·B·C 중 한 안을 골라 그 안의 light → dark 를 한 세션에서 이어서** 뽑는다.
   세션을 나누면 양 얼굴과 색감이 미묘하게 달라져서 테마를 전환할 때 티가 난다.
3. 원본 규격: **2:1 가로 (1456×720)**, PNG 로 받는다.
4. 후처리(워터마크 제거 · 아래 캔버스 연장 · 왼쪽/아래 알파 페이드 · webp 인코딩)는
   **`docs/news-hero-process.py` 와 완전히 같은 방식**이다. 아래 "후처리 · 적용" 참고.

---

## 레이아웃 제약 (프롬프트의 핵심)

이 카드는 소식 허브 세 카드보다 **더 낮고 더 납작하다**(안에 검색창·토글이 없다). 실측 근사:

| | 카드 크기 | 비율 |
|---|---|---|
| 모바일(390px) | 약 358×136 (안내문 2줄) | **≈2.6 : 1** |
| PC(lg 본문 열) | 약 832×116 (안내문 1줄) | **≈7.2 : 1** |

→ 가로가 3배 가까이 변하므로 **`cover` 금지.** 소식 히어로와 같은 문법
(`background-size: auto …; background-position: right top`)으로 간다.
**이미지 오른쪽 끝 = 카드 오른쪽 끝**이라 아래 좌표는 모바일·PC 어디서나 그대로 성립한다.

- **왼쪽 55%는 위아래로 완전히 빈 배경.** 제목(NOTICE / 공지사항)과 안내문이 지나간다.
  안내문은 `max-w` 가 안 걸려 있어 **지금은 카드 끝까지 늘어난다** → 아래 "적용" 참고.
- **오른쪽 위 모서리 22%×34%는 비워 둔다.** 관리자에게만 보이는 `+ 공지 등록` 버튼 자리다.
  성도 화면에선 비어 있지만, **거기 주인공 머리를 두면 관리자 화면에서만 가려진다.**
- **아래 10%는 평평한 빈 바닥**으로 끝낸다. 제미나이 워터마크(우하단 ✦)가 여기 떨어져야
  알파 역산으로 안전하게 지워진다.
- → 무대는 **x 55%~88%, 높이 10%~66%** 의 좁은 띠. 캐릭터는 **한 덩어리로 모을 것**
  (가로 30% 안). 늘어놓으면 왼쪽 글줄 위로 올라탄다 — 소식 6장에서 전부 이랬다.
- 라이트는 **어두운 잉크 글씨**가 얹히므로 거의 흰색에 가까운 high-key,
  다크는 **흰 글씨**가 얹히므로 차콜 위 저채도. 진한 덩어리가 있으면 제목이 안 읽힌다.
- 다크 카드 바탕은 남색이 아니라 **따뜻한 차콜 `#201f1f`**. 남색 밤하늘은 카드에서 뜬다.
- 글자·숫자·로고 금지. **종이·서랍·도장에도 글씨 금지** — 낙서(물결선 세 줄·하트·작은 별)로.
- 테두리·비네트·모서리 라운드 금지 — 카드 모서리는 CSS가 처리한다.
- **배경은 하나의 연속 그라데이션.** 사각형 하늘 패널을 그리면 다크 카드에서 뜬다(소식에서 2회 발생).
- **UI 요소를 진짜로 그리지 말 것.** "버튼 자리"를 묘사로 읽고 흰 알약을 그린 전례가 있다.

---

# A안 — 양들의 공지 보관함 (추천)

가장 안전하고 뜻이 바로 읽힌다. 지난 공지를 나무 서류함에 차곡차곡 넣는 장면.
**유머: 새끼양이 정리한 종이 탑이 자기 키보다 높아서 턱으로 겨우 받치고 있다.**

## A-light

```
A wide 2:1 background illustration for the header card of a "past announcements
archive" page in a mobile church app, LIGHT MODE, very pale and high-key (dark navy
text will be laid on top, so the whole image must stay bright and low-contrast).
Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, gentle airy morning light. Use the SAME small
chubby white sheep character as the attached reference image: stubby legs, tiny
round black hooves, serene slightly smug smile.

Palette: pale high-key sky blue and warm cream (the deepest tone around #3182f6,
used only in tiny accents), soft honey-wood, a touch of pale apricot. Everything
washed in bright morning haze. Warm and orderly, never flashy.

Composition is critical, follow every rule:
1. The LEFT 55% of the frame must be completely empty from top to bottom — just a
   smooth pale blue-to-cream gradient. A title and a paragraph are overlaid there.
2. Keep the TOP-RIGHT corner (right 22%, top 34%) empty and calm — a small button
   appears there for some users.
3. The whole scene therefore lives between 55% and 88% of the width.
4. Leave the BOTTOM 10% as plain empty ground with no detail at all.
5. Draw the characters as ONE tight cluster, not spread out: the entire group must
   fit inside a box no wider than 30% of the frame.
6. No character's head may rise higher than 66% from the bottom edge.

Main scene (that narrow stage, standing on the ground): a small honey-wood FILING
CHEST with three shallow drawers, the middle drawer pulled open and filled with
neatly stacked pale paper sheets standing on edge like files. One grown sheep sits
upright beside it, calmly sliding one more sheet into the drawer with a front hoof,
eyes closed, serene and very slightly smug, a tiny round wooden RUBBER STAMP resting
next to it with one soft blue ink pad.

The joke is the lamb: a tiny lamb is carrying a tottering TOWER of paper sheets that
is taller than the lamb itself, balancing the very top of the stack on its chin,
eyes crossed, legs braced and wobbling, absolutely determined not to drop a single
page. Two or three sheets have already slipped off and hang in the air mid-fall.

Each paper sheet carries only childish DOODLES — three wavy scribble lines, a small
heart, a tiny star — absolutely no letters or numbers, and the drawer fronts are
blank with no labels. A few sheets are tied into a bundle with a thin pastel ribbon.

The background must be ONE continuous soft gradient. Never draw a rectangular block,
panel, window or box of different colour, and no straight background edges anywhere.
Do NOT draw any user-interface elements, buttons, pills, panels or rounded
rectangles. Do NOT draw a village notice board, pushpins or thumbtacks, a paper
megaphone, a hand bell, paper planes, a camera or bunting — those belong to other
screens.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette, no rounded corners. The left 55% and the bottom 10% must fade into a plain
almost-white pale blue gradient.
```

## A-dark

```
A wide 2:1 background illustration for the header card of a "past announcements
archive" page in a mobile church app, DARK MODE. Style: cozy-epic children's
storybook illustration — soft flat shapes with subtle grain texture, rounded
friendly forms, warm rim lighting. Use the SAME small chubby white sheep character
as the attached reference image: stubby legs, tiny round black hooves, serene
slightly smug smile.

Palette: deep warm CHARCOAL (around #201f1f) — NOT navy blue, NOT black. The only
bright accents are a small AMBER lantern glow and one faint cool #4593fc blue rim
along an upper edge. The mood is "the day is over, and someone is quietly putting
every notice back where it belongs". Keep everything muted and low-contrast so white
text stays readable; the sheep's wool must read as soft warm grey, never bright
white.

Composition is critical, follow every rule:
1. The LEFT 55% of the frame must be flat empty charcoal from top to bottom. A title
   and a paragraph are overlaid there.
2. Keep the TOP-RIGHT corner (right 22%, top 34%) empty and calm — a small button
   appears there for some users.
3. The whole scene therefore lives between 55% and 88% of the width.
4. Leave the BOTTOM 10% as plain flat empty ground with no detail at all.
5. Draw the characters as ONE tight cluster, not spread out: the entire group must
   fit inside a box no wider than 30% of the frame.
6. No character's head may rise higher than 66% from the bottom edge.

Main scene (that narrow stage, standing on the ground): a small honey-wood FILING
CHEST with three shallow drawers, the middle drawer pulled open and filled with
neatly stacked pale paper sheets standing on edge like files. One grown sheep sits
upright beside it, calmly sliding one more sheet into the drawer with a front hoof,
eyes closed, serene and very slightly smug, wearing a tiny knitted nightcap flopped
over one eye. Its muzzle is a simple closed contented smile — nothing in its mouth,
no tongue, no object touching the face. A small lantern hangs just above the chest,
pooling warm amber light over the open drawer.

The joke is the lamb: a tiny lamb is carrying a tottering TOWER of paper sheets that
is taller than the lamb itself, balancing the very top of the stack on its chin,
eyes crossed, legs braced and wobbling. Two or three sheets have already slipped off
and drift in the air, each catching one warm amber edge.

Each paper sheet carries only childish DOODLES — three wavy scribble lines, a small
heart, a tiny star — absolutely no letters or numbers, and the drawer fronts are
blank with no labels. A few dust motes float in the lantern light.

The background must be ONE continuous soft gradient. Never draw a rectangular block,
panel, window or box of different colour, and no straight background edges anywhere.
Do NOT draw any user-interface elements, buttons, pills, panels or rounded
rectangles. Do NOT draw a village notice board, pushpins or thumbtacks, a paper
megaphone, a hand bell, paper planes, a camera or bunting — those belong to other
screens.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette, no rounded corners. The only bright areas are the lantern glow and the
amber edges of the falling sheets; the left 55% and the bottom 10% must be flat
#201f1f charcoal.
```

---

# B안 — 지난 공지 선반 (찾아보기)

"보관함"보다 **"찾아 꺼낸다"** 쪽. 벽 선반에 두루마리가 꽂혀 있고 사다리를 타고 꺼낸다.
**유머: 하나를 뽑았더니 옆의 것들이 줄줄이 딸려 나온다.** 아래 새끼양이 바구니로 받는 중.

> 교회소식 다크에 `rolled paper scrolls in a little wooden basket` 이 곁가지로 들어가 있다.
> 여기선 두루마리가 **주인공**이라 구분되지만, 겹치는 게 신경 쓰이면 A안이나 C안을 쓸 것.

## B-light

```
A wide 2:1 background illustration for the header card of a "past announcements
archive" page in a mobile church app, LIGHT MODE, very pale and high-key (dark navy
text will be laid on top, so the whole image must stay bright and low-contrast).
Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, gentle airy morning light. Use the SAME small
chubby white sheep character as the attached reference image: stubby legs, tiny
round black hooves, serene slightly smug smile.

Palette: pale high-key sky blue and warm cream (the deepest tone around #3182f6,
used only in tiny accents), soft honey-wood, a touch of pale apricot, bright morning
haze.

Composition is critical, follow every rule:
1. The LEFT 55% of the frame must be completely empty from top to bottom — just a
   smooth pale blue-to-cream gradient. A title and a paragraph are overlaid there.
2. Keep the TOP-RIGHT corner (right 22%, top 34%) empty and calm — a small button
   appears there for some users.
3. The whole scene therefore lives between 55% and 88% of the width.
4. Leave the BOTTOM 10% as plain empty ground with no detail at all.
5. Draw everything as ONE tight cluster, not spread out: the shelf, the ladder and
   both sheep must fit inside a box no wider than 32% of the frame.
6. No character's head may rise higher than 66% from the bottom edge.

Main scene (that narrow stage): a short honey-wood SHELF UNIT of two low rows, each
row packed with small pale PAPER SCROLLS standing upright side by side like a tiny
archive, each scroll tied with a thin pastel ribbon. A slim wooden step-ladder leans
against it.

One grown sheep stands on the second step of the ladder, stretching to tug ONE
scroll out of the upper row with a front hoof, eyes closed, serene and very slightly
smug.

The joke: that one scroll has dragged FOUR more out with it — they are sailing out
of the shelf in a gentle arc, unrolling slightly in the air with soft wavy tails.
A tiny lamb waits below holding up a small round basket with both front hooves,
utterly solemn, cheeks puffed, aiming carefully — and the basket is far too small
for four scrolls. A second even smaller lamb sits beside it hugging one scroll like
a treasure.

The unrolled scrolls show only childish DOODLES — three wavy scribble lines, a small
heart, a tiny star — absolutely no letters or numbers, and the shelf has no labels.

The background must be ONE continuous soft gradient. Never draw a rectangular block,
panel, window or box of different colour, and no straight background edges anywhere.
Do NOT draw any user-interface elements, buttons, pills, panels or rounded
rectangles. Do NOT draw a village notice board, pushpins or thumbtacks, a paper
megaphone, a hand bell, paper planes, a camera or bunting — those belong to other
screens.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette, no rounded corners. The left 55% and the bottom 10% must fade into a plain
almost-white pale blue gradient.
```

## B-dark

```
A wide 2:1 background illustration for the header card of a "past announcements
archive" page in a mobile church app, DARK MODE. Style: cozy-epic children's
storybook illustration — soft flat shapes with subtle grain texture, rounded
friendly forms, warm rim lighting. Use the SAME small chubby white sheep character
as the attached reference image: stubby legs, tiny round black hooves, serene
slightly smug smile.

Palette: deep warm CHARCOAL (around #201f1f) — NOT navy blue, NOT black. The only
bright accents are a small AMBER lantern glow and one faint cool #4593fc blue rim
along an upper edge. The mood is "a quiet little archive at night, still open for
whoever wants to look something up". Keep everything muted and low-contrast so white
text stays readable; the sheep's wool must read as soft warm grey, never bright
white.

Composition is critical, follow every rule:
1. The LEFT 55% of the frame must be flat empty charcoal from top to bottom. A title
   and a paragraph are overlaid there.
2. Keep the TOP-RIGHT corner (right 22%, top 34%) empty and calm — a small button
   appears there for some users.
3. The whole scene therefore lives between 55% and 88% of the width.
4. Leave the BOTTOM 10% as plain flat empty ground with no detail at all.
5. Draw everything as ONE tight cluster, not spread out: the shelf, the ladder and
   both sheep must fit inside a box no wider than 32% of the frame.
6. No character's head may rise higher than 66% from the bottom edge.

Main scene (that narrow stage): a short honey-wood SHELF UNIT of two low rows, each
row packed with small pale PAPER SCROLLS standing upright side by side like a tiny
archive, each tied with a thin ribbon. A slim wooden step-ladder leans against it,
and a small lantern hangs from the top corner of the shelf, pooling warm amber light
across the upper row.

One grown sheep stands on the second step of the ladder, stretching to tug ONE
scroll out of the upper row with a front hoof, eyes closed, serene and very slightly
smug, wearing a tiny knitted nightcap flopped over one eye. Its muzzle is a simple
closed contented smile — nothing in its mouth, no tongue, no object touching the
face.

The joke: that one scroll has dragged FOUR more out with it — they sail out of the
shelf in a gentle arc, unrolling slightly, each catching one warm amber edge. A tiny
lamb waits below holding up a small round basket with both front hooves, utterly
solemn, aiming carefully — and the basket is far too small for four scrolls. A
second even smaller lamb has fallen asleep sitting up beside it, with one small
round snore bubble.

The unrolled scrolls show only childish DOODLES — three wavy scribble lines, a small
heart, a tiny star — absolutely no letters or numbers, and the shelf has no labels.
A few dust motes float in the lantern light.

The background must be ONE continuous soft gradient. Never draw a rectangular block,
panel, window or box of different colour, and no straight background edges anywhere.
Do NOT draw any user-interface elements, buttons, pills, panels or rounded
rectangles. Do NOT draw a village notice board, pushpins or thumbtacks, a paper
megaphone, a hand bell, paper planes, a camera or bunting — those belong to other
screens.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette, no rounded corners. The only bright areas are the lantern glow and the
amber edges of the flying scrolls; the left 55% and the bottom 10% must be flat
#201f1f charcoal.
```

---

# C안 — 다시 읽어 주기 (카드 안내문과 가장 잘 맞는다)

카드 안내문이 "제목을 탭하면 전문을 읽을 수 있습니다" 다. 그 문장 그대로의 장면.
**유머: 돋보기가 너무 커서 그 너머 양 눈이 왕방울만 하게 보인다.**

## C-light

```
A wide 2:1 background illustration for the header card of a "past announcements
archive" page in a mobile church app, LIGHT MODE, very pale and high-key (dark navy
text will be laid on top, so the whole image must stay bright and low-contrast).
Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, gentle airy morning light. Use the SAME small
chubby white sheep character as the attached reference image: stubby legs, tiny
round black hooves, serene slightly smug smile.

Palette: pale high-key sky blue and warm cream (the deepest tone around #3182f6,
used only in tiny accents), soft honey-wood, a touch of pale apricot, bright morning
haze.

Composition is critical, follow every rule:
1. The LEFT 55% of the frame must be completely empty from top to bottom — just a
   smooth pale blue-to-cream gradient. A title and a paragraph are overlaid there.
2. Keep the TOP-RIGHT corner (right 22%, top 34%) empty and calm — a small button
   appears there for some users.
3. The whole scene therefore lives between 55% and 88% of the width.
4. Leave the BOTTOM 10% as plain empty ground with no detail at all.
5. Draw the characters as ONE tight cluster, not spread out: the entire group must
   fit inside a box no wider than 30% of the frame.
6. No character's head may rise higher than 66% from the bottom edge.

Main scene (that narrow stage, standing on soft pale grass): one grown sheep sits
upright on a low honey-wood stool, holding an old pale sheet of paper in one front
hoof and a big round brass-rimmed MAGNIFYING GLASS in the other, reading the sheet
aloud with great ceremony.

The joke: the magnifying glass is comically oversized, and through its lens ONE of
the sheep's eyes appears ENORMOUS — a huge round eye filling the whole circle, while
the other eye stays tiny and normal. The sheep's expression is completely serene and
very slightly smug, entirely unaware.

Two tiny lambs sit on the grass in front of it, backs straight, ears up, listening
with total devotion — one of them is holding its own sheet upside down. A short neat
STACK of older paper sheets sits beside the stool, tied with a thin pastel ribbon,
and one loose sheet has slipped off the top.

Every sheet carries only childish DOODLES — three wavy scribble lines, a small
heart, a tiny star — absolutely no letters or numbers.

The background must be ONE continuous soft gradient. Never draw a rectangular block,
panel, window or box of different colour, and no straight background edges anywhere.
Do NOT draw any user-interface elements, buttons, pills, panels or rounded
rectangles. Do NOT draw a village notice board, pushpins or thumbtacks, a paper
megaphone, a hand bell, paper planes, a camera or bunting — those belong to other
screens.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette, no rounded corners. The left 55% and the bottom 10% must fade into a plain
almost-white pale blue gradient.
```

## C-dark

```
A wide 2:1 background illustration for the header card of a "past announcements
archive" page in a mobile church app, DARK MODE. Style: cozy-epic children's
storybook illustration — soft flat shapes with subtle grain texture, rounded
friendly forms, warm rim lighting. Use the SAME small chubby white sheep character
as the attached reference image: stubby legs, tiny round black hooves, serene
slightly smug smile.

Palette: deep warm CHARCOAL (around #201f1f) — NOT navy blue, NOT black. The only
bright accents are a small AMBER lantern glow, one warm brass highlight on the
magnifier rim, and a faint cool #4593fc blue rim along an upper edge. The mood is
"a bedtime re-reading of every notice we already heard". Keep everything muted and
low-contrast so white text stays readable; the sheep's wool must read as soft warm
grey, never bright white.

Composition is critical, follow every rule:
1. The LEFT 55% of the frame must be flat empty charcoal from top to bottom. A title
   and a paragraph are overlaid there.
2. Keep the TOP-RIGHT corner (right 22%, top 34%) empty and calm — a small button
   appears there for some users.
3. The whole scene therefore lives between 55% and 88% of the width.
4. Leave the BOTTOM 10% as plain flat empty ground with no detail at all.
5. Draw the characters as ONE tight cluster, not spread out: the entire group must
   fit inside a box no wider than 30% of the frame.
6. No character's head may rise higher than 66% from the bottom edge.

Main scene (that narrow stage): one grown sheep sits upright on a low honey-wood
stool, holding an old pale sheet of paper in one front hoof and a big round
brass-rimmed MAGNIFYING GLASS in the other, reading the sheet aloud with great
ceremony, wearing a tiny knitted nightcap flopped over one eye. A small lantern
hangs just above, pooling warm amber light over the paper.

The joke: the magnifying glass is comically oversized, and through its lens ONE of
the sheep's eyes appears ENORMOUS — a huge round eye filling the whole circle, while
the other eye stays tiny and normal. The sheep's expression is completely serene and
very slightly smug, entirely unaware.

Two tiny lambs sit in front of it, backs straight, ears up, listening with total
devotion — one of them has already fallen asleep sitting bolt upright, with one
small round snore bubble. A short neat STACK of older paper sheets sits beside the
stool, tied with a thin ribbon.

Every sheet carries only childish DOODLES — three wavy scribble lines, a small
heart, a tiny star — absolutely no letters or numbers. A few dust motes float in the
lantern light.

The background must be ONE continuous soft gradient. Never draw a rectangular block,
panel, window or box of different colour, and no straight background edges anywhere.
Do NOT draw any user-interface elements, buttons, pills, panels or rounded
rectangles. Do NOT draw a village notice board, pushpins or thumbtacks, a paper
megaphone, a hand bell, paper planes, a camera or bunting — those belong to other
screens.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette, no rounded corners. The only bright areas are the lantern glow and the
brass rim of the magnifier; the left 55% and the bottom 10% must be flat #201f1f
charcoal.
```

---

## 적용 상태 (2026-09-21) — **B안으로 확정**

두 장 모두 적용 완료. 후처리는 **`docs/notice-archive-process.py` 한 방**이면 재현된다
(원본을 `1.png`/`2.png` 로 받아 두고 `python docs/notice-archive-process.py [원본폴더]`).

- **에셋**: `public/images/news/notice-archive-{light,dark}.webp` (1456×1040 RGBA, 각 39~42KB)
- **CSS**: `src/pages/News/news-hero.css` 맨 아래 `.nh-hero--notice`
- **컴포넌트**: `NoticeArchiveSection.tsx` — `nh-hero nh-hero--notice`, 안내문 `max-w`,
  다크 광택 span 제거, **관리자 `공지 등록` 버튼을 제목 옆으로 이동**(아래 참고)

### 이번 원본에서 제미나이가 틀린 것 (다음 재생성 때 반드시 반영)

1. **우상단에 라운드 사각 패널을 그려 버렸다** — 두 장 다. 프롬프트에 세 줄이나 금지해 뒀는데도
   `x=1091` 세로 단차 + `y=195` 가로 단차짜리 패널이 나왔고, **다크는 거기에 파란 네온
   테두리(+글로우)까지** 그렸다. 하필 관리자 버튼 자리다. → `strip_panel()`/`strip_glow()` 로 지웠다.
2. **장면을 가로로 너무 넓게 폈다** — 선반 왼쪽 끝이 x 46% 까지 나왔다(지시는 55%).
   왼쪽 페이드를 240→880 으로 길게 잡아 선반 왼쪽이 안개에 잠기게 해서 글줄을 살렸다.
3. **top-right 22%×34% 를 안 비웠다** — 날아가는 두루마리와 양 머리가 그 자리에 있다.

### 후처리에서 알아 둘 것

```python
# i: (name, out height, left fade [x0,x1], bottom fade [y0,y1])
CFG = {
    1: ("notice-archive-light", 1040, (240, 880), (700, 1000)),
    2: ("notice-archive-dark",  1040, (240, 880), (700, 1000)),
}
```

- **워터마크(✦) 는 이번 원본엔 없었다.** 있으면 `docs/gemini-unwatermark.py` 로 먼저 벗긴다
  (인페인트 금지, 매번 실측하는 알파 역산). 양털처럼 밝은 데 얹히면 기본 문턱에 안 걸리니
  `--min-step=3` 정도로 낮춰 볼 것.
- **네온 테두리는 '색 역산'으로 빼면 안 된다.** 코어는 거의 흰 하늘색(가산 89,126,171),
  번짐은 순수한 파랑(2,10,19)이라 **색비가 자리마다 다르다**. 단일 계수로 빼면 번짐 쪽이
  18 까지 파여 검은 얼룩이 남는다(실측). → 배경이 완전 중성(33,33,33)인 점을 이용해
  `e = B-R` 로 오염 범위만 집어내고, **주변 배경으로 메운다**(정규화 합성곱).
  표본에서 밝은 것(양털·두루마리)을 빼지 않으면 복원값이 흰색으로 끌린다.
- **단차를 평균값으로 빼면 하드 스텝은 그대로 남는다.** 이 패널은 세로변 8, 가로변 4 로
  세기가 달라서, 평균(2.5/5/14.5)을 160px 램프로 빼도 경계에 잔차 9 가 남았다(실측).
  → 줄마다 실측해 그 자리에서 없애는 `feather_vedge`/`feather_hedge` 를 쓴다.
  그 뒤 남는 **1~2px 머리카락 선**(원본 안티앨리어싱 픽셀)은 `soften_line` 으로 지운다.
  현재 잔여 단차 **≤1 레벨**.
- **아래로 캔버스를 1040 까지 늘렸다**(그림 720 + 여백 320). 이 여백은 알파로 사라지고,
  배율을 키워 그림을 크게 쓰는 데 쓰인다.
- 결과: `1456×1040 RGBA`, 한 장 40KB 안팎(`quality=80, method=6, alpha_quality=92`).

### CSS — `news-hero.css` **맨 아래**

```css
.nh-hero--notice {
  background-image: url('/images/news/notice-archive-light.webp');
  background-size: auto 122%;        /* 모바일 */
  background-position: right top;
}
.dark .nh-hero--notice { background-image: url('/images/news/notice-archive-dark.webp'); }
@media (min-width: 1024px) {
  .nh-hero--notice { background-size: auto 144.4%; }   /* 1040 / 720 */
}
```

- **(2026-09-21 개정) PC 는 `auto 185.7%` + `right 27.1%`, 카드는 `lg:min-h-[184px]`.**
  아래 144.4% 는 처음 값이다. 그림 720줄을 다 넣으면 위 130줄(빈 하늘)·아래 30줄(빈 바닥)까지
  카드 높이를 나눠 가져서 장면이 139×92px 로 쪼그라들었다("배경이 작아서 뭔지 안 보인다").
  → 장면이 있는 **560줄(y 130~690)만** 카드에 넣고(1040/560), 카드도 PC 에서만 136→184 로 키웠다.
  장면 257×184px. 세로 위치 = (130/560)/(1.857−1). 안내문은 `lg:max-w-[60%]`(한 줄).
  삽화를 다시 뽑으면 장면의 위·아래 끝 줄을 다시 재서 이 두 %를 다시 계산할 것.
- **배율이 두 개다.** PC(처음 값 144.4%)는 카드에 그림 720줄이 정확히 들어와 딱 맞지만,
  모바일은 카드가 더 높아서(156) 같은 배율이면 그림이 커져 **안내문 둘째 줄 위로 양이 올라탄다**.
  122% 로 줄이면 그림이 카드 위 82% 에 들어가고 아래 18% 는 알파 여백이 지나가 카드색으로 끝난다.
- ☠ **반드시 파일 맨 아래에 둘 것.** 위의 `@media (min-width:1024px) { .nh-hero { … } }` 와
  특정도가 같아서(둘 다 클래스 1개) 나중에 나온 쪽이 이긴다.

### 컴포넌트 — `NoticeArchiveSection.tsx`

```diff
+import '../news-hero.css'

-      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-card-dark …">
-        <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] …" />
+      <div className="nh-hero nh-hero--notice relative overflow-hidden rounded-3xl bg-white dark:bg-card-dark …">

-                className="ml-auto inline-flex items-center gap-1 h-8 px-3 rounded-full …"
+                className="ml-2 inline-flex items-center gap-1 h-8 px-3 rounded-full …"

-          <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6]">
+          <p className="max-w-[62%] lg:max-w-[54%] text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6]">
             홈에서 지나간 안내도 여기에 그대로 남아 있어요. 제목을 탭하면 전문을 읽을 수 있습니다.
           </p>
```

- **관리자 `공지 등록` 버튼은 `ml-auto` 를 뗐다.** 이 카드는 아주 낮고 넓어서(PC 832×136)
  배경이 `auto <카드높이>` 로 깔리면 삽화 폭이 275px 밖에 안 되고, 우상단 92px 짜리 알약이
  **그 3분의 1을 덮는다 — 정확히 주인공 양 얼굴**. 배율을 어떻게 잡아도 못 피한다
  (그림이 카드 높이를 채우는 한 양 머리는 항상 카드 위 30% 에 온다).
  → 제목 바로 옆이 삽화와 안 겹치는 유일한 자리다. **다시 `ml-auto` 로 되돌리지 말 것.**
- **안내문 `max-w` 를 반드시 걸 것.** 풀폭이면 글줄이 양 위로 올라탄다.
- **다크 상단 광택 `span` 은 제거한다.** 소식 세 장에서도 뺐다 — 삽화 위에 얹히면 뿌옇게 뜬다.
- 카드 바탕은 `bg-white` 그대로(반투명 `bg-white/80` 이면 삽화가 뿌예진다).
- 삽화를 다시 뽑아 장면 위치가 바뀌면 **`max-w`·배율·왼쪽 페이드를 같이 다시 볼 것.**
- `public/` 아래 이미지는 서비스워커 캐시 때문에 **바꿔도 한동안 예전 그림이 보인다**.
  "고쳤는데 그대로"면 캐시부터 의심할 것.

## 제미나이가 자주 틀리는 것 (소식 6장 + 이번 2장)

1. **UI 를 진짜로 그린다** — "버튼 자리"라고 쓰면 흰 알약을 그려 넣는다.
   → 프롬프트의 `Do NOT draw any user-interface elements…` 줄을 절대 빼지 말 것.
2. **사각 패널을 그린다** — 이번에도 두 장 다 그렸다(다크는 네온 테두리까지).
   → `The background must be ONE continuous soft gradient…` 줄을 유지하고,
   그래도 나오면 `notice-archive-process.py` 의 `strip_panel`/`strip_glow` 로 지운다.
3. **장면을 가로로 너무 넓게 편다** — 좌표를 무시하고 캐릭터를 늘어놓는다.
   → `ONE tight cluster … no wider than 30% of the frame` 줄 유지. 그래도 넓게 나오면
   **다시 뽑는 게 빠르다**(왼쪽 페이드로 억지로 덮으면 주인공이 안개에 잠긴다).
4. **입에 소품을 물린다(다크)** — 어두운 배경에서 혀처럼 뭉개진다.
   → 다크 프롬프트의 `nothing in its mouth, no tongue…` 줄 유지.
