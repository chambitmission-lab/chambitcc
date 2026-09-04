# 온라인 헌금 히어로 배경 이미지 프롬프트 (Gemini용)

`/news?tab=offering` 상단 **히어로 카드**(`News/components/OfferingSection.tsx`, OFFERING 엠블럼 +
"온라인 헌금" + 안내 문구 + `계좌 N곳` 칩) 뒤에 깔 배경. 라이트/다크 각 1장.
컨셉은 칭호·이어읽기·공지 배너·교육 배경과 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**,
장면은 **"양들의 헌금함"**.

유머는 **돈이 아니라 정성**에서 나온다 — 새끼양이 자기 몸통만 한 동전을 낑낑 밀고 와서
투입구에 넣으려는데 **동전이 구멍보다 크다**. 표정은 더없이 진지하다.
지폐 뭉치·계산기·저울·동전 산더미처럼 **돈을 세는 그림은 금지**(교회 화면에서 탐욕으로 읽힌다).
톤의 근거는 시드에 넣어둔 성구 — 고린도후서 9:7 *"하나님은 즐겨 내는 자를 사랑하시느니라"*.

## 사용법

1. Gemini에 `public/images/title-bg/` 중 아무 이미지나 한 장 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로" 라고 덧붙인 뒤, 아래 프롬프트를 통째로 붙여넣는다.
2. 결과물 저장 위치 (파일명 고정):
   - 라이트: `frontend/public/images/offering/hero-light.webp`
   - 다크:   `frontend/public/images/offering/hero-dark.webp`
3. 규격: **2:1 가로 (1536×768 권장)**, `cwebp -q 78 원본.png -o hero-light.webp`, 한 장 **60KB 이하**.
   크게 뽑았으면 `magick in.png -resize 1536x768^ -gravity south -extent 1536x768 out.png`
   로 **아래쪽 기준** 크롭.

## 레이아웃 제약 (프롬프트의 핵심)

히어로 카드 실측 (`p-5` + 엠블럼 44px + 안내문 + 칩):

| | 카드 크기 | 비율 |
|---|---|---|
| 모바일(390px) | 약 358×180 | **≈2 : 1** |
| PC(lg, 본문 열) | 약 832×158 | **≈5.3 : 1** |

2:1 원본을 `cover; center bottom` 으로 깔면:

| | 보이는 영역 |
|---|---|
| 모바일 | **거의 전체** (원본과 비율이 같다) |
| PC | 가로 **전체**, 세로는 **아래 38%** |

→ 교집합은 **"아래쪽 띠"**. 가로는 두 경우 다 전부 보이므로 좌우 크롭 걱정은 없다. 그래서:

- **핵심 장면(헌금함 + 큰 양 + 새끼양)은 화면 아래 38% 안에.**
- **위쪽 62%는 거의 비워 둔다** — 모바일에서 그 위로 제목·안내 문구가 통째로 지나간다.
- 카드 콘텐츠는 **전부 왼쪽 정렬**이다(엠블럼·제목 좌상단, `계좌 N곳` 칩 좌하단).
  → 주인공은 **오른쪽 45%**에 세우고, **왼쪽 40%는 바닥까지 빈 배경**으로 끝낸다.
- 히어로 글씨는 라이트에서 **어두운 잉크**다 → 라이트는 아주 창백한 high-key.
  다크는 흰 글씨 → 차콜 위에 저채도로.
- **오른쪽 아래 모서리 8%는 반드시 빈 바닥**으로 비운다. 주인공이 오른쪽에 서는 구도라
  **Gemini 워터마크 ✦(우하단)가 캐릭터 위에 얹히면 인페인트가 위험하다**(공지 배너에서 겪음).
  워터마크 띠만 잘라낼 수 있게 바닥을 평평하게 그리게 한다.
- 글자·숫자·로고 금지. **동전에도 숫자·문양 금지** — 민무늬 금색 원반으로.
- 테두리·비네트·모서리 라운드 금지 — 카드 모서리는 CSS가 처리한다.
- 다크 카드 바탕은 남색이 아니라 **따뜻한 차콜 `#201f1f`**. 남색 밤하늘로 그리면 카드에서 뜬다.

---

## 라이트 테마 프롬프트

