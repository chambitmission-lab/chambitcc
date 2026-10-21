# /companion 동행 히어로 배경 프롬프트 (Gemini용) — v3 도시 편

`/companion` 맨 위 **「혼자 말고, 둘이 한 주를 채워요」 히어로**(`pages/Companion/CompanionList.tsx` 의 `<section>`)
뒤에 깔 배경. 라이트/다크 각 1장.

오른쪽 **발자국 길(파랑·주황)과 길 끝 촛불은 계속 코드(SVG)로 그린다.**
v1(초원·민들레)·v2(초원 위 양 개그)는 "배경이 심심하다 / 너무 동화 초원" 피드백으로 폐기.
v3 방향: **몽글몽글한 파스텔 도시** — 장난감 블록처럼 둥글게 단순화한 한국 도시(한강·골목·육교·지하철 고가),
그 속을 같이 걷는 두 양. 일상 속 동행 = 퇴근길·산책길·주일 가는 길. 멀리 **작은 교회 창 하나가 따뜻하게 켜져 있는 것**이 참빛 시그니처.
두 양은 항상 **파랑 목도리 / 주황 목도리**(발자국 색과 짝).

## 사용법 (복붙 2번이면 끝)

1. Gemini에 **`frontend/public/images/title-bg/gospel_witness.webp`**(양 캐릭터) **1장만** 첨부.
   (초원 그림 verse-scene 은 붙이지 않는다 — 붙이면 다시 들판으로 끌려간다)
2. 아래 시안 중 **하나의 블록을 통째로 복사**해서 보낸다. 비율은 Gemini 화면의 **가로(16:9)**.
3. 마음에 드는 라이트가 나오면 그 결과 이미지를 첨부하고 **맨 아래 「다크 버전」 블록을 통째로** 보낸다(모든 시안 공통).
4. 원본 PNG를 넘겨주면 ✦ 제거·크롭·webp·CSS 적용은 이쪽에서. 저장 예정: `src/assets/companion/hero-{light,dark}.webp`

## 레이아웃 제약 (프롬프트에 이미 들어 있음 — 참고용)

- PC 히어로 ≈ 3.8:1, `cover; right center` → 16:9 그림의 **세로 가운데 50% 띠**만 보인다.
- 왼쪽 50% = 빈 하늘 + 아주 옅은 먼 스카이라인(제목 자리). 오른쪽 절반 세로 가운데 = 발자국이 얹힐 **매끈한 빈 보도**.
- 보도 끝 = 빈 빛 웅덩이(촛불 자리). 캐릭터·소품은 보도 옆(위 금지). 그림에 발자국·초·간판 글씨 금지.
- 가장자리 색: 라이트 ≈ `#e6eefa`, 다크 ≈ `#172131`.

---

## 시안 1. 한강 산책로 노을 — 이어폰 한 쪽씩 (추천)

강변 보도를 걷는 두 양이 유선 이어폰을 한 쪽씩 나눠 끼고, 손엔 아이스 아메리카노. 뒤로 다리와 파스텔 고층 빌딩.
친구·연인·가족 다 되는 장면, 요즘 감성.

