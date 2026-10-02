# 칭호 배경 이미지 생성 프롬프트 (Gemini용)

프로필 화면에서 장착 칭호에 맞는 배경을 깔기 위한 이미지 생성 프롬프트 모음.
컨셉: **"코지-에픽(cozy-epic)"** — 구도와 빛은 웅장하게, 주인공은 귀엽게. 보면 피식 웃음이 나면서 흐뭇해지는 톤.

## 사용법

1. 아래 **공통 스타일 블록**을 먼저 붙여넣고, 이어서 원하는 칭호의 **장면 문단**을 붙여 한 번에 요청한다.
   **캐릭터 일치 꿀팁**: 기존 이미지(`public/images/title-bg/` 중 아무거나 한 장)를 함께 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로"라고 덧붙이면 시리즈가 정확히 이어진다.
2. 결과물은 `frontend/public/images/title-bg/<key>.webp` 로 저장 (예: `dawn_riser.webp`).
   기존 26장은 전부 **1376×768** — 같은 규격으로 맞춘다. (`cwebp -q 78 원본.png -o <key>.webp`, 20~50KB)
3. 비율은 16:9 (모바일 프로필 헤더 뒤에 깔고 하단은 그라데이션으로 녹일 예정).
4. **새로 추가하는 칭호라면** 이미지를 넣은 뒤 `src/components/titles/TitleBackdrop.tsx` 의
   `TITLE_BG_KEYS` 에 key 를 추가해야 프로필에 실제로 깔린다 (미등록 키는 배너 없이 기본 레이아웃).
   칭호 자체(획득 조건)는 백엔드 `app/services/titles/registry.py` 의 `TITLE_REGISTRY` 에 등록한다.

## 일관성 규칙 (모든 이미지 공통)

- **주인공은 항상 같은 양 한 마리** — 통통하고 하얀 아기 양, 평온하고 뿌듯한 미소. 시리즈 전부 같은 캐릭터가 다른 상황을 연기한다.
- **양의 몸은 진짜 양** — 짧은 네 다리는 하얀 털에 덮이고 끝은 작고 둥근 검은 발굽. 사람 손·손가락·팔·맨살 금지.
  물건을 들어야 하면 **"upright on its two hind legs, both front hooves holding..."** 처럼 두발 자세를 명시할 것
  (네발 서기인데 뭔가 들라고 하면 팔이 새로 돋는다 — 에피소드 일러스트에서 겪은 사고).
- **부정형 금지** — "no arms, no hands"는 오히려 팔을 소환한다. 긍정형으로 진짜 양의 모습을 묘사할 것.
- **소품 개수는 믿지 말 것** — 생성 AI는 개수 세기에 약하다. 개수가 중요하지 않으면 아예 숫자를 쓰지 않는다.
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

## 칭호별 장면 (36종)

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

**story_graduate · 🎓 초보 딱지 뗀 자 (silver)** — `/bible/story` 42화 완주
> 이 시리즈에서 유일하게 "졸업"을 다루는 장면. 웅장한 정복(에베레스트·66권 산)이 아니라
> **초보용 보조 장비를 벗는 순간**이 유머의 핵심이다. 양의 표정은 우쭐하되 밉지 않게.
```
Night sea-cliff scene, the sheep placed on the right side of the frame: it stands
upright on its two hind legs at the very end of a small warm-lit wooden pier, wearing
a tiny graduation cap tipped at a jaunty angle with its tassel swinging, both front
hooves planted on its hips in a triumphant little pose, chest puffed out with the pure
smugness of a very small creature that has just been promoted. It has finally wriggled
out of its beginner swimming gear, cheerfully cast off in a heap behind it on the pier
— a deflated inflatable swim ring, little water wings and a foam kickboard. Stretching
away in front of it lies a vast calm navy sea of the Word reaching to the horizon, and
a long gently curving line of tiny amber lantern-buoys marks the shallow practice
channel it has already swum, the lights fading softly into the distance. On the far
horizon a warm amber dawn is just breaking over the open water — the real journey,
only now beginning. Deep navy sky with tiny blue-white stars above; the lower-left and
bottom-center of the frame stay quiet dark water with nothing in them.
```

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

