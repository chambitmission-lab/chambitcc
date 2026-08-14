# 칭호 배경 이미지 생성 프롬프트 (Gemini용)

프로필 화면에서 장착 칭호에 맞는 배경을 깔기 위한 이미지 생성 프롬프트 모음.
컨셉: **"코지-에픽(cozy-epic)"** — 구도와 빛은 웅장하게, 주인공은 귀엽게. 보면 피식 웃음이 나면서 흐뭇해지는 톤.

## 사용법

1. 아래 **공통 스타일 블록**을 먼저 붙여넣고, 이어서 원하는 칭호의 **장면 문단**을 붙여 한 번에 요청한다.
2. 결과물은 `frontend/public/images/title-bg/<key>.webp` 로 저장 (예: `dawn_riser.webp`).
3. 비율은 16:9 (모바일 프로필 헤더 뒤에 깔고 하단은 그라데이션으로 녹일 예정).

## 일관성 규칙 (모든 이미지 공통)

- **주인공은 항상 같은 양 한 마리** — 통통하고 하얀 아기 양, 평온하고 뿌듯한 미소. 25장 전부 같은 캐릭터가 다른 상황을 연기한다.
- **팔레트 고정** — 깊은 네이비 남색 밤하늘 베이스(#0A1428 계열) + 따뜻한 앰버빛 광원 하나 + 은은한 파란 별빛. 다크 테마 위에 자연스럽게 얹히는 저채도.
- **하단 중앙은 비워둔다** — 이름·아이디·칭호 칩 텍스트가 올라갈 자리. 피사체와 광원은 상단 또는 좌우로.
- **글자 금지** — 숫자·문자·로고가 들어가면 UI와 충돌한다.

---

## 공통 스타일 블록 (매번 맨 앞에 붙여넣기)

```
A wide 16:9 background illustration for a mobile app profile screen in dark mode.
Style: cozy-epic children's storybook illustration — soft flat shapes with subtle
grain texture, rounded friendly forms, gentle rim lighting. Base palette is deep
navy night-blue (around #0A1428) with ONE warm amber glowing focal light and tiny
sparkling blue-white stars. The recurring hero is a small chubby white sheep with
stubby legs and a serene, slightly smug smile — the SAME sheep character every time.
Composition: epic and dramatic like a movie poster, but the subject is adorable,
which makes it funny and heartwarming. Keep the main subject and the light source
in the upper half or off to one side; the bottom-center third must stay dim, simple
and almost empty (UI text will be overlaid there). Overall muted and low-contrast
so white text stays readable on top. No text, no letters, no numbers, no logos,
no frames or borders.

Scene:
```

---

## 칭호별 장면 (25종)

### 시간 카테고리

**dawn_riser · 🌅 새벽을 깨우는 자 (silver)**
```
The sheep stands heroically on a hilltop at dawn like a victorious general, a tiny
cape fluttering in the wind, front hoof resting on one of five defeated old-fashioned
alarm clocks scattered and toppled around the hill, little dizzy stars circling the
clocks. In the far background a rooster on a fence stares in utter shock, beak open,
because the sheep woke up first. The sky is a quiet navy-to-amber sunrise gradient.
```

**night_owl · 🦉 한밤의 올빼미 (silver)**
```
Deep night. The sheep is inside a cozy blanket fort on a hill, wrapped like a burrito,
face lit warmly by a softly glowing open book — the only light source. A real owl
perches on a branch just outside the fort, leaning in with huge astonished eyes,
genuinely impressed. Crescent moon and faint stars in the navy sky.
```

**faithful_watchman · 🛡️ 신실한 파수꾼 (gold)**
```
The sheep stands guard on an old stone watchtower at night, wearing an oversized
helmet that slides slightly over one eye, holding a tiny round shield and a lantern
with warm amber light. It stands perfectly straight and proud like a royal guard,
chest puffed out. Seven small banners flutter on the tower wall behind it.
```

**unbroken_month · 🔥 꺾이지 않는 30일 (gold)**
```
A dramatic wind storm of flying calendar pages swirls across a dark night landscape,
yet the sheep sits perfectly calm and unbothered in the middle, eyes closed in serene
meditation, protecting a single small candle flame with its hooves — the flame does
not flicker at all. Epic storm, absolutely peaceful sheep.
```

**day_and_night · 🌗 주야로 묵상하는 자 (silver)**
```
The sky is split in half like a diptych: soft amber sunrise on the left, deep navy
starry night on the right. The sheep sits on a hill exactly on the boundary line,
happily nibbling a glowing book like a snack, crumbs of light falling. A tiny picnic
mat and a thermos beside it.
```

**three_meals · 🍚 삼시세끼 말씀 (gold)**
```
The sheep sits at a small low Korean dining table (soban) set for a feast, chopsticks
in hoof, with three bowls that hold softly glowing golden light instead of rice.
The sheep looks deeply satisfied, one hoof on its full round belly. Warm lantern
light, night window behind showing navy sky and stars.
```

**keep_sabbath · ⛪ 안식일을 거룩히 (gold)**
```
The sheep marches happily up a winding path toward a tiny country church with warm
glowing windows on a hilltop. Comically, the weather along the path is rain, snow
and wind all at once, and the sheep walks through it with a small umbrella and rubber
boots, completely undeterred, almost skipping. Navy dusk sky.
```

**attendance_king · 📅 말씀 출석왕 (silver)**
```
The sheep proudly presses its inked front hoof onto a giant wall calendar mounted on
a wooden board under warm lamplight, leaving cute round hoof-stamp marks scattered
across many days. Its face is pure concentration with tongue slightly out. A little
ink pad sits nearby. Night scene, deep navy backdrop.
```

**hundred_days · 💯 작심백일 (legendary)**
```
Epic legendary scene: the sheep plants a small fluttering flag on a snowy mountain
summit at night, striking a triumphant pose. Behind it, a long winding trail of one
hundred tiny warm lights traces the entire path it climbed, glowing like a river of
fireflies down the mountain. Aurora hints in the navy sky. Grand scale, tiny proud hero.
```

### 패턴 카테고리

**moses_companion · 📜 모세의 동반자 (gold)**
```
The sheep walks through a majestic desert canyon at dusk holding a wooden staff twice
its height, wearing a tiny travel cloak, with a determined adventurer expression.
Behind it stretch long winding footprints across the sand dunes. Epic scale canyon
walls, warm amber horizon, first evening stars in the navy sky.
```

**wisdom_king · 👑 지혜의 왕 (silver)**
```
The sheep sits on a plush throne wearing a golden crown that is slightly too big and
slips over one eye, and round scholar glasses, one hoof raised in a sage advice-giving
gesture, chin slightly lifted. Stacks of thick old books form pillars beside the
throne, one book glowing warmly. Regal but adorably self-important. Navy palette.
```

**gospel_witness · ✝️ 복음의 증인 (gold)**
```
Night campfire scene on a hill: the sheep stands on a small rock dramatically telling
a story with hooves spread wide, while a circle of woodland animals (rabbits, a fox,
birds, a hedgehog) listen completely captivated, eyes sparkling. Four softly glowing
books float gently in the air around the sheep. Warm firelight, navy starry sky.
```

**seen_the_end · 🔚 끝을 본 자 (gold)**
```
The sheep dramatically closes an enormous ancient book bigger than itself, dust and
sparkles puffing out, with the deeply satisfied face of someone who just finished a
long series finale — one tear of joy. Behind it a glorious warm sunrise breaks over
the horizon like a victory ending. A few confetti sparkles drift in the air.
```

**storm_reader · 🌪️ 폭풍 흡입 (silver)**
```
The sheep reads at incredible speed: it sits calmly at the center while a spiral
tornado of fluttering glowing pages swirls around it, its reading glasses slightly
askew from the wind, hooves flipping pages in a blur. Motion lines and sparkles.
Epic vortex, completely focused tiny reader. Navy backdrop with warm glow center.
```

**plan_finisher · 🏁 유종의 미 (silver)**
```
The sheep bursts through a checkered finish-line ribbon at night, chest first like a
marathon champion, exhausted but glowing with pride, tiny sweat drops flying, legs a
comical blur. The ribbon snaps dramatically. Warm stadium-like glow from behind,
navy night sky with stars above.
```

**plan_collector · 🎖️ 완주 수집가 (gold)**
```
The sheep stands on a stool carefully polishing one of three shiny medals displayed
on a handsome wooden shelf under a warm picture light, huffing on the medal and
wiping it with a tiny cloth, utterly absorbed and proud. Cozy dark study room,
navy shadows, single warm lamp glow.
```

**word_marathoner · 🏃 말씀 마라토너 (legendary)**
```
Legendary epic: the sheep wearing a laurel wreath runs along a single continuous road
that passes through all four seasons in one panoramic landscape — cherry blossoms,
green summer, red autumn leaves, and snow — under one continuous navy night sky.
A warm trail of light follows its path across the whole year. Tiny runner, vast world.
```

**bible_conqueror · 🏆 성경 통독의 전설 (legendary)**
```
The most epic scene of all: the sheep stands victorious at the summit of a mountain
built entirely of sixty-six stacked giant ancient books, holding a small golden
trophy overhead with both front hooves. A magnificent aurora and a sky full of stars
crown the navy heavens, warm golden light rays breaking from behind the summit.
Legendary movie-poster composition, adorably tiny legend on top.
```

**living_legend · 🌟 살아있는 전설 (legendary)**
```
The grand finale of the whole series: a majestic hall of fame at night, tall navy
walls fading into starlight as if the museum opens straight into the night sky.
The sheep stands on a low round marble pedestal in the upper center, lit by a single
warm amber spotlight from above, wearing a tiny laurel wreath and taking a small,
humble, deeply satisfied bow. Displayed on elegant floating shelves and pedestals
around it are the treasured props of all its past adventures — a toppled alarm clock,
a slightly-too-big golden crown, three polished medals, a small round shield and
lantern, a wooden staff, a tiny umbrella and rubber boots, a checkered finish-line
ribbon, an ice axe with a knit hat, and warmly glowing ancient books — each with its
own tiny soft glow, arranged like constellation points around the hero. Gentle
golden dust motes drift in the spotlight beam. Epic award-ceremony composition,
one small sheep who collected an entire legend.
```

### 히든 카테고리

**returned_prodigal · 🫂 돌아온 탕자 (silver)**
```
A warm dusk country road: an old shepherd figure seen from behind runs down the road
with arms flung wide open, robe flying, one sandal comically left behind mid-air,
while the small sheep runs toward him from the far end of the road with teary happy
eyes, little dust clouds under its hooves. Amber sunset horizon melting into navy
night above. Deeply heartwarming with a gentle laugh.
```

**streak_breaker · 🔥 작심삼일 브레이커 (bronze)**
```
Night athletics track: the sheep is captured mid-air in slow-motion glory, leaping
over a fourth hurdle with a tiny determined flame burning above its head, while
three knocked-down hurdles lie defeated on the track behind it. Dramatic low-angle
epic sports-photo composition, warm rim light, navy sky — a huge triumph over a
very small wall, which is exactly why it's funny.
```

**leviticus_survivor · 🏕️ 레위기 생존자 (silver)**
```
The sheep emerges triumphantly from the edge of a vast dark swamp-jungle whose
gnarled trees are giant rolled scrolls and whose hanging vines are tangled ribbons
of parchment. It wears a slightly oversized explorer pith helmet and tiny rubber
boots, wool speckled with mud, proudly holding a small warm amber lantern as it
pushes through the last curtain of reeds onto dry ground. Along the swamp path
behind it lie the comically abandoned traces of readers who gave up: a deflated
little tent, a dropped bookmark, a single boot stuck in the mud. Faint blue
will-o'-the-wisps drift deep inside the swamp; ahead of the sheep the navy sky
opens with the first warm hint of dawn. Epic jungle-escape composition, one small
unstoppable survivor.
```

**eutychus_escape · 🪟 유두고 탈출 (bronze)**
```
Warm dim interior of a small wooden chapel during the sleepy mid-afternoon lull:
rows of pews where cozy woodland animals (a rabbit, a fox, a hedgehog) have all
dozed off, slumped in adorable poses with tiny floating dream-bubbles above their
heads. High up on the sill of a tall arched window sits the sheep — dangerously
close to the open window, yet completely awake — back perfectly straight, a warmly
glowing open book on its lap, its eyelids comically propped open with two tiny
matchsticks, wearing the proud focus of a survivor. Below the window someone has
thoughtfully placed a huge pile of soft cushions, just in case. One warm amber
shaft of light falls on the sheep; deep navy shadows fill the rest of the chapel,
dust motes sparkling in the beam.
```

**obadiah_finder · 🔍 오바댜를 찾은 자 (bronze)**
```
A colossal night library-labyrinth: towering bookshelf canyons of enormous ancient
tomes fade upward into an open starry navy sky. At the center the sheep stands on
top of a mountain of huge thick books it has climbed, wearing a detective's
deerstalker hat slightly askew and holding a magnifying glass in one hoof, while
the other hoof lifts triumphantly overhead a single tiny, impossibly thin glowing
booklet — the treasure it finally found. Golden sparkles burst around the little
book like a silent fanfare, and a crumpled treasure map with a winding drawn path
lies at the sheep's feet. Epic discovery composition: gigantic library, enormous
search, adorably tiny prize.
```

**everest_climber · 🏔️ 에베레스트 등정 (gold)**
```
Epic mountaineering scene at night: a colossal mountain shaped like one gigantic
ancient open book, its cliff face made of countless thin stacked page-edges like
rock strata, the highest ridges dusted with snow. The sheep has just reached the
summit and sits there completely relaxed, wearing a tiny knit hat and climbing
goggles pushed up on its forehead, a coiled rope over its shoulder, casually
sipping from a small steaming cup as if this was nothing at all. A tiny ice axe
is planted in the snow beside it. The summit glows with one warm amber light
against the vast navy sky, wisps of thin cloud drifting far below the peak —
enormous mountain, tiny unbothered conqueror.
```
