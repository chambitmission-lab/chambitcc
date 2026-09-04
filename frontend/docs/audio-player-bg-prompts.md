# 성경 오디오북 플레이어 배경·캐릭터 프롬프트 (Gemini용)

`/bible` 본문 위 **오디오북 카드**(`Bible/components/BibleAudioPlayer.tsx`) 뒤에 깔 배경과,
그 위를 걸어가는 **순례자 양** 스프라이트. 컨셉은 칭호·공지 배너·교육·헌금·예배 배경과 같은
**코지-에픽 동화풍 + 같은 양 캐릭터**, 장면은 **"말씀 한 장을 넘는 고갯길"**.

이 카드의 주인공은 **진행바**다. 그래서 진행바를 직선이 아니라 **고갯길**로 만든다.

| 구간 | 진행률 | 길 | 양 |
|---|---|---|---|
| 1막 · 출발 | 0~30% | 완만한 평지, 자갈 몇 개 | 가벼운 걸음 |
| 2막 · 오르막 | 30~62% | 돌밭, 가시덤불 | 걸음이 느려지고 몸이 기운다 |
| 3막 · 된비알 | 62~82% | 가장 가파른 구간 | 맞바람·가쁜 숨·땀, 지팡이로 버틴다 |
| 4막 · 고갯마루 | 82~90% | 돌무더기(케른) | 숨을 고른다 |
| 5막 · 도착 | 90~100% | 짧은 내리막 | 예배당 창에 불이 켜진다 |

**고난은 장식이 아니라 구조**다 — 길의 경사(`roadY`)가 실제로 계산되고, 양의 기울기·걸음
속도·숨·땀·맞바람이 전부 **그 경사에서 자동으로 나온다**. 배경 그림은 그 무대만 맡는다.

> 움직이는 시안: `/#/dev/audio-bg` (dev 전용, 상단 **확대** 버튼으로 3배 확대해 볼 수 있다)

---

## ⚠ 이 화면만의 제약 — 그림이 아니라 '띠'다

| | 카드 실측 | 비율 |
|---|---|---|
| 모바일(390px) | 약 358×90 | **≈4 : 1** |
| PC(본문 열) | 약 700×90 | **≈7.8 : 1** |

지금까지의 히어로 배경(2:1)과 **완전히 다른 극단적 가로 띠**다. 그래서:

1. **세로로 쌓인 장면 금지.** 능선 하나와 그 위 작은 소품뿐.
2. **왼쪽 14%는 재생 버튼(44px 원)이 덮는다.** 그 자리엔 아무것도 그리지 않는다.
3. **가운데를 진행바(고갯길)가 가로지른다.** 배경의 능선이 그 선과 겹쳐 보이면 안 되므로
   배경 능선은 **길보다 아래**(카드 하단 40%)에 깔린다.
4. **글자가 그림 위를 지나간다** — "오디오북 · 재생 중 · 12절"(왼쪽 위), "1.25×" 칩(오른쪽 위),
   "0:00 / 3:55"(아래 양끝). 히어로 배경보다 **한 단계 더 옅게**.
5. **가로로 무한 스크롤된다.** 재생 중 CSS가 `translateX(0 → -50%)`로 계속 흘리므로
   **왼쪽 끝과 오른쪽 끝이 이어져야 한다(seamless tileable).**
6. **길·양·예배당·바위는 그림에 넣지 않는다.** 전부 진행률에 반응해야 해서 DOM으로 얹는다.
   배경은 **흐르는 풍경만** 맡는다.

## 뽑을 것 (4장)

| 파일 | 규격 | 용도 |
|---|---|---|
| `public/images/bible/audio-ridge-light.webp` | 1536×256 (6:1) | 라이트 배경 능선 띠 |
| `public/images/bible/audio-ridge-dark.webp` | 1536×256 (6:1) | 다크 배경 능선 띠 |
| `public/images/bible/audio-lamb-walk.webp` | 128×96 투명 | 순례자 양 — 평지 걸음 |
| `public/images/bible/audio-lamb-climb.webp` | 128×96 투명 | 순례자 양 — 오르막 버티기 |

