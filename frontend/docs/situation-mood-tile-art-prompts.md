# 마음 체크인 감정 타일 배경 프롬프트 (Gemini용)

`/bible/situation` 첫 화면 **"지금 마음이 어떤가요?"** 아래 감정 타일 12장
(`SituationBible.tsx` `.sb-mood`, 데이터는 `situation/situationMoods.ts` `MOODS`)의
**타일 전체를 채우는 배경 그림**. 라벨(`불안해요`)과 `말씀 11` 은 그림 위에 얹힌다.
라이트/다크 각 12장, 총 24장.

---

## 1차 시안 실패에서 배운 것 (다시 반복하지 말 것)

1차는 "흰 바탕 위 작은 양 + 상징 소품(빛의 날개)"를 타일 모서리에 붙이는 방식이었다. 결과는
**유아용 클립아트** — 감성이 하나도 없고 어색했다. 원인:

| 1차의 실수 | 이번 원칙 |
|---|---|
| 흰 바탕 스티커 | **타일 전체가 한 장면.** 하늘·땅·공기가 있는 풍경 |
| 감정을 양의 **표정**으로 (찡그린 눈썹) | 감정은 **빛·날씨·시간대·공간의 크기**로. 양은 **작게, 대부분 뒷모습** |
| 상징 소품을 글로 지시(날개·지팡이·눈물병) → 노란 손처럼 그려짐 | 상징 소품 금지. **참빛은 자연의 빛**으로만 — 노을, 창문 불빛, 구름 틈 햇살, 등불, 새벽 |
| 굵은 외곽선 + 단색 면 | **손으로 칠한 과슈·수채 풍경화**, 붓 자국·종이 결, 영화 같은 빛 |

> 한 줄로: **"양을 보는 그림"이 아니라 "양이 서 있는 그 공기를 느끼는 그림".**
> 보는 사람이 작은 양의 뒷모습에 자기를 겹쳐 놓을 수 있어야 한다. 얼굴을 크게 그리면 그게 막힌다.

---

## 감성 포인트

> **"그 마음 그대로인 풍경 — 그런데 어딘가에 빛이 이미 와 있다."**

- **날씨와 시간대가 곧 감정이다.** 불안은 바람, 우울은 흐린 비, 외로움은 텅 빈 들판의 저녁,
  막막함은 안개. 장면을 보는 순간 "아, 지금 내 마음이 딱 이 날씨야"가 되어야 한다.
- **빛은 감정을 지우지 않는다.** 비는 계속 오고 안개도 그대로다. 다만 그 풍경 어딘가에
  따뜻한 금빛 한 점 — 멀리 켜진 창, 구름 틈의 한 줄기, 손에 든 등불 — 이 있다.
  이 화면의 위로 문구(`EMPATHY`)와 같은 태도다: 고쳐 주지 않고, **곁에 계신 분을 가리키기만** 한다.
- **다크는 같은 장면의 밤.** 어두워질수록 그 금빛이 더 또렷해진다(요 1:5).
  밤에 이 화면을 여는 사람이 많다. 다크가 더 마음에 닿아야 한다.

### 참빛교회다움

- **'참빛'이 그림의 주인공.** 12장 모두 같은 금빛(`#f6c86a` 근처)이 장면의 가장 따뜻한 점.
  그리드로 보면 금빛 점들이 이어져 보인다.
- **앱 공통 양**(`public/images/title-bg/*`)이 작은 모습으로 등장 — 목자의 양, 우리 성도.
  단 **풍경 속 작은 존재**로. 화면 높이의 1/4을 넘지 않는다.
- **목가적인 성경의 땅** — 완만한 언덕, 올리브 나무, 돌담 양 우리, 잔잔한 물가, 밀밭.
  각 장면이 시편 한 구절의 풍경이 되도록(아래 표).
- 하나님·예수님·천사·사람은 그리지 않는다(고신 개혁주의, 대교리문답 109문). 이번엔 상징 소품도 빼서
  애초에 그럴 여지를 없앴다.

---

## 사용법

1. **기준 1장 먼저.** Gemini 새 대화에 `public/images/title-bg/dawn_riser.webp` 첨부 →
   **[공통 머리말 — 라이트] + [⑤ 외로워요]** (가장 감성이 잘 드러나는 장면이라 기준으로 좋다).
   마음에 들 때까지 이것만 다시 뽑는다. 이게 나머지 23장의 화풍 기준.
2. 같은 대화에서 나머지 라이트를 차례로. 매번
   "**앞의 그림과 완전히 같은 화풍·붓 터치·양 크기로**" + [공통 머리말 — 라이트] + [장면].
