# 소식 허브 히어로 배경 이미지 프롬프트 (Gemini용)

`/news` 세 화면의 **히어로 카드** 뒤에 깔 배경. 각 라이트/다크 1장씩 총 6장.

| 탭 | 컴포넌트 | 파일명 |
|---|---|---|
| `?tab=event-album` 행사 앨범 | `News/components/EventAlbumSection.tsx` | `public/images/news/event-album-{light,dark}.webp` |
| `?tab=new-family` 새가족 등록 앨범 | `News/components/NewFamilySection.tsx` | `public/images/news/new-family-{light,dark}.webp` |
| `/news` 교회소식 | `News/components/NewsSection.tsx` | `public/images/news/church-news-{light,dark}.webp` |

컨셉은 헌금·공지 배너·칭호·교육 배경과 **같은 코지-에픽 동화풍 + 같은 양 캐릭터**.
헌금이 "양들의 헌금함"이었듯, 이번 세 장은 한 마을에서 벌어지는 **연작**이다.

| | 장면 | 유머(정성 > 결과) | 고유 소품 |
|---|---|---|---|
| 행사 앨범 | 양들의 단체사진 | 셀프타이머를 눌러 놓고 프레임으로 뛰어드는 큰 양 | 나무 삼각대 카메라 · 가랜드 · 줄에 집은 사진 카드 |
| 새가족 | 양들의 환영 문 | 정성껏 깔았는데 **카펫이 너무 짧다** | 클로버 아치 · 작은 보따리 · 새싹 화분 |
| 교회소식 | 양들의 소식 전하기 | 몸통만 한 종이 확성기로 힘껏 외쳤는데 **종이비행기 한 대**만 나온다 | 놋쇠 손종 · 종이비행기 · 돌돌 만 종이 |

> **공지 배너(`docs/notice-banner-bg-prompts.md`)와 겹치지 않게 할 것.**
> 공지 = 알림판 + 압정 + "키가 안 닿는다". 소식 = 확성기 + 종 + 종이비행기.
> 같은 마을이되 **소품이 겹치면 안 된다** — 소식 프롬프트에 알림판·압정 금지를 명시해 두었다.

## 사용법

1. Gemini에 `public/images/title-bg/` 중 아무 이미지나 한 장 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로" 라고 덧붙인 뒤, 아래 프롬프트를 통째로 붙여넣는다.
   **한 세션에서 6장을 이어서 뽑는 게 톤이 가장 잘 맞는다**(라이트 3장 → 다크 3장 순서).
2. 규격: **2:1 가로 (1536×768 권장)**, 한 장 **60KB 이하**.
   `magick in.png -resize 1536x768^ -gravity south -extent 1536x768 out.png` 로 아래쪽 기준 크롭.
3. 후처리(워터마크 제거 · 왼쪽 알파 페이드 · 인코딩)는 **헌금 문서와 완전히 동일**하다.
   `docs/offering-hero-bg-prompts.md` 의 "적용 상태" 절을 그대로 따른다.

---

## 레이아웃 제약 (프롬프트의 핵심)

세 카드 모두 `p-5` + 엠블럼 44px 구조라 크기가 거의 같다. 실측:

| | 모바일(390px) | PC(lg 본문 열) |
|---|---|---|
| 행사 · 새가족 | 약 358×188 (**≈1.9:1**) | 약 832×168 (**≈5:1**) |
| 교회소식 | 약 358×196 (**≈1.8:1**) | 약 832×176 (**≈4.7:1**) |

헌금과 같은 이유로 **`cover` 금지**, `background-size: auto 100%; background-position: right center`
(높이맞춤 + 오른쪽 정렬)로 간다. 그래서 **이미지의 오른쪽 끝 = 카드의 오른쪽 끝**이 항상 일치하고,
아래 좌표는 모바일·PC 어디서나 그대로 성립한다.

### 행사 앨범 · 새가족 (하단에 뷰 전환 토글이 있다)