띠는 각 30KB 이하(알파 포함), 양은 각 15KB 이하.
양을 두 장 뽑는 이유: 오르막에서 **자세가 바뀌어야** "힘들다"가 읽힌다. CSS 기울임만으로는
"기울어진 같은 그림"이라 몸이 버티는 느낌이 안 난다.

## 사용법

1. Gemini에 `public/images/title-bg/everest_climber.webp` 를 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로" 라고 덧붙인 뒤, 아래 프롬프트를 붙여넣는다.
   (등반 장비를 든 양이라 이번 컨셉과 가장 가깝다.)
2. **워터마크 처리** — 띠는 3:1(1536×512)로 뽑게 되어 있고 장면은 **위 절반**에 있다.
   받은 뒤 위 절반만 잘라내면 오른쪽 아래 ✦ 가 통째로 사라진다:
   `magick in.png -gravity north -crop 1536x256+0+0 +repage out.png`
3. **이음매 확인** — `magick out.png +append out.png seam-check.png` 로 두 장 이어 붙여 본다.

---

## 라이트 테마 — 능선 띠

```
A very wide 3:1 seamless horizontal SCENERY STRIP for the background of a small
audio-player card in a mobile Bible app, LIGHT MODE, extremely pale and high-key
(dark navy text and a winding progress path will be laid on top, so the whole image
must stay bright, soft and very low-contrast). Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain texture, rounded friendly forms,
gentle hazy morning light, no harsh outlines.

This is NOT a picture with a subject. It is a quiet PANORAMIC RIDGE BAND that will
scroll slowly and endlessly sideways behind a progress bar, like the view from a
train window. Nothing may draw the eye to one spot.

The mood is a HARD PILGRIM ROAD seen from far away — dry highland country, not a
soft green meadow: bare rocky ridges, wind-bent trees, scattered boulders, a few
thorny scrub bushes. Weathered but never bleak or scary; it is the honest hard road
home, drawn for children.

Composition is critical:
- SEAMLESSLY TILEABLE horizontally: the LEFT EDGE and RIGHT EDGE must line up
  perfectly so the strip can loop forever. The ridge line must sit at exactly the
  same height on both edges, and no object may touch either edge.
- ALL of the artwork sits in the TOP HALF of the frame. The BOTTOM HALF must be
  completely empty flat pale cream — nothing at all, not even texture.
- Inside that top half: one low, slightly jagged ROCKY RIDGE running all the way
  across, its crest rising and falling three or four times, with a second, fainter
  ridge behind it. Above them only a smooth pale blue-to-cream wash and two faint
  flat clouds.
- Everything must be SMALL and LOW: the tallest thing (a wind-bent pine leaning to
  the left) is no more than 25% of the frame height.

Palette: pale high-key sky blue and warm cream, with the deepest tone around #3182f6
used only in the faintest ridge wash. Dusty sage and pale stone grey. Everything
washed in bright morning haze, like a watercolour left in the sun.

Scattered evenly along the ridge, all tiny, all the same visual weight, spaced far
apart so no cluster forms: a few wind-bent pines all leaning the same way, two or
three boulders, a small spiky thorn bush, a low broken wooden fence, one narrow
stony footpath that comes over the crest and disappears again.

No sheep, no animals, no people, no buildings, no church, no chapel, no cross, no
lantern, no road in the foreground — those are added separately in the app.
No sun, no moon, no stars, no rain, no snow, no strong directional shadows — the
lighting must be flat and even.
No text, no letters, no numbers, no logos. No frames, no borders, no vignette, no
rounded corners. The bottom half must be plain flat empty cream.
```

## 다크 테마 — 능선 띠