3. 다크는 **새 대화**에서 해당 장면 **라이트 완성본을 첨부** → "같은 장면, 같은 구도의 밤" +
   [공통 머리말 — 다크] + [장면] + 장면의 **[밤]** 줄.
4. 비율은 Gemini에서 **16:9** 선택(없으면 프롬프트 첫 줄이 지시).
5. 저장(파일명 고정, `public/` 아님 — SW 캐시로 교체가 안 먹는다):
   `frontend/src/assets/situation-moods/{key}-light.png`, `{key}-dark.png`
   → 크롭·WebP 변환·글자 가독용 스크림은 내가 붙인다.

| # | 타일 | key | 날씨·시간 = 감정 | 참빛 | 품는 말씀 |
|---|---|---|---|---|---|
| ① | 불안해요 | `anxious` | 거센 바람 부는 언덕, 푸른 해질녘 | 돌담 양 우리 문에 걸린 등불 | 시 4:8 나를 안전히 살게 하시는 이는 오직 여호와 |
| ② | 지쳤어요 | `weary` | 긴 흙길 끝, 노을 | 나무 그늘에 기댄 양 등 위의 마지막 햇살 | 마 11:28 |
| ③ | 우울해요 | `down` | 흐린 비 오는 회청빛 들판 | 먼 구름 틈으로 내려오는 빛기둥 하나 | 시 42:5 |
| ④ | 슬퍼요 | `sad` | 비 그친 직후 보랏빛 저녁 호숫가, 빗방울 물결 | 수평선의 마지막 금빛 | 시 30:5 저녁에는 울음이 깃들일지라도 |
| ⑤ | 외로워요 | `lonely` | 텅 빈 들판의 분홍빛 저녁 | 먼 언덕 위 작은 집 창문 불빛 | 히 13:5 |
| ⑥ | 아파요 | `sick` | 작은 방, 커튼 사이 이른 아침 | 창으로 드는 첫 햇살 | 시 41:3 |
| ⑦ | 막막해요 | `overwhelmed` | 끝없는 안개·폭풍 구름 | 양이 선 높은 바위에만 닿는 빛 | 시 61:2 |
| ⑧ | 길을 모르겠어요 | `lost` | 새벽 안개 속 갈림길 | 양 앞 두 걸음만 비추는 등불 | 시 119:105 |
| ⑨ | 하나님이 멀어요 | `far` | 멀리 돌아가는 밤길 | 길 끝 열린 문에서 길게 쏟아지는 불빛 | 눅 15:20 |
| ⑩ | 용서가 안 돼요 | `forgive` | 메마른 돌밭, 늦은 오후 | 돌 틈에 핀 꽃 한 송이에 닿은 햇살 | 사 43:19 광야에 길을, 사막에 강을 |
| ⑪ | 쉬고 싶어요 | `rest` | 푸른 풀밭, 잔잔한 물가 | 나뭇잎 사이 일렁이는 햇빛 | 시 23:2 |
| ⑫ | 감사해요 | `thankful` | 밀밭 언덕의 해돋이 | 언덕을 가득 채우며 번지는 햇빛 | 시 23:5 |

각 타일의 기존 tone 색(구슬 색)이 **장면 전체의 주조색**이 된다 — 그리드의 무지개 리듬 유지.

---

## 레이아웃 제약

### 타일 실측

`.sb-mood` 높이 **96px 고정**, 폭은 열 수에 따라:

| | 열 | 타일 | 비율 |
|---|---|---|---|
| 모바일 390px | 2 | 174 × 96 | 1.8 : 1 |
| 모바일 448px | 2 | 203 × 96 | 2.1 : 1 |
| PC lg / xl | 3 / 4 | 195~230 × 96 | 2.0~2.4 : 1 |

16:9(1.78) 원본을 `background-size: cover` 로 깐다 → **넓은 타일에서는 위아래가 최대 25% 잘린다.**
→ 중요한 것(양·참빛)은 **세로 25~80% 띠 안**에.

### 글자 자리

- 라벨 15.5px/700 — **왼쪽 위**(y 14~34, 최장 `길을 모르겠어요` x ≈130까지)
- `말씀 10` 11.5px — **왼쪽 아래**
- → **왼쪽 45%는 차분한 면**(하늘·풀밭·물·안개). 세부 묘사·강한 명암 금지.
  양과 참빛은 **오른쪽 55%** 에. 왼쪽에서 오른쪽으로 갈수록 이야기가 생기는 구도.