- **왼쪽 46%는 바닥까지 완전히 빈 배경.** 제목·안내문·통계 숫자(`앨범 3 / 사진 3 / 연도 1`)가
  전부 왼쪽 정렬로 그 위를 지나간다.
- **오른쪽 26%는 아래에서 40% 높이까지 완전히 빈 바닥.**
  거기 피드/그리드 **뷰 전환 pill(약 66×28px)** 이 얹힌다. 캐릭터를 세우면 잘린다.
  덤으로 **Gemini 워터마크 ✦(우하단)** 자리도 이 구역이라 인페인트 위험이 사라진다.
- → 지면 장면이 설 수 있는 무대는 **x 46%~74%** 뿐이다. 좁다.
  **실루엣 3개 안에서 승부**하고 잔디·잔가지 같은 작은 점은 넣지 말 것.
- 대신 **위쪽은 오른쪽 끝까지 써도 된다** — 카드 오른쪽 위는 비어 있다.
  가랜드 줄·사진 카드·꽃잎은 **높이 55% 위**에서만 오른쪽 26%로 넘어갈 수 있다.
- 캐릭터 머리는 바닥에서 **62%** 를 넘지 않는다.

### 교회소식 (하단 전체가 검색창)

- 카드 아래쪽에 **가로 전체를 덮는 불투명 검색 입력(h-11)** 이 있다.
  → **아래 36%는 통째로 안 보인다.** 그 자리에 주인공을 그리면 그냥 사라진다.
- 지면(바닥선)을 **높이 38% 지점**에 두고, 장면은 **38%~78% 띠** 안에 세운다.
  38% 아래는 평평한 빈 바닥으로 끝낸다(워터마크가 여기 떨어져야 안전하다).
- **왼쪽 50%는 위아래로 완전히 빈 배경**(제목·안내문).
- **오른쪽 위 모서리 22%×30%는 비워 둔다** — 관리자에게만 보이는 `소식 등록` 버튼 자리.
- → 무대는 **x 52%~88%, 높이 38%~78%**.

### 세 장 공통

- 히어로 글씨는 라이트에서 **어두운 잉크** → 라이트는 아주 창백한 high-key.
  다크는 흰 글씨 → 차콜 위 저채도.
- 다크 카드 바탕은 남색이 아니라 **따뜻한 차콜 `#201f1f`**. 남색 밤하늘은 카드에서 뜬다.
- 글자·숫자·로고 금지. **사진 카드·종이·현수막에도 글씨 금지** — 낙서(물결선 세 줄·하트·작은 별)로.
- 테두리·비네트·모서리 라운드 금지 — 카드 모서리는 CSS가 처리한다.
- 얼굴이 식별되는 인물 사진 묘사 금지(행사 앨범). 사진 카드는 **파스텔 낙서**만.

---

# 라이트 테마 프롬프트

## 1. 행사 앨범 — light