### 필사 카테고리 (`/bible/typing`)

> 필사 칭호 공통 소품 규칙 — 시리즈 세계관(동화책·밤하늘)을 지키기 위해 **필기구는 깃펜·두루마리·양피지·작은 나무 책상**으로 통일한다.
> 휴대폰·모니터·현대 키보드는 그리지 않는다(예외: `typing_lightning` 의 앤티크 타자기, 자판은 글자 없는 민무늬).
> 두루마리·종이 위의 "글씨"는 반드시 **장식용 물결 잉크 선(decorative wavy ink lines)**으로 묘사해야 글자가 생기지 않는다.
> 깃펜·두루마리를 드는 장면은 전부 **두발 자세 + 두 앞발굽**을 명시했다 — 문구를 줄이다가 이 부분을 빼면 팔이 돋는다.
> **캐릭터 일치용 첨부 추천**: `story_graduate.webp`(두발로 선 포즈) + `night_owl.webp`(불빛 아래 책 장면) 두 장.

**typing_first · ✍️ 새내기 서기관 (bronze)** — 말씀 필사로 1절 완성
```
Night hilltop scene, the sheep placed on the left side of the frame: it sits upright
on its two hind legs at a tiny wooden writing desk, both front hooves gripping an
enormous feather quill nearly twice its own height, tongue poking out in fierce
concentration and a small smudge of ink on its nose. On the desk lies a very long
blank parchment scroll that spills off the edge and rolls far away down the hill —
and at the very top of it the sheep has just finished one single, slightly wobbly
stroke of decorative wavy ink that glows softly warm amber. A little ink pot sits
tipped over beside it. The sheep looks up with the enormous pride of a creature who
has just written its very first stroke. One small amber candle on the desk is the
only warm light; deep navy sky with tiny blue-white stars above.
```

**typing_one_chapter · 📄 한 장을 온전히 (silver)** — 한 장 전체를 필사
```
Dramatic night cliff scene in the upper right of the frame: the sheep stands upright
on its two hind legs at the edge of a rocky ledge, both front hooves lifting a single
finished parchment page high above its head toward the sky, presenting it to the
world like a royal newborn in a grand movie moment. The page is covered top to bottom
in neat rows of decorative wavy ink lines and glows warmly amber from within, the
only warm light in the scene, its glow catching the sheep's proud, misty-eyed face.
On the rock around its hooves lie a few worn-down little stubs of feather quills and
an empty ink pot. Below the cliff a calm sea of soft navy mist; deep navy sky with
tiny blue-white stars.
```

**typing_shepherd · 🐑 목자의 노래를 새긴 자 (silver)** — 시편 23편 전체 필사
> 목자는 인물로 그리지 않고 **지팡이 + 등불**로만 암시한다(하나님을 형상으로 그리지 않는 교회 노선 — 돌아온 탕자의 '아버지'는 비유 속 인물이라 예외였다).
```
A peaceful moonlit meadow of soft green pasture beside a perfectly still, mirror-calm
stream that reflects the stars. The sheep lies comfortably on its belly in the deep
grass in the upper left area, a small parchment scroll spread out in front of it,
a feather quill resting loosely between its two front hooves — it has drifted into
the coziest half-asleep smile mid-writing, eyes gently closed, completely at rest.
Just behind it a tall wooden shepherd's crook is planted in the ground, and a small
lantern hanging from the crook casts the one warm amber glow over the sheep like a
quiet guardian. Fireflies drift above the grass. Deep navy sky with tiny blue-white
stars; the stream and bottom-center of the frame stay calm and empty.
```

