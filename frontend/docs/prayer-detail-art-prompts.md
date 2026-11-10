# 기도 상세 머리 그림 — Gemini 복사용 프롬프트

기도 상세 모달 맨 위 그림 띠(`PrayerDetail/prayerArt.ts`, `.pd-art`)에 쓰는 감정별 풍경 9장 × 라이트·다크.

## 왜 새로 그리나

- 지금은 `/bible/situation` 감정 타일 그림(16:9, 1376px)을 빌려 쓴다. 띠는 PC에서 **가로 1280 × 세로 216**(약 6:1)이라 그림의 가운데 줄만 잘라 크게 늘려 보여 주게 되고, 고해상도 화면에서 흐려 보인다.
- 기도 감정 8개 중 **소망**은 짝이 되는 그림이 없어 창가 그림으로 대신하고 있다. 분노·혼란도 다른 감정 그림을 빌려 쓴다.
- 새 그림은 처음부터 **가로로 아주 긴 띠**에 맞춰 그린다: 중요한 것은 전부 세로 가운데 줄에, 위·아래는 잘려도 되는 하늘과 땅.

## 참빛교회다움을 넣는 방법

1. **참 빛 한 점** — 장면마다 양 곁에 따뜻한 금빛 하나(등불·햇살·창빛). 기분을 고쳐 주지 않고 그냥 거기 있다. 밤이 될수록 또렷해진다(요 1:5).
2. **멀리 보이는 교회** — 지평선에 아주 작게, 높은 네모 탑과 흰 빛 십자가(실제 참빛교회 건물의 탑). 다크에서는 창 두세 개에 불이 켜진다 = "지금 누군가 기도하고 있다".
3. **같은 어린 양** — 기존 감정 삽화의 양을 참고 이미지로 붙여 그림체를 맞춘다. 양은 작게, 뒷모습.

## 쓰는 법

1. **라이트:** Gemini 새 대화 → 참고 이미지로 `frontend/src/assets/situation-moods/sad-light.webp` 첨부 → 아래 **라이트** 칸을 통째로 복사해 붙여넣기. 비율은 **21:9**(없으면 16:9)로, 해상도는 고를 수 있는 가장 큰 것(2K 이상).
2. **다크:** Gemini 새 대화 → **같은 장면의 라이트 완성본** 첨부 → 아래 **다크** 칸을 통째로 복사해 붙여넣기.
3. **저장:** 표의 파일 이름으로 `Downloads` 폴더에 두고 알려 주세요. 워터마크 제거·자르기·변환(2560px webp)·적용은 제가 합니다.

| # | 기도 감정 | 장면 | 라이트 | 다크 |
|---|---|---|---|---|
| 1 | 불안 | 바람 부는 언덕, 돌담 뒤의 등불 | `prayer-anxious-light.png` | `prayer-anxious-dark.png` |
| 2 | 지침 | 먼 길 끝, 나무 아래 저녁 햇살 | `prayer-tired-light.png` | `prayer-tired-dark.png` |
| 3 | 슬픔 | 비 그치는 호숫가, 구름 사이 빛 | `prayer-sad-light.png` | `prayer-sad-dark.png` |
| 4 | 외로움 | 빈 들판의 벤치와 가로등 | `prayer-lonely-light.png` | `prayer-lonely-dark.png` |
| 5 | 분노 | 폭풍이 물러가는 바위 능선 | `prayer-angry-light.png` | `prayer-angry-dark.png` |
| 6 | 혼란 | 안개 낀 갈림길의 등불 | `prayer-confused-light.png` | `prayer-confused-dark.png` |
| 7 | 소망 | 눈 녹는 들판의 새벽, 첫 새싹 | `prayer-hopeful-light.png` | `prayer-hopeful-dark.png` |
| 8 | 감사 | 추수 때의 밀밭, 늦은 오후 | `prayer-grateful-light.png` | `prayer-grateful-dark.png` |
| 9 | 기본(감정 없음) | 이슬 맺힌 아침 풀밭, 언덕 위 교회 | `prayer-default-light.png` | `prayer-default-dark.png` |