```
A wide 2:1 background illustration for the header card of an "event photo album"
page in a mobile church app, LIGHT MODE, very pale and high-key (dark navy text will
be laid on top, so the whole image must stay bright and low-contrast). Style:
cozy-epic children's storybook illustration — soft flat shapes with subtle grain
texture, rounded friendly forms, gentle airy morning light. Use the SAME small
chubby white sheep character as the attached reference image: stubby legs, tiny
round black hooves, serene slightly smug smile.

Palette: pale high-key sky blue and warm cream (the deepest tone around #3182f6,
used only in tiny accents), soft honey-wood, a few pastel rose and apricot notes.
Everything washed in bright morning haze. Warm and reverent, never flashy.

Composition is critical, follow every rule:
1. The LEFT 46% of the frame must be completely empty all the way down to the
   bottom — just a smooth pale blue-to-cream gradient. A title, a paragraph and
   three small numbers will be overlaid there.
2. The RIGHT 26% must be plain flat empty ground from the bottom up to 40% of the
   height — a small UI pill sits there. Nothing may stand in that corner.
3. The ground scene therefore lives ONLY between 46% and 74% of the width.
4. Above 55% height the artwork MAY extend to the right edge — that upper area is
   free.
5. No character's head may rise higher than 62% from the bottom edge.

Main scene (the narrow stage between 46% and 74% of the width, standing on the
bottom): a small honey-wood BOX CAMERA on a slim wooden tripod, with one round lens
and a tiny round flash bulb, aimed to the left. In front of it, one grown sheep is
posing for the group photo, sitting upright, hooves neatly folded, eyes closed,
serene and very slightly smug.

The joke: the camera's self-timer has already started — a tiny lamb is sprinting
into the frame from the side, wool streaming behind it, utterly solemn, cheeks
puffed with effort, clearly about to arrive one second too late. A second even
smaller lamb has jumped a little too high and is caught mid-air above the others,
all four hooves off the ground, delighted.

Upper band (may cross the whole width above 55% height): a gentle string of BUNTING
stretched across the top, with small pastel triangular flags, and two or three
little square PHOTO CARDS clipped to a thin line with tiny wooden pegs, drifting
slightly. Each photo card is a plain pale rectangle with only a simple doodle inside
— one heart, one clover, three soft wavy lines. Absolutely no faces, no writing.
Add a few tiny floating sparkle dots.

No text, no letters, no numbers, no logos anywhere. No camera brand marks, no dials
with numbers. No frames, no borders, no vignette, no rounded corners. The left 46%
and the bottom-right corner must fade into a plain almost-white pale blue gradient.
```

## 2. 새가족 등록 앨범 — light

```
A wide 2:1 background illustration for the header card of a "welcoming new members"
page in a mobile church app, LIGHT MODE, very pale and high-key (dark navy text will
be laid on top, so the whole image must stay bright and low-contrast). Style:
cozy-epic children's storybook illustration — soft flat shapes with subtle grain
texture, rounded friendly forms, gentle airy morning light. Use the SAME small
chubby white sheep character as the attached reference image: stubby legs, tiny
round black hooves, serene slightly smug smile.

Palette: pale high-key sky blue and warm cream (the deepest tone around #3182f6,
used only in tiny accents), soft honey-wood, fresh pale green sprouts, and a few
pastel rose and apricot blossoms. Bright morning haze, warm and welcoming.

Composition is critical, follow every rule:
1. The LEFT 46% of the frame must be completely empty all the way down to the
   bottom — just a smooth pale blue-to-cream gradient. A title, a paragraph and
   three small numbers will be overlaid there.
2. The RIGHT 26% must be plain flat empty ground from the bottom up to 40% of the
   height — a small UI pill sits there. Nothing may stand in that corner.
3. The ground scene therefore lives ONLY between 46% and 74% of the width.
4. Above 55% height the artwork MAY extend to the right edge — that upper area is
   free.
5. No character's head may rise higher than 62% from the bottom edge.

Main scene (the narrow stage between 46% and 74% of the width, standing on the
bottom): a small open honey-wood GATE, just two posts and a low swinging half-door,
with a light arch of clover leaves and a few pastel blossoms growing over it.

One grown sheep stands just inside the gate, bowing a deep welcoming bow, one hoof
held out in greeting, eyes closed, serene and very slightly smug. A NEW little
sheep has just arrived through the gate wearing a soft pastel scarf and carrying a
tiny bundle tied to a stick over its shoulder, standing shyly with both hooves
together.

The joke is the lamb: a tiny lamb has rolled out a little rose-coloured welcome
carpet for the newcomer — and the carpet is ABSURDLY short, barely two hoof-lengths
long, ending well before the newcomer's feet. The lamb is smoothing it flat with
both front hooves, utterly solemn, deeply proud of its work.

Upper band (may cross the whole width above 55% height): a few soft petals and two
or three tiny pastel hearts drifting gently upward, and a thin garland of clover
leaves. Keep it very light and airy.

Bonus props low along the bottom band, simple and pale: one small potted sprout, a
couple of clover leaves.

No text, no letters, no numbers, no logos anywhere. No banners with writing, no name
tags with writing. No frames, no borders, no vignette, no rounded corners. The left
46% and the bottom-right corner must fade into a plain almost-white pale blue
gradient.
```

