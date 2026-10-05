# /about 첫 화면 "참 빛" 하늘 카드 배경 이미지 프롬프트 (Gemini용)

`/about` 맨 위 **하늘 카드**(`src/pages/About/About.tsx` — `.ab-dawn.ab-sky`,
스타일 `styles/dawn.css` · 색 토큰 `styles/index.css`) 뒤에 깔 배경 그림.

카드 위 글자(위에서부터):
`참 빛 곧 세상에 와서 / 각 사람에게 비추는 빛이 있었나니` → `요한복음 1:9` 알약 →
`그 빛을 만난 사람들` → **참빛교회** → (맨 아래) 빛 선 + `다섯 장의 이야기`

## 왜 바꾸나 (2026-10-05)

지금 카드는 CSS 그라데이션(라이트 새벽 `#cfdaea → #e3e9f2 → #f3f1ec`, 다크 무채색 밤 `#0b0b0d → #19191c`)
위에 빛줄기 한 가닥 + 빛 무리만 있다. 깔끔하지만 **"빛"이 추상적인 동그라미**라
처음 온 사람이 "아, 그래서 *참빛*교회구나"까지 가려면 말씀을 읽고 해석해야 한다.

> **2026-10-05 2차:** 1차 A안(시골 마을)을 적용해 보니 시대감이 옛날이라, 아래에 **[2차 — 현대적 버전](#2차--현대적-버전-2026-10-05)**을 추가했다.
> 2차도 "느낌이 이상하다"(빛기둥이 SF 광선처럼 읽힘)여서 **[3차 — 현대 건축 버전](#3차--현대-건축-버전-2026-10-05--지금은-여기부터)**을 추가했다.
> 새로 뽑을 때는 **3차부터** 본다.

그림이 해야 할 일은 하나 — **요 1:9의 두 반쪽을 한눈에 보여 주기.**

| 말씀 | 그림이 보여 줄 것 |
|---|---|
| 참 빛 곧 세상에 와서 | **위에서 세상으로 내려오는 하나의 빛** (광원은 하나, 위쪽 가운데) |
| 각 사람에게 비추는 빛 | 그 빛이 **아래 세상의 여러 작은 자리에 하나씩 닿는다** (집집의 창, 사람들, 길) |

---

## 사용법

1. 아래 **공통 블록**을 먼저 붙여넣고, 원하는 **컨셉 하나의 라이트 프롬프트**를 이어 붙여 요청한다.
   마음에 들면 **같은 대화에서** 다크 프롬프트를 이어서 요청한다(대화가 바뀌면 구도·톤이 흩어진다).
   - 다크를 뽑을 때 라이트 결과를 다시 첨부하고 "이 그림과 같은 구도, 같은 장소의 밤"이라고 덧붙이면 구도가 맞는다.
2. 비율은 **PC용 16:9** 로 먼저 받는다. 모바일은 세로 카드(약 1:2)라 가운데만 잘라 쓰게 되므로
   가운데 세로 띠만으로도 성립하는 구도인지 꼭 확인한다(아래 "안전 영역").
   가운데 자르기가 어색하면 같은 대화에서 **9:16 모바일판**을 따로 요청한다(각 컨셉 끝의 한 줄).
3. 후처리:

   ```
   python docs/gemini-unwatermark.py ~/Downloads/1.png ~/Downloads/1-clean.png
   cwebp -q 76 -resize 1600 0 ~/Downloads/1-clean.png -o src/assets/about/dawn-light.webp
   ```

   - 라이트 `src/assets/about/dawn-light.webp` · 다크 `dawn-dark.webp`
     (모바일판을 따로 뽑으면 `dawn-light-m.webp` · `dawn-dark-m.webp`)
   - ★ `public/` 이 아니라 `src/assets/` (해시 URL → 다시 구워도 SW 옛 캐시를 비켜 간다). 한 장 **80KB 이하** 목표.

---

## 레이아웃 제약 (프롬프트의 핵심)

### 카드 실측

| 위치 | 카드 크기(대략) | 비율 |
|---|---|---|
| PC | 1000~1180 × 620~800 | **약 1.5 : 1** (16:9로 받아 cover) |
| 모바일 | 358 × 700 | **약 1 : 2** (16:9면 가운데 30%만 보임) |

### 안전 영역 (세로 = 카드 높이 기준)

```
 0%  ┌──────────────────────────────┐
     │      ↓ 광원(위쪽 가운데)        │  ← 빛이 시작되는 곳. 여기만 가장 밝다
25%  │   참 빛 곧 세상에 와서          │
     │   각 사람에게 비추는 빛이…       │  ← 말씀(가운데 60% 폭) — 디테일 없는 매끈한 하늘
50%  │        (요한복음 1:9)          │
     │      그 빛을 만난 사람들         │
65%  │         참빛교회               │  ← 가장 큰 글자. 여기 뒤엔 사물 금지
75%  │ ·  ·   세상(마을·들판·사람)  ·  · │  ← 그림의 이야기는 여기 — 빛이 닿는 작은 자리들
90%  │           │ 다섯 장의 이야기    │  ← 가운데 아래 빛 선 자리, 단순하게
100% └──────────────────────────────┘
```

- **위 70%는 하늘만.** 글자가 다섯 줄 올라간다. 구름·새·별도 가운데 폭에서는 아주 옅게.
- **이야기는 아래 25~30% 띠에.** 마을·들판·사람 같은 "세상"은 지평선 아래에 낮게.
- **광원은 위쪽 가운데 하나.** 지금 CSS 빛줄기(위 가운데에서 내려오는 2px 선)와 빛 무리(30% 높이)가 그대로 얹힌다.
  그림의 광원이 옆에 있으면 CSS 빛과 두 개가 된다.
- **가운데 세로 띠(폭 30%)만 잘라도 성립할 것** — 모바일. 마을 불빛이 양옆에만 있으면 모바일에서 다 잘린다.

### 테마별 색 (앱 토큰에 맞출 것)

| | 하늘 | 글자 | 빛 |
|---|---|---|---|
| **라이트** | 저채도 새벽 — 위 `#cfdaea` 옅은 회청 → 가운데 `#e3e9f2` → 아래 `#f3f1ec` 따뜻한 미색 | 진한 남색 먹 `#182235` | 흰빛 중심 + **금빛**(`#ffd68c` 계열) |
| **다크** | **무채색 밤** `#0b0b0d ~ #19191c` | 미색 `#f1efee` | 흰빛 중심 + **옅은 푸른빛**(`#92c4ff` 계열) + 마을 창의 작은 앰버 |

> ★ **다크는 남색 금지.** 남색 밤하늘(`#0A1428` 계열)을 깔면 앱의 무채색 다크 위에서 파란 판으로 뜬다
> (5차 패스에서 이미 거부됨). 밤은 **먹빛·숯빛**이고, 색은 빛이 닿는 자리에만 있다.
>
> ★ **라이트는 하이키.** 글자가 진한 남색이라 배경은 카드 지금 밝기보다 어두워지면 안 된다.
> 채도 높은 하늘색 띠도 금지("가로 줄무늬처럼 끊긴다"로 거부된 적 있음).

### 공통 금지

- **글자·숫자·로고 금지** (한글은 반드시 깨진다).
- **십자가·교회 건물 단독 묘사 금지** — 첫 화면은 교회 홍보가 아니라 말씀의 장면. (`/greeting` 히어로에서도 십자가는 거부됨)
- **사람 얼굴 클로즈업 금지** — 사람은 아주 작은 실루엣까지만.
- **해(태양 원반) 금지** — 빛은 "광원 없는 빛"(구름 사이·위에서 내려오는 결)으로. 해가 보이면 그냥 일출 사진이 된다.

---

## 공통 블록 (매번 맨 앞에 붙여넣기)

```
A wide background illustration for the first screen of a church introduction page,
behind the Bible verse John 1:9 — "The true light, which gives light to everyone,
was coming into the world." The picture must show exactly that verse in one glance:
ONE single light coming down from above into the world, and that same light
reaching many small places below, one by one.

Composition rules (very important — text will be overlaid):
- The upper 70% is almost empty, soft, smooth sky with very little detail.
  Five lines of large centered text will sit there.
- The only light source is at the top center, slightly above the frame.
  It descends softly toward the center. No visible sun disk.
- The "world" lives only in the bottom 25–30% of the image, low on the horizon.
- The composition must still work if only the central vertical strip
  (about 30% of the width) is kept — put meaningful lit details near the center too,
  not only at the far left and right.
- The bottom center stays simple (a thin vertical line of light will be drawn there).
- No text, no letters, no numbers, no logos, no crosses, no frames or borders,
  no visible sun, no close-up faces.

Style: refined painterly illustration with soft gradients and fine grain,
calm and luminous, gentle and hopeful, not dramatic, not photographic,
not overly saturated. 16:9.

Scene:
```

---

## 컨셉 5종

### A. 창마다 하나씩 켜지는 불 — **추천**
> 위에서 내려온 빛이 언덕 아래 작은 마을에 닿으면서, 집집의 창에 불이 **하나씩** 켜진다.
> "각 사람에게 비추는 빛"을 가장 직접적으로 보여 준다. 다크에서 특히 강하다(먹빛 밤 + 앰버 창).

**라이트**
```
At early dawn, a soft column of white-gold light descends from the top center of
a pale misty sky. Far below, along the bottom edge, a small quiet village of low
houses sits on gentle rolling hills. Where the light touches the village, the
windows of the houses glow warm gold — each house receiving its own small light,
scattered across the whole width including near the center. Sky colors: very pale,
desaturated blue-grey at the top (#cfdaea), soft misty white in the middle
(#e3e9f2), warm ivory near the horizon (#f3f1ec). High-key, airy, bright overall;
the light is white at its core with a gentle gold halo (#ffd68c). Subtle mist
between the hills.
```

**다크**
```
The same village and the same hills at night. The sky is a deep neutral charcoal
black (#0b0b0d to #19191c) — absolutely no navy or blue tint in the sky. From the
top center, one soft beam of pale white light with a faint cool-blue edge (#92c4ff)
descends gently. Below, along the bottom edge, every window in the village glows a
small warm amber, one by one, scattered across the whole width including the center
— the only color in the picture comes from the light. Very calm, very dark, quiet.
```
모바일판: `Same scene, 9:16 vertical. Keep the village only in the bottom 25%, centered.`

### B. 새벽 들판, 한 사람씩 서 있는 길
> 낮은 들판에 길이 가운데로 나 있고, 작은 실루엣 몇 명이 서로 떨어져 서서 위의 빛을 올려다본다.
> 빛이 그들 하나하나의 어깨에 닿는다. 05장 초대(`verse-path.webp`, 들판 사이 길)와 운이 맞는다.

**라이트**
```
A wide, low meadow at first light with a narrow path running from the bottom
center toward the horizon. Along the path and across the field, a few tiny human
silhouettes stand far apart from each other, each looking up. From the top center,
a single soft white-gold light descends, and a faint ray of it rests on each person.
Sky: pale desaturated blue-grey (#cfdaea) fading to misty white (#e3e9f2) and warm
ivory at the horizon (#f3f1ec). High-key, airy, gentle gold glow (#ffd68c).
```

**다크**
```
The same meadow and path at night under a deep neutral charcoal sky (#0b0b0d to
#19191c, no navy, no blue tint). One soft white light with a faint cool-blue edge
(#92c4ff) descends from the top center. The tiny standing silhouettes are each
touched by a thin thread of that light, their outlines glowing faintly. The path
glows very softly. Quiet, dark, reverent.
```
모바일판: `Same scene, 9:16 vertical. Keep the path and at least two silhouettes near the center.`

### C. 하나의 등불에서 번지는 작은 불들
> 가운데 아래 언덕 위에 등불 하나. 그 빛이 아래 들판의 작은 등불들로 옮겨 가 점점이 이어진다.
> "참 빛 하나 → 각 사람"의 전달을 은유로. 03장 약속(`verse-lamp.webp`)과 같은 소재라 겹칠 수 있다(주의).

**라이트**
```
On a low hill at the bottom center stands a single small lantern, its light
connected by a soft glow to the sky above. From it, many tiny lanterns are lit one
by one across the gentle fields below, like a quiet chain of light spreading
outward. Pale desaturated dawn sky (#cfdaea → #e3e9f2 → #f3f1ec), high-key,
white-gold glow (#ffd68c).
```

**다크**
```
The same hill and fields at night under a deep neutral charcoal sky (#0b0b0d to
#19191c, no navy). A single soft light descends from the top center to the lantern
on the hill, and from there tiny warm amber lanterns glow one by one across the
dark fields. The only color is the light.
```

### D. 구름이 열리는 빛 — 가장 무난
> 낮게 깔린 구름층 한가운데가 열리고, 그 틈으로 빛의 결(god rays)이 아래 안개 낀 땅으로 고르게 내려온다.
> 사람·집 없이 하늘만으로. 글자 가독성은 가장 좋지만 "각 사람"이 덜 보인다.

**라이트**
```
A calm sky of soft, thin clouds. At the top center the clouds part gently, and
fine, soft rays of white-gold light (#ffd68c) fan downward evenly across the whole
width onto a misty, low land at the bottom edge. Very pale desaturated colors
(#cfdaea → #e3e9f2 → #f3f1ec), high-key, airy, no dramatic contrast.
```

**다크**
```
The same sky at night: a deep neutral charcoal (#0b0b0d to #19191c, no navy).
At the top center the dark clouds part slightly, and faint soft rays of white light
with a cool-blue edge (#92c4ff) fan downward onto a dark misty land. Very subtle,
mostly dark.
```

### E. 언덕 위 양들 — 앱 시리즈 연결판
> 앱 다른 화면의 **같은 양 캐릭터**(코지-에픽 동화풍)를 아주 작게. 언덕 위 양 떼가 위의 빛을 올려다보고,
> 빛이 한 마리씩 등에 닿는다. 앱 세계관과 이어지지만 소개 첫 화면으로는 가볍게 보일 수 있다.
> 캐릭터 참조로 `public/images/title-bg/` 이미지 한 장을 함께 첨부하고 "이 양 캐릭터와 같은 캐릭터로".

**라이트**
```
Style override: cozy-epic children's storybook illustration, soft flat shapes with
subtle grain. On gentle rolling hills along the bottom edge, a small flock of tiny
chubby white sheep (the same character as the attached image) is scattered across
the width, each looking up. From the top center, one soft white-gold light descends,
and a small patch of it rests on each sheep's back. Pale desaturated dawn sky
(#cfdaea → #e3e9f2 → #f3f1ec), high-key.
```

**다크**
```
The same hills and sheep at night under a deep neutral charcoal sky (#0b0b0d to
#19191c, no navy). One soft white light with a faint cool-blue edge descends from
the top center; each tiny sheep glows softly where the light touches its wool.
```

---

## 고르는 기준

| 컨셉 | "아 그래서 참빛" 전달력 | 글자 가독성 | 모바일 잘림 | 다른 장면과 겹침 |
|---|---|---|---|---|
| **A 창마다 불** | ★★★ | ★★☆ | 가운데 집 필요 | 없음 |
| B 들판의 사람들 | ★★★ | ★★☆ | 가운데 실루엣 필요 | 05 초대 길과 운 맞음 |
| C 등불 | ★★☆ | ★★☆ | 무난 | 03 약속 등불과 겹침 |
| D 구름 빛 | ★☆☆ | ★★★ | 무난 | 없음 |
| E 양 떼 | ★★☆ | ★★☆ | 가운데 양 필요 | 앱 세계관 연결 |

추천은 **A → B 순**. 둘 다 뽑아 보고, 다크에서 창 불빛이 무채색 밤 위에 점점이 켜지는 쪽이
"각 사람에게"가 설명 없이 읽힌다.

---

## 2차 — 현대적 버전 (2026-10-05) — 3차로 대체됨

1차로 컨셉 A(창마다 불)를 적용해 보니 **구도와 의미는 맞는데 시대감이 옛날**이었다.
원인은 소재와 화풍 두 가지다.

| 1차에서 옛날 느낌을 만든 것 | 2차에서 바꿀 것 |
|---|---|
| 박공지붕 시골집·들판·흙길 (유럽 시골 마을) | **지금의 한국 도시** — 아파트 단지, 저층 상가, 가로등, 횡단보도 |
| 붓 자국·종이 결이 있는 동화풍 회화 | **깔끔한 디지털 아트** — 매트 3D 렌더, 시네마틱 사진풍, 그래픽 그라데이션 |
| 손 잡고 걷는 두 실루엣 | 사람은 빼거나, 창·가로등·폰 화면 같은 **빛의 점**으로 대신한다 |

**바꾸지 않는 것:** 위 70% 빈 하늘, 위쪽 가운데 광원 하나, 아래 25~30% 띠에 놓이는 "세상", 가운데 세로 띠만 남겨도 성립하는 구도,
라이트는 하이키 새벽(`#cfdaea → #e3e9f2 → #f3f1ec`)과 금빛, 다크는 무채색 숯빛 밤(남색 금지).
위의 [레이아웃 제약](#레이아웃-제약-프롬프트의-핵심)과 [공통 금지](#공통-금지)는 그대로 지킨다.

### 2차 사용법

1. 아래 **현대 공통 블록**을 붙이고, 컨셉 하나의 **라이트 PC** 프롬프트를 이어 붙인다.
2. 마음에 들면 **같은 대화에서** 라이트 모바일 → 다크 PC → 다크 모바일 순으로 요청한다.
   다음 장을 요청할 때마다 직전 결과를 첨부하고 "같은 장소, 같은 구도로"라고 덧붙이면 넷의 구도가 맞는다.
3. `~/Downloads/1.png`(라이트 PC) `2.png`(라이트 모바일) `3.png`(다크 PC) `4.png`(다크 모바일)로 저장하면
   1차와 같은 파일명(`src/assets/about/dawn-*.webp`)으로 바꿔 넣는다. 코드는 손댈 필요가 없다.

### 현대 공통 블록 (매번 맨 앞에 붙여넣기)

```
A background image for the first screen of a modern church's mobile app and
website, behind the Bible verse John 1:9 — "The true light, which gives light to
everyone, was coming into the world." It must feel contemporary, clean and
premium, like a 2020s tech brand or an Apple-style keynote backdrop — NOT rustic,
NOT old-fashioned, NOT a storybook painting.

The image shows one idea at a glance: ONE single light comes down from above into
today's world, and that same light reaches many small places below, one by one.

Composition rules (very important — large text will be overlaid):
- The upper 70% is almost empty, smooth sky or soft gradient with no detail.
  Five lines of centered text sit there.
- The only light source is at the top center, slightly above the frame. It falls
  softly and vertically toward the center. No visible sun disk.
- The "world" lives only in the bottom 25–30% of the image, low and calm.
- The composition must still work if only the central vertical strip (about 30%
  of the width) is kept — put lit details near the center too, not only at the edges.
- The bottom center stays simple (a thin vertical line of light is drawn there by the UI).
- Clean edges, smooth gradients, no visible brush strokes, no paper texture,
  no film grain, no vintage tones, no sepia.
- No text, no letters, no numbers, no signs, no logos, no crosses, no church
  buildings, no frames or borders, no visible sun, no close-up faces.
```

---

### M1. 도시의 창마다 켜지는 빛 — **추천**
> 1차 A안을 지금의 한국 도시로 옮긴 판. 낮게 깔린 아파트 단지·저층 건물 사이로 위에서 빛이 내려오고,
> 빛이 닿은 창들이 **하나씩** 켜진다. "각 사람에게"가 그대로 읽히고, 처음 온 사람이 "우리 동네 얘기"로 받아들인다.
> 화풍은 시네마틱 사진풍 + 살짝 일러스트(완전 실사는 글자와 다툼).

**라이트 PC (16:9)**
```
Style: cinematic, slightly stylized digital art with a photographic feel, soft
atmospheric haze, clean modern architecture.
Scene: a calm contemporary Korean city at dawn. Along the bottom edge, a low,
gentle skyline of modern apartment blocks and mid-rise buildings with simple flat
geometry, softened by morning haze. A single soft column of white-gold light
descends from the top center of a pale, high-key sky. Where the light reaches the
city, individual windows across the skyline glow warm gold, one here, one there,
scattered across the whole width and also near the center. Sky: very pale
desaturated blue-grey at the top (#cfdaea), misty white in the middle (#e3e9f2),
warm ivory near the horizon (#f3f1ec). Bright, airy, quiet. 16:9.
```

**라이트 모바일 (9:16)**
```
Same city, same light, same style, now 9:16 vertical. The skyline sits only in
the bottom 25%, with the tallest building cluster slightly off center so the
center bottom stays open for a thin line of light. Several warm lit windows sit
near the center. The upper 75% is empty pale dawn sky with the single light
falling from the top center.
```

**다크 PC (16:9)**
```
The same city and composition at night. The sky is a deep neutral charcoal black
(#0b0b0d to #19191c) — absolutely no navy or blue tint. One soft beam of pale white
light with a faint cool-blue edge (#92c4ff) descends from the top center. Below,
the apartment blocks are dark silhouettes, and individual windows glow warm amber,
one by one, scattered across the width including the center — the only color in
the image comes from the light. Calm, minimal, premium. 16:9.
```

**다크 모바일 (9:16)**
```
Same night city, same light, same style, now 9:16 vertical. Skyline only in the
bottom 25%, lit amber windows near the center, center bottom kept open. The upper
75% is deep neutral charcoal (no navy) with the single soft white-blue light
falling from the top center.
```

### M2. 프리즘 — 하나의 빛이 여러 빛으로 (매트 3D)
> 위에서 내려온 한 줄기 빛이 아래의 매끈한 유리 조형(프리즘·렌즈)을 지나며 **여러 갈래의 작은 빛**으로 나뉘어
> 바닥 곳곳의 작은 점들을 비춘다. 브랜드 키비주얼처럼 가장 세련되고 글자 가독성이 좋다. 다만 "사람"이 직접 보이진 않는다.

**라이트 PC (16:9)**
```
Style: minimal matte 3D render, soft studio lighting, clean pastel surfaces,
premium product-launch aesthetic.
Scene: a pale, seamless studio space whose background fades from soft blue-grey
at the top (#cfdaea) through misty white (#e3e9f2) to warm ivory at the bottom
(#f3f1ec). From the top center, one thin vertical beam of white-gold light
descends. Near the bottom center it passes through a small, clear glass prism
resting on a smooth floor, and splits into many fine, soft rays that fan out
gently across the floor, each ending in a small warm glowing point of light —
many small lights scattered across the width, some near the center. Very clean,
very bright, very calm. 16:9.
```

**라이트 모바일 (9:16)**
```
Same studio, same prism, same style, now 9:16 vertical. The prism sits in the
bottom 25% at the center; the split rays fan out across the narrow floor and end
in small warm points, several close to the center. The upper 75% is an empty
pale gradient with the single beam falling from the top center.
```

**다크 PC (16:9)**
```
The same studio and composition in darkness: a seamless deep neutral charcoal
space (#0b0b0d to #19191c, no navy, no blue tint). One thin beam of white light
with a faint cool-blue edge (#92c4ff) descends from the top center into the glass
prism, which splits it into many soft rays across the dark floor, each ending in a
small warm amber glow. The only color comes from the light. 16:9.
```

**다크 모바일 (9:16)**
```
Same dark studio and prism, now 9:16 vertical. Prism in the bottom 25% at the
center, rays ending in small amber points near the center. Upper 75% empty deep
charcoal (no navy) with the beam falling from the top center.
```

### M3. 위에서 내려다본 도시의 밤길 (항공 시점)
> 아주 높은 곳에서 내려다본 도시 블록·도로망 위로 빛 하나가 내려오고, 그 빛이 거리의 **작은 불빛(창·가로등)**으로 퍼져 간다.
> 지도 같은 그래픽감이라 현대적이고, "세상에 와서"의 스케일이 크다. 위 70%는 안개·구름층으로 비운다.

**라이트 PC (16:9)**
```
Style: clean aerial digital art, soft tilt-shift feel, smooth gradients.
Scene: looking down at a modern city from very high above at dawn, seen at a low
angle so the city occupies only the bottom 25–30% and the rest is soft pale haze
and thin clouds. A single soft beam of white-gold light falls from the top center
through the haze onto the city grid. Around where it lands, small warm points of
light — windows, street lamps — glow across the street grid, spreading outward
and reaching across the whole width, some near the center. Sky and haze colors:
#cfdaea at the top, #e3e9f2 in the middle, warm #f3f1ec near the city. 16:9.
```

**라이트 모바일 (9:16)**
```
Same aerial city, same style, 9:16 vertical. City grid only in the bottom 25%,
warm points of light concentrated near the center. Upper 75% soft pale haze with
the single beam falling from the top center.
```

**다크 PC (16:9)**
```
The same aerial view at night. Deep neutral charcoal haze and sky (#0b0b0d to
#19191c, no navy). One soft white beam with a faint cool-blue edge (#92c4ff)
falls from the top center onto the dark city grid, and from there small warm
amber points of light spread across the streets and windows. 16:9.
```

**다크 모바일 (9:16)**
```
Same aerial night city, 9:16 vertical. City grid in the bottom 25%, amber points
near the center, upper 75% empty deep charcoal (no navy) with the beam from the
top center.
```

### M4. 빛 입자 — 추상 그래픽 (가장 미니멀)
> 사물 없이 빛만. 위에서 내려온 빛줄기가 아래에서 **수많은 작은 빛 입자**로 흩어져 바닥선 위에 하나씩 내려앉는다.
> 모션 그래픽 정지 화면 같은 느낌. 가장 현대적이고 글자와 절대 다투지 않지만, 장면의 이야기는 가장 약하다.

**라이트 PC (16:9)**
```
Style: minimal abstract motion-graphics still, soft mesh gradient, crisp light
particles, no objects.
Scene: a smooth gradient background from pale blue-grey at the top (#cfdaea)
through misty white (#e3e9f2) to warm ivory at the bottom (#f3f1ec). From the top
center, one soft vertical beam of white-gold light descends. In the bottom 25% it
gently disperses into many tiny glowing particles of warm gold light that drift
outward and settle along a soft, barely visible horizon line, each one its own
small light, spread across the width and near the center. Elegant, airy, quiet. 16:9.
```

**라이트 모바일 (9:16)**
```
Same abstract light, same style, now 9:16 vertical. Particles settle only in the
bottom 25%, many near the center. Upper 75% is empty smooth gradient with the
single beam from the top center.
```

**다크 PC (16:9)**
```
The same abstract composition on a deep neutral charcoal gradient (#0b0b0d to
#19191c, no navy, no blue tint). The beam is soft white with a faint cool-blue edge
(#92c4ff); at the bottom it disperses into many tiny warm amber particles settling
along a faint horizon. The only color comes from the light. 16:9.
```

**다크 모바일 (9:16)**
```
Same dark abstract light, 9:16 vertical. Amber particles only in the bottom 25%,
many near the center; upper 75% empty deep charcoal (no navy) with the beam from
the top center.
```

### 2차 고르는 기준

| 컨셉 | 현대감 | "각 사람에게" 전달 | 글자 가독성 | 메모 |
|---|---|---|---|---|
| **M1 도시의 창** | ★★☆ | ★★★ | ★★☆ | 1차 구도를 그대로 이어받아 교체 위험이 가장 작다 |
| M2 프리즘 | ★★★ | ★★☆ | ★★★ | 가장 세련됨. 사람·도시가 없어 은유로 읽어야 한다 |
| M3 항공 도시 | ★★★ | ★★☆ | ★★☆ | 스케일이 크다. 모바일에서 도시가 작아 보일 수 있다 |
| M4 빛 입자 | ★★★ | ★☆☆ | ★★★ | 가장 미니멀. 이야기는 약하다 |

추천은 **M1**이고, 둘을 비교해 보고 싶으면 **M1과 M2**를 나란히 뽑아 본다.
M1은 시네마틱 사진풍이 너무 실사로 가면 글자와 다투므로, 결과가 너무 사진 같으면
"more stylized, softer, less detailed" 한 줄을 덧붙여 다시 뽑는다.

---

## 3차 — 현대 건축 버전 (2026-10-05) — **지금은 여기부터**

2차(도시·프리즘·항공·입자)도 "느낌이 이상하다"는 피드백을 받았다. 원인을 다시 짚으면:

| 이상하게 만든 것 | 왜 | 3차에서는 |
|---|---|---|
| 하늘에서 **레이저 같은 빛기둥**이 땅에 꽂힘 | 도시·건물 위에 수직 광선이 떨어지면 **SF 트랙터 빔·UFO**로 읽힌다 | 빛은 **건축이 받아들이는 자연광**으로 — 천창(스카이라이트)·높은 슬릿 창·유리 지붕으로 들어오는 햇빛 |
| 아래 띠의 도시가 **작고 일반적인 스카이라인** | 성냥갑 실루엣이라 특징이 없고, 오히려 옛날 일러스트처럼 보인다 | **건물 하나를 크게, 가까이** — 재료(노출 콘크리트·흰 석고·유리·목재)가 보이는 거리 |
| 그림풍(디지털 아트·동화) | 현대 건축은 그림보다 **건축 시각화 렌더**에서 현대적으로 보인다 | **건축 시각화(archviz) 사진풍** — 잡지 화보 같은 미니멀 렌더, 부드러운 확산광 |

**핵심 아이디어:** "참 빛이 세상에 와서" = **위에서 공간 안으로 들어오는 한 줄기 자연광**,
"각 사람에게 비추는" = 그 빛이 공간 바닥의 **여러 자리(빈 의자들, 계단 단마다, 창마다)**에 하나씩 닿는다.
사람을 그리지 않고 **사람이 앉을 자리**로 "각 사람"을 말한다 — 처음 온 사람이 "내 자리도 있구나"로 읽는다.

**그대로 지키는 것:** 위 70%는 글자 자리(벽·천장·하늘의 **매끈한 면**), 광원은 위쪽 가운데 하나, 이야기는 아래 25~30%,
가운데 세로 띠만 남겨도 성립, 라이트는 하이키 미색·금빛, 다크는 무채색 숯빛(남색 금지), 글자·십자가 금지.
★ **십자가 금지는 특히 주의** — 안도 다다오 "빛의 교회"류 레퍼런스를 넣으면 제미나이가 십자 슬릿을 그린다. 이름을 넣지 않는다.

### 3차 사용법

1. **건축 공통 블록** + 컨셉 하나의 **라이트 PC**를 붙여 요청.
2. 마음에 들면 같은 대화에서 라이트 모바일 → 다크 PC → 다크 모바일. 매번 직전 결과를 첨부하고 "same space, same camera".
3. `~/Downloads/1.png`~`4.png`(라이트 PC · 라이트 모바일 · 다크 PC · 다크 모바일)로 저장 → 같은 파일명으로 교체(코드 무변경).
   - 그림에 뚜렷한 빛기둥이 없으면 CSS 빛줄기(2px)를 다시 살릴지 그때 함께 본다.

### 건축 공통 블록 (매번 맨 앞에 붙여넣기)

```
A background image for the first screen of a modern church's app and website,
behind the Bible verse John 1:9 — "The true light, which gives light to everyone,
was coming into the world."

Style: high-end architectural visualization, photorealistic but calm and
minimal, like a photo in an architecture magazine. Contemporary architecture:
exposed smooth concrete, white plaster, pale oak wood, large glass. Soft natural
light, gentle bounce light, clean lines, generous empty surfaces. Modern,
quiet, premium. NOT sci-fi, NOT a laser beam, NOT rustic, NOT a painting,
NOT fantasy.

The idea in one glance: ONE natural light enters the space from above, and that
same light falls on many individual places below, one by one.

Composition rules (very important — large centered text will be overlaid):
- The upper 70% is a smooth, almost featureless surface (plain wall, ceiling or
  sky) with very little detail. Five lines of text sit there.
- The only light source is an opening at the top center (skylight / slit /
  glass roof). Light falls softly and naturally from there. No visible sun disk.
- The story (seats, steps, windows catching light) lives only in the bottom
  25–30% of the image.
- The image must still work if only the central vertical strip (about 30% of the
  width) is kept — put lit details near the center as well, not only at the edges.
- The bottom center stays simple (the UI draws a thin vertical line of light there).
- Symmetrical, centered, eye-level or slightly low camera, straight verticals.
- No people. No text, no letters, no numbers, no signs, no logos, no crosses,
  no religious symbols, no altar, no pulpit, no stained glass, no frames or borders.
```

---

### N1. 천창 아래 빈 의자들 — **추천**
> 높은 흰 벽·노출 콘크리트의 미니멀한 홀. 천장 가운데 긴 천창에서 햇빛이 비스듬히 내려와
> 바닥에 놓인 **나무 의자 여러 개 하나하나에 빛 조각이 앉는다**. 의자 = "각 사람의 자리".
> 위 70%는 매끈한 높은 벽이라 글자 자리가 자연스럽게 생긴다.

**라이트 PC (16:9)**
```
Scene: a tall, minimal contemporary hall with smooth white plaster and pale
exposed-concrete walls, seen straight on and symmetrical. High at the top center
of the ceiling is a long, narrow skylight. Soft morning sunlight pours down from
it in a gentle, wide, hazy shaft and spreads across the floor. On the pale oak
floor in the bottom quarter of the image, a loose arrangement of simple modern
wooden chairs faces forward, spaced apart, spread across the width and also near
the center. Each chair has its own small patch of warm sunlight resting on it.
The upper 70% is the tall plain wall, almost empty. Palette: high-key, pale
blue-grey at the top (#cfdaea) warming to soft white (#e3e9f2) and warm ivory near
the floor (#f3f1ec); sunlight white-gold (#ffd68c). Bright, airy, peaceful. 16:9.
```

**라이트 모바일 (9:16)**
```
Same hall, same skylight, same chairs, same style, now 9:16 vertical with the
camera centered. The tall plain wall fills the upper 75%; the chairs sit only in
the bottom 25%, several close to the center, each with its own patch of sunlight.
Keep the center bottom slightly open between chairs.
```

**다크 PC (16:9)**
```
The same hall at night. The walls are deep neutral charcoal (#0b0b0d to #19191c),
absolutely no navy or blue tint. From the skylight at the top center, a soft pale
white light with a very faint cool edge (#92c4ff) falls gently into the space.
Each wooden chair on the floor is touched by its own small pool of warm amber
light — the only color in the image comes from the light. Calm, quiet, minimal. 16:9.
```

**다크 모바일 (9:16)**
```
Same night hall, 9:16 vertical. Upper 75% dark charcoal wall (no navy) with the
soft light falling from the skylight at the top center; chairs in the bottom 25%,
several near the center, each in its own small pool of warm amber light.
```

### N2. 빛이 내려앉는 넓은 계단
> 현대 건축의 넓은 앉음 계단(라운지 스탠드·도서관 계단). 위에서 들어온 빛이 **계단 단마다 한 줄씩** 내려앉는다.
> 사람 대신 "누구나 앉을 수 있는 자리"가 층층이 있어 "각 사람"이 넓게 읽힌다. 요즘 감성 공간(별마당 도서관류)이라 친근하다.

**라이트 PC (16:9)**
```
Scene: a wide, shallow set of seating steps made of pale oak and smooth concrete
in a bright contemporary atrium, seen head-on and symmetrical. The steps occupy
only the bottom quarter of the image. Above them rises a tall, plain white wall
up to a glass roof at the top center. Soft morning light comes down through the
glass roof and lands on the steps as gentle horizontal bands of warm light, one
on each step, across the whole width including the center. The upper 70% is the
plain wall and soft light, almost empty. High-key palette: #cfdaea at the top,
#e3e9f2 in the middle, warm #f3f1ec near the steps, sunlight #ffd68c. 16:9.
```

**라이트 모바일 (9:16)**
```
Same atrium and steps, same style, 9:16 vertical, centered. Plain wall in the
upper 75%, the steps in the bottom 25% with a warm band of light on each step,
clearly visible at the center.
```

**다크 PC (16:9)**
```
The same atrium at night: deep neutral charcoal walls and steps (#0b0b0d to
#19191c, no navy). Soft pale white light with a faint cool edge (#92c4ff) comes
down through the glass roof at the top center, and each step holds one thin band
of warm amber light. Minimal and calm. 16:9.
```

**다크 모바일 (9:16)**
```
Same night atrium, 9:16 vertical. Upper 75% dark charcoal (no navy) with soft
light from the glass roof at the top center; steps in the bottom 25% with a warm
amber band on each step, visible at the center.
```

### N3. 새벽 하늘 아래 현대 건물의 유리 창들
> 바깥에서 본 판. 낮고 넓은 현대 건물(유리 커튼월 + 흰 수평 슬래브)이 아래 띠에 정면으로 서 있고,
> 위 하늘에서 내려오는 부드러운 새벽빛이 **유리창 한 칸 한 칸에 따뜻하게 비친다**. 1차 "창마다 불"의 현대판.
> 하늘이 위 70%라 1차 레이아웃과 가장 가깝다. 빛은 기둥이 아니라 **하늘 위쪽 가운데가 밝아지는 빛 무리**로.

**라이트 PC (16:9)**
```
Scene: exterior, at dawn. A low, wide contemporary building with a facade of
tall glass panels between thin white horizontal concrete slabs stands straight
on, symmetrical, occupying only the bottom quarter of the image, with a calm
reflecting pool or smooth stone plaza in front. Above it, a vast, clean, almost
empty dawn sky. At the top center the sky is brightest — a soft white-gold glow,
no visible sun — and that light reflects in the glass, each individual glass
panel catching its own warm gold highlight, across the whole facade including the
center. Sky: pale blue-grey at the top (#cfdaea), misty white (#e3e9f2), warm ivory
near the building (#f3f1ec). High-key, serene, architectural photography. 16:9.
```

**라이트 모바일 (9:16)**
```
Same building and sky, same style, 9:16 vertical. Camera centered on the middle
of the facade so several glass panels with warm highlights sit at the center.
Building only in the bottom 25%; the upper 75% is empty dawn sky with the brightest
glow at the top center.
```

**다크 PC (16:9)**
```
The same building at night under a deep neutral charcoal sky (#0b0b0d to
#19191c, no navy, no blue tint). A faint soft white glow at the top center of the
sky. Inside the building, the glass panels glow one by one with warm amber light
from within, reflected softly in the pool in front. The only color comes from
the light. Calm, minimal. 16:9.
```

**다크 모바일 (9:16)**
```
Same building at night, 9:16 vertical, centered. Upper 75% empty deep charcoal
sky (no navy) with a faint glow at the top center; building in the bottom 25%
with warm amber glass panels near the center and their soft reflections.
```

### 3차 고르는 기준

| 컨셉 | 현대 건축감 | "각 사람에게" | 글자 자리 | 메모 |
|---|---|---|---|---|
| **N1 천창 아래 의자** | ★★★ | ★★★ | ★★★ (높은 벽) | 의자 = 각 사람의 자리. 가장 분명하고 조용하다 |
| N2 빛 내려앉는 계단 | ★★★ | ★★☆ | ★★★ | 요즘 공간 감성. 계단이 강당처럼 보이면 다시 뽑기 |
| N3 유리 창들 (외관) | ★★☆ | ★★☆ | ★★★ (하늘) | 지금 레이아웃·빛 무리와 가장 잘 맞고 교체 위험이 작다 |

추천은 **N1**, 비교용으로 **N3**. 결과가 너무 어둡거나 대비가 세면 `brighter, lower contrast, more empty wall`을 덧붙인다.
의자가 교회 장의자처럼 줄지어 나오면 `loosely scattered individual chairs, not rows, not pews`를 덧붙인다.

---

## 넣을 때 (그림이 오면 할 일 — 메모)

- `.ab-dawn` 안에 `<img class="ab-dawn-art">` 레이어를 맨 아래(z 0)로 깔고 `object-fit: cover; object-position: center bottom`.
  테마별 `<picture>` 대신 라이트/다크 두 장을 `.dark` 클래스로 토글(앱 테마는 클래스 기반).
- 지금의 CSS 빛줄기·빛 무리는 **그대로 위에 얹되 세기만 낮춘다** — 그림 광원과 위치를 맞추면 첫 진입 개화 애니메이션이 그림의 빛이 "켜지는" 것처럼 보인다.
- 글자 뒤 밝기 실측(라이트는 글자 자리 평균 L* 85 이상, 다크는 20 이하) 후 모자라면 가운데에만 카드색 radial 스크림.
- 그림 로딩 전엔 지금 그라데이션이 그대로 보이므로 LQIP는 불필요.