```
A wide 2:1 background illustration for the header card of an "online offering" page
in a mobile church app, LIGHT MODE, very pale and high-key (dark navy text will be
laid on top, so the whole image must stay bright and low-contrast). Style:
cozy-epic children's storybook illustration — soft flat shapes with subtle grain
texture, rounded friendly forms, gentle airy morning light. Use the SAME small
chubby white sheep character as the attached reference image: stubby legs, tiny
round black hooves, serene slightly smug smile.

Palette: pale high-key sky blue and warm cream (the deepest tone around #3182f6,
used only in tiny accents), soft honey-wood, a few pastel rose and apricot hearts.
Everything washed in bright morning haze. Warm and reverent, never flashy — this is
a church, not a bank.

Composition is critical: ALL of the artwork sits in the BOTTOM 38% of the frame, and
the MAIN SCENE must be inside the RIGHT 45% of the width. The LEFT 40% must be
completely empty down to the very bottom — just a smooth pale blue-to-cream
gradient — because a title, a paragraph and a small chip will be overlaid there.
The TOP 62% must also be almost empty, with maybe two faint clouds and a few tiny
floating sparkle dots. Leave the BOTTOM-RIGHT CORNER (about 8% of the frame) as
plain flat empty ground with no detail at all.

Main scene (right side, bottom band): a small honey-wood OFFERING BOX shaped like a
little chapel chest — a rounded wooden box with a slim coin slot on its lid and one
small, simple wooden cross carved on the front panel. Three soft pastel HEARTS drift
gently upward out of the slot, getting smaller as they rise.

Beside it, one grown sheep stands upright on its hind legs, having just posted its
offering: one hoof still resting on the lid, eyes closed, wearing a serene and very
slightly smug little smile.

The joke is the lamb: a tiny lamb is rolling an ENORMOUS round golden coin, almost
as big as its whole body, up to the box with both front hooves — utterly solemn,
cheeks puffed with effort, tongue poking out — and the coin is OBVIOUSLY far too big
to fit through the slot. The coin must be a plain smooth blank golden disc: NO
numbers, NO letters, NO engraved symbols of any kind.

A second even smaller lamb stands on the other side holding a little wooden
piggy-bank-style pot upside down and shaking it, with one last tiny coin stubbornly
refusing to fall out, and one small motion arc above it.

Keep all of them SMALL and light — their heads should reach no higher than 38% up
from the bottom edge. Bonus props low along the same bottom band, simple and pale: a
few scattered clover leaves, one small potted plant, a couple of tiny hearts resting
on the ground.

No text, no letters, no numbers, no logos anywhere. No banknotes, no cash stacks, no
calculators, no piles of money. No frames, no borders, no vignette, no rounded
corners. The left 40% and the top must fade into a plain almost-white pale blue
gradient.
```

## 다크 테마 프롬프트

```
A wide 2:1 background illustration for the header card of an "online offering" page
in a mobile church app, DARK MODE. Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain texture, rounded friendly forms,
warm rim lighting. Use the SAME small chubby white sheep character as the attached
reference image: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep warm CHARCOAL (around #201f1f) with a faint cool blue tint in the
upper area — NOT navy blue, NOT black. The mood is "it is late at night and the
lamb has finally finished counting out its very small savings". The only bright
accents are a small AMBER lantern glow and the soft rose glow of hearts rising out
of the offering box. Keep everything muted and low-contrast so light text stays
readable, and let the sheep's wool read as soft warm grey, never bright white.

Composition is critical: ALL of the artwork sits in the BOTTOM 38% of the frame, and
the MAIN SCENE must be inside the RIGHT 45% of the width. The LEFT 40% must be flat
empty charcoal all the way down to the bottom, because a title, a paragraph and a
small chip will be overlaid there. The TOP 62% must also be almost empty — a smooth
dark charcoal gradient with a few faint dust motes catching the lantern light.
Leave the BOTTOM-RIGHT CORNER (about 8% of the frame) as plain flat empty ground
with no detail at all.

Main scene (right side, bottom band): the same small honey-wood OFFERING BOX shaped
like a little chapel chest — a slim coin slot on the lid, one small simple wooden
cross on the front panel, warm amber light pooling across it from a little lantern
hanging just above. Three soft rose HEARTS drift gently upward out of the slot,
faintly glowing, getting smaller as they rise.

Beside it the same grown sheep stands upright on its hind legs, one hoof resting on
the lid, eyes closed, serene and slightly smug, wearing a tiny knitted nightcap that
has flopped over one eye. Its muzzle is just a simple closed contented smile —
nothing in its mouth, no tongue, no object touching the face.

The joke is the lamb: a tiny lamb is still rolling an ENORMOUS round golden coin,
almost as big as its whole body, toward the box with both front hooves — utterly
solemn, cheeks puffed with effort — and the coin is OBVIOUSLY far too big to fit
through the slot. The coin must be a plain smooth blank golden disc catching one
amber highlight: NO numbers, NO letters, NO engraved symbols of any kind.

A second even smaller lamb has given up and fallen fast asleep curled against the
side of the box, still hugging its little upside-down wooden savings pot, with one
small round snore bubble.

Keep all of them SMALL and low — their heads should reach no higher than 38% up from
the bottom edge. Bonus props low along the same bottom band, mostly in shadow: a few
clover leaves, one small potted plant, one tiny heart resting on the ground catching
the lantern light.

No text, no letters, no numbers, no logos anywhere. No banknotes, no cash stacks, no
calculators, no piles of money. No frames, no borders, no vignette, no rounded
corners. The only bright areas are the lantern, the glowing hearts and the coin
highlight; the left 40% must be flat #201f1f charcoal.
```

