# 봉인 대기 화면 배경 이미지 프롬프트 (Gemini용)

`/capsule/:id` 에서 **아직 못 여는 캡슐**(`CapsuleOpen.tsx` → `.capsule-waiting`, 봉인 다이얼 `D-1` 화면)
뒤에 깔 배경. 라이트/다크 각 1장. **A안(금고 앞 잠복근무)으로 적용 완료** — 맨 아래 적용 상태 참고.
아래 5개 컨셉은 다시 뽑을 때를 위해 그대로 남겨 둔다.

컨셉은 다른 화면들과 같은 **코지-에픽 동화풍 + 같은 양 캐릭터**(`public/images/title-bg/`, `capsule/letter-*.webp`).
다만 이 화면만은 **웃기는 게 목적**이다. 기다림은 아무 일도 안 일어나는 시간이라서,
화면이 진지하면 그냥 비어 보인다. 웃기면 기다림이 **장면**이 된다.

> **핵심 발상 — 다이얼을 그림 안의 물건으로 만든다.**
> 화면 한가운데 208px 원(`.capsule-dial`)이 이미 떠 있다. 배경은 그 원을 피하는 게 아니라,
> 그 원이 **금고 문 / 화분 / 오븐 창 / 달 / 시계 문자판**으로 읽히도록 주변을 그린다.
> 그러면 배경과 다이얼이 한 그림이 되고, `D-1` 이 그 물건의 눈금이 된다.
> 아래 5개 컨셉은 전부 이 규칙을 따른다. **마음에 드는 것 하나만 고르면 된다.**

## 사용법

1. Gemini에 `public/images/capsule/letter-light.webp`(또는 `title-bg/` 아무거나) 한 장을 첨부하고
   "이 양 캐릭터와 완전히 같은 캐릭터로" 라고 덧붙인 뒤, 고른 컨셉의 프롬프트를 통째로 붙여넣는다.
2. 라이트 → 다크 순으로 뽑고, 다크는 **라이트 결과물을 첨부**한 뒤 "같은 구도·같은 소품, 시간대만 밤으로"를 덧붙인다.
   (이 화면은 히어로와 달리 두 장이 **밝기만 다른 같은 장면**이어야 한다. 장면을 뒤집지 않는다.)
3. 결과물 저장 위치 (파일명 고정):
   - 라이트: `frontend/public/images/capsule/sealed-light.webp`
   - 다크:   `frontend/public/images/capsule/sealed-dark.webp`
4. 규격: **1:1 정사각 (1440×1440 권장)**, `cwebp -q 76`, 한 장 70KB 이하.

## 레이아웃 제약 (프롬프트에 이미 반영돼 있음 — 손대지 말 것)

- **중앙 상단 원형 안전지대**: 가로 정중앙, 세로 위에서 32% 지점에 **지름 = 이미지 폭의 46%** 인 원.
  이 원 안에는 아무것도 그리지 않는다. 다이얼(눈금 링 + 흰 코어 + `D-1`)이 그 위에 정확히 얹힌다.
  주인공(양)은 그 원의 **바로 아래 또는 좌우**에서 원을 **올려다보거나 만지는** 자세.
- **아래 40%는 거의 비운다**: 제목·칩·블러 편지 카드·CTA 버튼이 전부 그 위에 쌓인다.
  바닥·풀·그림자 같은 단순한 톤만 두고 캔버스 색으로 서서히 사라져야 한다.
- **네 가장자리는 캔버스 색으로 페이드**: 라이트 `#f1f3f6`, 다크 `#131313`.
  PC(560px)와 모바일(448px)에서 크롭 폭이 달라지므로 **좌우 대칭 구도**로 잡는다.
- 글자·숫자·로고·읽히는 필기 **금지**(달력 숫자, 시계 문자판 숫자, 오븐 노브 눈금 전부 포함).
  테두리·비네트·액자 금지.
- 라이트는 high-key(밝고 저대비, 검정 글자가 얹힌다), 다크는 낮은 명도 + 앰버 포인트 한두 곳
  (흰 글자가 얹힌다). 브랜드 파랑은 라이트 `#3182f6` / 다크 `#4593fc` — **악센트로만**, 면적으로 쓰지 않는다.