- 라이트: 글씨가 **진한 남색** → 그림 왼쪽은 **밝고 옅게**.
  다크: 글씨가 **흰색** → 그림 왼쪽은 **어둡고 가라앉게**.
  (구현 때 왼쪽에 타일 색 스크림을 살짝 더 깐다. 그래도 그림 자체가 이걸 지켜야 한다.)
- 오른쪽 아래 모서리(12%×15%)는 단순하게 — Gemini 워터마크 ✦ 자리, 크롭으로 잘라 낸다.

---

## 공통 머리말 — 라이트

```
A wide 16:9 hand-painted landscape that will be used as the full background of a small
emotion card in a mobile church app (shown about 180x96 pixels), LIGHT MODE.

Style: soft gouache and watercolour painting, like a background painting from a
hand-drawn animated film or the most tender page of a picture book. Visible soft
brush strokes and paper texture, atmospheric depth, gentle cinematic light, airy and
luminous. NOT a cartoon, NOT clip-art, no thick outlines, no flat vector shapes,
no sticker look. The emotion comes from the WEATHER, the TIME OF DAY, the LIGHT and
the SPACE — not from a facial expression.

The lamb: the same small white lamb as the attached reference, but painted SMALL
inside the landscape — no taller than one quarter of the image height — usually seen
from BEHIND or from the side at a distance, so the viewer can feel they are the lamb.
No visible facial expression, no cartoon eyes, no tears, no exaggerated pose.

The true light: somewhere near the lamb there is ONE warm golden light (#f6c86a) that
comes from nature or an ordinary thing — sunset, a ray through clouds, a lit window,
a lantern, dawn. It is the warmest point in the painting. It does not drive away the
weather or the mood; it is simply there.

Palette: the whole scene is bathed in {TONE} — high-key, soft, light and airy, gently
desaturated, because dark navy text is laid over the left side.

Composition is critical:
- The LEFT 45% of the image is calm and simple: open sky, soft field, still water or
  mist, light in value, with no detail, no objects, no strong contrast — text sits there.
- The lamb and the golden light are in the RIGHT 55%, inside the vertical band between
  25% and 80% of the height (the top and bottom may be cropped).
- Keep the bottom-right corner simple.

No people, no human figures, no hands, no faces, no angels, no religious symbols.
No text, letters, numbers or logos. No frame, border, vignette or rounded corners.
No user-interface elements.

Scene:
```

## 공통 머리말 — 다크

라이트 완성본을 첨부하고 붙인다.

```
The SAME landscape as the attached painting, at NIGHT, for DARK MODE. Same
composition, same lamb in the same place and the same size, same brushwork — only the
time and the light change.

A wide 16:9 hand-painted gouache and watercolour landscape used as the full background
of a small dark card (shown about 180x96 pixels). Soft brush strokes, paper texture,
atmospheric depth. Not a cartoon, no outlines, no clip-art.

Night palette: deep, quiet, low-key, tinted with {TONE_NIGHT}. Shadows lean warm
charcoal (#201f1f), NOT pure black and NOT saturated navy. The lamb's wool is a soft
dim warm grey, never bright white, seen small from behind or at a distance.

The true light: the ONE warm golden light (#f6c86a) is now the brightest thing in the
whole painting, glowing clearly and laying a soft warm rim of light on the nearest
side of the lamb and the ground around it. The darker the night, the clearer the
light. It does not chase the darkness away — it shines in it.

Composition (identical to the light version):
- LEFT 45% calm, dark and simple — night sky, dim field, still water or mist — white
  text sits there. No bright spots, no stars clustered on the left.
- Lamb and golden light in the RIGHT 55%, between 25% and 80% of the height.
- Bottom-right corner simple.

No people, no human figures, no hands, no faces, no angels, no religious symbols.
No text, letters, numbers or logos. No frame, border, vignette or rounded corners.

Scene:
```

---

## 장면 12개

`{TONE}` / `{TONE_NIGHT}` 는 장면마다 적힌 값으로 바꾼다.

### ① 불안해요 — 바람 부는 언덕, 그래도 우리 문엔 불이

TONE: `pale windy sky blue and silver-green` / NIGHT: `deep blue-grey`

```
A wide grassy hillside at blue dusk with a strong wind: long grass streaming sideways,
loose clouds racing across the sky, a few leaves torn away in the air. Everything is
moving. On the right, a low round stone sheepfold wall sits in the hollow of the hill,
and the small lamb has tucked itself against the sheltered side of the wall, out of
the wind, seen from behind. Hanging on the wooden gate post of the sheepfold right
beside it, a small lantern burns with a steady warm golden flame that the wind does
not move.
```
**[밤]** `Night wind, dark racing clouds; the steady lantern on the gate is the one warm point, its light holding the lamb and the stones of the wall.`