## 3. 교회소식 — light

```
A wide 2:1 background illustration for the header card of a "church news" page in a
mobile church app, LIGHT MODE, very pale and high-key (dark navy text will be laid
on top, so the whole image must stay bright and low-contrast). Style: cozy-epic
children's storybook illustration — soft flat shapes with subtle grain texture,
rounded friendly forms, gentle airy morning light. Use the SAME small chubby white
sheep character as the attached reference image: stubby legs, tiny round black
hooves, serene slightly smug smile.

Palette: pale high-key sky blue and warm cream (the deepest tone around #3182f6,
used only in tiny accents), soft honey-wood, one small warm brass note, a few
apricot highlights. Bright morning haze, warm and reverent.

Composition is critical, follow every rule:
1. The LEFT 50% of the frame must be completely empty from top to bottom — just a
   smooth pale blue-to-cream gradient. A title and a paragraph will be overlaid
   there.
2. The BOTTOM 36% of the frame must be plain flat empty ground with no detail at
   all — a wide opaque search bar will cover it completely.
3. The ground line where the characters stand must therefore sit at about 38% of
   the height, and the whole scene lives in the band between 38% and 78% height,
   between 52% and 88% of the width.
4. Keep the TOP-RIGHT corner (right 22%, top 30%) empty — a small button appears
   there for some users.

Main scene (that middle-right band): one grown sheep stands upright on its hind
legs, ringing a small honey-brass HAND BELL held high in one hoof, eyes closed,
serene and very slightly smug, with two faint sound arcs curving out from the bell.
A few rolled paper scrolls, tied with pale ribbon, rest in a small wooden basket
beside it.

The joke is the lamb: a tiny lamb is holding a rolled-paper MEGAPHONE cone almost as
big as its whole body, braced with both front hooves, cheeks enormously puffed,
tongue poking out with effort, giving its mightiest possible announcement — and all
that comes out is ONE small pale PAPER PLANE, gliding away on a thin dotted arc. A
second even smaller lamb watches the plane with its head tilted all the way back.

Two more little paper planes drift high in the upper right area, on faint dotted
flight lines.

Do NOT draw a village notice board, and do NOT draw pins or thumbtacks — that scene
belongs to another screen. No text, no letters, no numbers, no logos anywhere; the
paper scrolls and planes must be blank, or carry only three soft wavy doodle lines.
No frames, no borders, no vignette, no rounded corners. The left 50% and the whole
bottom 36% must fade into a plain almost-white pale blue gradient.
```

---

# 다크 테마 프롬프트

세 장 모두 라이트와 **같은 구도·같은 캐릭터·같은 소품**이고, 시간대만 밤으로 바뀐다.
밤의 서사는 헌금과 같은 결 — "늦은 밤인데도 굳이 준비하고 있다".

## 4. 행사 앨범 — dark