## 컨셉 고르기

| | 컨셉 | 원(다이얼)의 정체 | 웃음 포인트 | 남는 생각 |
|---|---|---|---|---|
| A | 금고 앞 잠복근무 | 거대한 금고 문 | 아무도 못 여는 걸 굳이 지킨다 | 기다림도 자리를 지키는 일 |
| B | 심어 둔 편지 | 흙 위 화분 테두리 | 편지에 물을 준다 | 시간이 자라게 한다 |
| C | 천천히 굽는 중 | 오븐 유리창 | 너무 일찍 꺼내 본 실패작들 | 익는 데는 시간이 든다 |
| D | 달나라 배송 | 밤하늘의 달 | 사다리가 대놓고 모자란다 | 손 닿지 않는 곳에 맡겨 둠 |
| E | 시계추 그네 | 괘종시계 문자판 | 아무리 밀어도 안 빨라진다 | 재촉이 통하지 않는 시간 |

---

## A. 금고 앞 잠복근무 — 라이트

```
A square 1:1 background illustration for a "sealed time capsule / countdown" screen
in a mobile app, LIGHT MODE. Style: cozy-epic children's storybook illustration —
soft flat shapes with subtle paper grain, rounded friendly forms, gentle airy
lighting, gently humorous. Use the SAME small chubby white sheep character as the
attached reference image: stubby legs, tiny round black hooves, serene slightly smug
smile.

COMPOSITION IS CRITICAL. Dead center horizontally, at 32% down from the top, there
must be a completely EMPTY CIRCLE whose diameter is 46% of the image width — nothing
drawn inside it, just flat pale tone. A real UI dial will be placed exactly there.
The illustration must make that empty circle read as the round door of an enormous
vault. So: draw only the vault's outer frame around it — a thick rounded stone-and-
brass rim with a few chunky rivets, two small hinges on the left, hugging the circle
from outside. The bottom 40% of the image is nearly empty pale floor fading away,
and all four edges fade smoothly into flat #f1f3f6.

Scene: the sheep is camped out in front of the vault door, keeping watch on it
overnight even though absolutely nobody could open it anyway. It sits in a tiny
striped folding camp chair at the LOWER LEFT of the circle, wrapped in a blanket,
holding a steaming mug in both front hooves, staring up at the vault with enormous
earnest seriousness. A small dome tent, a thermos and a stack of empty mugs sit at
the lower right, symmetrically balancing it. One tiny lamb has fallen asleep on the
floor next to the chair.

Palette: high-key warm cream and pale cool grey, soft white; brushed brass on the
vault rim; one small accent of clear blue #3182f6 (the blanket stripe). Bright,
low-contrast, no heavy shadows.

No text, no letters, no numbers, no logos, no readable writing anywhere. No frames,
no borders, no vignette.
```

## A. 금고 앞 잠복근무 — 다크

```
Same square 1:1 illustration as the light version — the SAME vault door rim, the
SAME sheep in the SAME camp chair with the SAME mug, the SAME tent and sleeping lamb
in exactly the same positions — but now it is the middle of the night, DARK MODE.

Keep the empty center circle exactly as before: dead center horizontally, 32% down,
diameter 46% of image width, absolutely nothing inside it, just flat near-black tone.
The vault rim still hugs it from outside, now only catching a thin cool rim-light.

Palette: deep charcoal-black base (#131313 at the edges, lifting to about #232323 in
the middle), muted brass on the vault rim, and ONE warm amber light source — a small
camping lantern on the floor beside the chair — casting a soft golden pool on the
sheep, the mug's steam and the sleeping lamb. A faint cool blue #4593fc glow traces
the top edge of the vault rim, like a standby light. The sheep is still wide awake
and still absurdly serious about guarding a door nobody can open.

Overall very dark and low-contrast so white text stays readable. The bottom 40% is
almost pure darkness, and all four edges fade into flat #131313.

No text, no letters, no numbers, no logos, no readable writing anywhere. No frames,
no borders, no vignette. The only bright things are the lantern and its pool of
light.
```