### 받아 보고 확인할 것

- 양·금빛·교회가 **세로 가운데 줄**에 있는가 (위아래 1/3이 잘려도 괜찮은가)
- **왼쪽 절반이 비어 있고 고요한가** (작성자 이름·기도 버튼이 올라간다)
- 교회가 **아주 작고 흐린가**, 간판 글자가 그려지지 않았는가
- 양이 만화 얼굴·눈물 없이 **작은 뒷모습**인가

어긋나면 같은 대화에서 "Move the lamb and the light into the middle horizontal band" 처럼 한 줄로 고쳐 달라고 하면 됩니다.

---

## 1. 불안

### 라이트 → `prayer-anxious-light.png` (`sad-light.webp` 첨부)

```
An ultra-wide 21:9 panoramic hand-painted landscape, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, atmospheric depth, gentle cinematic light. Paint at the highest resolution available with clean, crisp brushwork (it will be shown large on a desktop screen). Use exactly the same painting style and the same small white lamb as the attached reference image. NOT a cartoon, NOT clip-art, no thick outlines.

The emotion comes from the weather, the time of day, the light and the empty space, not from a facial expression. The lamb is small, about one sixth of the image height, seen from behind or from the side. No cartoon face, no tears, no exaggerated pose.

There is ONE warm golden light (#f6c86a) close to the lamb, the warmest point of the whole painting. It does not fix the mood; it is simply there.

Far away on the horizon, at about 55% of the width, stands a tiny modern stone church with a tall, slim rectangular tower; a thin vertical cross on the tower glows softly white. It is very small (no taller than 6% of the image height), pale and hazy with distance, almost part of the horizon. The lamb is turned slightly towards it.

IMPORTANT composition (this image will be cropped to a very wide, short banner): everything that matters, the lamb, the golden light, the horizon and the tiny church, must sit inside the MIDDLE horizontal band of the image, between 38% and 62% of the height. The top third is only open sky. The bottom third is only soft, simple foreground with very little detail and no important objects. The lamb and the golden light are close together on the right, between 64% and 82% of the width. The left half is calm, open, bright space with little detail (text will be placed over it).

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

Colour mood: pale windy sky blue and silver-green, blue dusk. Light, airy and high-key overall; the lower left is the palest part.

Scene: A wide grassy hillside at blue dusk in a strong wind: long grass streaming sideways, loose clouds racing across the sky, a few leaves torn into the air. Everything is moving. On the right stands a low round stone sheepfold wall, and the small lamb has tucked itself against the sheltered side of the wall, out of the wind, seen from behind. On the wooden gate post right beside the lamb hangs a small lantern with a steady warm golden flame that the wind does not move.
```

### 다크 → `prayer-anxious-dark.png` (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same ultra-wide 21:9 composition, the same lamb in exactly the same place and size, the same tiny church on the horizon, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal (#1a1815), and the lower left is the darkest, calmest part. The lamb's wool is a dim warm grey, not bright white.

