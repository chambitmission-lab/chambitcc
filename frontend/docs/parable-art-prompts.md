# 예수님의 비유 — 비유 그림 프롬프트 (Gemini용, 통째 복사판)

`/bible/parables` 도감 카드·비유 시트 머리·읽기 화면 비유 카드에 들어갈 그림 34편 × 라이트/다크.
그림이 생긴 비유부터 선화 아이콘(`Parables/ParableArt.tsx`)을 갈아끼운다(없는 비유는 선화 유지).

**복사 버튼이 있는 페이지:** `docs/parable-art-prompts.html` (브라우저로 열고 버튼만 누르면 됨)

## 쓰는 법 — 블록 하나 = 복사 한 번

1. **라이트:** Gemini 새 대화 → 참고 그림 `src/assets/situation-moods/weary-light.webp` 첨부 → 그 비유의 **라이트** 블록 통째로 붙여넣기 (16:9).
   같은 대화에서 다음 비유 라이트 블록을 이어 붙여도 된다(그림체가 더 잘 맞는다).
2. **다크:** Gemini 새 대화 → **그 비유의 라이트 완성본** 첨부 → **다크** 블록 통째로 붙여넣기.
3. 저장: `{id}-light.png` / `{id}-dark.png` 로 `Downloads` 에 두고 알려 주기. 자르기·변환·적용은 Claude 가 한다.
4. 1차는 ★ 입문 5편(10장)부터.

## 컨셉 요약