---

## B. 심어 둔 편지 — 라이트

```
A square 1:1 background illustration for a "sealed time capsule / countdown" screen
in a mobile app, LIGHT MODE. Style: cozy-epic children's storybook illustration —
soft flat shapes with subtle paper grain, rounded friendly forms, warm morning
light, gently humorous. Use the SAME small chubby white sheep character as the
attached reference image: stubby legs, tiny round black hooves, serene slightly smug
smile.

COMPOSITION IS CRITICAL. Dead center horizontally, at 32% down from the top, there
must be a completely EMPTY CIRCLE whose diameter is 46% of the image width — nothing
inside it, just flat pale tone, because a UI dial sits exactly there. Make that
circle read as the round rim of a big terracotta plant pot seen from slightly above:
draw only the pot's thick rounded rim and its rounded body just below and around the
circle, plus a little dark crumbly soil peeking over the near edge of the rim.

Scene: an envelope has been PLANTED in the pot like a bulb. Its corner sticks up out
of the soil and two impossible little green sprouts with heart-shaped leaves are
growing straight out of the sealed flap. The sheep stands at the LOWER LEFT, up on
its hind legs, watering the envelope with a small tin watering can, utterly matter-
of-fact about it. On the LOWER RIGHT, symmetrically, a tiny lamb crouches nose-to-
soil, checking whether it has grown since yesterday. A couple of butterflies drift
above. Bottom 40% is a soft pale garden floor fading to nothing; all four edges fade
smoothly into flat #f1f3f6.

Palette: high-key cream and pale sky, soft terracotta, fresh spring green, one small
accent of clear blue #3182f6 (the watering can). Bright, low-contrast, no heavy
shadows.

No text, no letters, no numbers, no logos, no readable writing anywhere. No frames,
no borders, no vignette.
```

## B. 심어 둔 편지 — 다크

```
Same square 1:1 illustration as the light version — the SAME pot rim, the SAME
planted envelope with the SAME two sprouts, the SAME sheep with the SAME watering
can on the lower left and the SAME lamb on the lower right, identical composition —
but now it is night, DARK MODE.

Keep the empty center circle exactly as before: dead center horizontally, 32% down,
diameter 46% of image width, absolutely nothing inside it, just flat near-black
tone. The pot rim still frames it from outside, catching only a thin moonlit edge.

Palette: deep charcoal-black base (#131313 at the edges, lifting to about #232323
around the pot), deep muted terracotta, dark blue-green leaves. Light sources: a
small warm amber lantern hung on a garden stake at the left, and soft cool moonlight
from above. The two sprouts and the envelope corner glow very faintly with a cool
blue #4593fc bioluminescence, as if the letter is quietly working through the night.
The butterflies are replaced by two or three tiny fireflies. The sheep is still
watering it, at night, in the dark, with total conviction. The lamb has fallen
asleep curled against the pot.

Very dark and low-contrast so white text stays readable. Bottom 40% almost pure
darkness; all four edges fade into flat #131313.

No text, no letters, no numbers, no logos, no readable writing anywhere. No frames,
no borders, no vignette. The only bright things are the lantern, the fireflies and
the faint glow on the sprouts.
```

---

## C. 천천히 굽는 중 — 라이트

