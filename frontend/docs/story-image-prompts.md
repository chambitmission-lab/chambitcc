# 처음 만나는 성경 — 에피소드 일러스트 프롬프트 (Gemini용)

`/bible/story` 42화 에피소드 히어로 이미지 생성 프롬프트 모음.
컨셉: 칭호 배경(`title-bg-prompts.md`)과 **같은 "코지-에픽(cozy-epic)" 세계관** — 구도와 빛은 웅장하게, 주인공은 귀엽게.
같은 양 캐릭터가 이번엔 **성경 이야기 속을 여행하는 목격자(독자의 아바타)**로 등장한다.

## 사용법

1. 아래 **공통 스타일 블록**을 먼저 붙여넣고, 원하는 화의 **장면 문단**을 이어 붙여 한 번에 요청.
2. **캐릭터 일치 꿀팁**: 기존 칭호 배경 이미지(`public/images/title-bg/`) 중 한 장을
   Gemini에 함께 첨부하고 "이 양 캐릭터와 완전히 같은 캐릭터로"라고 하면 시리즈가 정확히 이어진다.
3. 한 대화 안에서 이어서 생성 (대화가 바뀌면 톤이 흩어짐). 스타일이 벗어난 장만 재생성.
   **소품 개수는 믿지 말 것** — 생성 AI는 개수 세기에 약하다. 개수가 중요한 소품은
   "exactly one pair, two matching boots, nothing more"처럼 이중 삼중으로 못 박고,
   그래도 틀리면 개수 언급을 아예 빼거나(주머니에 담기 등) 재생성.
   **"네발 서기 + 물건 들기" 조합 금지** — 네발이 다 땅에 있는데 들라고 하면 팔이
   새로 돋아난다(17화 사고). 들 게 있으면 "upright on its two hind legs, both front
   hooves holding..."처럼 두발 자세를 명시하고, 네발 자세면 입에 물기·등에 얹기로.
4. 비율 **16:9**, 변환: `cwebp -q 78 -crop 0 0 1280 720 -resize 1200 675 원본.png -o {에피소드 id}.webp`
   (장당 30~60KB쯤 나온다. `-crop`은 1376×768 원본 기준 — **우하단 제미나이 ✦ 워터마크를 잘라내는 단계**라
   생략 금지. 원본 해상도가 다르면 우하단 ~100px이 잘려나가도록 crop 폭·높이를 맞출 것)
5. 저장: `src/pages/Bible/Story/img/{에피소드 id}.webp` — **파일만 넣으면 자동 연결**된다
   (`StoryEpisode.tsx`의 `import.meta.glob`이 감지, 없는 화는 이모지 히어로 유지).
   id는 각 프롬프트 제목의 값 그대로 (URL·진행 저장용 불변 슬러그). creation·fall·flood 3장 적용 완료.

## 화면 배치 (판단)

- **1순위 — 에피소드 읽기 화면 히어로** (`StoryEpisode.tsx` 타이틀 영역): hook·제목 바로 위 16:9 라운드 카드.
  이야기를 읽기 직전에 장면이 각인되는 위치. 이모지는 이미지에 흡수시키거나 제거.
- **여정 맵 노드는 이모지 유지** — 44px 원 안에서는 일러스트가 뭉개져 오히려 인지가 나빠진다.
- 선택: 맵의 막(Act) 헤더 배너(각 막 첫 화 이미지 재사용), 다음 화 예고(teaser) 카드 배경.

## 일관성 규칙 (모든 이미지 공통)

- **주인공은 칭호 시리즈와 같은 양 한 마리** — 통통하고 하얀 아기 양. 단, 이번 시리즈에서 양은
  이야기의 **목격자/여행자**다: 장면을 지켜보고, 놀라고, 돕고, 감동한다. 성경 인물을 연기하지 않는다.
  (유일한 예외: 31화 '잃어버린 양' — 이야기 자체가 양 이야기라 양이 주인공이어도 된다)
- **예수님이 등장하는 장면** — 온화하게 빛나는 로브 차림, 뒷모습·원경·빛으로만. 얼굴 디테일 금지.
  엄숙한 장면(십자가·유배 등)에서 양은 장난기 없이 **조용히, 작게, 경외하는 자세**로.
