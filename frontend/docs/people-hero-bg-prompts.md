# 섬기는 사람들 히어로 배경 이미지 프롬프트 (Gemini용)

`/people` 상단 **히어로**(`People/people.css` `.ppl-hero`) 뒤에 깔 배경.
라이트/다크 각 1장 × **컨셉 5안**. 기존 배경들과 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**를
쓰되, 이 화면은 "함께 섬기는 얼굴들"이라 대놓고 **익살스럽고 유쾌하게** 간다.
5안 중 마음에 드는 하나만 골라 라이트/다크 두 장을 뽑으면 된다.

## 사용법

1. Gemini에 `public/images/title-bg/` 중 아무 이미지나 한 장 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로" 라고 덧붙인 뒤, 아래 프롬프트 하나를 통째로 붙여넣는다.
2. 저장 위치 (파일명 고정 — `public/` 아님, 서비스워커 캐시 때문에 해시 URL이 붙는 `src/assets/`):
   - 라이트: `frontend/src/assets/people/hero-light.webp`
   - 다크:   `frontend/src/assets/people/hero-dark.webp`
3. 규격: **2:1 ~ 2.4:1 가로 (1536×768 / 1584×672)**, `cwebp -q 78 원본.png -o hero-light.webp`, 한 장 60KB 이하.
   크게 뽑았으면 `magick in.png -resize 1536x768^ -gravity south -extent 1536x768 out.png`
   로 **아래쪽 기준** 크롭.
   Gemini 워터마크(우하단 ✦)는 배경 되메우기 또는 OpenCV TELEA inpaint로 제거
   (워터마크 자리에 캐릭터가 붙어 있으면 inpaint가 흰 뭉개짐을 남긴다 — 교육 히어로 사례 참고).

## 레이아웃 제약 (프롬프트의 핵심)

히어로가 **모바일 라운드 카드 / PC 페이지 카드 윗면 띠**라 비율이 크게 다르다.
실측: 모바일 약 448×390(**≈1.15:1**), PC 약 1200×340(**≈3.5:1**). `cover; center bottom` 기준:

| | 보이는 영역 |
|---|---|
| 모바일 | 세로 **전체**, 가로는 **가운데 57%** |
| PC | 가로 **전체**, 세로는 **아래 57%** |

→ 교집합은 **"아래쪽 띠 × 가운데"**. 그래서 다섯 안이 공통으로 지키는 규칙:

- **핵심 장면은 화면 아래 45% 띠의 가운데 절반 안에.**
- 좌우 바깥 1/4은 **PC에서만 보이는 보너스 소품** 자리.
- **위쪽 55%는 거의 비워 둔다** — 엠블럼·배지·제목·부제가 그 위에 올라간다.
- **바닥 한가운데**는 통계 칩(`17 교역자` 등)과 `인물 관리` 버튼이 덮는다 →
  바닥 정중앙은 단순하게, **캐릭터는 머리·소품만 칩 위로 빼꼼** 나오는 높이로.
- 히어로 글씨는 **어두운 잉크**(`--text-strong`) → **라이트는 아주 창백한 high-key**여야 한다.
- 다크 카드 바탕은 남색이 아니라 **차콜 `#201f1f`** → 남색 밤하늘 금지, **따뜻한 차콜 + 앰버 불빛**.
- 브랜드 색은 토스 블루 `#3182f6` — 라이트에선 그 톤을 아주 옅게만, 진하게 쓰지 말 것.
- 글자·숫자·로고 금지(현수막·명찰에도 **글씨 대신 낙서**). 테두리·비네트 금지 — 모서리는 CSS가 처리.

---

# 1안 · 단체사진 대참사 🫣

교회 단체사진 찍는 순간인데 아무도 카메라를 안 보고 있다.
제목 "함께 섬기는 얼굴들"을 가장 직역한 안이라 글과 제일 잘 붙는다.

## 라이트 테마 프롬프트

