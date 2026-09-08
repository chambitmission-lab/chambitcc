# 말씀 사진 카드 인트로 배경 이미지 프롬프트 (Gemini용) — 5안

`/bible/photo-verse` 에서 **사진을 고르기 전 인트로 화면**
(`src/pages/Bible/PhotoVerse/PhotoVerse.tsx` 의 `.pv-intro` — 사각 아이콘 뱃지 +
"내 사진 위에 / 말씀을 담아보세요" + 안내 2줄 + `사진 선택하기` 버튼 +
점선 아래 "사진이 없어도 괜찮아요" + 감성 배경 스와치 8개 + 자물쇠 안내) 뒤에 깔 배경.
라이트/다크 각 1장. 원래는 배경이 없었다 — `#f1f3f6` / `#131313` 민무늬 위에 글자만.
**2026-09-08에 A안(폴라로이드를 흔드는 양)을 적용했다** ([적용 상태](#적용-상태-2026-09-08) 참고).
나머지 4안은 다시 뽑을 때를 위해 그대로 남겨 둔다.

컨셉은 칭호·이어읽기·플랜·교육·헌금·소식·묵상방 배경과 같은
**코지-에픽 동화풍 + 같은 양 캐릭터**. 다만 이 화면은 그 중에서 **가장 대놓고 웃겨도 되는 자리**다.

## 왜 여기만 유머를 앞세우나

이 화면이 하는 일은 설명이 아니라 **"이거 한 번 해볼래?"** 한마디다.
말씀 카드는 만들어 보기 전에는 재미를 알 수 없고, 그래서 유일한 문제는 **첫 시도의 문턱**이다.
그림이 먼저 웃겨서 "얘가 뭐 하는 거야?" 하고 들여다보게 되면, 손가락은 이미 버튼 근처에 있다.

- **감성은 결과물이 가져간다.** 사용자가 만들 카드(내 사진 + 말씀)가 이미 충분히 진지하다.
  그러니 인트로는 진지함을 **한 번 더 반복하지 말고**, 웃기고 따뜻하게 문만 열어 주면 된다.
- 유머의 문법은 교육 히어로(`docs/education-hero-bg-prompts.md`, 자고 있는 새끼양)와 같은 계열이다.
  **양은 언제나 대단히 진지하고, 웃긴 건 상황**이다. 양이 개그를 치는 그림은 이 세계관이 아니다.
- 감성은 마지막 한 겹으로만 넣는다 — **빛**. 아래 5안 모두 "빛이 사진 위로 내려앉는" 장치를
  하나씩 갖고 있고, 그게 이 화면의 카피("말씀을 담아보세요")를 그림으로 번역한 부분이다.

---

## 공통 규칙 (5안 전부 해당)

1. Gemini에 `public/images/title-bg/` 중 아무 이미지나 한 장 첨부하고
   **"이 양 캐릭터와 완전히 같은 캐릭터로"** 라고 덧붙인 뒤, 아래 프롬프트를 통째로 붙여넣는다.
2. 규격: **2:1 가로 (1536×768 권장)**. `cwebp -q 78 원본.png -o intro-light.webp`, 한 장 **60KB 이하**.
   크게 뽑았으면 `magick in.png -resize 1536x768^ -gravity south -extent 1536x768 out.png`
   로 **아래쪽 기준** 크롭.
3. Gemini 워터마크(우하단 ✦)는 OpenCV TELEA inpaint로 제거. 워터마크 위에 소품이 겹치면
   교육 히어로 때처럼 **인페인트 대신 배경 되메우기**(깨끗한 열의 행별 중앙값)를 쓴다.
4. 저장 위치 — 후보를 여러 개 뽑을 때는 안 기호를 붙여 두고, 채택된 것만 이름을 확정한다.
   - 후보: `frontend/public/images/photo-verse/intro-a-light.webp` / `intro-a-dark.webp` …
   - 채택: `frontend/public/images/photo-verse/intro-light.webp` / `intro-dark.webp`
5. **글자·숫자·로고 절대 금지.** 이 화면은 소재가 사진과 글씨라 프롬프트가 방심하면
   Gemini가 사진 위에 영어 문장을 써 버린다. 사진·폴라로이드·칠판·간판 안쪽은
   **빛줄기나 어린애 낙서(하트·물결·작은 십자가)로만** 채운다.
6. 테두리·비네트·액자 테 금지 — 카드 모서리는 CSS가 처리한다.
7. 카드 바탕색이 히어로들과 다르다.
   - 라이트 `#f1f3f6` (쿨 그레이) — 위에 **어두운 잉크**가 얹히므로 그림은 **아주 창백한 high-key**.
   - 다크 `#131313` (거의 검정, **남색 아님**) — 위에 **밝은 잉크**. 배경은 깊게, 빛은 점처럼.
   두 장 모두 **위쪽 가장자리는 카드색으로 완전히 사라져야** 한다.

---

## 레이아웃 제약 (프롬프트의 핵심)

이 화면은 **모바일에서 세로로 아주 길고, PC에서 가로로 아주 넓다.**
실측: 모바일 약 430×760(**≈0.57:1**), PC 약 1200×640(**≈1.9:1**).
게다가 세로 가운데는 아이콘·제목·본문·버튼·점선·스와치 8개·자물쇠 안내가 **끊김 없이 채우고 있다.**
→ 그림이 들어갈 수 있는 자리는 **아래쪽 띠**와 **PC에서만 남는 좌우 여백**뿐이다.

| | 보이는 영역 (모바일 `background-size: 200%` / PC `cover`, 둘 다 `center bottom`) |
|---|---|
| 모바일 | 세로는 아래 절반, 가로는 **가운데 50%** |
| PC | 가로 **전체**, 세로는 **아래 45%** |

그래서 프롬프트는 전부 이 세 줄을 반복한다.

- **핵심 장면(양·새끼양·주인공 소품)은 화면 아래 40% 띠의 가운데 절반 안에.**
- **왼쪽·오른쪽 바깥 1/4은 PC에서만 보이는 보너스 소품** 자리 — 낮고 단순하게. 없어도 그림이 성립해야 한다.
- **위쪽 55~60%는 거의 비운다** — 제목·본문·버튼이 그 위에 올라간다.
  하늘 그라데이션 + 아주 옅은 입자(먼지·반딧불·꽃가루) 정도만.

> 캐릭터 키 기준: **머리 끝이 이미지 중앙선(50%)을 넘지 않게.** 넘으면 제목 글자와 부딪힌다.
> 아래 띠 위에는 스와치 8개와 자물쇠 안내가 겹치므로, **바닥은 단순하게** 두고
> 적용할 때 `.pv-intro` 의 `padding-bottom` 을 그림 띠 높이만큼(약 160~200px) 늘린다.

---

## 5안 한눈에

| | 안 | 장면 | 웃음 | 감성 | 궁합 |
|---|---|---|---|---|---|
| **A** | 폴라로이드를 흔드는 양 | 몸통만 한 즉석사진을 온 힘 다해 흔든다 | 잔상 3중 + 까치발 새끼양 | 아직 안 보이는 사진 = 기다림 | ★★★ 은유가 정확 |
| **B** | 셀카봉 대참사 | 단체 사진이 완벽하게 망함 | 프레임 밖으로 튀어나간 새끼양 | 망한 사진도 그대로 담긴다 | ★★☆ 제일 웃김 |
| **C** | 말씀 도장 쿵! | 키만 한 스탬프로 사진을 찍는 순간 | 잉크 패드 밟은 발자국 | '새기다' | ★★☆ |
| **D** | 붓글씨 대참사 | 엎지른 잉크가 은하수가 된다 | 대참사를 모르는 양 | 실수가 하늘이 되는 반전 | ★★★ 제일 예쁨 |
| **E** | 카메라가 집 | 거대한 카메라 오두막, 렌즈가 창문 | 굴뚝 = 셔터 버튼 | 창에서 쏟아지는 빛 | ★★☆ 제일 오래 봄 |

**추천 순서: A → D → E → B → C.**
A가 첫째인 이유는 하나다 — 이 화면의 문장("내 사진 위에 말씀을 담아보세요")을 **동작 하나로** 번역하기 때문.
흔들면 흐릿한 사진 위로 빛이 떠오른다. 사용자가 버튼을 누른 뒤 벌어질 일이 그림에 미리 들어 있다.

---

## A안 — 폴라로이드를 흔드는 양

**장면.** 양이 제 몸통만 한 즉석사진 한 장을 두 앞발로 붙잡고 온 힘을 다해 흔든다.
사진 속은 아직 반쯤 흐린데, 그 흐림 사이로 **빛 한 줄이 떠오르는 중**이다.
뒤에는 빨랫줄에 사진들이 집게로 널려 있고, 새끼양이 까치발로 한 장 더 널려다 실패하는 중.

**웃음.** 사진이 양보다 크다 · 흔드는 잔상이 3중으로 겹친다 · 그 와중에 표정은 더없이 진지하다.
**감성.** "아직 안 보이는 사진"은 기다림이다. 다크에서는 빨랫줄의 사진들이 반딧불처럼 은은히 빛난다.

### 라이트

```
A wide 2:1 background illustration for the intro screen of a "make a verse photo
card" feature in a mobile church app, LIGHT MODE, very pale and high-key (dark ink
text and a blue button will be laid on top, so the whole image must stay bright and
low-contrast). Style: cozy-epic children's storybook illustration — soft flat shapes
with subtle grain texture, rounded friendly forms, gentle airy afternoon light. Use
the SAME small chubby white sheep character as the attached reference image: stubby
legs, tiny round black hooves, serene slightly smug smile.

Palette: pale high-key sky blue and warm cream, soft honey wood, a few pastel mint
and apricot accents. The deepest tone in the whole image is a small amount of soft
blue around #3182f6, used only in tiny accents. Everything washed in bright hazy
daylight.

Composition is critical: ALL of the artwork sits in the BOTTOM 40% of the frame, and
the MAIN SCENE must be inside the CENTER HALF of the width. The TOP 60% must be
almost completely empty — a smooth pale blue-to-cream gradient with two faint clouds
and a few tiny floating dust sparkles, nothing else, because a headline and a button
will be overlaid there. No character's head may rise above the midline of the image.

Main scene (center, bottom band): one sheep stands upright on its hind legs, gripping
with both front hooves a single instant-camera photo print that is comically almost
as big as its own body, and shaking it hard to develop it — show the shake as three
soft overlapping motion ghosts of the print and a few speed swooshes. The sheep's
face is absolutely serious, deeply focused, as if this is important work. The print
itself is still half-developed: a soft milky white rectangle with a faint warm glow
rising through it, like an image about to appear — inside it there are NO letters and
NO numbers, only a soft ribbon of light and a tiny childish doodle heart.

Behind and slightly left, a low clothesline strung between two short posts, with four
or five more instant photos pegged to it by little wooden clips, each print a plain
pale rectangle with only soft blurry color inside. A tiny lamb stands on its tiptoes
below the line, stretching up with one hoof to peg one more photo and clearly not
reaching. Two prints have already fallen and lie flat on the ground.

Bonus props spread into the far LEFT and far RIGHT quarters, along the same bottom
band, low and simple: a boxy vintage instant camera resting on a stool, a small
potted plant, a scattering of wooden clothespins, one photo print gliding in from the
edge on the breeze.

No text, no letters, no numbers, no logos anywhere — especially not inside the photo
prints. No frames, no borders, no vignette. The top edge must fade into a plain
almost-white cool grey gradient.
```

### 다크

```
A wide 2:1 background illustration for the intro screen of a "make a verse photo
card" feature in a mobile church app, DARK MODE. Style: cozy-epic children's
storybook illustration — soft flat shapes with subtle grain texture, rounded friendly
forms, warm rim lighting. Use the SAME small chubby white sheep character as the
attached reference image: stubby legs, tiny round black hooves, serene slightly smug
smile.

Palette: deep near-black charcoal (around #131313) with a faint cool blue tint in the
upper area — NOT navy blue. The mood is "a warm yard late at night". The only bright
accents are AMBER lantern light and the soft glow of the photographs themselves.
Keep everything muted and low-contrast so light text stays readable across the top.

Composition is critical: ALL of the artwork sits in the BOTTOM 40% of the frame, and
the MAIN SCENE must be inside the CENTER HALF of the width. The TOP 60% must be
almost completely empty — a smooth near-black gradient with a scattering of very
small distant stars and two or three drifting fireflies, because a headline and a
button will be overlaid there. No character's head may rise above the midline.

Main scene (center, bottom band): the same sheep stands upright, gripping with both
front hooves one instant-camera photo print almost as big as its own body, shaking it
hard to develop it — three soft overlapping motion ghosts, a few speed swooshes, and
a face of total, unshakeable seriousness. The print is half-developed and it GLOWS
faintly from within, a warm milky light spilling onto the sheep's wool and lighting
its face from below — inside the print there are NO letters and NO numbers, only a
soft ribbon of light and a tiny doodle heart.

Behind and slightly left, the low clothesline with four or five more pegged prints,
each one glowing gently like a paper lantern, so the line reads as a string of warm
lights in the dark. A tiny lamb on its tiptoes stretches up to peg one more and
cannot reach. Two fallen prints glow softly on the ground.

Bonus props spread into the far LEFT and far RIGHT quarters, along the same bottom
band, low, simple and mostly in shadow: a boxy vintage instant camera on a stool with
one amber glint on its lens, a small potted plant, scattered clothespins, a little
brass lantern hung on a post casting a warm pool of light.

No text, no letters, no numbers, no logos anywhere — especially not inside the photo
prints. No frames, no borders, no vignette. Everything except the glowing prints and
the lantern stays deep near-black.
```

---

## B안 — 셀카봉 대참사

**장면.** 양이 우스꽝스럽게 긴 셀카봉을 들고 단체 사진을 찍는다.
새끼양 하나는 점프하다 프레임 밖으로 반쯤 튀어나갔고, 하나는 하필 눈을 감았고,
하나는 등을 돌린 채 렌즈에 코를 박고 있다. 삼각대 위 낡은 카메라의 셀프타이머가 깜빡인다.

**웃음.** 완벽하게 망한 단체 사진. 그런데 양은 이 사진이 아주 잘 나왔다고 확신하고 있다.
**감성.** 프레임 밖으로 튄 새끼양까지 포함해 이 순간은 따뜻하다 — "그대로 담아도 괜찮아요."

### 라이트

```
A wide 2:1 background illustration for the intro screen of a "make a verse photo
card" feature in a mobile church app, LIGHT MODE, very pale and high-key (dark ink
text and a blue button will be laid on top, so the image must stay bright and
low-contrast). Style: cozy-epic children's storybook illustration — soft flat shapes
with subtle grain, rounded friendly forms, sunny midday air. Use the SAME small
chubby white sheep character as the attached reference image: stubby legs, tiny round
black hooves, serene slightly smug smile.

Palette: pale high-key sky blue, soft meadow green, warm cream, with tiny apricot and
mint accents and one small touch of soft blue near #3182f6. Bright hazy sunlight.

Composition is critical: ALL of the artwork sits in the BOTTOM 40% of the frame, and
the MAIN SCENE must be inside the CENTER HALF of the width. The TOP 60% must be
almost completely empty — a smooth pale blue-to-cream gradient with two faint clouds
and a few floating pollen sparkles, because a headline and a button go there. No
character's head may rise above the midline of the image.

Main scene (center, bottom band): a disastrous group photo in progress. One grown
sheep stands upright holding a selfie stick that is absurdly, ridiculously too long —
it arcs up and off toward the upper left and the little camera at its end is far away
and tilted at a hopeless angle. The sheep's expression is calm, confident, certain
that this shot is going perfectly. Around it, THREE tiny lambs ruin it in three
different ways: the first is caught mid-jump and is half out of the composition, only
its back legs and a puff of wool still inside; the second has its eyes squeezed shut
at exactly the wrong moment; the third has turned completely around and is pressing
its nose against a second camera that sits on a small wooden tripod, so we only see
its round backside. The tripod camera has a tiny self-timer light blinking, drawn as a
small soft glow with three little light rays.

A gentle wide beam of warm light falls from the upper right across the whole group,
as if the sun decided this ruined photo was worth lighting properly.

Bonus props spread into the far LEFT and far RIGHT quarters, along the same bottom
band, low and simple: a toppled little studio light lying on the grass, a picnic
basket, a fallen straw hat, a few daisies, one photo print gliding in from the edge.

No text, no letters, no numbers, no logos anywhere, and nothing readable on the
cameras. No frames, no borders, no vignette. The top edge must fade into a plain
almost-white cool grey gradient.
```

### 다크

```
A wide 2:1 background illustration for the intro screen of a "make a verse photo
card" feature in a mobile church app, DARK MODE. Style: cozy-epic children's
storybook illustration — soft flat shapes with subtle grain, rounded friendly forms,
warm rim lighting. Use the SAME small chubby white sheep character as the attached
reference image: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep near-black charcoal (around #131313) with a faint cool blue tint above
— NOT navy. The mood is "a night group photo beside a small campfire": the only
bright accents are the AMBER firelight and one cool white flash burst. Everything
else muted and low-contrast so light text stays readable across the top.

Composition is critical: ALL of the artwork sits in the BOTTOM 40% of the frame, and
the MAIN SCENE must be inside the CENTER HALF of the width. The TOP 60% must be
almost completely empty — near-black gradient with small distant stars and a few
sparks drifting up from the fire, because a headline and a button go there. No
character's head may rise above the midline.

Main scene (center, bottom band): the same disastrous group photo, now at night
beside a small campfire. The grown sheep stands upright holding the absurdly
over-long selfie stick arcing off toward the upper left, utterly confident. THREE
tiny lambs ruin it exactly as before: one caught mid-jump and half out of frame, one
with eyes squeezed shut, one turned around pressing its nose to the tripod camera.
The tripod camera's flash is going off RIGHT NOW — a soft cool-white burst that
briefly lights every face and throws long soft shadows behind them, while the
campfire keeps everything else in warm amber. The contrast between the white flash
and the amber fire is the whole picture.

Bonus props spread into the far LEFT and far RIGHT quarters, along the same bottom
band, low, simple and mostly in shadow: a toppled little studio light, a picnic
basket, a fallen straw hat with one amber glint, a lantern on the ground, one glowing
photo print gliding in from the edge.

No text, no letters, no numbers, no logos anywhere, and nothing readable on the
cameras. No frames, no borders, no vignette. Only the flash and the fire are bright;
everything else stays deep near-black.
```

---

## C안 — 말씀 도장 쿵!

**장면.** 양이 제 키만 한 나무 스탬프를 두 발로 번쩍 들어 사진 위에 **막 내리찍는 순간**.
충격파가 동그랗게 퍼지고 잉크가 사방으로 튄다. 옆에서 새끼양이 잉크 패드를 밟고 지나가
바닥에 앞발 도장 자국을 줄줄이 남겼다. 찍힌 사진 몇 장이 위로 떠오른다.

**웃음.** 도장이 양보다 크고, 발자국은 이미 되돌릴 수 없고, 아무도 그걸 신경 쓰지 않는다.
**감성.** '새기다'. 다크에서는 잉크가 검정이 아니라 **금빛/별빛**으로 찍힌다.

### 라이트

```
A wide 2:1 background illustration for the intro screen of a "make a verse photo
card" feature in a mobile church app, LIGHT MODE, very pale and high-key (dark ink
text and a blue button will be laid on top, so the image must stay bright and
low-contrast). Style: cozy-epic children's storybook illustration — soft flat shapes
with subtle grain, rounded friendly forms, soft workshop daylight. Use the SAME small
chubby white sheep character as the attached reference image: stubby legs, tiny round
black hooves, serene slightly smug smile.

Palette: warm cream and pale honey wood, pale sky blue air, one soft blue near
#3182f6 for the ink, small apricot accents. Bright and airy.

Composition is critical: ALL of the artwork sits in the BOTTOM 40% of the frame, and
the MAIN SCENE must be inside the CENTER HALF of the width. The TOP 60% must be
almost completely empty — a smooth pale gradient with a few floating paper scraps and
dust sparkles, because a headline and a button go there. No character's head may rise
above the midline of the image.

Main scene (center, bottom band): a tiny stamp workshop. One sheep stands upright on
a low wooden workbench, holding overhead with both front hooves a chunky wooden hand
stamp as tall as itself, and bringing it DOWN onto a photo print laid flat on the
bench — freeze the exact moment of impact: a soft round shockwave ring, a few flying
ink droplets, and the sheep's face set in absolute, heroic concentration. The photo
print under the stamp shows NO letters and NO numbers — only a soft blue printed mark
like a little heart and a wobbly cross doodle, still wet and shining.

Beside the bench, a tiny lamb has walked straight across the open ink pad and is
strolling away leaving a neat trail of small round blue hoofprints across the boards,
completely unbothered. Three or four finished photo prints drift upward out of the
bench into the air, tilting as they rise.

Bonus props spread into the far LEFT and far RIGHT quarters, along the same bottom
band, low and simple: a rack of small wooden stamps, a fat roll of paper tape, a
stack of blank photo prints, a tipped-over ink pot with a slow soft blue puddle, one
photo print gliding in from the edge.

No text, no letters, no numbers, no logos anywhere — the stamps and prints carry only
doodles. No frames, no borders, no vignette. The top edge must fade into a plain
almost-white cool grey gradient.
```

### 다크

```
A wide 2:1 background illustration for the intro screen of a "make a verse photo
card" feature in a mobile church app, DARK MODE. Style: cozy-epic children's
storybook illustration — soft flat shapes with subtle grain, rounded friendly forms,
warm rim lighting. Use the SAME small chubby white sheep character as the attached
reference image: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep near-black charcoal (around #131313), NOT navy. The mood is "the
workshop lamp is still on well past midnight". The only bright accents are one AMBER
desk lamp and the GOLDEN ink, which glows like liquid starlight. Everything else
muted and low-contrast so light text stays readable across the top.

Composition is critical: ALL of the artwork sits in the BOTTOM 40% of the frame, and
the MAIN SCENE must be inside the CENTER HALF of the width. The TOP 60% must be
almost completely empty — near-black gradient with a few floating gold sparks and
paper scraps, because a headline and a button go there. No character's head may rise
above the midline.

Main scene (center, bottom band): the same tiny stamp workshop at night. The sheep
stands upright on the workbench, holding the oversized wooden stamp overhead and
bringing it down onto a photo print — the exact moment of impact, with a soft round
shockwave ring and flying droplets, except the ink is GOLDEN and every droplet glows,
scattering small warm sparks into the dark air. The sheep's face is heroically
serious, lit warmly from below by the glow. The struck print shows NO letters and NO
numbers — only a glowing golden heart and a wobbly cross doodle.

Beside the bench, the tiny lamb has walked across the open ink pad and is strolling
away leaving a trail of small glowing golden hoofprints across the dark boards,
completely unbothered. Three or four finished prints drift upward, each faintly
luminous.

Bonus props spread into the far LEFT and far RIGHT quarters, along the same bottom
band, low, simple and mostly in shadow: a rack of wooden stamps, a roll of tape, a
stack of blank prints, a small brass desk lamp with a warm amber cone of light, a
tipped ink pot with a slow golden puddle.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette. Only the lamp, the golden ink and the hoofprints are bright; everything
else stays deep near-black.
```

---

## D안 — 붓글씨 대참사 (엎지른 잉크가 하늘이 된다)

**장면.** 양이 제 몸보다 큰 붓을 온몸으로 껴안고 사진 위에 획 하나를 긋는다.
그 옆에서 새끼양이 잉크병을 옮기다 넘어뜨렸고, 쏟아진 잉크가 바닥을 타고 흐르는데 —
**아래로 갈수록 그 잉크가 밤하늘로 변해 별이 흩어진다.** 양은 전혀 모르고 계속 획을 긋는다.

**웃음.** 세계관 최대의 참사가 등 뒤에서 벌어지는데 주인공은 붓끝만 본다.
**감성.** 엎지른 실수가 하늘이 되는 반전 — 다섯 안 중 가장 예쁘고, 가장 오래 본다.

### 라이트

```
A wide 2:1 background illustration for the intro screen of a "make a verse photo
card" feature in a mobile church app, LIGHT MODE, very pale and high-key (dark ink
text and a blue button will be laid on top, so the image must stay bright and
low-contrast). Style: cozy-epic children's storybook illustration — soft flat shapes
with subtle grain, rounded friendly forms, quiet morning window light. Use the SAME
small chubby white sheep character as the attached reference image: stubby legs, tiny
round black hooves, serene slightly smug smile.

Palette: warm cream paper, pale honey wood, and a spilled ink that is not black but a
soft dreamy blue — pale sky blue deepening to about #3182f6 only at its densest edge.
Bright, hazy, airy.

Composition is critical: ALL of the artwork sits in the BOTTOM 40% of the frame, and
the MAIN SCENE must be inside the CENTER HALF of the width. The TOP 60% must be
almost completely empty — a smooth pale gradient with a few tiny drifting sparkles,
because a headline and a button go there. No character's head may rise above the
midline of the image.

Main scene (center, bottom band): one sheep stands upright hugging a calligraphy
brush far bigger than itself with both front hooves and its whole body, dragging one
single confident stroke across a photo print laid flat on a low wooden desk. Its face
is pure concentration — tongue barely out, eyes locked on the brush tip. The stroke
it has made is a soft blue sweep with NO letters and NO numbers in it, just a graceful
curve and a tiny doodle heart at its end.

Directly behind it, unnoticed: a tiny lamb was carrying an ink bottle, has tripped,
and the bottle is tumbling in mid-air with a long ribbon of ink pouring out. The lamb
is frozen with both hooves over its mouth. Here is the magic: as the spilled ink runs
down and to the sides across the desk and floor, it stops being a spill and becomes
SKY — soft pale blue clouds, drifting wisps and a scattering of tiny white stars
spreading out along the bottom of the frame. The transition from puddle to sky must
be gradual and seamless. The sheep with the brush has absolutely no idea any of this
is happening.

Bonus props spread into the far LEFT and far RIGHT quarters, along the same bottom
band, low and simple: a jar of brushes, a folded cloth, a short stack of photo
prints, a small potted plant, one print gliding in from the edge.

No text, no letters, no numbers, no logos anywhere — the brush stroke is a shape, not
writing. No frames, no borders, no vignette. The top edge must fade into a plain
almost-white cool grey gradient.
```

### 다크

```
A wide 2:1 background illustration for the intro screen of a "make a verse photo
card" feature in a mobile church app, DARK MODE. Style: cozy-epic children's
storybook illustration — soft flat shapes with subtle grain, rounded friendly forms,
warm rim lighting. Use the SAME small chubby white sheep character as the attached
reference image: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep near-black charcoal (around #131313), NOT navy. One small AMBER candle
is the only warm light; everything else is the cool silver-blue glow of a spilled
galaxy. Muted and low-contrast so light text stays readable across the top.

Composition is critical: ALL of the artwork sits in the BOTTOM 40% of the frame, and
the MAIN SCENE must be inside the CENTER HALF of the width. The TOP 60% must be
almost completely empty — a smooth near-black gradient with a few very small distant
stars, because a headline and a button go there. No character's head may rise above
the midline.

Main scene (center, bottom band): the same sheep stands upright at night, hugging the
oversized calligraphy brush with its whole body and dragging one confident stroke
across a photo print on the low desk, lit warmly from the side by a single short
candle. Total concentration. The stroke is a soft glowing sweep with NO letters and
NO numbers — a graceful curve ending in a tiny glowing heart.

Behind it, unnoticed: the tiny lamb has tripped and the ink bottle tumbles in mid-air,
pouring a long ribbon. As the spill runs down and outward it becomes a real MILKY WAY
— a soft luminous river of silver-blue dust, deep indigo cloud, and dozens of small
bright stars spreading across the bottom of the frame, with two or three tiny falling
stars trailing off toward the edges. The transition from ink to galaxy must be
gradual and seamless. The lamb stands frozen with both hooves over its mouth, its
face lit by the galaxy it just made. The sheep with the brush still has no idea.

Bonus props spread into the far LEFT and far RIGHT quarters, along the same bottom
band, low, simple and mostly in shadow: a jar of brushes, a folded cloth, a stack of
photo prints, the candle in a small brass holder, one faintly glowing print gliding
in from the edge.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette. Only the candle and the spilled galaxy are bright; everything else stays
deep near-black.
```

---

## E안 — 카메라가 집이다

**장면.** 거대한 빈티지 카메라가 통째로 오두막이다. 둥근 렌즈가 창문이고, 그 창에서 양이
몸을 반쯤 내밀고 손을 흔든다. 셔터 버튼은 굴뚝, 필름 감는 손잡이는 우물 두레박,
목에 걸던 스트랩이 흘러내려 현관 계단이 됐다. 새끼양 둘이 처마 밑에 사진을 걸고 있다.

**웃음.** 카메라가 집이라는 사실을 **아무도 이상하게 여기지 않는다.** 굴뚝(셔터 버튼)에서는
연기 대신 폭신한 플래시 구름이 퐁 하고 올라온다.
**감성.** 렌즈 창에서 부챗살 빛이 앞마당으로 쏟아진다 — 이 화면이 말하는 "담는다"의 그림 버전.

### 라이트

```
A wide 2:1 background illustration for the intro screen of a "make a verse photo
card" feature in a mobile church app, LIGHT MODE, very pale and high-key (dark ink
text and a blue button will be laid on top, so the image must stay bright and
low-contrast). Style: cozy-epic children's storybook illustration — soft flat shapes
with subtle grain, rounded friendly forms, gentle afternoon haze. Use the SAME small
chubby white sheep character as the attached reference image: stubby legs, tiny round
black hooves, serene slightly smug smile.

Palette: pale sky blue, warm cream, soft honey-brown leather and pale brushed silver
for the camera-house, with small mint and apricot accents and one soft blue near
#3182f6. Bright and airy.

Composition is critical: ALL of the artwork sits in the BOTTOM 40% of the frame, and
the MAIN SCENE must be inside the CENTER HALF of the width. The TOP 60% must be
almost completely empty — a smooth pale blue-to-cream gradient with two faint clouds
and a few floating sparkles, because a headline and a button go there. The
camera-house must be SHORT and wide, and its roofline must NOT rise above the midline
of the image.

Main scene (center, bottom band): a giant vintage boxy camera that is also a cozy
little cottage, sitting low and snug on a grassy rise. Its round lens is a window with
a warm interior behind it, and one sheep leans out of that lens-window on its front
hooves, waving happily at the viewer. The shutter button on top is a small chimney,
puffing not smoke but three round fluffy white FLASH clouds. The film-winding knob on
the side has become a well crank with a tiny bucket. The camera's leather neck strap
spills down the front and turns into the steps up to a small round door. A soft
fan-shaped beam of warm light pours out of the lens-window across the front yard,
carrying a few floating photo prints and sparkles in it. Nobody in the picture finds
any of this unusual.

Two tiny lambs are hanging small photo prints along a line under the eaves, one on a
stool that is slightly too short.

Bonus props spread into the far LEFT and far RIGHT quarters, along the same bottom
band, low and simple: a small mailbox, a potted plant beside the door, a wooden
tripod leaning like a garden tool, a few flowers, one photo print gliding in from the
edge.

No text, no letters, no numbers, no logos anywhere — no camera brand marks, no dials
with numbers, and nothing readable in the prints. No frames, no borders, no vignette.
The top edge must fade into a plain almost-white cool grey gradient.
```

### 다크

```
A wide 2:1 background illustration for the intro screen of a "make a verse photo
card" feature in a mobile church app, DARK MODE. Style: cozy-epic children's
storybook illustration — soft flat shapes with subtle grain, rounded friendly forms,
warm rim lighting. Use the SAME small chubby white sheep character as the attached
reference image: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep near-black charcoal (around #131313), NOT navy. The mood is "the light
in the window is still on". The only bright thing is the warm AMBER glow pouring out
of the lens-window; the camera-house body stays a dark silhouette with soft rim light.
Muted and low-contrast so light text stays readable across the top.

Composition is critical: ALL of the artwork sits in the BOTTOM 40% of the frame, and
the MAIN SCENE must be inside the CENTER HALF of the width. The TOP 60% must be
almost completely empty — a smooth near-black gradient with small distant stars,
because a headline and a button go there. The camera-house roofline must NOT rise
above the midline of the image.

Main scene (center, bottom band): the same giant vintage camera cottage at night, low
and snug on the grassy rise, mostly in warm shadow. Its round lens is a glowing amber
window, and one sheep leans out of it waving, its wool catching the warm light. The
shutter-button chimney puffs three round fluffy flash clouds, faintly lit from below.
The film-winder well crank, the neck-strap steps and the little round door are all
there, barely picked out in rim light. A wide fan-shaped beam of warm amber light
pours from the lens-window across the dark front yard, and inside that beam a few
photo prints drift, glowing softly like paper lanterns.

Two tiny lambs hang small glowing prints along a line under the eaves by lantern
light, one on a stool that is slightly too short.

Bonus props spread into the far LEFT and far RIGHT quarters, along the same bottom
band, low, simple and mostly in shadow: a small mailbox, a potted plant, a leaning
wooden tripod, a hanging lantern with a warm pool of light, one glowing print gliding
in from the edge.

No text, no letters, no numbers, no logos anywhere — no brand marks, no numbered
dials, nothing readable in the prints. No frames, no borders, no vignette. Only the
lens-window, the light beam and the lantern are bright; everything else stays deep
near-black.
```

---

## 적용 방법 (실제 적용된 CSS)

배경을 `.pv-intro` 자체에 깔면 PC에서 문장 기둥(560px) 안에 갇히고, 위쪽 페이드 정지점이
카드 높이에 따라 흔들린다. 그래서 **바닥에 붙는 삽화 띠를 `::after` 로 따로 세우고**,
그 띠에만 마스크로 페이드를 준다 (`PhotoVerse.css` 앞부분 + `lg` 블록).

```css
.pv-intro {
  position: relative;
  padding: 32px 28px 200px;              /* 아래 200px이 삽화 띠 자리 */
}

.pv-intro::after {
  content: '';
  position: absolute;
  inset: auto 0 0 0;
  height: 300px;
  background-image: url('/images/photo-verse/intro-light.webp');
  background-repeat: no-repeat;
  background-position: center bottom;
  background-size: 200% auto;            /* 모바일: 가운데 절반 = 핵심 장면만 */
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 38%);
  mask-image: linear-gradient(to bottom, transparent 0, #000 38%);
  pointer-events: none;
}

[data-theme='dark'] .pv-intro::after {
  background-image: url('/images/photo-verse/intro-dark.webp');
}

.pv-intro > * { position: relative; z-index: 1; }   /* 글자를 띠 위로 */

@media (min-width: 1024px) {
  .pv-intro { max-width: none; padding-bottom: 300px; }
  .pv-intro__bg { max-width: 560px; }               /* 문장 기둥만 560px로 */
  .pv-intro::after { height: 500px; background-size: 100% auto; }
}
```

- **PC에서 `.pv-intro { max-width: 560px }` 를 그대로 두면 삽화도 560px 안에 갇힌다.**
  그래서 `max-width` 는 `.pv-intro` 에서 걷어내고 `.pv-intro__bg`(폭 100%짜리 유일한 블록)로 옮겼다.
  `__headline`·`__body` 는 원래 자기 폭이 좁아 그대로 둔다.
- `cover` 가 아니라 **`100% auto`** 다. `cover` 는 카드가 세로로 길어지면 좌우를 잘라
  PC에서만 보이는 보너스 소품(카메라·화분)을 날려 버린다.
- 카드 바탕이 라이트 `#f1f3f6` / 다크 `#131313` 인데 원본 위 가장자리가 각각
  `#e9eef2` / `#121212` 라 거의 같다 — 마스크 페이드만으로 경계가 사라진다.
- 스와치 줄(`.pv-bg-row`)과 자물쇠 안내가 그림과 겹치면 `padding-bottom` 을 키운다
  (PC 270 → 300 으로 한 번 올렸다).
- 라이트 결과물이 프롬프트보다 어둡게 나오면(기도방·교육 히어로 때처럼) 잉크를 흰색으로
  뒤집지 말고 **이미지를 더 밝게 다시 뽑는다** — 이 화면의 제목·본문은 전부 어두운 잉크다.

## 다시 뽑을 때 체크리스트

- [ ] 사진·프린트·칠판 안에 **글자가 없는가** (이 화면에서 가장 자주 깨지는 규칙)
- [ ] 캐릭터 머리 끝이 **중앙선 아래**에 있는가
- [ ] 위 55%가 거의 비어 있고, 위 가장자리가 카드색으로 사라지는가
- [ ] 좌우 바깥 1/4을 잘라내도 (= 모바일에서) 그림이 성립하는가
- [ ] 다크가 **남색이 아니라 거의 검정(#131313)** 인가
- [ ] 라이트/다크가 **같은 장면·같은 구도**인가 (밝기와 광원만 다르다 — 타임캡슐 히어로만 예외)

## 적용 상태 (2026-09-08)

- **A안(폴라로이드를 흔드는 양) 채택 · 적용 완료.**
  `public/images/photo-verse/intro-light.webp`(33KB) · `intro-dark.webp`(35KB),
  원본 1584×672(2.36:1 — 프롬프트의 2:1보다 조금 넓게 나왔지만 그대로 씀).
- 라이트는 낮 마당, 다크는 빨랫줄 사진이 등불처럼 빛나는 밤 마당. 구도·소품 동일.

### ★ 제미나이 워터마크(✦)를 지운 방법 — 인페인트가 아니라 **거울쌍 이식**

워터마크는 **오른쪽 카메라+스툴 위**(원본 x1441~1487, y530~576, 약 47×46)에 얹혀 있었다.
소품 구조(스툴 다리·카메라 슬롯 모서리) 한복판이라 그냥 지우면 뭉개진다. 세 가지를 시도했다.

| 방법 | 결과 |
|---|---|
| TELEA/NS 인페인트 | 별은 사라지지만 카메라 슬롯·다리가 **뿌옇게 번진다** (교육 히어로 때와 같은 증상) |
| 알파 역산(흰색 α≈0.3으로 언블렌드) | 구조는 살아나지만 **잔상 실루엣이 남는다** — 워터마크가 단순 알파 합성이 아니다 (다크 배경에선 α 0.3, 라이트 배경에선 0.5처럼 보인다) |
| **거울쌍 이식** ✅ | 완전히 깨끗 |

채택한 방법: 이 그림은 **왼쪽에도 똑같은 카메라+스툴 소품**이 있다. 그래서
좌우 반전본을 `matchTemplate`(워터마크를 마스크로 제외한 `TM_SQDIFF`)로 오른쪽 소품에 정렬하고
(라이트 scale 1.01 · 다크 0.96), 워터마크 자리 패치만 가우시안 페더 마스크로 갈아 끼웠다.
같은 물건의 반대편이라 선·명암이 자연스럽게 이어지고 번짐이 전혀 없다.

> 다시 뽑을 때도 같은 손이 쓴다: **워터마크가 대칭 소품 위에 떨어졌으면 거울쌍 이식이 1순위**,
> 평평한 배경 위면 배경 되메우기, 정말 어쩔 수 없을 때만 인페인트.