```
A wide landscape illustration of a soft, dreamy pastel city. Style: cozy modern illustration with gentle gouache texture, simplified rounded buildings like soft toy blocks with rounded corners, hazy airy light, very little line detail, calm and warm — a marshmallow-soft version of a modern Korean city. Use the lamb character from the attached reference image: fluffy round white wool and simple cute faces. One lamb wears a small blue scarf, the other a small orange scarf.

The mood: everyday, warm and a little playful — two companions sharing an ordinary walk in the city at the same pace, neither ahead nor behind.

Composition: the whole left half of the picture is calm open sky with only a very faint, pale, low-contrast distant skyline at the horizon and almost nothing else. On the right half, a smooth, clean, empty walkway runs horizontally through the exact vertical middle of the picture with soft gentle curves, from the center to near the right edge. The walkway surface is plain, smooth and bare — no tiles, no lines, no markings, no signs on it. The walkway ends near the right edge at a small empty spot with a soft warm pool of light; that spot stays completely empty: NO candles, NO lanterns, NO flames, NO objects. All characters and props stay in the right half, inside the middle band of the picture height (not near the very top or very bottom), right beside the walkway — never standing on it or covering it. The characters are small, about one fifth of the picture height. The bottom right corner is soft and plain.

Scene: a riverside park walkway along the Han River at the end of the day. Behind the walkway, a calm wide river reflects the sky, and beyond it a soft pastel skyline of rounded high-rise buildings and one long gentle bridge. Far away on the right, among the buildings, one small humble church with a little steeple has a single warm glowing window. On the grass just below the walkway, the two lambs walk side by side, sharing one pair of wired earphones — one earbud each, the white cord drooping between them — each holding a tiny iced coffee cup, bobbing their heads to the same song with closed happy eyes. A small round street tree and a park bench at the far right edge.

LIGHT MODE. Bright, high-key soft late-afternoon light. Palette: pale sky blue fading to almost white at the edges (edges very close to #e6eefa), soft peach and lilac tints on the clouds and buildings, pale mint grass, a light warm-gray walkway that is smooth, bright and low in saturation. A gentle warm peach-gold glow only at the empty spot where the walkway ends. Overall airy, soft, dreamy and low-contrast.

The image must contain ONLY the illustration: no footprints, no candles, no text, no numbers, no letters, no signs with writing, no logos, no captions, no user interface elements, no frames, no borders, no rounded corners, no vignette.
```

## 시안 2. 퇴근길 지하철 출구 — 우산 두 개 들고 기다리기

비 오는 저녁, 지하철 출구 앞에서 우산 하나는 쓰고 하나는 짝 몫으로 들고 기다리는 양.
지친 짝이 계단을 올라오다 그걸 보고 반짝 웃는다. = "바쁜 주엔 짝이 메꿔줘요".

```
A wide landscape illustration of a soft, dreamy pastel city. Style: cozy modern illustration with gentle gouache texture, simplified rounded buildings like soft toy blocks with rounded corners, hazy airy light, very little line detail, calm and warm — a marshmallow-soft version of a modern Korean city. Use the lamb character from the attached reference image: fluffy round white wool and simple cute faces. One lamb wears a small blue scarf, the other a small orange scarf.

The mood: everyday, warm and a little playful — two companions who look out for each other in an ordinary city evening.

Composition: the whole left half of the picture is calm open sky with only a very faint, pale, low-contrast distant skyline at the horizon and almost nothing else. On the right half, a smooth, clean, empty sidewalk runs horizontally through the exact vertical middle of the picture with soft gentle curves, from the center to near the right edge. The sidewalk surface is plain, smooth and bare — no tiles, no lines, no markings, no signs on it. The sidewalk ends near the right edge at a small empty spot with a soft warm pool of light; that spot stays completely empty: NO candles, NO lanterns, NO flames, NO objects. All characters and props stay in the right half, inside the middle band of the picture height (not near the very top or very bottom), right beside the sidewalk — never standing on it or covering it. The characters are small, about one fifth of the picture height. The bottom right corner is soft and plain.

Scene: a gentle sprinkle of soft rain on a city street in the evening. Just below the sidewalk, a small rounded subway entrance with soft glowing light coming up the stairs. The lamb with the blue scarf stands at the top of the stairs under a round blue umbrella, holding a second folded orange umbrella out ready, waiting. The lamb with the orange scarf is just climbing up the last steps, a little tired with a tiny briefcase, and its face lights up with a big surprised smile seeing its friend. Behind the street, soft pastel rounded buildings with a few warm windows, a cozy small cafe with warm light, round street trees. Far away on the right, one small humble church with a little steeple has a single warm glowing window. Tiny raindrops sparkle in the light.

LIGHT MODE. Bright, high-key soft light of a gentle rainy afternoon clearing up. Palette: pale sky blue fading to almost white at the edges (edges very close to #e6eefa), soft peach and lilac tints on the clouds and buildings, a light warm-gray sidewalk that is smooth, bright and low in saturation, with faint soft reflections. A gentle warm peach-gold glow only at the empty spot where the sidewalk ends. Overall airy, soft, dreamy and low-contrast.

The image must contain ONLY the illustration: no footprints, no candles, no text, no numbers, no letters, no signs with writing, no subway logos, no captions, no user interface elements, no frames, no borders, no rounded corners, no vignette.
```