```
A square 1:1 background illustration for a "sealed time capsule / countdown" screen
in a mobile app, LIGHT MODE. Style: cozy-epic children's storybook illustration —
soft flat shapes with subtle paper grain, rounded friendly forms, warm kitchen
light, gently humorous. Use the SAME small chubby white sheep character as the
attached reference image: stubby legs, tiny round black hooves, serene slightly smug
smile, now wearing a small apron and oven mitts.

COMPOSITION IS CRITICAL. Dead center horizontally, at 32% down from the top, there
must be a completely EMPTY CIRCLE whose diameter is 46% of the image width — nothing
inside it, just flat pale tone, because a UI dial sits exactly there. Make that
circle read as the round glass window of a chubby vintage cream-colored oven: draw
only the oven's rounded body and the thick brass ring around the window, with a
horizontal handle bar just beneath the circle and two small round knobs left and
right of it (the knobs must have NO numbers and NO markings on them).

Scene: the sheep is on its knees in front of the oven at the LOWER LEFT, both front
hooves on the floor, face right up against the glass, watching a letter bake with
unbearable anticipation. On the LOWER RIGHT, symmetrically, a small cooling rack
holds two obvious failures — envelopes taken out far too early, still limp and pale,
one of them slightly sad-looking — and a tiny lamb inspects them with a frown. A
wisp of sweet steam curls from the oven's edge.

Palette: high-key cream, warm butter yellow, soft pink, pale grey; brushed brass;
one small accent of clear blue #3182f6 (the apron). Bright, low-contrast, no heavy
shadows. Bottom 40% is a plain pale kitchen floor fading away; all four edges fade
smoothly into flat #f1f3f6.

No text, no letters, no numbers, no logos, no readable writing anywhere — the knobs
and the oven are completely unmarked. No frames, no borders, no vignette.
```

## C. 천천히 굽는 중 — 다크

```
Same square 1:1 illustration as the light version — the SAME oven with the SAME
brass window ring, handle and unmarked knobs, the SAME kneeling sheep in the SAME
apron at the lower left, the SAME cooling rack with the SAME two too-early envelopes
and the SAME lamb at the lower right — but now it is late at night in the kitchen,
DARK MODE.

Keep the empty center circle exactly as before: dead center horizontally, 32% down,
diameter 46% of image width, absolutely nothing inside it, just flat near-black
tone. The oven body and brass ring still frame it from outside.

Palette: deep charcoal-black base (#131313 at the edges, lifting to about #242220
around the oven), deep cream, muted brass. The oven is the ONLY strong light in the
room: a warm amber glow spills from the seam under its door and from the edge of the
window ring, lighting the sheep's face and wool from below and throwing one long
soft shadow behind it. A cool blue #4593fc pilot dot glows on one knob. Everything
else — the rack, the failures, the dozing lamb — sits in soft darkness, only edge-lit.

Very dark and low-contrast so white text stays readable. Bottom 40% almost pure
darkness; all four edges fade into flat #131313.

No text, no letters, no numbers, no logos, no readable writing anywhere. No frames,
no borders, no vignette. The only bright thing is the oven's amber spill.
```

---

## D. 달나라 배송 — 라이트

```
A square 1:1 background illustration for a "sealed time capsule / countdown" screen
in a mobile app, LIGHT MODE. Style: cozy-epic children's storybook illustration —
soft flat shapes with subtle paper grain, rounded friendly forms, pale dawn light,
gently humorous. Use the SAME small chubby white sheep character as the attached
reference image: stubby legs, tiny round black hooves, serene slightly smug smile.

COMPOSITION IS CRITICAL. Dead center horizontally, at 32% down from the top, there
must be a completely EMPTY CIRCLE whose diameter is 46% of the image width — nothing
inside it, just flat pale tone, because a UI dial sits exactly there. Make that
circle read as a huge pale daytime moon hanging low in a very early morning sky:
draw only a soft halo of thin cloud wisps and a few faint stars around its outside,
nothing at all on the disc itself.

Scene: the letter has already been sent up to the moon, and the sheep would very
much like it back. Leaning against the moon from the LOWER LEFT is a small wooden
ladder that is comically, hopelessly short — it ends barely above the sheep's head.
The sheep stands on its very top rung on tiptoe, one front hoof stretched all the
way up toward the moon, the other shading its eyes, absolutely certain this will
work. At the LOWER RIGHT, symmetrically, a tiny lamb steadies the ladder with both
hooves and looks worried. Two or three small envelopes drift upward between them
like balloons, already out of reach.

Palette: high-key pale dawn — soft peach, pale lilac, cream and cool white, one small
accent of clear blue #3182f6 (a ribbon on the ladder). Bright, low-contrast, no
heavy shadows. Bottom 40% is soft empty ground haze fading away; all four edges fade
smoothly into flat #f1f3f6.

No text, no letters, no numbers, no logos, no readable writing anywhere. No frames,
no borders, no vignette.
```