```
A wide 2:1 background illustration for the header of an "our people / those who
serve" page in a mobile church app, LIGHT MODE, very pale and high-key (dark navy
text will be laid on top, so the whole image must stay bright and low-contrast).
Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, gentle airy morning light. Use the SAME small
chubby white sheep character as the attached reference image: stubby legs, tiny
round black hooves, serene slightly smug smile.

Palette: pale high-key sky blue and warm cream (the deepest tone around #3182f6,
used only in tiny accents), soft honey wood, a few pastel mint and apricot props.
Everything washed in bright morning haze.

Composition is critical: ALL of the artwork sits in the BOTTOM 45% of the frame, and
the MAIN SCENE must be inside the CENTER HALF of the width. The TOP 55% must be
almost completely empty — a smooth pale blue-to-cream gradient with two faint clouds
and a few tiny floating sparkle dots — because a title and subtitle go there.

Main scene (center, bottom band): a church GROUP PHOTO going comically wrong. Seven
or eight tiny sheep are lined up in two rows in front of a little wooden tripod
camera with a blinking self-timer light. NOT ONE of them is doing it right: one is
sprinting into frame from the side, wool flying, clearly late; one has its eyes shut
mid-sneeze; one tiny lamb in the front row is caught mid-jump with all four hooves
off the ground; one is looking backwards at a butterfly; two in the back row are
squished cheek to cheek trying to fit in; the last one holds a comically long selfie
stick pointed the wrong way. They wear tiny serving props — an apron, a small
shepherd cap, a scarf. Keep them all SMALL: their heads must not rise above the
midline of the image, and the very BOTTOM CENTER must stay simple and uncluttered
(chips and a button will sit there) — only heads and props peek up.

Bonus props spread into the far LEFT and far RIGHT quarters along the same bottom
band, low and simple: a potted plant, a tipped-over stool, a stack of folded chairs,
a paper flag garland with blank pastel triangles, one balloon drifting in.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette. The top edge must fade into a plain almost-white pale blue gradient.
```

## 다크 테마 프롬프트

```
A wide 2:1 background illustration for the header of an "our people / those who
serve" page in a mobile church app, DARK MODE. Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain texture, rounded friendly forms,
warm rim lighting. Use the SAME small chubby white sheep character as the attached
reference image: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep warm CHARCOAL (around #201f1f) with a faint cool blue tint in the
upper area — NOT navy blue, NOT black. Mood: "the evening service is over and
everyone stayed for a photo". The only bright accents are AMBER string lights and
the warm pop of the camera flash. Keep everything muted and low-contrast so light
text stays readable across the top.

Composition is critical: ALL of the artwork sits in the BOTTOM 45% of the frame, and
the MAIN SCENE must be inside the CENTER HALF of the width. The TOP 55% must be
almost completely empty — a smooth dark charcoal gradient with a few faint dust
motes catching the light — because a title and subtitle go there.

Main scene (center, bottom band): the same church GROUP PHOTO going comically wrong,
at night under a sagging string of warm amber bulbs. Seven or eight tiny sheep in
two rows before a little wooden tripod camera whose flash has just gone off, throwing
a soft warm glow onto their faces and rim-lighting their wool against the dark room.
Same gags: one sprinting in late, one caught mid-sneeze with eyes shut, one lamb
frozen mid-jump in the front row, one looking backwards, two squished cheek to cheek,
one holding an over-long selfie stick pointed the wrong way. Tiny serving props — an
apron, a shepherd cap, a scarf. Keep them SMALL, heads below the midline, and the
very BOTTOM CENTER simple and uncluttered — only heads and props peek up.

Bonus props in the far LEFT and far RIGHT quarters, low and mostly in shadow: a
potted plant, a tipped-over stool, folded chairs, a blank paper flag garland catching
one amber glint, a balloon drifting in.

No text, no letters, no numbers, no logos anywhere. No frames, no borders, no
vignette. The only bright areas are the flash and the string lights — everything else
stays deep charcoal.
```

---

# 2안 · 주방 봉사 릴레이 🍲

식당 봉사팀의 아수라장. "섬김"을 가장 실감나게 그리는 안.

## 라이트 테마 프롬프트

