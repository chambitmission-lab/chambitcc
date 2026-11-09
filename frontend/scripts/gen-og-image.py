# -*- coding: utf-8 -*-
"""Open Graph 공유 카드(1200×630) 생성 → public/og-image.jpg

카톡·페북·슬랙·구글 공유 미리보기용. 512 정사각 앱 아이콘 대신 가로 카드를 줘야
큰 썸네일로 그려진다(index.html og:image / scripts/prerender-seo.mjs 가 참조).

2026-11-09 C1안: 홈 '말씀 삽화'(언덕 위 예수님과 양) 위에 표어·이름·한 줄만 크게.
카톡 썸네일은 폭 200px 남짓으로 줄어들어 작은 글씨(예배 시간·주소)는 안 읽힌다 →
그런 정보는 이미지에 넣지 말고 og:description 으로 보낸다.

구성
- 삽화(public/images/home/verse-scene-light.webp, 1200×391)를 1.28배만 키워 오른쪽 끝
  (예수님·양) 기준으로 아래에 깐다. 크게 키워 자르면 머리 위가 잘리고 흐려진다.
- 모자란 위쪽은 삽화 하늘 색을 열마다 평균내 위로 늘리고 맑은 하늘색으로 이어 붙인다.
- 왼쪽부터 옅은 흰 빛을 얹어 글자 뒤를 밝힌다.
- 서체: Pretendard(앱 본문 서체). scripts/fonts/ 의 KS X 1001 한글 2350자+ASCII 서브셋
  OTF(OFL). 문구에 서브셋 밖 글자를 쓰면 두부(□)가 나오니 그때는 서브셋을 다시 만들 것.

실행: python scripts/gen-og-image.py   (문구·삽화가 바뀌면 다시 굽고 커밋)
      바꾼 뒤엔 index.html 의 og-image.jpg?v= 값도 올려야 카톡이 새 이미지를 긁는다.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "public/images/home/verse-scene-light.webp"
OUT = ROOT / "public/og-image.jpg"
FONTS = ROOT / "scripts/fonts"

W, H = 1200, 630
ART_SCALE = 1.28
BRAND = (49, 130, 246)      # #3182f6 토스 블루(theme.css 단일 출처)
NAVY = (20, 33, 61)
SOFT = (64, 80, 106)
SKY_TOP = (226, 238, 252)


def font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / f"Pretendard-{weight}.subset.otf"), size)


def vgrad_mask(size, fn) -> Image.Image:
    m = Image.new("L", size)
    d = ImageDraw.Draw(m)
    for y in range(size[1]):
        d.line([(0, y), (size[0], y)], fill=int(fn(y)))
    return m


def background() -> Image.Image:
    art = Image.open(ART).convert("RGB")
    art = art.resize((round(art.width * ART_SCALE), round(art.height * ART_SCALE)), Image.LANCZOS)
    art = art.crop((art.width - W, 0, art.width, art.height))
    top = H - art.height

    # 위로 이어 붙일 하늘: 삽화 40~90행 색을 열마다 평균 → 위쪽일수록 맑은 하늘색
    strip = art.crop((0, 40, W, 90)).resize((W, 1), Image.BOX).filter(ImageFilter.GaussianBlur(40))
    ext = strip.resize((W, top + 140), Image.BILINEAR)
    sky = Image.new("RGB", ext.size, SKY_TOP)
    eh = ext.height
    ext = Image.composite(sky, ext, vgrad_mask(ext.size, lambda y: 255 * (1 - y / eh) ** 1.3))
    ext = ext.filter(ImageFilter.GaussianBlur(6))

    canvas = Image.new("RGB", (W, H))
    canvas.paste(ext, (0, 0))
    # 삽화 위 130px 은 페이드로 이어 붙인다(원본 위쪽 둥근 흰 귀퉁이도 이걸로 가려진다)
    canvas.paste(art, (0, top), vgrad_mask(art.size, lambda y: 255 * min(1, y / 130) ** 1.5))

    # 글자 뒤 흰 빛: 왼쪽에서 오른쪽으로 옅어지고, 아래(언덕) 쪽은 걷어 낸다
    veil = Image.new("RGBA", (W, H), (255, 255, 255, 0))
    alpha = Image.new("L", (W, H))
    ad = ImageDraw.Draw(alpha)
    for x in range(W):
        ad.line([(x, 0), (x, H)], fill=int(max(0, 170 - 300 * x / W)))
    fade = vgrad_mask((W, H), lambda y: 255 * max(0, 1 - max(0, y - 380) / 200))
    veil.putalpha(Image.composite(alpha, Image.new("L", (W, H), 0), fade))
    return Image.alpha_composite(canvas.convert("RGBA"), veil).convert("RGB")


def main() -> None:
    canvas = background()
    d = ImageDraw.Draw(canvas)
    x0 = 86
    d.text((x0, 108), "인생은 만남입니다", font=font("Bold", 44), fill=BRAND)
    d.text((x0 - 5, 166), "부천참빛교회", font=font("ExtraBold", 124), fill=NAVY)
    d.text((x0, 322), "참빛이신 예수님을 만나는 곳", font=font("Medium", 38), fill=SOFT)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