## D. 달나라 배송 — 다크

```
Same square 1:1 illustration as the light version — the SAME hopelessly short ladder
in the SAME place, the SAME sheep stretching up from its top rung, the SAME worried
lamb steadying it, the SAME two or three envelopes drifting up — but now it is deep
night, DARK MODE.

Keep the empty center circle exactly as before: dead center horizontally, 32% down,
diameter 46% of image width, absolutely nothing inside it, just flat near-black
tone. It is the same moon, now seen at night: draw only a soft cool halo and a
scatter of tiny stars around its outside, nothing on the disc.

Palette: deep charcoal-black night (#131313 at the edges, lifting to about #1c1e26
near the horizon), cool blue-grey moonlight as the main light — it rims the sheep's
wool, the ladder rungs and the floating envelopes with a thin cold #4593fc edge — and
ONE warm amber counterpoint: a small oil lamp hanging from the bottom rung of the
ladder, glowing gold on the lamb below. The drifting envelopes catch just enough
moonlight to stay visible against the dark.

Very dark and low-contrast so white text stays readable. Bottom 40% almost pure
darkness; all four edges fade into flat #131313.

No text, no letters, no numbers, no logos, no readable writing anywhere. No frames,
no borders, no vignette. The only bright things are the moonlight rim and the small
amber lamp.
```

---

## E. 시계추 그네 — 라이트

```
A square 1:1 background illustration for a "sealed time capsule / countdown" screen
in a mobile app, LIGHT MODE. Style: cozy-epic children's storybook illustration —
soft flat shapes with subtle paper grain, rounded friendly forms, soft daylight,
gently humorous. Use the SAME small chubby white sheep character as the attached
reference image: stubby legs, tiny round black hooves, serene slightly smug smile.

COMPOSITION IS CRITICAL. Dead center horizontally, at 32% down from the top, there
must be a completely EMPTY CIRCLE whose diameter is 46% of the image width — nothing
inside it, just flat pale tone, because a UI dial sits exactly there. Make that
circle read as the face of an enormous old grandfather clock: draw only the carved
wooden case around it — a rounded bonnet with a small finial on top, slim side
columns running down past the circle — and absolutely NOTHING on the face itself: no
numerals, no markings, no hands.

Scene: below the clock face hangs a long pendulum with a big round brass bob, and
the sheep is riding it like a playground swing, sitting astride the bob, front hooves
gripping the rod, wool blown sideways, blissfully pleased with itself — trying very
hard to make time go faster and achieving exactly nothing. At the LOWER LEFT a tiny
lamb pushes the pendulum with both hooves and all its strength; at the LOWER RIGHT,
symmetrically, a second lamb sits on the floor holding a sealed envelope in its lap,
watching the two of them with a flat, unimpressed expression. Little motion arcs
curve around the swinging bob.

Palette: high-key cream and pale warm grey, honey-toned wood, brushed brass; one
small accent of clear blue #3182f6 (a ribbon on the pendulum rod). Bright,
low-contrast, no heavy shadows. Bottom 40% is a plain pale floor fading away; all
four edges fade smoothly into flat #f1f3f6.

No text, no letters, no numbers, no logos, no readable writing anywhere — the clock
face is completely blank. No frames, no borders, no vignette.
```

## E. 시계추 그네 — 다크

```
Same square 1:1 illustration as the light version — the SAME grandfather clock case,
the SAME pendulum and brass bob, the SAME sheep riding it, the SAME pushing lamb on
the lower left and the SAME unimpressed lamb with the envelope on the lower right,
identical composition — but now it is the middle of the night, DARK MODE.

Keep the empty center circle exactly as before: dead center horizontally, 32% down,
diameter 46% of image width, absolutely nothing inside it — no numerals, no hands,
no markings — just flat near-black tone. The wooden clock case still frames it from
outside, catching only a thin warm rim-light.

Palette: deep charcoal-black base (#131313 at the edges, lifting to about #221f1c
around the clock), deep walnut wood, muted brass. Light: one small warm amber candle
on the floor at the lower right, throwing long soft shadows of the swinging pendulum
across the wall, plus faint cool blue #4593fc moonlight from the upper left rimming
the sheep's wool and the brass bob. The motion arcs are drawn as thin, faintly
glowing cool-blue lines.

Very dark and low-contrast so white text stays readable. Bottom 40% almost pure
darkness; all four edges fade into flat #131313.

No text, no letters, no numbers, no logos, no readable writing anywhere. No frames,
no borders, no vignette. The only bright things are the candle and the cold rim of
moonlight.
```