```
A wide 2:1 background illustration for the header of an "our people / those who
serve" page in a mobile church app, LIGHT MODE, very pale and high-key (dark navy
text will be laid on top, so keep the whole image bright and low-contrast). Style:
cozy-epic children's storybook illustration — soft flat shapes with subtle grain,
rounded friendly forms, gentle airy morning light. Use the SAME small chubby white
sheep character as the attached reference image: stubby legs, tiny round black
hooves, serene slightly smug smile.

Palette: pale high-key sky blue and warm cream (deepest tone around #3182f6, tiny
accents only), soft honey wood, pastel mint and apricot kitchenware, faint steam.

Composition is critical: ALL artwork sits in the BOTTOM 45% of the frame and the MAIN
SCENE inside the CENTER HALF of the width. The TOP 55% is almost empty — a smooth
pale gradient with a few soft curls of steam rising and fading out — because a title
and subtitle go there.

Main scene (center, bottom band): a church kitchen SERVING RELAY in full chaos. Five
tiny sheep in oversized aprons pass things down a line: the first stirs a pot far too
big for it, standing on a little stool, steam puffing into its face; the second
balances a wobbling tower of pastel bowls that leans dangerously; the third carries a
tray of round rice balls with its tongue poking out in concentration; the fourth
holds a kettle pouring a perfect little arc of tea, extremely proud of itself; a tiny
lamb at the end wears a chef hat that has slid down over its eyes and is sweeping the
floor in completely the wrong direction. One small splash of soup arcs mid-air with a
comic sparkle. Keep them all SMALL — heads below the midline — and keep the very
BOTTOM CENTER simple and uncluttered (chips and a button sit there); only heads,
steam and props peek up.

Bonus props in the far LEFT and far RIGHT quarters, low and simple: a stack of trays,
a bag of rice, a potted herb, a mop leaning on nothing in particular, one runaway
apple rolling in from the edge.

No text, no letters, no numbers, no logos. No frames, no borders, no vignette. The
top edge fades into a plain almost-white pale blue gradient.
```

## 다크 테마 프롬프트

```
A wide 2:1 background illustration for the header of an "our people / those who
serve" page in a mobile church app, DARK MODE. Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain, rounded friendly forms, warm rim
lighting. Use the SAME small chubby white sheep character as the attached reference
image: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep warm CHARCOAL (around #201f1f) with a faint cool blue tint up top —
NOT navy, NOT black. Mood: "late supper prep, the kitchen light is still on". The
only bright accents are the AMBER hanging kitchen lamp and the glow of the stove.
Muted and low-contrast so light text stays readable across the top.

Composition is critical: ALL artwork in the BOTTOM 45% of the frame, MAIN SCENE
inside the CENTER HALF of the width. TOP 55% almost empty — dark charcoal gradient
with a few soft curls of steam catching the lamplight and fading out.

Main scene (center, bottom band): the same church kitchen SERVING RELAY at night
under one warm amber hanging lamp that pools light over the counter. Five tiny sheep
in oversized aprons: one on a stool stirring an enormous pot with steam in its face,
one balancing a leaning tower of bowls, one carrying a tray of rice balls with its
tongue out, one pouring a glowing arc of tea and looking very pleased, and a tiny
lamb whose chef hat has slid over its eyes sweeping the wrong way. A small splash of
soup arcs mid-air with a warm glint. Their wool catches the amber rim light against
the dark kitchen. Keep them SMALL, heads below the midline, BOTTOM CENTER simple.

Bonus props in the far LEFT and RIGHT quarters, low and mostly in shadow: a stack of
trays, a rice sack, a potted herb, a leaning mop, one apple rolling in with a faint
amber glint.

No text, no letters, no numbers, no logos. No frames, no borders, no vignette. Only
the lamp and the stove are bright — everything else stays deep charcoal.
```

---

# 3안 · 사역 소품 퍼레이드 🎺

각자 사역 도구를 들고 옆으로 행진. 교역자·선교사·장로·교회직원이 탭으로 나뉘는
이 화면 구조와 제일 잘 맞는 안.

## 라이트 테마 프롬프트

