# 교회 소개 — "어떤 만남을 원하시나요?" 장면 이미지 프롬프트 (Gemini용)

`/about` 만남 섹션에서 왼쪽 행(비린내·시들면·힘 닳으면·필요없으면·손수건)을 누를 때
오른쪽 카드에 깔리는 장면 이미지 5장. 칭호 배경(`title-bg-prompts.md`)·성경 이야기
(`story-image-prompts.md`)와 **같은 코지-에픽(cozy-epic) 양 캐릭터 세계관**을 잇는다.
컨셉: 네 가지 스쳐가는 만남은 **양이 당하는 짧은 콩트** — 피식 웃기고 살짝 짠하다.
마지막 손수건 만남만 **따뜻하게 받아준다** (웃음 → 뭉클 반전).

## 사용법

1. 아래 **공통 스타일 블록**을 먼저 붙여넣고, 원하는 장면 문단을 이어 붙여 한 번에 요청.
2. **캐릭터 일치**: `public/images/title-bg/` 이미지 한 장을 함께 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로"라고 하면 시리즈가 이어진다.
3. 한 대화 안에서 5장을 이어서 생성 (대화가 바뀌면 톤이 흩어짐).
   양은 **네발 자세면 물건은 입에 물거나 등에 얹기**, 들어야 하면 "upright on its two
   hind legs, both front hooves holding…"으로 명시 (팔 돋아나는 사고 방지). 부정형("no arms") 금지.
4. 비율 **4:3** (카드가 가로로 넓지 않은 편). 변환:
   `cwebp -q 78 -crop 0 0 1280 960 -resize 960 720 원본.png -o {key}.webp`
   (`-crop`은 우하단 제미나이 ✦ 워터마크를 잘라내는 단계 — 원본 해상도에 맞춰 폭·높이를 조정할 것)
5. 저장: `src/pages/About/img/{key}.webp` — **파일만 넣으면 자동 연결**된다
   (`About.tsx`의 `import.meta.glob`이 감지, 없는 장면은 그라데이션 카드 유지).
   key는 각 프롬프트 제목의 값 그대로.

## 일관성 규칙 (5장 공통)