---

## 뽑고 나서

1. 워터마크 ✦(우하단)는 **비워 둔 바닥 8%** 안에 떨어져야 한다. 캐릭터 위에 얹혔으면
   인페인트하지 말고(글로우를 빨아들여 얼룩이 남는다) **다시 뽑는 편이 빠르다**.
2. `public/images/offering/` 폴더를 만들고 두 장을 넣는다.
3. `OfferingSection.tsx` 히어로에 깔 CSS 초안 — 지금 있는 `blur-3xl` 브랜드 원은 **빼고** 쓴다:

```css
/* 라이트 */
background-image:
  linear-gradient(90deg, var(--card-bg) 0%, var(--card-bg) 34%, rgba(255,255,255,0) 78%),
  url('/images/offering/hero-light.webp');
background-size: 100% 100%, cover;
background-position: left center, center bottom;
```
   가로 워시를 한 겹 더 까는 이유는 공지 배너와 같다 — **모바일에서 안내 문구가 그림 위를
   지나가기 때문**. 원본부터 왼쪽 40%가 비어 있어야 이 워시가 경계선을 안 만든다.

4. 다크는 `hero-dark.webp` + `var(--card-bg)` 가 `#201f1f` 로 바뀌므로 같은 규칙이 그대로 먹는다.

## 적용 상태 (2026-09-04)

두 장 모두 적용 완료. CSS 는 `src/pages/News/offering.css`(`.off-hero`).

- **에셋**: `public/images/offering/hero-{light,dark}.webp` (1536×768 RGBA, 20KB / 25KB).
  원본 1456×720 → 워터마크 제거 → south 기준 cover 크롭 → **왼쪽 46% 알파 smoothstep 페이드**
  → `quality=80, alpha_quality=92, method=6`.
- **워터마크 제거는 인페인트가 아니라 '알파 역산'으로 했다.** ✦ 는 순수 흰색(255)을 고정
  알파로 올린 합성이라, 같은 위치의 밝은/어두운 두 장에서
  `a = 1 - (obs1-obs2)/(bg1-bg2)` 로 풀면 `a` 피크 ≈ **0.32**, `W = 255` 가 나온다.
  알파 맵은 어두운 장의 **평평한 바닥 위**에서만 신뢰할 수 있으므로 아래 절반에서 재고
  ✦ 의 4중 대칭으로 위 절반을 복원한 뒤 `bg = (obs - 255a)/(1-a)` 로 두 장 모두 벗겼다.
  → **캐릭터에 겹친 부분까지 자국 없이 사라진다.** 인페인트(TELEA)는 여기선 쓰지 말 것 —
  주인공 실루엣을 빨아들여 얼룩이 남는다.
  좌표(1456×720 기준): 중심 **(1336.5, 599)**, 반경 ≈ 25px. 공지 배너와 같은 자리다.
- **배치는 `cover` 가 아니라 `auto 100%; right center`.** 카드가 모바일 358×180(2:1) →
  PC 832×158(**5.3:1**)로 변해서, `cover` 를 쓰면 PC 에서 세로 38%만 남아 **양의 머리가 잘린다**.
  높이맞춤으로 두면 PC 에선 폭 316px 짜리 작은 무대가 오른쪽 끝에 서고 장면이 온전히 보인다.
- **카드색 맞춤(gradient wash)을 하지 않는다.** 왼쪽 알파 페이드를 에셋에 구웠기 때문 —
  라이트 하늘이 연파랑, 다크 바닥이 `#1e1e1a`(카드는 `#201f1f`)라 색을 맞추는 방식은 어차피 어긋난다.
- 히어로의 기존 `blur-3xl` 브랜드 원과 다크 상단 광택 span 은 **제거했다**(삽화가 그 역할을 한다).
- 본문 글줄은 `max-w-[70%] lg:max-w-[64%]` 로 묶어 양·헌금함 위로 넘어가지 않게 했다.
  **삽화를 다시 뽑아 장면 위치가 바뀌면 이 값도 다시 볼 것.**

---

## 자주 깨지는 곳 (재생성 말고 부분 수정)

**동전에 숫자·문양이 들어갔을 때** (제미나이가 자주 그린다)

```
Keep this image exactly as it is — same composition, same lighting, same colors,
same characters, same offering box. Change ONE thing only:

Redraw the large golden coin as a completely plain, smooth, blank golden disc —
no numbers, no letters, no engraved symbols, no rim lettering, nothing on its face
at all. Just a soft gradient and one gentle highlight. Everything else must stay
pixel-identical.
```

**왼쪽이 안 비었을 때** — 고쳐 그리게 하지 말고 이미지 편집으로 왼쪽 40%를 카드색
(라이트 `#ffffff`, 다크 `#201f1f`) 단색으로 덮은 뒤 경계만 깃털링하는 게 확실하다.