손그림 과슈·수채(감정 타일과 같은 결) · 모든 그림에 **따뜻한 금빛(#f6c86a) 광원 하나**(참 빛, 요 1:9)가
비유의 핵심 순간을 비춘다 · 같은 흰 아기 양이 목격자(잃은 양만 주인공) · 사람은 얼굴 묘사 없는 동화 인물,
예수님은 그리지 않음 · 글자 금지 · **핵심은 화면 가운데(가로 30~70%, 세로 28~72%)** — 시트 띠(≈3.3:1)·
카드(≈2.2:1)·40px 정사각 썸네일로 잘라 쓰기 때문.


---

## 하나님의 마음

### ★ 잃은 양 (`lost-sheep`)

**라이트 → `lost-sheep-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A rocky hillside at golden evening. A shepherd walks home carrying the small white lamb across his shoulders, holding its legs gently; the lamb is the lost sheep that has just been found, resting safe and content. Behind them the warm low sun is the golden light, glowing around the shepherd and the lamb. Far off at the left edge, a small calm flock waits in the field.
```

**다크 → `lost-sheep-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 잃은 드라크마 (`lost-coin`)

**라이트 → `lost-coin-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: Inside a small stone house. A woman bends low, sweeping the floor with a simple broom; a small clay oil lamp set on the floor is the golden light, and in its glow a single silver coin glints between the floor stones. The lamb peers at the coin with her, nose close to the floor. Plain stone walls fade softly at the edges.
```

**다크 → `lost-coin-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### ★ 돌아온 아들 (`prodigal-son`)

**라이트 → `prodigal-son-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A long dusty road leading to a farmhouse. An old father in a flowing robe is running down the road, arms open, toward his thin son in ragged clothes who walks slowly with his head bowed; they are just about to meet in the centre. The golden light glows from the open doorway of the house behind the father. The lamb stands at the roadside, watching them.
```

**다크 → `prodigal-son-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 포도원 품꾼 (`vineyard-workers`)

**라이트 → `vineyard-workers-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A vineyard gate in the late afternoon. The landowner stands at the gate welcoming a few tired workers who have only just arrived, while rows of vines stretch behind. The low warm sun is the golden light, falling on the latecomers. The lamb stands among the vines at the gate.
```

**다크 → `vineyard-workers-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 빚진 두 사람 (`two-debtors`)

**라이트 → `two-debtors-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A low dinner table in a courtyard house. A woman kneels quietly beside the table with a small alabaster jar of perfume; the jar softly glows as the golden light. Other guests sit back in shadow, simple and small. The lamb sits near the woman, watching.
```

**다크 → `two-debtors-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```


---

## 하나님 나라

### ★ 씨 뿌리는 자 (`sower`)

**라이트 → `sower-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A sloping field at early morning. A sower walks with a cloth bag at his side, throwing seed in a wide arc. Around him the ground changes: a hard footpath where small birds peck, a rocky patch, a tangle of thorns, and rich dark soil where green shoots already rise. The rising sun is the golden light, low behind him. The lamb walks along the good soil, looking at the shoots.
```

**다크 → `sower-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 스스로 자라는 씨 (`growing-seed`)

**라이트 → `growing-seed-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A small field beside a farmer's hut at dawn. In the field the grain has grown by itself: tiny sprouts, then green blades, then full golden ears of wheat, in gentle rows. The farmer stands at the hut door, just waking, surprised. The golden light glows from the hut's window. The lamb stands among the sprouts.
```

**다크 → `growing-seed-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### ★ 겨자씨 (`mustard-seed`)

**라이트 → `mustard-seed-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A large, wide mustard plant grown into a tree beside a field, its branches full of small birds resting and nesting. The lamb rests in its shade at the foot of the trunk. Sunlight breaking through the branches is the golden light, falling on the lamb. In front of the lamb lies one tiny round seed on a flat stone.
```

**다크 → `mustard-seed-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 누룩 (`leaven`)

**라이트 → `leaven-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A simple kitchen. A woman kneads a large bowl of dough that is softly rising over the rim of the bowl. A clay oven in the corner glows as the golden light. The lamb sniffs the rising dough curiously.
```

**다크 → `leaven-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 가라지 (`weeds`)

**라이트 → `weeds-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A wheat field near harvest, the good wheat golden while darker weeds grow mixed among it. The farmer stands calmly at the edge of the field, one hand raised gently to tell his servants to wait. The warm low sun is the golden light over the wheat. The lamb stands between the stalks.
```

**다크 → `weeds-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 밭에 감추인 보화 (`hidden-treasure`)

**라이트 → `hidden-treasure-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A quiet field. A man kneels by a freshly dug hole, amazed; in the hole a small wooden chest has opened and its golden glow is the golden light, lighting his face from below. The lamb peeks into the hole beside him.
```

**다크 → `hidden-treasure-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 값진 진주 (`pearl`)

**라이트 → `pearl-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A small market stall at sunset. A merchant holds up a single large, luminous pearl, gazing at it; the pearl itself softly shines as the golden light. Simple jars and cloths rest on the stall. The lamb looks up at the pearl.
```

**다크 → `pearl-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 그물 (`net`)

**라이트 → `net-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: The shore of a calm lake at sunset. Fishermen have pulled a large dragnet full of fish onto the sand and sit sorting the fish into baskets. The setting sun over the lake is the golden light. The lamb stands on the sand beside a basket.
```

**다크 → `net-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```


---

## 기도

### 한밤중에 찾아온 친구 (`friend-midnight`)

**라이트 → `friend-midnight-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A sleeping village lane under the moon. A man stands knocking at a closed wooden door; above it, a small window has just lit up as the golden light, someone inside about to get up. The lamb stands beside the man at the door.
```

**다크 → `friend-midnight-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 과부와 불의한 재판관 (`persistent-widow`)

**라이트 → `persistent-widow-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A stone courtyard with a judge's seat under an arch. A small widow in a simple shawl stands before the seat once again, hands open, steady and not giving up. A shaft of sunlight is the golden light, falling on the widow. The lamb stands faithfully beside her.
```

**다크 → `persistent-widow-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 바리새인과 세리의 기도 (`pharisee-tax-collector`)

**라이트 → `pharisee-tax-collector-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A temple courtyard with tall stone pillars. In the middle a richly dressed man stands proudly upright. Far to the side, a humble man stands with his head bowed and his hand on his chest. A beam of warm light, the golden light, falls only on the humble man. The lamb stands quietly near him.
```

**다크 → `pharisee-tax-collector-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```


---

## 이웃과 용서

### ★ 선한 사마리아 사람 (`good-samaritan`)

**라이트 → `good-samaritan-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A rocky desert road winding down between hills. A traveler kneels beside a wounded man lying by the road, gently binding his wounds; a patient donkey waits beside them. Two figures walk away far down the road. A small lantern set on the ground is the golden light, glowing on the traveler's caring hands. The lamb stands close to the donkey, watching.
```

**다크 → `good-samaritan-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 용서하지 않은 종 (`unforgiving-servant`)

**라이트 → `unforgiving-servant-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A king's hall with simple arches. A servant kneels before the throne; above him a long scroll of debts is torn in two and drifting down in the golden light from a high window. The lamb stands at the side of the hall, looking up at the torn scroll.
```

**다크 → `unforgiving-servant-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 어리석은 부자 (`rich-fool`)

**라이트 → `rich-fool-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: Huge new storehouses overflowing with grain at evening. A rich man stands with arms folded, admiring his barns. A single lamp in the storehouse doorway is the golden light. The lamb stands small beside a heap of grain, looking at the man.
```

**다크 → `rich-fool-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 부자와 나사로 (`rich-man-lazarus`)

**라이트 → `rich-man-lazarus-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: Outside the closed gate of a wealthy house. A poor man sits on the ground by the gate with a stray dog beside him; behind the gate a feast is faintly seen. The golden light falls on the poor man from above, gentle and kind. The lamb sits close to the poor man.
```

**다크 → `rich-man-lazarus-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 큰 잔치 (`great-banquet`)

**라이트 → `great-banquet-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A long banquet table under hanging lanterns in a courtyard. A servant leads in guests from the streets: a man with a crutch, a blind man holding the servant's arm, people in worn clothes, all being welcomed to the table. The central lantern is the golden light. The lamb sits at the end of the table.
```

**다크 → `great-banquet-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 낮은 자리 (`lowest-seat`)

**라이트 → `lowest-seat-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A wedding feast at a low table. The host gently takes a humble guest by the arm and leads him from the far end of the table toward the place of honour. A lamp near the head of the table is the golden light. The lamb sits at the humble end of the table.
```

**다크 → `lowest-seat-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```


---

## 듣고 행하는 삶

### 반석 위에 지은 집 (`two-builders`)

**라이트 → `two-builders-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A storm by a river. On the right, a small stone house stands firm on solid rock, its window glowing as the golden light. On the left, a house built on sand is sliding into the flooding water. The lamb stands safe on the rock beside the strong house.
```

**다크 → `two-builders-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 두 아들 (`two-sons`)

**라이트 → `two-sons-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A vineyard gate in the morning. One son walks into the vineyard carrying a basket, while another son walks away down the road. The father stands at the gate. The low morning sun is the golden light, shining on the son who went in. The lamb stands at the gate.
```

**다크 → `two-sons-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 악한 농부 (`wicked-tenants`)

**라이트 → `wicked-tenants-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A vineyard on a hillside with a stone watchtower and a winepress. A young man, the owner's son, walks up the path toward the vineyard alone; the tenants stand at the top, small and unwelcoming. The golden light glows around the son on the path. The lamb stands at the bottom of the path. Calm and quiet, no violence.
```

**다크 → `wicked-tenants-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 열매 맺지 못한 무화과나무 (`barren-fig`)

**라이트 → `barren-fig-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A vineyard corner with a fig tree that has leaves but no fruit. A gardener kneels and gently digs around its roots, a basket of soil beside him; the owner stands nearby. Warm sunlight is the golden light on the gardener and the tree. The lamb watches beside the basket.
```

**다크 → `barren-fig-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 망대와 전쟁 (`tower-cost`)

**라이트 → `tower-cost-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A building site with only the stone foundation of a tower. A man sits on a stone with a measuring cord and a small pile of counted stones, thinking carefully before he builds. The low sun is the golden light. The lamb sits beside the pile of stones.
```

**다크 → `tower-cost-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 새 포도주와 새 부대 (`new-wine`)

**라이트 → `new-wine-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A cellar room with a small window. An old cracked leather wineskin hangs on the wall, and a fresh new wineskin rests beside a jar of new wine being poured. Sunlight from the window is the golden light on the new wineskin. The lamb looks at the new wineskin.
```

**다크 → `new-wine-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```


---

## 깨어 준비하기

### 충성된 종과 악한 종 (`faithful-servant`)

**라이트 → `faithful-servant-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: The doorway of a large house at evening. A servant is handing out bread to the household at a table, while the master has just come home and stands at the door with a lantern, the golden light. The lamb stands by the table.
```

**다크 → `faithful-servant-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 무화과나무의 교훈 (`fig-tree-leaves`)

**라이트 → `fig-tree-leaves-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A fig tree in early summer, its branches covered in fresh tender green leaves. The lamb stands under the tree looking up at the new leaves. Warm sunlight through the leaves is the golden light. Behind, a soft summer landscape.
```

**다크 → `fig-tree-leaves-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 혼인 잔치와 예복 (`wedding-feast`)

**라이트 → `wedding-feast-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: The entrance of a king's wedding hall. Servants welcome guests gathered from the roads, and each guest is given a clean white wedding garment at the door. A lamp at the doorway is the golden light, shining on the white garments. The lamb stands at the doorway.
```

**다크 → `wedding-feast-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 열 처녀 (`ten-virgins`)

**라이트 → `ten-virgins-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A village lane at night. A row of young women in simple dresses wait with small clay oil lamps: those on the right hold lamps burning brightly, those on the left hold lamps that have gone out. Far down the lane, the bridegroom's procession approaches with a torch, the golden light. The lamb stands beside the women with bright lamps.
```

**다크 → `ten-virgins-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 달란트 (`talents`)

**라이트 → `talents-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: A master's courtyard. A servant joyfully opens a cloth bag to show the master that the money has doubled; the coins catch the golden light from a lamp. In the background another servant is digging up a buried bag. The lamb stands beside the joyful servant.
```

**다크 → `talents-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

### 양과 염소 (`sheep-goats`)

**라이트 → `sheep-goats-light.png`**

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene: Evening at the edge of a field. A shepherd gently separates his flock: the sheep gathered on his right, the goats on his left. The low warm sun behind the shepherd is the golden light. The lamb stands among the sheep on the right.
```

**다크 → `sheep-goats-dark.png`** (라이트 완성본 첨부)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```


---

## 적용 메모 (그림이 오면)

- 저장: `src/pages/Bible/Parables/img/{id}-{light|dark}.webp` — `import.meta.glob` 으로 있는 것만 연결, 없으면 선화.
- 크롭: 워터마크(우하단 ✦)를 자르고 1200×675, 시트 띠·카드·정사각 썸네일은 CSS `object-position: center`.
- 테마: `[data-theme=dark]` 일 때 dark 파일, 한쪽만 있으면 있는 쪽.

## 원본 조각 (수정은 여기서 하고 스크립트로 다시 굽는다)

### [라이트 공통] (매번 맨 앞에)

```
A wide 16:9 hand-painted storybook scene, soft gouache and watercolour, like a background painting from a hand-drawn animated film. Visible soft brush strokes, paper texture, gentle atmospheric depth. Use exactly the same painting style and the same small chubby white lamb as the attached reference. This is one image of a series illustrating the parables Jesus told, set in first-century Galilee and Judea: stone houses, olive trees, dusty paths, vineyards, the lake.

The small white lamb appears in every image as a quiet witness to the story, about one sixth of the image height, in the shape of a real little lamb standing on its four short legs. People in the story are simple storybook figures in plain ancient Middle Eastern clothing, small in the scene, faces soft and simple without detailed features, seen mostly from the side or from behind. Jesus does not appear.

There is exactly ONE warm golden light (#f6c86a) in the scene - a lamp, a window, a lantern or the low sun - and it is the warmest point of the painting. It falls on the key moment of the parable.

IMPORTANT composition: the lamb, the golden light and the main figure or object of the parable are gathered CLOSE TOGETHER in the centre of the image (between 30% and 70% of the width and between 28% and 72% of the height), so that a small square crop of the centre still shows the lamb, the light and the key object. The outer edges are calm, simple and low in detail (sky, plain wall, field), with no important detail near the edges.

Colour mood for light mode: bright, airy and soft. Pale warm cream, soft sky blue and gentle sage green, like a clear morning or soft afternoon. No harsh contrast, no dark heavy areas.

No text, no letters, no numbers, no logos. No frame, border or vignette.

Scene:
```

### [다크 공통] (라이트 완성본 첨부 후 이것만)

```
The SAME painting as the attached image, but at NIGHT. Keep the same composition, the same lamb and figures in exactly the same places and sizes, the same brushwork. Only the time and the light change.

Night palette: deep, quiet and low-key, but NOT pure black and NOT saturated navy; the shadows lean soft warm charcoal. The lamb's wool is a dim warm grey, not bright white. The outer edges fall into calm, dark, low-detail space.

The ONE warm golden light (#f6c86a) is now the brightest thing in the painting. It glows clearly and lays a soft warm rim of light on the lamb, the figures and the key object near it. The darker the night, the clearer the light. It does not chase the darkness away; it shines in it.

Everything important stays in the centre of the image (30-70% of the width, 28-72% of the height). No text, no letters, no numbers, no logos. No frame, border or vignette.
```

---

### 비유별 Scene (원본) (★ = 입문 5편, 먼저)

파일 이름은 `{id}-light.png` / `{id}-dark.png`.

#### 하나님의 마음

**★ lost-sheep · 잃은 양**
```
Scene: A rocky hillside at golden evening. A shepherd walks home carrying the small white lamb across his shoulders, holding its legs gently; the lamb is the lost sheep that has just been found, resting safe and content. Behind them the warm low sun is the golden light, glowing around the shepherd and the lamb. Far off at the left edge, a small calm flock waits in the field.
```

**lost-coin · 잃은 드라크마**
```
Scene: Inside a small stone house. A woman bends low, sweeping the floor with a simple broom; a small clay oil lamp set on the floor is the golden light, and in its glow a single silver coin glints between the floor stones. The lamb peers at the coin with her, nose close to the floor. Plain stone walls fade softly at the edges.
```

**★ prodigal-son · 돌아온 아들**
```
Scene: A long dusty road leading to a farmhouse. An old father in a flowing robe is running down the road, arms open, toward his thin son in ragged clothes who walks slowly with his head bowed; they are just about to meet in the centre. The golden light glows from the open doorway of the house behind the father. The lamb stands at the roadside, watching them.
```

**vineyard-workers · 포도원 품꾼**
```
Scene: A vineyard gate in the late afternoon. The landowner stands at the gate welcoming a few tired workers who have only just arrived, while rows of vines stretch behind. The low warm sun is the golden light, falling on the latecomers. The lamb stands among the vines at the gate.
```

**two-debtors · 빚진 두 사람**
```
Scene: A low dinner table in a courtyard house. A woman kneels quietly beside the table with a small alabaster jar of perfume; the jar softly glows as the golden light. Other guests sit back in shadow, simple and small. The lamb sits near the woman, watching.
```

#### 하나님 나라

**★ sower · 씨 뿌리는 자**
```
Scene: A sloping field at early morning. A sower walks with a cloth bag at his side, throwing seed in a wide arc. Around him the ground changes: a hard footpath where small birds peck, a rocky patch, a tangle of thorns, and rich dark soil where green shoots already rise. The rising sun is the golden light, low behind him. The lamb walks along the good soil, looking at the shoots.
```

**growing-seed · 스스로 자라는 씨**
```
Scene: A small field beside a farmer's hut at dawn. In the field the grain has grown by itself: tiny sprouts, then green blades, then full golden ears of wheat, in gentle rows. The farmer stands at the hut door, just waking, surprised. The golden light glows from the hut's window. The lamb stands among the sprouts.
```

**★ mustard-seed · 겨자씨**
```
Scene: A large, wide mustard plant grown into a tree beside a field, its branches full of small birds resting and nesting. The lamb rests in its shade at the foot of the trunk. Sunlight breaking through the branches is the golden light, falling on the lamb. In front of the lamb lies one tiny round seed on a flat stone.
```

**leaven · 누룩**
```
Scene: A simple kitchen. A woman kneads a large bowl of dough that is softly rising over the rim of the bowl. A clay oven in the corner glows as the golden light. The lamb sniffs the rising dough curiously.
```

**weeds · 가라지**
```
Scene: A wheat field near harvest, the good wheat golden while darker weeds grow mixed among it. The farmer stands calmly at the edge of the field, one hand raised gently to tell his servants to wait. The warm low sun is the golden light over the wheat. The lamb stands between the stalks.
```

**hidden-treasure · 밭에 감추인 보화**
```
Scene: A quiet field. A man kneels by a freshly dug hole, amazed; in the hole a small wooden chest has opened and its golden glow is the golden light, lighting his face from below. The lamb peeks into the hole beside him.
```

**pearl · 값진 진주**
```
Scene: A small market stall at sunset. A merchant holds up a single large, luminous pearl, gazing at it; the pearl itself softly shines as the golden light. Simple jars and cloths rest on the stall. The lamb looks up at the pearl.
```

**net · 그물**
```
Scene: The shore of a calm lake at sunset. Fishermen have pulled a large dragnet full of fish onto the sand and sit sorting the fish into baskets. The setting sun over the lake is the golden light. The lamb stands on the sand beside a basket.
```

#### 기도

**friend-midnight · 한밤중에 찾아온 친구**
```
Scene: A sleeping village lane under the moon. A man stands knocking at a closed wooden door; above it, a small window has just lit up as the golden light, someone inside about to get up. The lamb stands beside the man at the door.
```

**persistent-widow · 과부와 불의한 재판관**
```
Scene: A stone courtyard with a judge's seat under an arch. A small widow in a simple shawl stands before the seat once again, hands open, steady and not giving up. A shaft of sunlight is the golden light, falling on the widow. The lamb stands faithfully beside her.
```

**pharisee-tax-collector · 바리새인과 세리의 기도**
```
Scene: A temple courtyard with tall stone pillars. In the middle a richly dressed man stands proudly upright. Far to the side, a humble man stands with his head bowed and his hand on his chest. A beam of warm light, the golden light, falls only on the humble man. The lamb stands quietly near him.
```

#### 이웃과 용서

**★ good-samaritan · 선한 사마리아 사람**
```
Scene: A rocky desert road winding down between hills. A traveler kneels beside a wounded man lying by the road, gently binding his wounds; a patient donkey waits beside them. Two figures walk away far down the road. A small lantern set on the ground is the golden light, glowing on the traveler's caring hands. The lamb stands close to the donkey, watching.
```

**unforgiving-servant · 용서하지 않은 종**
```
Scene: A king's hall with simple arches. A servant kneels before the throne; above him a long scroll of debts is torn in two and drifting down in the golden light from a high window. The lamb stands at the side of the hall, looking up at the torn scroll.
```

**rich-fool · 어리석은 부자**
```
Scene: Huge new storehouses overflowing with grain at evening. A rich man stands with arms folded, admiring his barns. A single lamp in the storehouse doorway is the golden light. The lamb stands small beside a heap of grain, looking at the man.
```

**rich-man-lazarus · 부자와 나사로**
```
Scene: Outside the closed gate of a wealthy house. A poor man sits on the ground by the gate with a stray dog beside him; behind the gate a feast is faintly seen. The golden light falls on the poor man from above, gentle and kind. The lamb sits close to the poor man.
```

**great-banquet · 큰 잔치**
```
Scene: A long banquet table under hanging lanterns in a courtyard. A servant leads in guests from the streets: a man with a crutch, a blind man holding the servant's arm, people in worn clothes, all being welcomed to the table. The central lantern is the golden light. The lamb sits at the end of the table.
```

**lowest-seat · 낮은 자리**
```
Scene: A wedding feast at a low table. The host gently takes a humble guest by the arm and leads him from the far end of the table toward the place of honour. A lamp near the head of the table is the golden light. The lamb sits at the humble end of the table.
```

#### 듣고 행하는 삶

**two-builders · 반석 위에 지은 집**
```
Scene: A storm by a river. On the right, a small stone house stands firm on solid rock, its window glowing as the golden light. On the left, a house built on sand is sliding into the flooding water. The lamb stands safe on the rock beside the strong house.
```

**two-sons · 두 아들**
```
Scene: A vineyard gate in the morning. One son walks into the vineyard carrying a basket, while another son walks away down the road. The father stands at the gate. The low morning sun is the golden light, shining on the son who went in. The lamb stands at the gate.
```

**wicked-tenants · 악한 농부**
```
Scene: A vineyard on a hillside with a stone watchtower and a winepress. A young man, the owner's son, walks up the path toward the vineyard alone; the tenants stand at the top, small and unwelcoming. The golden light glows around the son on the path. The lamb stands at the bottom of the path. Calm and quiet, no violence.
```

**barren-fig · 열매 맺지 못한 무화과나무**
```
Scene: A vineyard corner with a fig tree that has leaves but no fruit. A gardener kneels and gently digs around its roots, a basket of soil beside him; the owner stands nearby. Warm sunlight is the golden light on the gardener and the tree. The lamb watches beside the basket.
```

**tower-cost · 망대와 전쟁**
```
Scene: A building site with only the stone foundation of a tower. A man sits on a stone with a measuring cord and a small pile of counted stones, thinking carefully before he builds. The low sun is the golden light. The lamb sits beside the pile of stones.
```

**new-wine · 새 포도주와 새 부대**
```
Scene: A cellar room with a small window. An old cracked leather wineskin hangs on the wall, and a fresh new wineskin rests beside a jar of new wine being poured. Sunlight from the window is the golden light on the new wineskin. The lamb looks at the new wineskin.
```

#### 깨어 준비하기

**faithful-servant · 충성된 종과 악한 종**
```
Scene: The doorway of a large house at evening. A servant is handing out bread to the household at a table, while the master has just come home and stands at the door with a lantern, the golden light. The lamb stands by the table.
```

**fig-tree-leaves · 무화과나무의 교훈**
```
Scene: A fig tree in early summer, its branches covered in fresh tender green leaves. The lamb stands under the tree looking up at the new leaves. Warm sunlight through the leaves is the golden light. Behind, a soft summer landscape.
```

**wedding-feast · 혼인 잔치와 예복**
```
Scene: The entrance of a king's wedding hall. Servants welcome guests gathered from the roads, and each guest is given a clean white wedding garment at the door. A lamp at the doorway is the golden light, shining on the white garments. The lamb stands at the doorway.
```

**ten-virgins · 열 처녀**
```
Scene: A village lane at night. A row of young women in simple dresses wait with small clay oil lamps: those on the right hold lamps burning brightly, those on the left hold lamps that have gone out. Far down the lane, the bridegroom's procession approaches with a torch, the golden light. The lamb stands beside the women with bright lamps.
```

**talents · 달란트**
```
Scene: A master's courtyard. A servant joyfully opens a cloth bag to show the master that the money has doubled; the coins catch the golden light from a lamp. In the background another servant is digging up a buried bag. The lamb stands beside the joyful servant.
```

**sheep-goats · 양과 염소**
```
Scene: Evening at the edge of a field. A shepherd gently separates his flock: the sheep gathered on his right, the goats on his left. The low warm sun behind the shepherd is the golden light. The lamb stands among the sheep on the right.
```

---