---

## 뽑을 때 자주 어긋나는 것 (재요청 문구)

- **중앙 원을 채워 버림** → `"The center circle must stay completely empty — remove everything inside it, keep only the frame around it."`
- **숫자를 그려 넣음**(시계 문자판·오븐 노브·달력) → `"Remove every number, numeral and marking. The face and knobs must be completely blank."`
- **양이 원을 가림** → `"Move the sheep fully below the circle. Nothing may overlap the circle."`
- **아래쪽이 복잡함** → `"The bottom 40% must be almost empty — plain floor tone fading out. No props there."`
- **라이트가 어두움** → `"Much brighter and lower contrast — this is a high-key light mode background, dark text will be placed on top."`
- **두 장의 구도가 다름** → 다크를 뽑을 때 라이트 결과물을 **첨부**하고 `"Same layout, same props, same poses. Only the time of day changes."`
- Gemini 워터마크(우하단 ✦)는 다른 배경들처럼 inpaint로 지우고 안쪽 12~14px 크롭.

## 적용 상태 (2026-09-08) — **A. 금고 앞 잠복근무** 채택

- 원본 1024×1024 두 장에서 제미나이 워터마크(우하단 ✦)를 마름모 마스크로 inpaint(`cv2.INPAINT_TELEA`, r=5)로 지우고,
  **가장자리 복제(`BORDER_REPLICATE`)로 사방 88px을 덧대 1200×1200** 으로 저장했다.
  덧댄 88px 구간에서만 알파를 0으로 떨어뜨려(smoothstep) 라이트·다크 캔버스 어느 쪽에도 이음매 없이 녹는다.
  → `public/images/capsule/sealed-light.webp`(46KB) / `sealed-dark.webp`(31KB), q80.
  **그림 자체는 한 픽셀도 자르지 않았다** — 양·의자·텐트·자는 새끼양이 전부 보여야 한다는 게 채택 조건이었다.
- 측정값(원본 1024 기준): 안쪽 원 중심 `(512, 471)`, 반지름 `277`. 88px 덧댄 뒤 중심 `(600, 559)`.
- `capsule.css` `.capsule-waiting::before` 가 **483×483 고정 px** 로 깐다(`top: -45px`, `left: 50%`, `translateX(-50%)`).
  폭이 컨테이너가 아니라 **다이얼 208px에 묶인 고정값**인 이유: 화면 폭을 따라 늘리면 금고 문 구멍과 다이얼 링이 어긋난다.
  483px일 때 안쪽 원 반지름 ≈ 111px, 다이얼 눈금 반지름 ≈ 101px — 링이 눈금 바로 바깥에 앉는다.
- 그림이 들어앉을 자리를 만들려고 여백을 늘렸다: `.capsule-waiting { padding-top: 76px }`(JSX의 `pt-10` 제거),
  `.capsule-waiting__sender { margin-top: 108px }`(JSX의 `mt-9` 제거). 이 두 값을 줄이면 새끼양·텐트가 제목 글자에 깔린다.
- 좌우로 삐져나온 페이드 여백 때문에 `.capsule-waiting { overflow: hidden }` 필요(가로 스크롤 방지).
  360px 이하 폭에서는 텐트 오른쪽 끝이 몇 px 잘린다 — 다이얼 정렬을 지키려면 감수해야 하는 부분.
- `.capsule-waiting .capsule-dial__halo { opacity: 0.3 }` — 기본 0.5는 금고 문을 뿌옇게 덮는다.
- 다크는 `.dark .capsule-waiting::before` 에서 이미지만 교체(이 파일의 다른 화면들과 같은 규칙).