## 시안 3. 주일 아침 골목길 — 교회 가는 길 (참빛 시그니처)

빌라·카페·화분이 있는 동네 골목. 한 양이 늦잠 잔 짝의 손을 끌고 뛰어가고, 끌려가는 양은 아직 잠옷 위에 외투, 입에 토스트.
골목 끝 언덕 위 작은 교회 창이 따뜻하다. 피식 웃기는 일요일 아침.

```
A wide landscape illustration of a soft, dreamy pastel city. Style: cozy modern illustration with gentle gouache texture, simplified rounded buildings like soft toy blocks with rounded corners, hazy airy light, very little line detail, calm and warm — a marshmallow-soft version of a modern Korean neighborhood. Use the lamb character from the attached reference image: fluffy round white wool and simple cute faces. One lamb wears a small blue scarf, the other a small orange scarf.

The mood: everyday, warm and playful — a funny, sweet Sunday-morning moment between two companions.

Composition: the whole left half of the picture is calm open sky with only a very faint, pale, low-contrast distant skyline at the horizon and almost nothing else. On the right half, a smooth, clean, empty alley path runs horizontally through the exact vertical middle of the picture with soft gentle curves, from the center to near the right edge. The path surface is plain, smooth and bare — no tiles, no lines, no markings, no signs on it. The path ends near the right edge at a small empty spot with a soft warm pool of light; that spot stays completely empty: NO candles, NO lanterns, NO flames, NO objects. All characters and props stay in the right half, inside the middle band of the picture height (not near the very top or very bottom), right beside the path — never standing on it or covering it. The characters are small, about one fifth of the picture height. The bottom right corner is soft and plain.

Scene: a cozy Korean residential alley on a bright Sunday morning — small rounded villa buildings, potted plants and flowers on doorsteps, a little cafe with an awning, laundry gently drying on a balcony, a sleeping cat on a wall. Just below the path, the lamb with the blue scarf, neatly dressed and holding a small book, runs happily while pulling the other lamb by the hoof. The lamb with the orange scarf is being dragged along, still half asleep, wearing a coat thrown over pajamas, one slipper, with a piece of toast in its mouth and messy wool. At the far right end, up on a small hill above the rooftops, a humble little church with a small steeple has a warm glowing window, the morning sun just behind it.

LIGHT MODE. Bright, high-key fresh morning light. Palette: pale sky blue fading to almost white at the edges (edges very close to #e6eefa), soft peach, butter-yellow and lilac tints on the walls, a light warm-gray path that is smooth, bright and low in saturation. A gentle warm peach-gold glow only at the empty spot where the path ends. Overall airy, soft, dreamy and low-contrast.

The image must contain ONLY the illustration: no footprints, no candles, no text, no numbers, no letters, no signs with writing, no logos, no captions, no user interface elements, no frames, no borders, no rounded corners, no vignette.
```

## 시안 4. 고가 위 지하철 + 육교 — 창밖으로 손 흔드는 짝

파스텔 도시 위로 동글동글한 지하철이 고가를 지나가고, 창문에서 한 양이 손을 흔든다.
아래 육교 위에선 다른 양이 두 손 흔들며 뛰어간다. 다른 길로 가도 같은 방향 — 멀리 사는 짝·가족.