### ② 지쳤어요 — 여기까지 걸어온 길

TONE: `soft peach and dusty apricot` / NIGHT: `dim warm umber`

```
A long winding dirt path stretches back across rolling hills from the left, showing
how far it has come. At the right, under a single old olive tree by the roadside, the
small lamb has finally sat down, leaning against the trunk, seen from the side at a
distance, its little cloth bundle set down on the ground next to it. The last warm
golden sunlight of the evening slants low across the hills and rests on the lamb's
back like a blanket.
```
**[밤]** `After sunset; a small lantern hung on a low branch of the olive tree casts a warm circle of light over the resting lamb.`

### ③ 우울해요 — 흐린 날, 멀리 한 줄기

TONE: `muted grey-blue rain and mist` / NIGHT: `dark slate`

```
A wide, low, overcast landscape on a grey rainy day: soft fine rain, heavy flat
clouds, a damp field fading into mist. Quiet and heavy. The small lamb lies in the wet
grass on the right, curled small, seen from behind. Further away to the right, ONE
narrow pillar of warm golden sunlight breaks through a gap in the clouds and touches
the field — a soft bright patch on the grass, not far from the lamb, slowly coming
closer. The rain has not stopped. No rainbow, no clearing sky.
```
**[밤]** `Night rain; through a gap in the dark clouds a soft golden light (like moonlight turned warm) falls on the grass just beside the lamb.`

### ④ 슬퍼요 — 비 그친 저녁 호숫가

TONE: `soft lilac and lavender dusk` / NIGHT: `deep violet-grey`

```
A wide still lake at lavender dusk, just after rain. The surface is glassy, with a
few last raindrops making small rings on the water. On the right, the small lamb sits
alone at the water's edge on a smooth stone, seen from behind, looking out over the
lake. Low on the far horizon, a thin line of warm golden light remains where the sun
went down, and its reflection draws a soft golden path across the water toward the
lamb.
```
**[밤]** `Night; the golden horizon is replaced by one warm lamp-lit window on the far shore, its reflection stretching across the dark water to the lamb's feet.`

### ⑤ 외로워요 — 텅 빈 들판, 먼 창의 불빛 ★기준 장면

TONE: `soft dusky rose and pale pink sky` / NIGHT: `deep muted plum`

```
A vast open field at dusk under a wide pale pink sky, almost empty. The small lamb
stands alone in the middle-right of the field, very small, seen from behind, looking
toward the distance. Far away on a gentle hill to the right, there is one tiny stone
cottage, and its single window glows with warm golden light — someone is awake, as if
waiting. A thin path in the grass leads from the lamb toward that light. Lonely, but
not alone.
```
**[밤]** `Night over the empty field; the cottage window is the brightest thing in the painting, and its warm glow faintly reaches the grass around the lamb.`

### ⑥ 아파요 — 창가의 아침

TONE: `soft mint green and morning white` / NIGHT: `quiet dark sea-green`

```
Inside a small, simple, cozy room, early morning. Gauzy curtains at a window on the
right, a potted green plant on the sill, a small cup on a stool. The small lamb is
asleep, tucked under a soft quilt on a low bed beneath the window, seen from the side
at a distance. The first warm golden sunlight comes through the curtains and falls
gently across the quilt. Quiet, safe, tender. The left side of the image is a calm,
softly lit plain wall.
```
**[밤]** `Night in the same room; a small oil lamp on the stool by the bed is the only light, its warm glow over the sleeping lamb.`

### ⑦ 막막해요 — 안개 바다 위의 바위

TONE: `cool storm grey and pale fog` / NIGHT: `dark storm grey`

```
A boundless sea of drifting fog and low storm clouds — no path, no horizon, nothing to
hold onto. On the right, one tall, solid, rounded rock rises out of the fog, and the
small lamb stands on top of it, seen from behind, looking into the grey. High on the
right, a small opening in the clouds lets a soft beam of warm golden light fall
exactly onto the rock and the lamb, while all around stays misty. The rock is firm.
```
**[밤]** `A dark stormy night of fog; the golden beam on the rock is the only light, the lamb standing in it.`

### ⑧ 길을 모르겠어요 — 두 걸음만큼의 빛

TONE: `warm amber haze and pale gold fog` / NIGHT: `deep dim amber-brown`