```
A wide 2:1 background illustration for the header of an "our people / those who
serve" page in a mobile church app, LIGHT MODE, very pale and high-key (dark navy
text sits on top — keep it bright and low-contrast). Style: cozy-epic children's
storybook illustration — soft flat shapes with subtle grain, rounded friendly forms,
gentle airy morning light. Use the SAME small chubby white sheep character as the
attached reference image: stubby legs, tiny round black hooves, serene slightly smug
smile.

Palette: pale high-key sky blue and warm cream (deepest tone around #3182f6, tiny
accents only), soft honey wood, pastel mint and apricot props.

Composition is critical: ALL artwork sits in the BOTTOM 45% of the frame, MAIN SCENE
inside the CENTER HALF of the width. The TOP 55% must be almost empty — a smooth pale
gradient with two faint clouds, a few sparkle dots and one small paper flag garland
strung high with BLANK pastel triangles — because a title and subtitle go there.

Main scene (center, bottom band): a cheerful little PARADE of sheep walking sideways
across the frame, each carrying the tool of what they serve, all slightly too big for
them: one with a small acoustic guitar, one with a thick book held open like a hymnal
(pages blank, no letters), one in a chef hat with a ladle shouldered like a rifle,
one with a tool belt and a hammer, one with a chunky old camera, one dribbling a
soccer ball, and at the very back a tiny lamb DRAGGING a broom twice its length,
struggling but determined, tongue out. They walk in a loose line with mismatched
steps, some marching proudly, one out of sync and facing the wrong way. Keep them
SMALL — heads below the midline — and keep the very BOTTOM CENTER simple and
uncluttered (chips and a button sit there); only heads and props peek up.

Bonus props in the far LEFT and far RIGHT quarters, low and simple: a potted plant, a
small drum, a watering can, a rolled-up mat, one balloon on a string.

No text, no letters, no numbers, no logos. No frames, no borders, no vignette. The top
edge fades into a plain almost-white pale blue gradient.
```

## 다크 테마 프롬프트

```
A wide 2:1 background illustration for the header of an "our people / those who
serve" page in a mobile church app, DARK MODE. Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain, rounded friendly forms, warm rim
lighting. Use the SAME small chubby white sheep character as the attached reference
image: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep warm CHARCOAL (around #201f1f) with a faint cool blue tint up top —
NOT navy, NOT black. Mood: "an evening lantern parade after the service". The only
bright accents are small AMBER paper lanterns the sheep carry and a high string of
warm bulbs. Muted, low-contrast, so light text stays readable across the top.

Composition is critical: ALL artwork in the BOTTOM 45% of the frame, MAIN SCENE inside
the CENTER HALF of the width. TOP 55% almost empty — dark charcoal gradient with a
few faint floating light motes and that high string of small warm bulbs.

Main scene (center, bottom band): the same cheerful sideways PARADE at night, each
sheep carrying its serving tool plus a tiny glowing amber lantern: one with a small
guitar, one with a thick open book (blank pages, no letters), one in a chef hat with
a ladle shouldered like a rifle, one with a tool belt and hammer, one with a chunky
camera, one dribbling a soccer ball, and at the back a tiny lamb DRAGGING a broom
twice its length, determined, tongue out. Loose line, mismatched steps, one out of
sync facing the wrong way. Their wool glows warmly on the lantern side and falls into
soft shadow on the other. Keep them SMALL, heads below the midline, BOTTOM CENTER
simple.

Bonus props in the far LEFT and RIGHT quarters, low and mostly in shadow: a potted
plant, a small drum, a watering can, a rolled mat, one balloon catching an amber glint.

No text, no letters, no numbers, no logos. No frames, no borders, no vignette. Only
the lanterns are bright — everything else stays deep charcoal.
```

---

# 4안 · 함께 세워가는 목말탑 🪜

부제의 "함께 세워가는"을 문자 그대로 그린 말장난 안. 다섯 중 제일 웃기다.

## 라이트 테마 프롬프트