**typing_hundred · 📜 부지런한 서기관 (silver)** — 말씀 100절 필사
```
Cozy night scene inside a small wooden scribe's nook with a round window showing the
navy starry sky. The sheep sits upright on its two hind legs on a little stool on the
right side of the frame, taking a well-earned break: it stretches one front leg out
straight in a comical wrist-stretching pose, eyes squeezed shut with a satisfied
groan-smile, a tiny sparkle of relief beside it. Next to the stool stands the scroll
it has written, rolled up into a big, fat, round roll almost as tall as the sheep
itself, its loose end trailing decorative wavy ink lines. A feather quill rests in an
ink pot and a small cup of tea steams on the desk. One warm amber oil lamp lights the
corner; everything else is soft navy shadow.
```

**typing_ezra · 🪶 에스라의 후예 (gold)** — 말씀 1,000절 필사
```
Grand night scene in the square of an ancient walled city with tall stone gates.
In the upper center the sheep stands upright on its two hind legs atop a tall wooden
platform with a few steps, wearing a slightly-too-big scholar's turban and a small
scribe's robe, a feather quill tucked behind one ear. With both front hooves it
unrolls an immensely long scroll it has copied by hand, and the scroll cascades down
the steps and flows away across the stone square like a gentle river of warm amber
light, covered in decorative wavy ink lines. On the far left and right edges of the
square small woodland animals (rabbits, a fox, a hedgehog, birds) stand at a
respectful distance gazing up in awe. Warm golden light rises from the scroll;
deep navy sky full of tiny blue-white stars. Epic scale, humble tiny scholar; the
bottom-center of the square stays dim and empty.
```

**typing_swift_pen · 🖋️ 필객의 붓 (silver)** — 정확도 95% 이상으로 분당 300타
```
Night scene on a breezy hilltop: the sheep stands upright on its two hind legs in the
upper left of the frame, holding a feather quill in both front hooves and sweeping it
through the air like a calm orchestra conductor in perfect flow, eyes half-closed,
a serene little smile, wool fluttering in the wind. From the tip of the quill a long,
graceful ribbon of glowing warm amber ink streams out and swirls in elegant loops and
curves across the upper sky like a ribbon dance, sprinkling tiny sparkles as it flows.
A small parchment scroll on a rock beside it is filled with neat decorative wavy ink
lines. Deep navy sky with tiny blue-white stars; the bottom of the frame stays quiet
dark grass.
```

**typing_lightning · ⚡ 번개 손가락 (gold)** — 정확도 95% 이상으로 분당 500타
```
Night scene in a small cozy study, the sheep sitting upright on its two hind legs on
the right side of the frame at a small antique typewriter with plain round blank
keycaps. Its two front hooves are a comical motion blur over the keys, tiny crackling
blue-white sparks and little zigzag lightning bolts leaping off the keyboard, its wool
puffed up and frizzy from static electricity like a fluffy cloud, a thin wisp of smoke
curling from the machine, and a long sheet of paper with decorative wavy lines
shooting out of the top. Yet right beside the typewriter a single cup of tea sits
perfectly still and calm under the warm amber desk lamp — the one quiet thing in the
storm. Deep navy shadows fill the room; a round window shows the navy starry sky.
Epic speed, tiny flustered-proud typist.
```

**typing_heart_tablet · 💗 마음판에 새긴 자 (gold)** — 암송 모드로 50절 필사
```
Quiet night scene on a soft hill under a vast starry sky. In the upper center the
sheep sits upright on its two hind legs on a small cushion, wearing a cozy sleep mask
pulled over its eyes, writing calmly on a long parchment scroll with a feather quill
held in both front hooves — and the decorative wavy ink lines it writes are perfectly
neat and even. A closed book lies shut beside it, untouched. From the middle of the
sheep's chest a soft heart-shaped warm amber glow shines through its white wool —
the only warm light in the scene — gently lighting the scroll. The sheep wears a
completely serene, peaceful smile. Deep navy sky with tiny blue-white stars and a few
drifting sparkles; the lower part of the hill stays dim and empty.
```