```
A quiet field path at dawn, swallowed in thick soft fog. On the right, the path splits
into two directions that both disappear into the mist. The small lamb stands at the
fork, seen from behind, holding a small glowing lantern. The lantern's warm golden
light reaches only the next two flat stepping-stones in front of it; beyond that,
everything is soft fog. Only the next step can be seen — and it is enough.
```
**[밤]** `Pitch-dark foggy night; the lantern lights only the lamb and the next two stones, a warm small sphere in the dark.`

### ⑨ 하나님이 멀어요 — 길 끝의 열린 문

TONE: `calm twilight blue` / NIGHT: `deep quiet blue-black`

```
A long country road at blue twilight. Far down the road on the right stands a small
house whose door is wide open, and warm golden light pours out of it and spills a long
way down the road. The small lamb is on the road, very small and far from the house,
seen from behind, walking slowly back toward it with its head low. The stream of light
from the open door reaches all the way to the lamb's feet — longer than the distance
the lamb has to walk.
```
**[밤]** `Night road; the open door is the brightest point, the river of golden light along the dark road reaching the lamb.`

### ⑩ 용서가 안 돼요 — 돌밭의 꽃 한 송이

TONE: `warm sand and dry ochre` / NIGHT: `dim warm brown-grey`

```
A dry, stony, sun-baked field in late afternoon, scattered with grey stones and
cracked earth — hard ground. The small lamb sits among the stones on the right, seen
from the side at a distance, still and closed in. Right beside it, between two stones,
a single small flower has opened, and a soft ray of warm golden light falls on that
flower. The ground is still hard; only this one small thing has begun.
```
**[밤]** `Night on the stony field; the small flower glows softly in a pool of warm golden light beside the lamb.`

### ⑪ 쉬고 싶어요 — 푸른 풀밭, 쉴 만한 물가

TONE: `soft teal, fresh green and clear water` / NIGHT: `deep calm teal`

```
A peaceful green meadow beside a perfectly still, clear pond, under a large leafy
tree. The small lamb lies curled up asleep in the soft grass in the shade on the
right, seen from the side at a distance. Warm golden sunlight filters through the
leaves and dapples the grass and the lamb's wool, and makes one gentle glint on the
still water. Complete stillness — the kind of picture that makes you breathe slowly.
```
**[밤]** `Quiet night by the still pond; a warm golden glow (a lantern hung low in the tree) lies over the sleeping lamb and reflects in the water.`

### ⑫ 감사해요 — 밀밭 언덕의 해돋이

TONE: `warm honey gold and soft cream` / NIGHT: `pre-dawn deep amber-indigo`

```
A gentle hill of ripe golden wheat at sunrise. The sun is just rising on the right
horizon, and warm golden light floods across the field, making every stalk glow. The
small lamb stands on the crest of the hill on the right, seen from behind, facing the
sunrise, bathed in the light. Quiet, full, overflowing gratitude — not a party.
```
**[밤]** `The moment just before dawn; the sky is still dark, but a band of warm golden light is rising on the right horizon, the first glow touching the lamb on the hill.`

---

## 받은 뒤 체크리스트

**180×96 으로 줄여서** 본다 (크게 보면 다 좋아 보인다).

- [ ] 그림만 보고 **어떤 마음인지** 느껴지는가 (날씨·빛으로)
- [ ] 클립아트처럼 보이지 않는가 — 붓 자국·공기·깊이가 있는가
- [ ] 양이 작고, 얼굴 표정이 아니라 **자세·위치**로 말하는가
- [ ] 금빛 참빛이 장면에서 가장 따뜻한 점인가 / 12장 같은 금색인가
- [ ] 왼쪽 45%가 차분해서 라벨이 읽히는가 (라이트=밝게, 다크=어둡게)
- [ ] 사람·손·얼굴·천사가 없는가
- [ ] 다크가 새까맣거나 진한 남색으로 흐르지 않았는가

## 붙일 때 (구현 메모)

- `.sb-mood__orb` → `.sb-mood__bg`(cover, 기본 `background-position: 70% 55%`) + 왼쪽 스크림
  `linear-gradient(90deg, var(--surface-container) 0~25%, transparent 60%)` 를 살짝.
- 16:9 → 2:1 로 크롭해 **640×320 WebP**, 한 장 ≤ 30KB, 화면 진입 후 지연 로드. 라이트/다크는 `.dark` 로 교체.
- 라벨 그림자 대신 스크림으로 가독성 확보(글자에 그림자 넣으면 싸 보인다).