```
A wide landscape illustration of a soft, dreamy pastel city. Style: cozy modern illustration with gentle gouache texture, simplified rounded buildings like soft toy blocks with rounded corners, hazy airy light, very little line detail, calm and warm — a marshmallow-soft version of a modern Korean city. Use the lamb character from the attached reference image: fluffy round white wool and simple cute faces. One lamb wears a small blue scarf, the other a small orange scarf.

The mood: everyday, warm and playful — two companions on different routes, still heading the same way together.

Composition: the whole left half of the picture is calm open sky with only a very faint, pale, low-contrast distant skyline at the horizon and almost nothing else. On the right half, a smooth, clean, empty pedestrian bridge deck runs horizontally through the exact vertical middle of the picture with a soft gentle curve, from the center to near the right edge. Its surface is plain, smooth and bare — no tiles, no lines, no markings, no signs on it. It ends near the right edge at a small empty spot with a soft warm pool of light; that spot stays completely empty: NO candles, NO lanterns, NO flames, NO objects. All characters and props stay in the right half, inside the middle band of the picture height (not near the very top or very bottom), and never stand on the bridge deck or cover it. The characters are small, about one sixth of the picture height. The bottom right corner is soft and plain.

Scene: just above the pedestrian bridge, a short, chubby, rounded pastel subway train glides along an elevated track in the same direction. From one round train window, the lamb with the orange scarf leans out a little and waves happily. Just below the bridge deck, on a little staircase leading up to it, the lamb with the blue scarf waves back with both hooves while hopping along. Behind them, soft rounded pastel apartment buildings and small office towers with a few warm windows, round street trees. Far away on the right, one small humble church with a little steeple has a single warm glowing window. A few birds fly in the same direction as the train.

LIGHT MODE. Bright, high-key soft afternoon light. Palette: pale sky blue fading to almost white at the edges (edges very close to #e6eefa), soft peach, mint and lilac tints on the train and buildings, a light warm-gray bridge deck that is smooth, bright and low in saturation. A gentle warm peach-gold glow only at the empty spot where the bridge deck ends. Overall airy, soft, dreamy and low-contrast.

The image must contain ONLY the illustration: no footprints, no candles, no text, no numbers, no letters, no route numbers, no signs with writing, no logos, no captions, no user interface elements, no frames, no borders, no rounded corners, no vignette.
```

## 시안 5. 루프탑 저녁 — 캐릭터 없이 도시만 (가장 깔끔)

양 없이 도시 풍경만. 옥상 위 작은 정원, 빨랫줄에 **파랑·주황 목도리 두 장**이 나란히 걸려 바람에 같이 흔들린다(둘이 함께 사는/같이 걷는 은유).
멀리 교회 창 하나. 발자국 SVG가 주인공이 되는 구도.

```
A wide landscape illustration of a soft, dreamy pastel city. Style: cozy modern illustration with gentle gouache texture, simplified rounded buildings like soft toy blocks with rounded corners, hazy airy light, very little line detail, calm and warm — a marshmallow-soft version of a modern Korean city.

The mood: quiet, warm and gently witty — the trace of two companions who share daily life, without showing them.

Composition: the whole left half of the picture is calm open sky with only a very faint, pale, low-contrast distant skyline at the horizon and almost nothing else. On the right half, a smooth, clean, empty rooftop walkway runs horizontally through the exact vertical middle of the picture with soft gentle curves, from the center to near the right edge. Its surface is plain, smooth and bare — no tiles, no lines, no markings, no signs on it. It ends near the right edge at a small empty spot with a soft warm pool of light; that spot stays completely empty: NO candles, NO lanterns, NO flames, NO objects. All props stay in the right half, inside the middle band of the picture height (not near the very top or very bottom), right beside the walkway — never on it or covering it. The bottom right corner is soft and plain.

Scene: a cozy little rooftop garden on top of a city building. Round potted plants, a small vegetable box, two little folding chairs side by side facing the view, with two mugs on a tiny table between them. On a laundry line just above the walkway, a blue scarf and an orange scarf hang side by side, fluttering together in the same breeze. Beyond the rooftop, a soft pastel skyline of rounded buildings with a few warm windows. Far away on the right, one small humble church with a little steeple has a single warm glowing window. A pair of small birds sits close together on the laundry line.

LIGHT MODE. Bright, high-key soft late-afternoon light. Palette: pale sky blue fading to almost white at the edges (edges very close to #e6eefa), soft peach and lilac tints on the clouds and buildings, fresh green plants, a light warm-gray walkway that is smooth, bright and low in saturation. A gentle warm peach-gold glow only at the empty spot where the walkway ends. Overall airy, soft, dreamy and low-contrast.

The image must contain ONLY the illustration: no people, no animals except the two small birds, no footprints, no candles, no text, no numbers, no letters, no signs with writing, no logos, no captions, no user interface elements, no frames, no borders, no rounded corners, no vignette.
```