- **팔레트 고정** — 깊은 네이비 밤하늘 베이스(#0A1428 계열) + 따뜻한 앰버빛 광원 하나 + 은은한 파란 별빛.
- **글자 금지** — 숫자·문자·로고가 들어가면 UI와 충돌하고, 한글은 반드시 깨진다.

---

## 공통 스타일 블록 (매번 맨 앞에 붙여넣기)

```
A wide 16:9 hero illustration for a Bible storybook feature in a mobile app, one of a
42-image series sharing a single consistent style. Style: cozy-epic children's storybook
illustration — soft flat shapes with subtle grain texture, rounded friendly forms, gentle
rim lighting. Base palette is deep navy night-blue (around #0A1428) with ONE warm amber
glowing focal light and tiny sparkling blue-white stars. The recurring hero is a small
chubby white sheep with stubby legs — the SAME sheep character every time — appearing in
each scene as a tiny traveler and witness inside the Bible story: watching, marveling,
helping, never playing the main biblical character. The sheep's short limbs are covered
in white wool and end in small rounded dark hooves — never human-like hands, fingers,
arms, or bare pink skin. Composition: epic and cinematic like
a movie poster, but the witness is adorable, which makes it warm and inviting. When Jesus
appears, show him only as a gently radiant robed figure seen from behind or at a distance,
face never detailed, treated with reverence. Solemn scenes stay quiet and tender rather
than funny. No text, no letters, no numbers, no logos, no frames or borders.

Scene:
```

---

## 1막 · 시작 (창세기 1–11장)

**01. creation — 세상이 시작되다**
```
The very first dawn of creation: a burst of warm golden light breaks over dark primordial
waters, separating brightness from darkness, while newborn stars swirl into place across
the navy sky. The sheep sits on a tiny floating rock at the edge of it all, wool blown
back by the wind of the beginning, holding onto its little hat, eyes enormous with wonder.
```

**02. fall — 무언가 잘못되다**
```
A lush garden at dusk with one tree at its center bearing a single glowing fruit, a
serpent coiled quietly around the trunk, two small silhouetted figures reaching toward
it. A long cold shadow creeps across the warm grass. The sheep peeks out from behind a
flowering bush in the foreground, hooves over its mouth, deeply worried.
```

**03. flood — 노아와 무지개**
```
A great wooden ark rides vast flood waters under parting storm clouds. The sheep stands
on deck in a tiny yellow raincoat, hooves on the railing, watching a white dove fly home
carrying an olive leaf, while pairs of animals peek hopefully from the ark's round
windows. A luminous rainbow breaks through the gray-navy sky.
```

**04. babel — 하늘에 닿으려던 탑**
```
An enormous unfinished ziggurat tower spirals up into churning storm clouds, its top lost
in darkness, while tiny crowds scatter from its base in every direction across a twilight
plain, gesturing past each other in confusion. The sheep stands at the bottom holding a
rolled-up blueprint upside down, scratching its head with one hoof.
```

## 2막 · 약속 (창세기 12–50장)

**05. abraham — 한 사람을 부르시다**
```
A dark desert night beside a lone tent: an old robed man seen from behind lifts his head
to an overwhelming sky filled with countless brilliant stars stretching to the horizon.
The sheep sits close beside him looking up too, trying to count the stars on its stubby
hooves and clearly losing count, awed.
```

**06. isaac — 산 위의 시험**
```
Dawn on a windswept mountaintop: a stone altar with bundled firewood, and nearby a ram
caught in a thicket glowing in warm golden light. A father and son walk down the slope
together in silhouette, hand in hand. The sheep watches from a rock, wiping its brow
with one hoof in enormous relief.
```

**07. jacob — 씨름하는 사람**
```
Night at a shallow river ford: two figures locked in a wrestling embrace, one of them
faintly radiant, as the first golden line of dawn breaks on the horizon. The sheep peeks
from behind a boulder holding a tiny lantern, wide-eyed, having clearly stayed up all
night watching.
```

**08. joseph — 꿈꾸는 소년**
```
A moonlit wheat field where golden sheaves bow in a circle toward a young man in a vivid
many-colored robe, dreamlike stars swirling low overhead and distant Egyptian granaries
on the horizon. The sheep wears a small leftover scrap of the colorful fabric as a scarf,
twirling once, delighted.
```

## 3막 · 구출 (출애굽기·민수기)

**09. burning-bush — 불타는 떨기나무**
```
A lone desert bush blazes with brilliant golden flame yet is not consumed. A shepherd
kneels before it in silhouette, his sandals set aside on the holy ground. The sheep
stands barefoot at attention beside him, staring at the flame in awe — next to the
shepherd's sandals it has neatly placed its own footwear: exactly one pair of tiny
yellow rain boots, two matching boots side by side, nothing more.
```

**10. exodus — 바다가 갈라지다**
```
The sea stands parted into two towering walls of deep teal water with a dry path between
them, a long line of tiny people crossing toward the far shore under a pillar of golden
fire and cloud. The sheep walks in the middle of the crowd, stopped mid-step to stare at
a curious fish pressing its face against the water wall, staring right back.
```

**11. sinai — 산에서 받은 열 마디**
```
A dark mountain wrapped in smoke, cloud and flickers of lightning, two stone tablets
glowing warm gold near the summit where one small figure climbs alone. Far below at base
camp, the sheep sits on the ground by a tiny tent wearing an oversized helmet, gripping
a mug with both front hooves, watching the summit with equal parts terror and awe.
```

**12. wilderness — 광야의 40년**
```
A vast dune desert under a wide navy sky: a winding trail of tiny tents and walking
people led by a tall luminous pillar of cloud, soft white flakes of manna drifting down
like snow. The sheep stands with its head tilted back and tongue out, happily catching
manna flakes, a little basket already full beside it.
```

## 4막 · 땅과 왕 (여호수아–열왕기)

**13. jericho — 무너지는 성벽**
```
Massive ancient city walls crack and crumble outward in slow golden dust, while a ring
of tiny marching figures below raise rams-horn trumpets. The sheep marches proudly at
the end of the line, upright on its two hind legs, both front hooves holding a trumpet
twice its size to its mouth, cheeks puffed out enormous, eyes squeezed shut with effort.
```

**14. judges — 영웅들의 시대, 흔들리는 백성**
```
A rugged twilight land under a turbulent spiral of storm clouds, a broken sword planted
in cracked earth. On a small hill, the sheep stands upright on its two hind legs as a
tiny volunteer watchman, both front hooves gripping one lone torch raised high, burning
bravely against the huge dark sky — a very small light, held very stubbornly.
```

**15. ruth — 이방 여인의 선택**
```
A golden barley field at warm sunset where a young woman gleans sheaves of grain, a dirt
path leading to the small lamplit village of Bethlehem on the hill behind her. The sheep
follows happily on all four stubby legs, one barley sheaf far bigger than itself strapped
across its back like a huge backpack, leaning forward with cheerful determination, its
small dark hooves planted firmly on the path.
```

**16. saul — 왕을 달라는 백성**
```
A darkening throne hall: a tall king stands alone with a spear, his crown tilting and
slipping from his bowed head, his long shadow splitting in two across the floor. The
sheep stands off to the side as a tiny page holding a velvet cushion, watching the
falling crown with big worried eyes.
```

**17. david — 목동이 왕이 되다**
```
Warm morning light on a valley: a small shepherd boy holding only a sling stands calm,
facing a huge armored giant silhouetted on the far side — the light clearly on the boy's
side. At the boy's heel a small open pouch of smooth sling stones lies on the ground,
and the sheep gently nudges it toward the boy with its nose, eyes full of trust. The
sheep is a simple quadruped animal standing on its four stubby wool legs, carrying
nothing and holding nothing — no arms, no hands, no extra limbs of any kind.
```

**18. solomon — 지혜의 왕과 성전**
```
A magnificent golden temple gleams on a hilltop with ornate pillars and rising incense,
the sky above it split — radiant gold on one side, creeping dusk on the other, and a
hairline crack at the temple's base. The sheep, in a tiny builder's hard hat, polishes
the bottom of one great pillar with a cloth, pausing to look up uneasily at the darkening
half of the sky.
```

## 5막 · 분열과 선지자 (열왕기·선지서)

**19. divided — 나라가 둘로 갈라지다**
```
A fork in a night road where a single royal banner lies torn into two halves, one half
blown toward each path, with two separate campfires burning far apart on the northern
and southern horizons. The sheep stands exactly at the fork holding a folded map, looking
left and right, ears drooping, heartbroken that one road became two.
```

**20. elijah — 불의 선지자 엘리야**
```
A mountaintop at night: a column of blinding fire falls from the sky onto a
water-drenched stone altar, a lone prophet with arms raised in silhouette, a stunned
crowd tiny at the mountain's edge. The sheep peeks out from behind a big water jar,
wool blown straight back by the blast, one hoof still holding a little water bucket
it helped carry.
```

**21. jonah — 도망친 선지자**
```
Inside the great fish, vast as a cathedral: ribs arch overhead like columns, deep teal
sea-light glows through the distant mouth. A prophet sits in silhouette, head in his
hands, thinking it all over. The sheep sits quietly beside him, having set one warm
amber lantern between them, offering silent company at the bottom of the sea.
```

**22. prophets — 선지자들의 외침**
```
Dusk on the high wall of an ancient city: a robed figure holds up a glowing scroll,
rays of warm light radiating from it over rooftops that stay dark and indifferent.
Below on the wall path, the sheep runs as a tiny courier with a satchel overflowing
with rolled glowing scrolls, determined to deliver every single warning.
```

**23. exile — 무너진 성전, 낯선 땅의 노래**
```
A wide Babylonian river at dusk, willow trees along the bank where harps hang silent
from the branches, weary people resting beneath them, distant ziggurats on the horizon,
one small candle flame glowing among the exiles. The sheep quietly hangs its own tiny
harp on the lowest branch and sits down close to the people, leaning gently against
someone's side. Solemn and tender, no humor.
```

## 6막 · 귀환과 침묵 (에스라–말라기)

**24. return — 집으로 돌아가다**
```
Sunrise over a ruined city wall being rebuilt: wooden scaffolds, fresh stones rising
out of the rubble, warm gold light washing over the work. The sheep, in a tiny hard
hat, proudly carries a single stone on its back up a plank ramp, cheeks puffed,
one bead of sweat flying — its stone clearly the smallest and clearly carried with
the most heart.
```

**25. esther — 죽으면 죽으리이다**
```
A vast Persian throne hall with towering columns: a queen in flowing robes walks alone
down the long carpet toward the shadowed throne, from which a golden scepter extends
toward her, catching the light. Behind her, the sheep solemnly carries the very end of
her long royal train in its mouth, marching with tiny determined steps, refusing to
let her walk in alone.
```

**26. silence — 400년의 침묵**
```
A thin crescent moon over the still, dark rooftops of Jerusalem — four hundred years of
quiet in the air. On one rooftop the sheep lies fast asleep, wrapped in a little blanket,
while low on the horizon behind it one brand-new star just begins to rise with a faint
warm glow. The sheep hasn't noticed yet. The whole world hasn't noticed yet.
```

## 7막 · 예수님 오시다 (복음서 1)

**27. nativity — 구유에 누우신 왕**
```
A humble stable on the Bethlehem hillside glows warm gold from within: a manger at its
heart, parents and shepherds gathered near in soft silhouette, one great star blazing
directly above the roof. The sheep stands among the stable animals in the front,
on tiptoe on all four hooves, peeking over the edge of the manger with its ears
drooped in pure awe.
```

**28. baptism — 물과 광야에서**
```
A calm river at dawn: a robed figure stands waist-deep, seen from behind, as the sky
opens above him in soft light and a luminous white dove descends along a single golden
beam. On the riverbank the sheep waits quietly, holding a neatly folded towel over one
front leg like a tiny attendant, watching the light with wide eyes.
```

**29. sermon — 산 위의 가르침**
```
A green hillside sloping down to a blue lake, crowds seated quietly on the grass among
wild lilies and small birds, and at the front a gently radiant figure teaching, seen
from behind in the morning light. The sheep sits in the very front row, closer than
anyone, ears standing straight up, completely absorbed, a half-eaten flower forgotten
in its hoof.
```

**30. miracles — 폭풍을 잠재우신 분**
```
Violent dark waves and rain around a small wooden boat — but at its bow one robed figure
stands with a raised hand, and around the boat a widening circle of perfectly calm,
glassy golden water spreads while the waves freeze mid-crash. The sheep clings to the
mast in a tiny life vest, mid-panic, one eye already opening in astonishment at the
sudden stillness.
```

**31. lost — 잃어버린 것을 찾아서**
```
Dusk on the hills: a shepherd walks home carrying one small sheep across his shoulders
— and this time it IS our sheep, muddy, burr-covered, teary-eyed and utterly happy,
hooves gently holding the shepherd's collar. Ahead, warm golden light glows from the
fold gate where the ninety-nine wait, all looking up. The one scene where the little
witness is the story itself.
```

## 8막 · 십자가와 부활 (복음서 2)

**32. jerusalem — 마지막 일주일이 시작되다**
```
A great golden city gate in late light: a humble figure rides a small donkey through
it while crowds line the road, laying palm branches and cloaks on the ground. The
sheep hurries to lay down its own tiny blanket on the road just in time, then looks
up at the passing rider with shining eyes.
```

**33. lastsupper — 마지막 식사, 그리고 겟세마네**
```
A lamplit upper room: a long low table with a group of robed figures gathered in warm
silhouette, and at the table's center one cup and one broken loaf glowing gold —
through the window, dark olive trees under a navy sky. The sheep lies curled beneath
the table among the sandaled feet, quiet and still, keeping close on the heaviest
of nights.
```

**34. cross — 십자가**
```
Three crosses stand on a bare hill against a darkened, heavy sky, the center cross
lit by a single shaft of pale golden light breaking through the clouds, small
silhouetted figures keeping watch below. At the foot of the hill, apart and small,
the sheep sits perfectly still with its head bowed low, its little hat held against
its chest. Completely solemn — no humor in this one.
```

**35. resurrection — 사흘째 새벽**
```
A garden tomb at first light: the great round stone rolled aside, brilliant warm dawn
light streaming out of the open doorway across dewy grass and blooming flowers, linen
cloths folded just inside. The sheep stands at the entrance bathed in the outpouring
light, wool glowing gold at the edges, eyes wide, its dropped hat lying forgotten in
the grass — joy just beginning to dawn on its face.
```

## 9막 · 교회의 시작 (사도행전·서신서)

**36. pentecost — 바람과 불의 날**
```
A crowded upper room where small tongues of golden flame rest above each person's head,
ribbons of luminous wind swirling in through the open windows. In the corner among them
sits the sheep with a tiny flame of its own hovering over its head — eyes crossed
upward trying to look at it, hooves clasped, equal parts astonished and overjoyed.
```

**37. paul — 박해자가 전도자로**
```
A dusty desert road at midday turned to night-navy by contrast: a man fallen to his
knees, shielding his eyes from an overwhelming column of light bursting from the sky,
his travel documents scattering, companions staggering back in silhouette. The sheep
crouches at the roadside with one hoof shielding its eyes and its wool blown straight
back, hat flying off, caught in the same great light.
```

**38. missions — 온 세상으로**
```
An ancient sailing ship crosses a deep blue Mediterranean at dusk, and across the sea
and coastlines beyond it thin glowing golden routes spread outward from city to city
toward a distant lighthouse. At the bow the sheep stands upright on its two hind legs
in a tiny sailor's scarf, one front hoof on the rail and the other holding a spyglass
to its eye, wind in its wool, utterly ready for the ends of the earth.
```

**39. letters — 교회에게 보낸 편지들**
```
A night landscape of scattered little house-church windows glowing warm across dark
hills, connected by faint golden threads of light. Along the winding road between them
runs the sheep as a tiny mail carrier, satchel stuffed with sealed scrolls, one letter
held carefully in its mouth, determined that every church gets its letter tonight.
```

## 10막 · 새 하늘과 새 땅 (요한계시록)

**40. revelation — 마지막 책, 문 앞에 서신 분**
```
The inside of a dim, cozy room at night: a humble wooden door with warm golden light
blazing through its edges and keyhole from outside, where a radiant robed figure stands
knocking gently, visible only as light through the gap. Seven small golden lampstands
glow softly around the dark room. The sheep stands before the door, one trembling hoof
already reaching for the handle.
```

**41. newheaven — 모든 눈물이 씻기다**
```
A glorious golden city descends slowly from parting clouds over a renewed green earth,
a crystal river flowing from its gate, a great tree with luminous leaves on the
riverbank, no darkness left anywhere in the sky. The sheep stands in the meadow looking
up, one last tear sliding down its cheek and catching the golden light as it turns
into a tiny spark — while the sheep begins to smile.
```

**42. epilogue — 이제 당신의 차례**
```
An open wooden door leading out of a dark room into a bright sunrise landscape: an open
book lies on the threshold and a gentle path runs forward through golden fields toward
the light. The sheep holds the door open with its back, turned toward the viewer,
one hoof stretched out in invitation — after forty-one adventures, it is your turn
to walk through.
```