- **주인공은 같은 양 한 마리** — 통통하고 하얀 아기 양. 앞의 네 장에서는 "당하는 쪽", 마지막 장에서는 "안기는 쪽".
- **팔레트** — 앞의 네 장은 살짝 가라앉은 남색-회청색 베이스(카드가 회남색으로 바뀜),
  마지막 장만 **브랜드 블루(#3182f6 계열)에 따뜻한 앰버 광원**. 다섯 장을 나란히 두면 마지막이 "켜지는" 느낌.
- **하단 1/3은 단순하고 어둡게** — 문구("비린내 나는 만남" 등)가 그 위에 흰 글씨로 올라간다.
- **글자 금지** — 숫자·문자·로고가 들어가면 UI와 충돌하고 한글은 반드시 깨진다.
- **비난 금지** — 나쁜 만남을 연기하는 상대 캐릭터도 악당처럼 그리지 말 것. 그저 무심하고 바쁘고 서투른 정도.
  (교회 소개 페이지다. 웃음은 나되 누굴 조롱하는 그림이 되면 안 된다.)

---

## 공통 스타일 블록 (매번 맨 앞에 붙여넣기)

```
A 4:3 illustration for a church introduction page in a mobile app, one of a 5-image
series sharing a single consistent style. Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain texture, rounded friendly forms,
gentle rim lighting, gently humorous like a wordless picture book. The recurring hero
is a small chubby white sheep with stubby legs and big expressive eyes — the SAME sheep
character every time. The sheep's short limbs are covered in white wool and end in
small rounded dark hooves. Other characters are simple friendly animals, never
villains — at worst distracted, busy or clumsy. Keep the main subject and the light
in the upper two thirds; the bottom third must stay dim, simple and almost empty
(white UI text will be overlaid there). No text, no letters, no numbers, no logos,
no frames or borders.

Scene:
```

---

## 장면별 프롬프트 (5종)

**fishy · 🐟 비린내 나는 만남**
> 콩트: 생선 가게 앞에서 처음 만난 고양이가 악수를 청하는데, 고양이 손에서 생선 냄새가 올라온다. 양은 예의상 웃으며 참는 중.
```
Muted navy and slate-blue palette with cool teal accents. Outside a tiny fish-market
stall at dusk, a slick-looking cat in a shiny jacket greets the sheep with an
over-friendly handshake, one paw still holding a dripping fish behind its back.
Faint wavy green stink-lines rise from the paw. The sheep is upright on its hind legs,
shaking hooves politely while leaning its whole body away, eyes watering, a tiny
forced smile. A seagull on the awning covers its beak with a wing. Light source: one
cool lantern above the stall. Bottom third: plain dark cobblestones, empty.
```

**wilted · 🥀 시들면 버리는 만남**
> 콩트: 꽃이 예쁠 땐 애지중지, 시드는 순간 화분째 골목에 내놓는다. 양은 그 화분 안에서 자라던 꽃이었다.
```
Muted navy and dusty violet palette. A narrow back alley at night. A fashionable
flamingo in oversized sunglasses walks away cheerfully carrying a fresh, brightly
blooming potted flower, already looking at the new one. Left behind on the curb,
next to a trash bin, sits a clay pot with one drooping wilted flower — and the sheep
is sitting inside that pot with the wilted flower as a hat, petals falling around it,
looking small and puzzled. A single faded "thank you" flower petal drifts down. Light
source: one lonely streetlamp above the curb. Bottom third: dark empty alley floor.
```

**worn_out · 🔋 힘 닳으면 버리는 만남**
> 콩트: 양이 짐꾼처럼 온갖 짐을 등에 지고 헉헉대는데, 힘이 다 빠지자 주인은 새 짐꾼(로봇)으로 갈아탄다.
```
Muted navy and steel-grey palette. On a dim mountain trail at night, the sheep stands
on all four legs, tongue out, tiny sweat drops flying, with a comically tall tower of
suitcases, boxes and a birdcage strapped to its back — its legs wobbling like jelly. A
little glowing battery icon shaped from a cloud above its head shows one red bar.
Just ahead, a busy badger in a hiking outfit is already climbing onto a brand-new
shiny delivery robot, waving goodbye without looking back. Light source: the robot's
cool headlight. Bottom third: plain dark rocky path, empty.
```

**deleted · 🗑️ 필요없으면 지우는 만남**
> 콩트: 거대한 스마트폰 화면 위, 친구 목록에서 양의 프로필이 휴지통으로 드래그되고 있다. 양은 자기 프로필 사진 안에서 "잠깐만!" 하는 중.
```
Muted navy palette with cold blue screen glow. A giant smartphone lies flat like a
stage, its screen showing a simple contacts list made of round animal portrait circles
(no text — just circles with animal faces). A huge grey paw of an unseen owner is
dragging one circle toward a trash-can icon at the corner of the screen. Inside that
circle is the sheep — but the sheep is actually leaning half out of the circle,
hooves grabbing the rim, eyes wide, mouth open in a silent "wait!". The other animal
portraits look the other way, embarrassed. Light source: the screen itself. Bottom
third: dark tabletop below the phone, empty.
```

**handkerchief · 🤍 땀과 눈물을 닦아주는 손수건 같은 만남**
> 반전: 앞의 네 장을 다 겪고 온 양. 땀과 눈물에 젖은 얼굴을, 커다란 따뜻한 손이 손수건으로 닦아준다. 손의 주인은 화면 밖 — 빛으로만.
```
Bright brand-blue palette (around #3182f6 to #5aa3ff) with ONE warm golden-amber light
source from the upper left, tiny soft sparkles in the air. The same sheep, a little
rumpled from its long day (a suitcase strap still on its back, a wilted petal stuck in
its wool), sits on a stone step. A large gentle hand in a softly glowing white sleeve
reaches in from outside the frame and dabs the sheep's cheek with a plain white cotton
handkerchief, wiping away a sweat drop and a tear at once. The sheep's eyes are closed,
shoulders finally relaxed, the smallest relieved smile. The hand's owner is never
shown — only warm light from that direction. Tender, quiet, heartwarming, no jokes in
this one. Bottom third: plain soft blue step and ground, simple and empty.
```

---

## 배치 판단

- 이미지는 카드 **전체를 채우고**(object-fit: cover) 하단 65%에 남색 스크림이 깔린 뒤 문구가 올라간다
  → 그래서 하단 1/3을 비우라는 규칙이 중요하다.
- 이미지가 있으면 원형 하트/X 엠블럼은 숨겨진다(장면이 그 역할을 대신함). 이미지가 없는 장면은 지금의
  그라데이션 + 엠블럼 카드가 그대로 나온다 — 5장 다 넣지 않아도 깨지지 않는다.
- 다크모드에서도 카드는 자체 배경을 갖고 있어 별도 버전 불필요.