---

## 다크 버전 (모든 시안 공통 — 고른 라이트 결과 이미지를 첨부하고 이 블록만 보내기)

```
Make the exact same picture with the exact same composition, the same characters in the same poses, and the same style — as a cozy city night version.

DARK MODE. Palette: deep muted navy night sky (edges very close to #172131), a few tiny faint stars and a thin crescent moon high in the upper right. The city glows softly: many small warm amber windows in the rounded buildings, soft street lights, gentle reflections. The small church far away on the right has a slightly brighter, warm glowing window. The walkway stays a smooth, flat, slightly lighter dusky blue so it still reads as a calm empty lane. The lambs' white wool catches soft light so they stay clearly visible and cute; the blue and orange scarves keep their colors, just softer. A soft, low amber glow pools at the empty spot where the walkway ends. Everything else stays dark, soft and cozy, never neon or harsh. Keep the left half calm, empty night sky with only a very faint skyline.

The image must contain ONLY the illustration: no footprints, no candles, no flames, no text, no numbers, no letters, no signs with writing, no logos, no captions, no user interface elements, no frames, no borders, no rounded corners, no vignette.
```

---

## 고를 때 체크리스트

- [ ] 그림 안에 **발자국·초·간판 글씨·로고가 없나** (도시라서 간판 글씨가 잘 생긴다 — 있으면 탈락 or 지워 달라고 재요청)
- [ ] 오른쪽 절반 세로 가운데에 **매끈한 빈 보도**가 지나가고, 캐릭터가 길을 가리지 않나
- [ ] 캐릭터·소품이 세로 가운데 50% 띠 안에 있나(PC에서 위아래가 잘린다)
- [ ] 왼쪽 절반이 비어 있나(스카이라인은 아주 옅게만)
- [ ] 건물이 둥글둥글 몽글한가(각진 실사 도시면 탈락)
- [ ] 목도리 색이 파랑/주황인가, 멀리 교회 창 하나가 따뜻한가
- [ ] 라이트/다크 구도가 같은가

## 적용 메모 (받으면 이쪽에서)

- `<section>` 의 `bg-[var(--brand-soft)]` 위에 `cover; right center` 로 얹고, 왼쪽 제목 칸은 카드 면 색 워시로 가독성 확보.
- 그림 속 보도 높이에 `FootprintPath` 의 `MID`(viewBox y=50)가 오도록 맞춤.
- 모바일(세로 배치)은 그림을 옅게 / 발자국 블록 뒤로만 잘라 깔기.
- 테마 전환 선로딩은 `themeAssets.ts` 에 등록.

## 적용 상태 (2026-10-21)

- 시안 3(주일 아침 골목) 라이트/다크 적용 → `src/assets/companion/hero-{light,dark}.webp`.
  제미나이 결과가 왼쪽 절반을 단색 판으로 그려 와서 **오른쪽 장면(x 688~1376)만 잘라** 688×768 webp q82(36KB/30KB).
  ✦ 는 `gemini-unwatermark.py`(라이트 `--min-step=4`), 잔차 0.15/0.06 — 자국 없음.
- **히어로에서 발자국 길(FootprintPath)·촛불은 뺐다** — 양 두 마리가 이미 동행을 보여 주고, 겹치면 양 얼굴을 가린다.
  (짝 카드의 실제 진행 발자국은 그대로)
- lg: `.cp-hero-art` 를 카드 오른쪽 62%에 `cover; right 70%`, 왼쪽 38%는 마스크로 녹임. 글 칸은 `max-w-[46%]`.
  모바일: 글 뒤에 깔면 양이 글씨와 섞여 탁해서 **글·버튼 사이 200px 띠**(위아래 마스크, `center 72%`)로 둔다.
- 본문은 `break-keep` — "합/쳐서" 같은 낱말 중간 줄바꿈 방지.
- 언덕 위 교회는 PC에서 꼭대기에 살짝만 보인다(교회를 살리려면 교회가 더 아래 있는 컷으로 재생성).
- 선로딩: `themeAssets.ts COMPANION_HERO` + `useThemeArt` → `is-loaded` 페이드인.