**typing_daily_line · 🗓️ 날마다 한 줄 (silver)** — 여러 날에 걸쳐 총 7일 필사
```
Cozy night treehouse scene: the sheep sits upright on its two hind legs on the wide
windowsill of a small wooden treehouse on the left side of the frame, writing one
neat line of decorative wavy ink in a small leather journal with a feather quill held
in both front hooves, a peaceful content smile. Strung across the upper part of the
frame from the treehouse to a far branch is a long clothesline, and pinned along it
with little wooden clothespins hang small handwritten journal pages drying like
laundry, each covered in wavy ink lines and glowing faintly. A warm amber lantern
hangs by the window as the one warm light. A crescent moon and tiny blue-white stars
in the deep navy sky; the bottom-center stays dark, quiet leaves.
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

**typing_jot_and_tittle · 🔍 일점일획도 (gold)** — 정확도 100%로 30절 필사 (히든, 필사 연작)
> `obadiah_finder` 가 이미 돋보기·탐정 모자를 썼으므로 여기선 돋보기 금지. 유머의 핵심은 설명 문구 "오타가 당신을 피해 다닙니다" — 겁먹고 도망치는 잉크 얼룩 꼬마들.
> **캐릭터·소품 일치용 첨부 추천**: 이미 만든 필사 연작 `typing_first.webp`(깃펜·작은 책상) + `typing_hundred.webp`(둥근 창·찻잔·잉크병) 두 장.
> 첨부한 뒤 프롬프트 맨 앞에 "첨부한 그림들과 완전히 같은 양 캐릭터와 같은 화풍으로" 한 줄을 덧붙인다. 공통 스타일 블록까지 합친 완성본은 이 문서 맨 아래 **일점일획도 한 번에 붙여넣기**에 있다.
```
Night scene at a small wooden writing desk in the upper right of the frame: the sheep
sits upright on its two hind legs, holding a feather quill in both front hooves with
absolute calm precision, eyes focused and serene, the tip of the quill glowing with a
single tiny jewel-like point of warm amber light. Across the parchment in front of it
runs a flawless line of decorative wavy ink. All around the edges of the parchment,
a little crowd of tiny round black ink-blot creatures with big panicked eyes and
stubby legs are fleeing in comical terror — leaping off the edge of the desk,
hiding behind the ink pot, one diving into a teacup — scattering away from the sheep
as if it were a legendary hero they dare not approach. The glowing quill tip is the
one warm light, catching the sheep's face; deep navy shadows fill the room and tiny
blue-white stars show through a round window behind. Epic hero standoff, adorably
tiny opponents.
```

---

## 일점일획도 한 번에 붙여넣기 (`typing_jot_and_tittle`)

첨부: `public/images/title-bg/typing_first.webp`, `public/images/title-bg/typing_hundred.webp`
결과 저장: `public/images/title-bg/typing_jot_and_tittle.webp` (1376×768) → `TitleBackdrop.tsx` 의 `TITLE_BG_KEYS` 히든 묶음에 키 추가

```
Using the attached images as reference, draw the exact same sheep character in the
exact same art style.

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
Night scene at a small wooden writing desk in the upper right of the frame: the sheep
sits upright on its two hind legs, holding a feather quill in both front hooves with
absolute calm precision, eyes focused and serene, the tip of the quill glowing with a
single tiny jewel-like point of warm amber light. Across the parchment in front of it
runs a flawless line of decorative wavy ink. All around the edges of the parchment,
a little crowd of tiny round black ink-blot creatures with big panicked eyes and
stubby legs are fleeing in comical terror — leaping off the edge of the desk,
hiding behind the ink pot, one diving into a teacup — scattering away from the sheep
as if it were a legendary hero they dare not approach. The glowing quill tip is the
one warm light, catching the sheep's face; deep navy shadows fill the room and tiny
blue-white stars show through a round window behind. Epic hero standoff, adorably
tiny opponents.
```