```
A wide 2:1 background illustration for the header of an "our people / those who
serve" page in a mobile church app, LIGHT MODE, very pale and high-key (dark navy
text sits on top — keep it bright and low-contrast). Style: cozy-epic children's
storybook illustration — soft flat shapes with subtle grain, rounded friendly forms,
gentle airy morning light. Use the SAME small chubby white sheep character as the
attached reference image: stubby legs, tiny round black hooves, serene slightly smug
smile.

Palette: pale high-key sky blue and warm cream (deepest tone around #3182f6, tiny
accents only), soft honey wood, pastel mint and apricot props.

Composition is critical: ALL artwork sits in the BOTTOM 45% of the frame and the MAIN
SCENE inside the CENTER HALF of the width. The TOP 55% must be almost empty — a
smooth pale gradient with two faint clouds and a few sparkle dots — because a title
and subtitle go there.

Main scene (center, bottom band): a comical three-sheep TOTEM POLE, literally
"building together". At the base one broad sheep stands with a completely calm,
resigned expression, as if this happens every week. On its shoulders a second sheep
wobbles with hooves out for balance and cheeks puffed. On top a tiny lamb stretches
up on tiptoe to hang a small BLANK paper banner on a hook — thrilled, tongue out, one
hoof waving. The whole tower leans slightly. Beside them a fourth sheep steadies a
short wooden ladder that nobody is using, and a fifth sits on the floor with a
toolbox, calmly eating a sandwich and watching. Everything stays SMALL and LOW — the
tips of the lamb's ears must not rise above the midline of the image — and the very
BOTTOM CENTER stays simple and uncluttered (chips and a button sit there).

Bonus props in the far LEFT and far RIGHT quarters, low and simple: a paint bucket
with a brush, a potted plant, a coil of rope, a stack of folded chairs, one screw
rolling in from the edge.

No text, no letters, no numbers, no logos — the banner stays BLANK or carries only a
childish doodle (a heart, a wobbly little cross). No frames, no borders, no vignette.
The top edge fades into a plain almost-white pale blue gradient.
```

## 다크 테마 프롬프트

```
A wide 2:1 background illustration for the header of an "our people / those who
serve" page in a mobile church app, DARK MODE. Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain, rounded friendly forms, warm rim
lighting. Use the SAME small chubby white sheep character as the attached reference
image: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep warm CHARCOAL (around #201f1f) with a faint cool blue tint up top —
NOT navy, NOT black. Mood: "still decorating the hall long after dark". The only
bright accents are ONE warm AMBER bulb the lamb is screwing in, plus a small work
lamp on the floor. Muted and low-contrast so light text stays readable up top.

Composition is critical: ALL artwork in the BOTTOM 45% of the frame, MAIN SCENE
inside the CENTER HALF of the width. TOP 55% almost empty — dark charcoal gradient
with a few faint dust motes drifting in the bulb's glow.

Main scene (center, bottom band): the same comical three-sheep TOTEM POLE at night.
The broad base sheep stands with a calm resigned face; the middle sheep wobbles with
hooves out for balance; on top a tiny lamb on tiptoe screws a warm amber bulb into a
hanging socket, and the bulb has JUST lit — a soft golden pool of light spilling down
over all three and rim-lighting their wool against the dark hall. The tower leans
slightly. A fourth sheep steadies an unused ladder; a fifth sits with a toolbox,
calmly eating a sandwich, half in shadow. Everything SMALL and LOW — the lamb's ear
tips stay below the midline — and the very BOTTOM CENTER stays simple.

Bonus props in the far LEFT and RIGHT quarters, low and mostly in shadow: a paint
bucket, a potted plant, a coil of rope, folded chairs, one screw rolling in with a
faint amber glint.

No text, no letters, no numbers, no logos — any banner stays BLANK or shows only a
childish doodle. No frames, no borders, no vignette. Only the bulb and the work lamp
are bright — everything else stays deep charcoal.
```

---

# 5안 · 환영 하이파이브 터널 🙌

두 줄로 마주 선 양들이 앞발로 아치를 만들고 그 사이로 새끼양이 달려 지나간다.
얼굴들이 좌우로 길게 늘어서서 **PC 와이드 띠**에 특히 잘 맞는 안.

## 라이트 테마 프롬프트