```
A very wide 3:1 seamless horizontal SCENERY STRIP for the background of a small
audio-player card in a mobile Bible app, DARK MODE. Style: cozy-epic children's
storybook illustration — soft flat shapes with subtle grain texture, rounded friendly
forms, no harsh outlines. The mood is "the hard road home, late in the evening" —
dry rocky highland country seen as soft silhouettes, weathered but never frightening.

This is NOT a picture with a subject. It is a quiet PANORAMIC RIDGE BAND that will
scroll slowly and endlessly sideways behind a progress bar. Light text will be laid
over it, so keep everything muted, dim and very low-contrast.

Composition is critical:
- SEAMLESSLY TILEABLE horizontally: the LEFT EDGE and RIGHT EDGE must line up
  perfectly. The ridge line must sit at exactly the same height on both edges, and no
  object may touch either edge.
- ALL of the artwork sits in the TOP HALF of the frame. The BOTTOM HALF must be
  completely empty flat deep charcoal (#201f1f) — nothing at all.
- Inside that top half: one low, slightly jagged ROCKY RIDGE running all the way
  across as a soft dark silhouette, with a second fainter ridge behind it. Above them
  a smooth deep charcoal wash with the faintest cool blue tint right at the ridge
  line.
- Everything must be SMALL and LOW: the tallest thing (a wind-bent pine leaning to
  the left) is no more than 25% of the frame height.

Palette: deep warm CHARCOAL (around #201f1f) with a faint cool blue tint just above
the ridge — NOT navy, NOT black, NOT a colourful night sky. The ridges are barely a
shade lighter than the sky. Two or three very dim amber pinpricks (distant windows)
sit low along the ridge, tiny and soft, with no glow halo wider than a few pixels.

Scattered evenly along the ridge, all tiny, all the same visual weight, spaced far
apart: a few wind-bent pine silhouettes all leaning the same way, two or three
boulders, a small spiky thorn bush, a low broken wooden fence, one narrow stony
footpath.

No sheep, no animals, no people, no buildings, no church, no chapel, no cross, no
lantern, no road in the foreground — those are added separately in the app.
No moon, no visible stars, no aurora, no rain, no snow, no strong directional
shadows — the lighting must be flat and even.
No text, no letters, no numbers, no logos. No frames, no borders, no vignette, no
rounded corners. The bottom half must be plain flat empty #201f1f charcoal.
```

---

## 순례자 양 ① — 평지 걸음 (`audio-lamb-walk`)

```
A single tiny character sprite on a FULLY TRANSPARENT background, drawn in exactly
the same cozy-epic children's storybook style as the attached reference, and it must
be the SAME small chubby sheep character: creamy white curly wool, a warm cream face,
tiny round black hooves, small black dot eyes, a calm little smile.

A PILGRIM LAMB SEEN FROM ITS LEFT SIDE, walking, facing RIGHT — a clean side profile,
striding across the picture from left to right on level ground. Its head is up and its
expression is serene and just slightly smug, the way this character always looks.

Its equipment, all small and simple:
- a rolled honey-brown CLOTH BUNDLE tied with twine on its back, like a little
  travelling pack, with the knot clearly visible on top
- a slim WOODEN STAFF held in its front hoof, planted forward and angled up to the
  right, taller than the lamb
- a small warm AMBER LANTERN hanging from the top of the staff, glowing softly

The sprite must read clearly at a very small size — it will be displayed about 30
pixels wide. Simple bold shapes, no fine detail, no thin lines, a soft slightly darker
edge all around so it stays visible against both a pale cream and a dark charcoal
background. Flat even lighting, no cast shadow, no ground, no scenery.

Centred in the canvas with a little empty margin on all sides. No text, no letters, no
numbers, no logos, no background of any kind — pure transparency.
```

## 순례자 양 ② — 오르막 버티기 (`audio-lamb-climb`)