```
A wide 2:1 background illustration for the header card of an "event photo album"
page in a mobile church app, DARK MODE. Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain texture, rounded friendly forms,
warm rim lighting. Use the SAME small chubby white sheep character as the attached
reference image: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep warm CHARCOAL (around #201f1f) with a faint cool blue tint in the
upper area — NOT navy blue, NOT black. The mood is "the event is over, and the
sheep are taking one last photo before going home". The only bright accents are a
small AMBER lantern glow and one soft warm flash bulb highlight. Keep everything
muted and low-contrast so light text stays readable, and let the sheep's wool read
as soft warm grey, never bright white.

Composition is critical, follow every rule:
1. The LEFT 46% of the frame must be flat empty charcoal all the way down to the
   bottom. A title, a paragraph and three small numbers will be overlaid there.
2. The RIGHT 26% must be plain flat empty ground from the bottom up to 40% of the
   height — a small UI pill sits there. Nothing may stand in that corner.
3. The ground scene therefore lives ONLY between 46% and 74% of the width.
4. Above 55% height the artwork MAY extend to the right edge — that upper area is
   free.
5. No character's head may rise higher than 62% from the bottom edge.

Main scene (the narrow stage between 46% and 74% of the width, standing on the
bottom): a small honey-wood BOX CAMERA on a slim wooden tripod, one round lens and a
tiny round flash bulb that is glowing warm amber, aimed to the left. A small lantern
hangs just above, pooling amber light over the group. In front of the camera one
grown sheep poses, sitting upright, hooves neatly folded, eyes closed, serene and
slightly smug, wearing a tiny knitted nightcap flopped over one eye. Its muzzle is a
simple closed contented smile — nothing in its mouth, no tongue, no object touching
the face.

The joke: the self-timer has already started — a tiny lamb is sprinting into the
frame from the side, wool streaming behind it, utterly solemn, clearly one second
too late. A second even smaller lamb has curled up and fallen fast asleep right
where it was posing, with one small round snore bubble.

Upper band (may cross the whole width above 55% height): a gentle string of BUNTING
across the top and two or three small square PHOTO CARDS clipped to a thin line with
tiny wooden pegs, each catching a faint amber edge. Each photo card is a plain dim
rectangle with only a simple doodle inside — one heart, one clover, three soft wavy
lines. No faces, no writing. A few faint dust motes drift through the lantern light.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette, no rounded corners. The only bright areas are the lantern, the flash bulb
and the photo-card edges; the left 46% must be flat #201f1f charcoal.
```

## 5. 새가족 등록 앨범 — dark

```
A wide 2:1 background illustration for the header card of a "welcoming new members"
page in a mobile church app, DARK MODE. Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain texture, rounded friendly forms,
warm rim lighting. Use the SAME small chubby white sheep character as the attached
reference image: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep warm CHARCOAL (around #201f1f) with a faint cool blue tint in the
upper area — NOT navy blue, NOT black. The mood is "someone new arrives late at
night, and the lantern was left on for them". The only bright accents are a small
AMBER lantern hanging over the gate and a faint rose glow from a few tiny hearts.
Keep everything muted and low-contrast so light text stays readable, and let the
sheep's wool read as soft warm grey, never bright white.

Composition is critical, follow every rule:
1. The LEFT 46% of the frame must be flat empty charcoal all the way down to the
   bottom. A title, a paragraph and three small numbers will be overlaid there.
2. The RIGHT 26% must be plain flat empty ground from the bottom up to 40% of the
   height — a small UI pill sits there. Nothing may stand in that corner.
3. The ground scene therefore lives ONLY between 46% and 74% of the width.
4. Above 55% height the artwork MAY extend to the right edge — that upper area is
   free.
5. No character's head may rise higher than 62% from the bottom edge.

Main scene (the narrow stage between 46% and 74% of the width, standing on the
bottom): the same small honey-wood GATE — two posts and a low swinging half-door —
with a light arch of clover leaves over it and a small amber LANTERN hanging from
the arch, its warm light spilling down onto the path.

One grown sheep stands just inside the gate, bowing a deep welcoming bow, one hoof
held out in greeting, eyes closed, serene and slightly smug, wearing a tiny knitted
nightcap. Its muzzle is a simple closed contented smile — nothing in its mouth. A
NEW little sheep has just arrived through the gate wearing a soft scarf and carrying
a tiny bundle on a stick, standing shyly in the lantern light with both hooves
together.

The joke is the lamb: a tiny lamb has rolled out a little welcome carpet for the
newcomer — and it is ABSURDLY short, barely two hoof-lengths long, ending well
before the newcomer's feet. The lamb is smoothing it flat with both front hooves,
utterly solemn and deeply proud.

Upper band (may cross the whole width above 55% height): three small rose HEARTS
drifting gently upward, faintly glowing, getting smaller as they rise, and a few
faint dust motes catching the lantern light.

Bonus props low along the bottom band, mostly in shadow: one small potted sprout, a
couple of clover leaves.

No text, no letters, no numbers, no logos anywhere. No banners with writing. No
frames, no borders, no vignette, no rounded corners. The only bright areas are the
lantern and the glowing hearts; the left 46% must be flat #201f1f charcoal.
```