```
A wide 2:1 background illustration for the header of an "our people / those who
serve" page in a mobile church app, LIGHT MODE, very pale and high-key (dark navy
text sits on top — keep it bright and low-contrast). Style: cozy-epic children's
storybook illustration — soft flat shapes with subtle grain, rounded friendly forms,
gentle airy morning light. Use the SAME small chubby white sheep character as the
attached reference image: stubby legs, tiny round black hooves, serene slightly smug
smile.

Palette: pale high-key sky blue and warm cream (deepest tone around #3182f6, tiny
accents only), soft honey wood, pastel mint and apricot confetti.

Composition is critical: ALL artwork sits in the BOTTOM 45% of the frame. The TOP 55%
must be almost empty — a smooth pale gradient with a few tiny pastel confetti flakes
drifting down and fading out well before the top edge — because a title and subtitle
go there.

Main scene (bottom band): a WELCOME TUNNEL. Two rows of sheep face each other along
the bottom, forming a low arch by touching front hooves overhead like a guard of
honour — but they are sheep, so the arch is lumpy and uneven and one pair cannot
quite reach. Running through the middle of the tunnel, at the exact CENTER of the
frame, a tiny lamb sprints with its ears flying back and the biggest grin, scattering
confetti. One sheep in the row is distracted and high-fiving nobody; one has bent so
low its face is squashed sideways; one showers the lamb with pastel petals from a
small basket. Each sheep wears a tiny serving prop — apron, scarf, little cap,
headset. Keep everything SMALL and LOW: the top of the arch must stay BELOW the
midline of the image, and the very BOTTOM CENTER stays simple and uncluttered (chips
and a button sit there) — only the running lamb and the arch peek up. The two rows
continue outward into the far LEFT and RIGHT quarters so it reads as a long tunnel on
wide screens.

Bonus props at the far LEFT and RIGHT edges, low and simple: a potted plant, a basket
of petals, a small drum, one balloon on a string.

No text, no letters, no numbers, no logos. No frames, no borders, no vignette. The top
edge fades into a plain almost-white pale blue gradient.
```

## 다크 테마 프롬프트

```
A wide 2:1 background illustration for the header of an "our people / those who
serve" page in a mobile church app, DARK MODE. Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain, rounded friendly forms, warm rim
lighting. Use the SAME small chubby white sheep character as the attached reference
image: stubby legs, tiny round black hooves, serene slightly smug smile.

Palette: deep warm CHARCOAL (around #201f1f) with a faint cool blue tint up top —
NOT navy, NOT black. Mood: "an evening send-off under string lights". The only bright
accents are a sagging string of small AMBER bulbs running the length of the tunnel.
Muted and low-contrast so light text stays readable across the top.

Composition is critical: ALL artwork in the BOTTOM 45% of the frame. TOP 55% almost
empty — dark charcoal gradient with a few faint confetti flakes and light motes
drifting and fading out well before the top edge.

Main scene (bottom band): the same WELCOME TUNNEL at night. Two rows of sheep face
each other, touching front hooves overhead in a lumpy uneven arch (one pair cannot
quite reach), warm amber bulbs strung just above them casting a golden rim light
along their wool and leaving the rest of the hall in soft shadow. At the exact CENTER
a tiny lamb sprints through, ears flying back, grinning, scattering confetti that
catches the light. One sheep high-fives nobody; one has bent so low its face is
squashed sideways; one showers petals from a small basket. Tiny serving props —
apron, scarf, cap, headset. Keep everything SMALL and LOW: the top of the arch stays
BELOW the midline, and the BOTTOM CENTER stays simple. The rows continue outward into
the far LEFT and RIGHT quarters so it reads as a long tunnel on wide screens.

Bonus props at the far LEFT and RIGHT edges, low and mostly in shadow: a potted plant,
a basket of petals, a small drum, one balloon catching an amber glint.

No text, no letters, no numbers, no logos. No frames, no borders, no vignette. Only
the string lights are bright — everything else stays deep charcoal.
```

---

## 어떤 안을 고를까

| 안 | 웃음 | 제목과의 궁합 | PC 와이드 띠 | 한 줄 |
|---|---|---|---|---|
| 1 단체사진 | ★★★ | ★★★ | ★★ | "얼굴들"을 그대로 그린 안전한 정답 |
| 2 주방 릴레이 | ★★★ | ★★ | ★★ | 섬김의 냄새가 나는 안 |
| 3 소품 퍼레이드 | ★★ | ★★★ | ★★★ | 분류 탭(교역자·선교사·장로·직원)과 붙는 안 |
| 4 목말탑 | ★★★★ | ★★★ | ★ | 부제 "함께 세워가는" 말장난, 제일 웃김 |
| 5 환영 터널 | ★★ | ★★ | ★★★★ | 가장 따뜻하고 가로로 제일 잘 늘어남 |