```
The SAME pilgrim lamb character as the previous image, in the SAME style, size and
colours, on a FULLY TRANSPARENT background — this is the second pose of the same
sprite, so the body proportions, wool shape, cream face, pack, staff and lantern must
match exactly.

This time the lamb is CLIMBING A STEEP SLOPE: seen from its left side, facing RIGHT,
its whole body LEANING FORWARD into the climb, head lowered, front legs reaching up
and the back leg pushing off behind. It leans hard on the WOODEN STAFF, which is
planted steeply into the ground ahead of it and clearly taking its weight. The
travelling bundle on its back has slid a little to one side with the effort.

Its face is still gentle, never distressed — eyes squeezed into two small determined
arcs, mouth a small resolute line, one tiny bead of sweat near the brow. It is
straining, but it is not suffering: this lamb has decided to get up this hill.

The small amber lantern still hangs from the top of the staff, swinging slightly
backwards from the motion.

The sprite must read clearly at about 30 pixels wide: simple bold shapes, no fine
detail, no thin lines, a soft slightly darker edge all around so it works on both pale
cream and dark charcoal. Flat even lighting, no cast shadow, no ground, no scenery.

Centred in the canvas with a little empty margin on all sides. No text, no letters, no
numbers, no logos, no background of any kind — pure transparency.
```

---

## 뽑고 나서 — 애니메이션 스펙

배경은 정지 이미지이고, **재미는 전부 CSS가 만든다.** 원칙 하나: **소리가 날 때만 움직인다.**
`.abp-scene *{animation-play-state:paused}` 를 기본값으로 두고 재생 중에만 `running` 으로
바꾸면, 일시정지 순간 풍경도 걸음도 같이 멎어 "멈췄다"가 눈으로 온다.

| 레이어 | 움직임 | 값 |
|---|---|---|
| 능선 띠(먼 풍경) | 오른쪽 → 왼쪽 무한 스크롤 | `translateX(0 → -50%)`, **46s** linear |
| 근경 능선(CSS SVG) | 같은 방향, 더 빠르게 → 패럴랙스 | **24s** / 거친 바위층 **15s** |
| 고갯길(진행바) | 지나온 길은 브랜드 실선, 남은 길은 **점선 오솔길** | `stroke-dasharray:5 7` |
| 양의 자세 | 경사에 따라 스프라이트 교체 + 기울임 | `lean = atan2(Δy, Δx)`, ±26° 클램프 |
| 양의 걸음 | 오르막에서 **느려진다** | 평지 0.72s → 오르막 **1.05s** |
| 지팡이 | 디딜 때마다 세워짐 | `rotate(-7deg → 5deg)`, 걸음과 동기 |
| 등불 | 호흡하듯 밝기 | **2.4s** ease-in-out (무한 글로우는 여기 하나뿐) |
| 맞바람 | **된비알에서만** 분다 | `lean < -7°` 일 때만 `opacity:1`, 돌풍 1.8s |
| 가쁜 숨·땀 | 같은 조건에서만 | 숨 1.6s, 땀 2.2s |
| 절 마커 | 지나가면 디딤돌 점등 | 2px 회색 → 3px 흰 점 + 브랜드 글로우, 0.35s |
| 예배당 | 진행률에 비례해 창에 불 | `opacity: (pct/100)²` — 후반에 확 밝아진다 |
| 완주 | 1회 연출 | 예배당 글로우 1.2s 확산 (반복 금지) |

- 절 마커는 **백엔드 `VerseTiming`을 그대로 쓴다** — 이미 받는 절별 시작 초를
  `start/duration*100` 으로 찍으면 된다. 새 API가 필요 없다.
- 길의 모양은 `ROAD_KEYS` 하나가 단일 출처다. 이 배열만 고치면 경사·양의 기울기·걸음 속도·
  맞바람 구간이 **전부 따라 바뀐다**. 손으로 맞추는 값이 없다.
- `prefers-reduced-motion: reduce` 에서는 전부 정지하고 진행바만 남긴다.

## 적용 위치

- 카드: `BibleAudioPlayer.tsx`(장식용 `blur-3xl` 오브 2개는 **뺀다**)
- CSS: `src/pages/Bible/styles/audio-player-scene.css` (새 파일)
- 카드 높이가 75px → 90px 로 커진다(진행바가 고갯길이라 30px 필요). 접기 기능이 있으니
  안 듣는 사람에게는 부담이 되지 않는다.
- **접힌 상태에서는 배경·양을 렌더하지 않는다.** 한 줄 띠에 풍경은 과하다.