The ONE warm golden light (#f6c86a) near the lamb is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the side of the lamb that faces it and on the ground around it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

The tiny church on the horizon is now a dark silhouette: its thin cross glows softly white, and two or three of its small windows are lit warm gold, as if people are inside praying. It stays tiny and far away.

Everything that matters stays inside the middle horizontal band (38% to 62% of the height). The top third is only night sky, with a few faint stars on the right side only. The bottom third is only dark, simple foreground. The left half stays calm and dark with little detail.

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

At night: A windy night with dark racing clouds. The steady lantern on the gate post is the one warm point, its light holding the lamb and the stones of the wall.
```

---

## 2. 지침

### 라이트 → `prayer-tired-light.png` (`sad-light.webp` 첨부)

```
An ultra-wide 21:9 panoramic hand-painted landscape, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, atmospheric depth, gentle cinematic light. Paint at the highest resolution available with clean, crisp brushwork (it will be shown large on a desktop screen). Use exactly the same painting style and the same small white lamb as the attached reference image. NOT a cartoon, NOT clip-art, no thick outlines.

The emotion comes from the weather, the time of day, the light and the empty space, not from a facial expression. The lamb is small, about one sixth of the image height, seen from behind or from the side. No cartoon face, no tears, no exaggerated pose.

There is ONE warm golden light (#f6c86a) close to the lamb, the warmest point of the whole painting. It does not fix the mood; it is simply there.

Far away on the horizon, at about 55% of the width, stands a tiny modern stone church with a tall, slim rectangular tower; a thin vertical cross on the tower glows softly white. It is very small (no taller than 6% of the image height), pale and hazy with distance, almost part of the horizon. The lamb is turned slightly towards it.

IMPORTANT composition (this image will be cropped to a very wide, short banner): everything that matters, the lamb, the golden light, the horizon and the tiny church, must sit inside the MIDDLE horizontal band of the image, between 38% and 62% of the height. The top third is only open sky. The bottom third is only soft, simple foreground with very little detail and no important objects. The lamb and the golden light are close together on the right, between 64% and 82% of the width. The left half is calm, open, bright space with little detail (text will be placed over it).

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

Colour mood: soft peach and dusty apricot sunset. Light, airy and high-key overall; the lower left is the palest part.

Scene: A long winding dirt path comes from far away on the left across low rolling hills, showing how far it has come; the path continues on towards the tiny church. On the right, under a single old olive tree by the roadside, the small lamb has finally sat down and is resting against the trunk, a little cloth bundle set down beside it. The last warm golden sunlight of the evening slants low through the branches and rests on the lamb's back like a blanket.
```

### 다크 → `prayer-tired-dark.png` (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same ultra-wide 21:9 composition, the same lamb in exactly the same place and size, the same tiny church on the horizon, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal (#1a1815), and the lower left is the darkest, calmest part. The lamb's wool is a dim warm grey, not bright white.

The ONE warm golden light (#f6c86a) near the lamb is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the side of the lamb that faces it and on the ground around it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

The tiny church on the horizon is now a dark silhouette: its thin cross glows softly white, and two or three of its small windows are lit warm gold, as if people are inside praying. It stays tiny and far away.

Everything that matters stays inside the middle horizontal band (38% to 62% of the height). The top third is only night sky, with a few faint stars on the right side only. The bottom third is only dark, simple foreground. The left half stays calm and dark with little detail.

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

At night: A still, warm night. The sunlight is gone; instead a small lantern hangs from the lowest branch of the olive tree, and its golden light rests on the sleeping lamb's back exactly where the sunlight was. The path behind is lost in the dark.
```

---

## 3. 슬픔

### 라이트 → `prayer-sad-light.png` (`sad-light.webp` 첨부)

```
An ultra-wide 21:9 panoramic hand-painted landscape, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, atmospheric depth, gentle cinematic light. Paint at the highest resolution available with clean, crisp brushwork (it will be shown large on a desktop screen). Use exactly the same painting style and the same small white lamb as the attached reference image. NOT a cartoon, NOT clip-art, no thick outlines.

The emotion comes from the weather, the time of day, the light and the empty space, not from a facial expression. The lamb is small, about one sixth of the image height, seen from behind or from the side. No cartoon face, no tears, no exaggerated pose.

There is ONE warm golden light (#f6c86a) close to the lamb, the warmest point of the whole painting. It does not fix the mood; it is simply there.

Far away on the horizon, at about 55% of the width, stands a tiny modern stone church with a tall, slim rectangular tower; a thin vertical cross on the tower glows softly white. It is very small (no taller than 6% of the image height), pale and hazy with distance, almost part of the horizon. The lamb is turned slightly towards it.

IMPORTANT composition (this image will be cropped to a very wide, short banner): everything that matters, the lamb, the golden light, the horizon and the tiny church, must sit inside the MIDDLE horizontal band of the image, between 38% and 62% of the height. The top third is only open sky. The bottom third is only soft, simple foreground with very little detail and no important objects. The lamb and the golden light are close together on the right, between 64% and 82% of the width. The left half is calm, open, bright space with little detail (text will be placed over it).

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

Colour mood: soft lilac-grey and pearl, with one pale gold opening. Light, airy and high-key overall; the lower left is the palest part.

Scene: A wide, perfectly still lake just as a long rain is ending. Thin veils of rain still hang over the far left of the water; the surface is ringed with the last few raindrops. On the right, the small lamb sits on a flat rock at the water's edge, its wool a little damp, seen from behind, looking across the lake towards the far shore where the tiny church stands. Directly above the lamb the grey clouds have opened a little, and a single soft shaft of warm golden light comes down and lies on the lamb and on the water in front of it.
```

### 다크 → `prayer-sad-dark.png` (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same ultra-wide 21:9 composition, the same lamb in exactly the same place and size, the same tiny church on the horizon, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal (#1a1815), and the lower left is the darkest, calmest part. The lamb's wool is a dim warm grey, not bright white.

The ONE warm golden light (#f6c86a) near the lamb is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the side of the lamb that faces it and on the ground around it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

The tiny church on the horizon is now a dark silhouette: its thin cross glows softly white, and two or three of its small windows are lit warm gold, as if people are inside praying. It stays tiny and far away.

Everything that matters stays inside the middle horizontal band (38% to 62% of the height). The top third is only night sky, with a few faint stars on the right side only. The bottom third is only dark, simple foreground. The left half stays calm and dark with little detail.

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

At night: The rain has stopped and the lake is black and still. A small lantern stands on the rock beside the lamb, and its golden light and the lit windows of the far church both lay thin gold lines across the dark water, reaching towards each other.
```

---

## 4. 외로움

### 라이트 → `prayer-lonely-light.png` (`sad-light.webp` 첨부)

```
An ultra-wide 21:9 panoramic hand-painted landscape, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, atmospheric depth, gentle cinematic light. Paint at the highest resolution available with clean, crisp brushwork (it will be shown large on a desktop screen). Use exactly the same painting style and the same small white lamb as the attached reference image. NOT a cartoon, NOT clip-art, no thick outlines.

The emotion comes from the weather, the time of day, the light and the empty space, not from a facial expression. The lamb is small, about one sixth of the image height, seen from behind or from the side. No cartoon face, no tears, no exaggerated pose.

There is ONE warm golden light (#f6c86a) close to the lamb, the warmest point of the whole painting. It does not fix the mood; it is simply there.

Far away on the horizon, at about 55% of the width, stands a tiny modern stone church with a tall, slim rectangular tower; a thin vertical cross on the tower glows softly white. It is very small (no taller than 6% of the image height), pale and hazy with distance, almost part of the horizon. The lamb is turned slightly towards it.

IMPORTANT composition (this image will be cropped to a very wide, short banner): everything that matters, the lamb, the golden light, the horizon and the tiny church, must sit inside the MIDDLE horizontal band of the image, between 38% and 62% of the height. The top third is only open sky. The bottom third is only soft, simple foreground with very little detail and no important objects. The lamb and the golden light are close together on the right, between 64% and 82% of the width. The left half is calm, open, bright space with little detail (text will be placed over it).

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

Colour mood: dusty rose and soft mauve early evening, very quiet. Light, airy and high-key overall; the lower left is the palest part.

Scene: A very wide, empty meadow in the quiet just after sunset, with nothing in it for a long way in every direction. On the right stands a single old wooden bench with one old-fashioned lamp post beside it; the lamp has just come on with a warm golden glow. The small lamb sits on one end of the bench, seen from behind, with the other half of the bench left empty beside it, as if the seat is being kept for someone. The lamb looks out across the empty meadow towards the tiny church.
```

### 다크 → `prayer-lonely-dark.png` (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same ultra-wide 21:9 composition, the same lamb in exactly the same place and size, the same tiny church on the horizon, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal (#1a1815), and the lower left is the darkest, calmest part. The lamb's wool is a dim warm grey, not bright white.

The ONE warm golden light (#f6c86a) near the lamb is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the side of the lamb that faces it and on the ground around it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

The tiny church on the horizon is now a dark silhouette: its thin cross glows softly white, and two or three of its small windows are lit warm gold, as if people are inside praying. It stays tiny and far away.

Everything that matters stays inside the middle horizontal band (38% to 62% of the height). The top third is only night sky, with a few faint stars on the right side only. The bottom third is only dark, simple foreground. The left half stays calm and dark with little detail.

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

At night: Full night over the empty meadow. The lamp post makes one small round pool of golden light that holds the bench and the lamb, including the empty seat beside it. Far away the church windows are lit: the lamb is not the only one awake.
```

---

## 5. 분노

### 라이트 → `prayer-angry-light.png` (`sad-light.webp` 첨부)

```
An ultra-wide 21:9 panoramic hand-painted landscape, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, atmospheric depth, gentle cinematic light. Paint at the highest resolution available with clean, crisp brushwork (it will be shown large on a desktop screen). Use exactly the same painting style and the same small white lamb as the attached reference image. NOT a cartoon, NOT clip-art, no thick outlines.

The emotion comes from the weather, the time of day, the light and the empty space, not from a facial expression. The lamb is small, about one sixth of the image height, seen from behind or from the side. No cartoon face, no tears, no exaggerated pose.

There is ONE warm golden light (#f6c86a) close to the lamb, the warmest point of the whole painting. It does not fix the mood; it is simply there.

Far away on the horizon, at about 55% of the width, stands a tiny modern stone church with a tall, slim rectangular tower; a thin vertical cross on the tower glows softly white. It is very small (no taller than 6% of the image height), pale and hazy with distance, almost part of the horizon. The lamb is turned slightly towards it.

IMPORTANT composition (this image will be cropped to a very wide, short banner): everything that matters, the lamb, the golden light, the horizon and the tiny church, must sit inside the MIDDLE horizontal band of the image, between 38% and 62% of the height. The top third is only open sky. The bottom third is only soft, simple foreground with very little detail and no important objects. The lamb and the golden light are close together on the right, between 64% and 82% of the width. The left half is calm, open, bright space with little detail (text will be placed over it).

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

Colour mood: warm sand and pale terracotta under a clearing slate-violet sky. Light, airy and high-key overall; the lower left is the palest part.

Scene: A bare rocky ridge just after a violent storm has passed over. The heavy storm clouds are still visible but are moving away and thinning into pale washed sky on the left; the wind has dropped. A few broken branches and scattered stones lie about. On the right, the small lamb stands still on the ridge, seen from behind, its wool ruffled by the last of the wind. In a hollow of the rock right beside the lamb the rain has left a small, perfectly calm pool, and the first low golden sunlight after the storm is reflected in it.
```

### 다크 → `prayer-angry-dark.png` (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same ultra-wide 21:9 composition, the same lamb in exactly the same place and size, the same tiny church on the horizon, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal (#1a1815), and the lower left is the darkest, calmest part. The lamb's wool is a dim warm grey, not bright white.

The ONE warm golden light (#f6c86a) near the lamb is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the side of the lamb that faces it and on the ground around it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

The tiny church on the horizon is now a dark silhouette: its thin cross glows softly white, and two or three of its small windows are lit warm gold, as if people are inside praying. It stays tiny and far away.

Everything that matters stays inside the middle horizontal band (38% to 62% of the height). The top third is only night sky, with a few faint stars on the right side only. The bottom third is only dark, simple foreground. The left half stays calm and dark with little detail.

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

At night: The storm is only a faint flicker of far-off lightning low on the far left horizon, too distant to hear. The ridge is quiet. A small lantern stands on the rock beside the lamb, and its golden flame is reflected, perfectly still, in the calm pool.
```

---

## 6. 혼란

### 라이트 → `prayer-confused-light.png` (`sad-light.webp` 첨부)

```
An ultra-wide 21:9 panoramic hand-painted landscape, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, atmospheric depth, gentle cinematic light. Paint at the highest resolution available with clean, crisp brushwork (it will be shown large on a desktop screen). Use exactly the same painting style and the same small white lamb as the attached reference image. NOT a cartoon, NOT clip-art, no thick outlines.

The emotion comes from the weather, the time of day, the light and the empty space, not from a facial expression. The lamb is small, about one sixth of the image height, seen from behind or from the side. No cartoon face, no tears, no exaggerated pose.

There is ONE warm golden light (#f6c86a) close to the lamb, the warmest point of the whole painting. It does not fix the mood; it is simply there.

Far away on the horizon, at about 55% of the width, stands a tiny modern stone church with a tall, slim rectangular tower; a thin vertical cross on the tower glows softly white. It is very small (no taller than 6% of the image height), pale and hazy with distance, almost part of the horizon. The lamb is turned slightly towards it.

IMPORTANT composition (this image will be cropped to a very wide, short banner): everything that matters, the lamb, the golden light, the horizon and the tiny church, must sit inside the MIDDLE horizontal band of the image, between 38% and 62% of the height. The top third is only open sky. The bottom third is only soft, simple foreground with very little detail and no important objects. The lamb and the golden light are close together on the right, between 64% and 82% of the width. The left half is calm, open, bright space with little detail (text will be placed over it).

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

Colour mood: pale pearl-white morning mist with soft sage green and a hint of warm amber. Light, airy and high-key overall; the lower left is the palest part.

Scene: Early morning in thick, soft mist over open fields. A narrow footpath comes in and, on the right, splits into three faint paths that each fade into the mist after a few steps, so that none of them shows where it goes. The small lamb stands at the fork, seen from behind, not yet choosing. On the ground at its feet sits a small lantern with a warm golden flame that lights only the next few steps of grass and path. Far off, the mist has thinned in just one place, and there the thin white cross of the tiny church shows through.
```

### 다크 → `prayer-confused-dark.png` (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same ultra-wide 21:9 composition, the same lamb in exactly the same place and size, the same tiny church on the horizon, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal (#1a1815), and the lower left is the darkest, calmest part. The lamb's wool is a dim warm grey, not bright white.

The ONE warm golden light (#f6c86a) near the lamb is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the side of the lamb that faces it and on the ground around it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

The tiny church on the horizon is now a dark silhouette: its thin cross glows softly white, and two or three of its small windows are lit warm gold, as if people are inside praying. It stays tiny and far away.

Everything that matters stays inside the middle horizontal band (38% to 62% of the height). The top third is only night sky, with a few faint stars on the right side only. The bottom third is only dark, simple foreground. The left half stays calm and dark with little detail.

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

At night: Night mist. The three paths are invisible beyond the small circle of lantern light at the lamb's feet. Through the one thin place in the mist, the church's white cross and one lit window are the only things visible in the distance.
```

---

## 7. 소망

### 라이트 → `prayer-hopeful-light.png` (`sad-light.webp` 첨부)

```
An ultra-wide 21:9 panoramic hand-painted landscape, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, atmospheric depth, gentle cinematic light. Paint at the highest resolution available with clean, crisp brushwork (it will be shown large on a desktop screen). Use exactly the same painting style and the same small white lamb as the attached reference image. NOT a cartoon, NOT clip-art, no thick outlines.

The emotion comes from the weather, the time of day, the light and the empty space, not from a facial expression. The lamb is small, about one sixth of the image height, seen from behind or from the side. No cartoon face, no tears, no exaggerated pose.

There is ONE warm golden light (#f6c86a) close to the lamb, the warmest point of the whole painting. It does not fix the mood; it is simply there.

Far away on the horizon, at about 55% of the width, stands a tiny modern stone church with a tall, slim rectangular tower; a thin vertical cross on the tower glows softly white. It is very small (no taller than 6% of the image height), pale and hazy with distance, almost part of the horizon. The lamb is turned slightly towards it.

IMPORTANT composition (this image will be cropped to a very wide, short banner): everything that matters, the lamb, the golden light, the horizon and the tiny church, must sit inside the MIDDLE horizontal band of the image, between 38% and 62% of the height. The top third is only open sky. The bottom third is only soft, simple foreground with very little detail and no important objects. The lamb and the golden light are close together on the right, between 64% and 82% of the width. The left half is calm, open, bright space with little detail (text will be placed over it).

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

Colour mood: fresh dawn, pale aqua and soft spring green with a warm peach-gold horizon. Light, airy and high-key overall; the lower left is the palest part.

Scene: The very end of winter, a few minutes before sunrise. A wide field where the last thin patches of snow are melting and the dark earth shows through; here and there the first tiny green shoots have come up. A bare young tree on the right has its first few pale buds. The small lamb stands beside the tree, seen from behind, facing the horizon. Right there on the horizon, just beside the lamb, the first rim of the sun is appearing as a warm golden glow, and its first light touches the lamb, the buds and the top of the tiny church's tower.
```

### 다크 → `prayer-hopeful-dark.png` (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same ultra-wide 21:9 composition, the same lamb in exactly the same place and size, the same tiny church on the horizon, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal (#1a1815), and the lower left is the darkest, calmest part. The lamb's wool is a dim warm grey, not bright white.

The ONE warm golden light (#f6c86a) near the lamb is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the side of the lamb that faces it and on the ground around it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

The tiny church on the horizon is now a dark silhouette: its thin cross glows softly white, and two or three of its small windows are lit warm gold, as if people are inside praying. It stays tiny and far away.

Everything that matters stays inside the middle horizontal band (38% to 62% of the height). The top third is only night sky, with a few faint stars on the right side only. The bottom third is only dark, simple foreground. The left half stays calm and dark with little detail.

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

At night: The last hour of the night, before any dawn. The sun is not up, but exactly where it will rise there is a thin warm golden line along the horizon beside the lamb, the first sign of morning, and one bright morning star above it. The green shoots are just visible in that faint light.
```

---

## 8. 감사

### 라이트 → `prayer-grateful-light.png` (`sad-light.webp` 첨부)

```
An ultra-wide 21:9 panoramic hand-painted landscape, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, atmospheric depth, gentle cinematic light. Paint at the highest resolution available with clean, crisp brushwork (it will be shown large on a desktop screen). Use exactly the same painting style and the same small white lamb as the attached reference image. NOT a cartoon, NOT clip-art, no thick outlines.

The emotion comes from the weather, the time of day, the light and the empty space, not from a facial expression. The lamb is small, about one sixth of the image height, seen from behind or from the side. No cartoon face, no tears, no exaggerated pose.

There is ONE warm golden light (#f6c86a) close to the lamb, the warmest point of the whole painting. It does not fix the mood; it is simply there.

Far away on the horizon, at about 55% of the width, stands a tiny modern stone church with a tall, slim rectangular tower; a thin vertical cross on the tower glows softly white. It is very small (no taller than 6% of the image height), pale and hazy with distance, almost part of the horizon. The lamb is turned slightly towards it.

IMPORTANT composition (this image will be cropped to a very wide, short banner): everything that matters, the lamb, the golden light, the horizon and the tiny church, must sit inside the MIDDLE horizontal band of the image, between 38% and 62% of the height. The top third is only open sky. The bottom third is only soft, simple foreground with very little detail and no important objects. The lamb and the golden light are close together on the right, between 64% and 82% of the width. The left half is calm, open, bright space with little detail (text will be placed over it).

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

Colour mood: warm cream and honey gold, late-afternoon harvest light. Light, airy and high-key overall; the lower left is the palest part.

Scene: A wide field of ripe wheat on gently rolling hills in late afternoon, the ears moving in slow waves in a light breeze. Part of the field on the right has been harvested, and a few bound sheaves stand in a small group. The small lamb stands on a low rise beside the sheaves, seen from behind, quietly looking out over the whole field towards the tiny church. The low sun sits just beside the lamb, a soft warm golden disc in a pale sky, edging the lamb's wool and the tops of the wheat with light.
```

### 다크 → `prayer-grateful-dark.png` (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same ultra-wide 21:9 composition, the same lamb in exactly the same place and size, the same tiny church on the horizon, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal (#1a1815), and the lower left is the darkest, calmest part. The lamb's wool is a dim warm grey, not bright white.

The ONE warm golden light (#f6c86a) near the lamb is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the side of the lamb that faces it and on the ground around it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

The tiny church on the horizon is now a dark silhouette: its thin cross glows softly white, and two or three of its small windows are lit warm gold, as if people are inside praying. It stays tiny and far away.

Everything that matters stays inside the middle horizontal band (38% to 62% of the height). The top third is only night sky, with a few faint stars on the right side only. The bottom third is only dark, simple foreground. The left half stays calm and dark with little detail.

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

At night: A clear, mild harvest night. Where the sun was, a small lantern now stands on top of the sheaves beside the lamb, and its golden light catches the nearest ears of wheat so that they glow like small flames against the dark field.
```

---

## 9. 기본 (감정을 고르지 않은 기도)

교회가 다른 장면보다 조금 더 가깝고 또렷하다 — 감정 대신 "참빛교회에서 올리는 기도"가 주제.

### 라이트 → `prayer-default-light.png` (`sad-light.webp` 첨부)

```
An ultra-wide 21:9 panoramic hand-painted landscape, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, atmospheric depth, gentle cinematic light. Paint at the highest resolution available with clean, crisp brushwork (it will be shown large on a desktop screen). Use exactly the same painting style and the same small white lamb as the attached reference image. NOT a cartoon, NOT clip-art, no thick outlines.

The emotion comes from the weather, the time of day, the light and the empty space, not from a facial expression. The lamb is small, about one sixth of the image height, seen from behind or from the side. No cartoon face, no tears, no exaggerated pose.

There is ONE warm golden light (#f6c86a) close to the lamb, the warmest point of the whole painting. It does not fix the mood; it is simply there.

On a low green hill at about 55% of the width stands a small modern stone church with a tall, slim rectangular tower; a thin vertical cross on the tower glows softly white. It is small (about 10% of the image height), soft and a little hazy with distance, with no sign and no lettering on it. The lamb is turned towards it.

IMPORTANT composition (this image will be cropped to a very wide, short banner): everything that matters, the lamb, the golden light, the horizon and the church, must sit inside the MIDDLE horizontal band of the image, between 38% and 62% of the height. The top third is only open sky. The bottom third is only soft, simple foreground with very little detail and no important objects. The lamb and the golden light are close together on the right, between 64% and 82% of the width. The left half is calm, open, bright space with little detail (text will be placed over it).

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

Colour mood: clear early-morning sky blue and fresh soft green, with warm cream light. Light, airy and high-key overall; the lower left is the palest part.

Scene: A calm, clear early morning. A wide meadow wet with dew slopes gently up towards the small church on its hill, and a narrow footpath crosses the meadow from the lamb's feet to the church door. The small lamb sits quietly in the grass at the beginning of the path, seen from behind, looking up at the church. Beside it, on a low stone at the path's edge, stands a small lantern still burning with a warm golden flame from the night before, its glow catching the dew on the grass around the lamb.
```

### 다크 → `prayer-default-dark.png` (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same ultra-wide 21:9 composition, the same lamb in exactly the same place and size, the same small church on its hill, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal (#1a1815), and the lower left is the darkest, calmest part. The lamb's wool is a dim warm grey, not bright white.

The ONE warm golden light (#f6c86a) near the lamb is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the side of the lamb that faces it and on the ground around it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

The small church on the hill is now a dark silhouette: its thin cross glows softly white, and several of its windows are lit warm gold, as if people are inside praying. No sign and no lettering on it.

Everything that matters stays inside the middle horizontal band (38% to 62% of the height). The top third is only night sky, with a few faint stars on the right side only. The bottom third is only dark, simple foreground. The left half stays calm and dark with little detail.

No people, no human figures, no hands, no faces, no angels. No text, letters, numbers, signs or logos. No frame, border or vignette.

At night: A quiet, clear night. The lantern beside the lamb and the lit windows of the church are the only lights, and the footpath between them is just visible as a pale line across the dark meadow.
```