## 적용할 때 (이미지 나온 뒤)

- `.ppl-hero` 에 `background-image: url(...)`, `background-size: cover;`
  `background-position: center bottom;` (다크는 `[data-theme='dark'] .ppl-hero` 로 분기).
- 지금 히어로의 **`.ppl-hero::before` 브랜드 blur 원은 배경 위에서 뿌옇게 뜬다 → 삭제**.
- 제목·부제 자리를 확보하려면 히어로 **위쪽에 카드색 세로 페이드**를 한 겹 얹는다
  (`linear-gradient(to bottom, var(--surface) 0%, transparent 60%)`) — 교육 히어로와 같은 방식.
- 통계 칩·`인물 관리` 버튼이 바닥을 덮으므로 `padding-bottom` 을 늘려 캐릭터 띠 자리를 만들 것.
- 라이트 결과물이 프롬프트보다 어둡게 나오면 잉크를 흰색으로 뒤집지 말고
  **이미지를 더 밝게 다시 뽑는다** — 아래 인물 카드가 전부 어두운 잉크라
  히어로만 흰 글씨가 되면 어긋난다.
- `public/images/` 는 서비스워커 stale-while-revalidate 대상이라 다시 구워도 화면이 안 바뀔 수 있다.
  자주 갈아끼울 거면 `src/assets/people/` 로 옮겨 해시 URL을 받는 편이 낫다.

---

## 적용 상태 (2026-09-10) — **적용했다가 되돌림**

1안(단체사진 대참사)을 라이트/다크로 뽑아 히어로에 깔아 봤으나,
**"너무 어수선하다"는 검증으로 제거**했다. `.ppl-hero` 는 배경 없는 원래 형태
(브랜드 후광 `::before` + `padding-bottom: 1.5rem`)로 되돌아갔다.
→ **이 화면 히어로에 삽화 배경을 다시 깔지 말 것.** 다시 시도한다면 양 떼처럼
디테일이 많은 장면이 아니라, 훨씬 절제된(거의 무지에 가까운) 그림이어야 한다.

아래는 그때 남긴 기술 메모 — 다른 화면에서 같은 문제를 만나면 쓸 것.

### Gemini ✦ 워터마크 제거 (그때 두 장 모두 같은 자리)

실측 위치: 중심 **(1459, 551)**, 가로 1437~1481, 세로 527~574. 하필 **의자 위**라 까다로웠다.

- ❌ `cv2.inpaint` TELEA/NS — 흰 뭉갬이 남는다. 마스크를 별 모양으로 줄여도 마찬가지.
- ❌ 주변 링 SSD 최소 패치 이식 — 엉뚱한 곳(민트색 의자)을 물어와 구조가 무너진다.
- ❌ 라이트/다크 차이로 알파 추정 후 언믹스 — 배경 차이가 재질마다 달라 신호가 안 나온다.
- ✅ **방향성 복제**: 그 자리 원본이 평평한 면들뿐이라는 걸 이용.
  경계선(여기선 좌석판 윗선) 위쪽은 **바로 위 픽셀을 아래로 복제** → 배경 면과 세로 기둥이 그대로 내려온다.
  아래쪽은 **바로 오른쪽 픽셀을 왼쪽으로 복제** → 가로로 이어지는 구조가 살아난다.
  보간(gradient)이 아니라 복제라서 평면이 평면으로 남는다. 경계 1px 깃털링 + 원본 결의 그레인.

### 히어로에 배경을 깔 때의 레이아웃 메모

- 모바일은 `background-size: 175% auto; center bottom` 처럼 **폭 기준**으로 깔아야
  제목 줄 수와 무관하게 삽화 띠 높이가 일정하다. `cover` 로 두면 히어로가 길어질수록 그림이 커진다.
- 관리자에게만 보이는 '인물 관리' 버튼 때문에 히어로 높이가 한 줄 달라진다 →
  `:has()` 로 그 경우만 아래 여백을 늘려야 버튼이 그림과 겹치지 않는다.
- 카드색은 Tailwind `background-light #f1f3f6` / `background-dark #131313`.
  페이드를 쓸 거면 이 값을 직접 박아야 한다(테마 토큰 `--surface` 와 다른 값).