## 6. 교회소식 — dark

```
A wide 2:1 background illustration for the header card of a "church news" page in a
mobile church app, DARK MODE. Style: cozy-epic children's storybook illustration —
soft flat shapes with subtle grain texture, rounded friendly forms, warm rim
lighting. Use the SAME small chubby white sheep character as the attached reference
image: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep warm CHARCOAL (around #201f1f) with a faint cool blue tint in the
upper area — NOT navy blue, NOT black. The mood is "it is late, but this news is
too good to keep until morning". The only bright accents are a small AMBER lantern
glow and one warm brass highlight on the bell. Keep everything muted and
low-contrast so light text stays readable, and let the sheep's wool read as soft
warm grey, never bright white.

Composition is critical, follow every rule:
1. The LEFT 50% of the frame must be flat empty charcoal from top to bottom. A
   title and a paragraph will be overlaid there.
2. The BOTTOM 36% of the frame must be plain flat empty ground with no detail at
   all — a wide opaque search bar will cover it completely.
3. The ground line where the characters stand must therefore sit at about 38% of
   the height, and the whole scene lives in the band between 38% and 78% height,
   between 52% and 88% of the width.
4. Keep the TOP-RIGHT corner (right 22%, top 30%) empty — a small button appears
   there for some users.

Main scene (that middle-right band): one grown sheep stands upright on its hind
legs, ringing a small honey-brass HAND BELL held high in one hoof, catching a single
warm amber highlight, eyes closed, serene and slightly smug, wearing a tiny knitted
nightcap flopped over one eye. Its muzzle is a simple closed contented smile —
nothing in its mouth, no tongue, no object touching the face. Two faint sound arcs
curve out from the bell. A small lantern hangs just above, pooling amber light. A
few rolled paper scrolls rest in a little wooden basket beside it.

The joke is the lamb: a tiny lamb is holding a rolled-paper MEGAPHONE cone almost as
big as its whole body, braced with both front hooves, cheeks enormously puffed,
giving its mightiest possible announcement — and all that comes out is ONE small
pale PAPER PLANE, gliding away on a thin dotted arc, catching one amber edge. A
second even smaller lamb has fallen asleep sitting up beside it, with one small
round snore bubble.

One more paper plane drifts high in the upper right area on a faint dotted flight
line, and a few dust motes catch the lantern light.

Do NOT draw a village notice board, and do NOT draw pins or thumbtacks — that scene
belongs to another screen. No text, no letters, no numbers, no logos anywhere; the
scrolls and planes must be blank. No frames, no borders, no vignette, no rounded
corners. The only bright areas are the lantern, the bell highlight and the paper
plane edge; the left 50% and the whole bottom 36% must be flat #201f1f charcoal.
```

---

## 적용 상태 (2026-09-04)

여섯 장 모두 적용 완료. CSS 는 `src/pages/News/news-hero.css`(`.nh-hero` + `--news/--family/--album`),
후처리는 **`docs/news-hero-process.py` 한 방**이면 재현된다(원본 6장을 `1~6.png` 로 받아두고
`python docs/news-hero-process.py [원본폴더]`).

- **에셋**: `public/images/news/{event-album,new-family,church-news}-{light,dark}.webp`
  (1456×1100 / 1456×1080 RGBA, 각 36~40KB).
- **워터마크 제거는 인페인트가 아니라 '알파 역산'**(헌금과 동일). 다크 원본의 평평한 바닥에서
  `a = (obs-bg)/(255-bg)` 로 알파 맵을 뽑으면 **피크 ≈ 0.31**, 그 맵으로 여섯 장 모두
  `bg = (obs-255a)/(1-a)`. 좌표는 1456×720 기준 **중심 (1337, 599), 반경 ≈ 25px** — 헌금·공지와 같은 자리.
  인페인트(TELEA)는 여기서도 쓰지 말 것.
- **`cover` 가 아니라 `auto 100%; right center`.** 카드가 모바일 358 → PC 832 로 변하기 때문.
- **아래로 캔버스를 늘렸다**(720 → 1100/1080). 히어로 아래쪽에는 통계 숫자·뷰 전환 토글(행사·새가족)과
  **불투명 검색창**(소식)이 앉는데, 원본대로 쓰면 그 UI 가 양들 위에 얹힌다. 늘린 띠는 알파로 사라지므로
  결과적으로 **그림은 카드 위쪽 2/3, UI 는 순수 카드색 위**로 갈린다.
- **왼쪽 페이드는 아주 길게**(행사·새가족 x 170→720, 소식 x 210→760) 구웠다. 제미나이가 장면을
  프롬프트보다 훨씬 넓게(가로 65%) 그려서, 짧은 페이드로는 안내 문구가 양 위에 그대로 얹힌다.
  긴 페이드로 **왼쪽 끝 소품(달려오는 새끼양·화분·바구니)이 안개에 잠기게** 해서 글줄을 살렸다.
- 안내 문구는 `max-w-[60%] lg:max-w-[52%]` 로 묶었다. **삽화를 다시 뽑아 장면 위치가 바뀌면 이 값도 다시 볼 것.**
- 히어로의 기존 `blur-3xl` 브랜드 원(새가족은 purple→pink 원)과 다크 상단 광택 span 은 **제거했다**.
  카드 바탕도 `bg-white/80` → `bg-white`(반투명이면 삽화가 뿌옇게 뜬다).

---

## 이번 생성에서 제미나이가 틀린 것 (다음 재생성 때 프롬프트에 반영)

세 가지가 반복해서 나왔다. **프롬프트에 아래 문장을 추가**하면 재생성이 훨씬 수월하다.

1. **UI pill 을 진짜로 그렸다** (새가족 라이트). "a small UI pill sits there" 를 지시가 아니라
   묘사로 읽고 흰색 알약을 그려 넣었다 → `Do NOT draw any user-interface elements, buttons,
   pills, panels or rounded rectangles — that area must be plain empty background.`
2. **하늘을 사각형 패널로 그렸다** (행사·소식 다크). 화면 절반이 밝은 직사각형이라 다크 카드에서 뜬다
   → `The background must be ONE continuous soft gradient. Never draw a rectangular block,
   panel, window or box of different colour — no straight background edges anywhere.`
   (지금 에셋은 패널을 어둡게 눌러 하이라이트만 남기고 경계를 녹여 살렸다. `dim4` 방식 —
   `news-hero-process.py` 의 `i == 4` 블록 참고. 다시 뽑는 편이 깔끔하다.)
3. **장면을 가로로 너무 넓게 폈다** (전부). "between 46% and 74% of the width" 를 무시하고
   가로 65%에 캐릭터를 늘어놓았다 → `Draw the characters as ONE tight cluster, not spread out:
   the whole group must fit inside a box no wider than 30% of the frame.`

## 알아 둘 것

- 새가족 히어로 엠블럼만 아직 **purple→pink 그라데이션**이다(브랜드는 토스 블루).
  삽화는 브랜드 블루 + 로즈로 뽑아 두어서, 나중에 엠블럼을 블루로 정리해도 그대로 쓸 수 있다.
- 주보 탭에는 히어로 카드가 없다 — 배경 이미지 자리도 없다.
