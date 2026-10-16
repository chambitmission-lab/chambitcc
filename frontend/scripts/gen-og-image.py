# -*- coding: utf-8 -*-
"""Open Graph 공유 카드(1200×630) 생성 → public/og-image.jpg

카톡·페북·슬랙·구글 공유 미리보기용. 512 정사각 앱 아이콘 대신 가로 카드를 줘야
큰 썸네일로 그려진다(index.html og:image / scripts/prerender-seo.mjs 가 참조).

구성: 왼쪽 밝은 면에 교회 이름·한 줄 소개·주일 예배 시간·주소, 오른쪽에 예배당 사진
(src/assets/landing/church-day.webp, 세로 사진이라 높이에 맞춰 오른쪽 기둥처럼 세운다).
서체: Windows 맑은 고딕(malgunbd.ttf). Pretendard 는 woff2 조각뿐이라 PIL 이 못 읽는다.

실행: python scripts/gen-og-image.py   (문구·사진·시간이 바뀌면 다시 굽고 커밋)
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PHOTO = ROOT / "src/assets/landing/church-day.webp"
OUT = ROOT / "public/og-image.jpg"
FONT_BOLD = Path(r"C:\Windows\Fonts\malgunbd.ttf")
FONT_REG = Path(r"C:\Windows\Fonts\malgun.ttf")

W, H = 1200, 630
BG = (241, 243, 246)        # --ig-light-background 와 동일
INK = (25, 31, 40)
INK_SOFT = (78, 89, 104)
MUTED = (139, 149, 161)
BRAND = (49, 130, 246)      # #3182f6 토스 블루(theme.css 단일 출처)
PHOTO_W = 470


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size)


def main() -> None:
    canvas = Image.new("RGB", (W, H), BG)

    # ── 오른쪽: 예배당 사진(높이 맞춤, 가운데 크롭) + 왼쪽 가장자리 페이드 ──
    photo = Image.open(PHOTO).convert("RGB")
    scale = H / photo.height
    photo = photo.resize((round(photo.width * scale), H), Image.LANCZOS)
    left = max(0, (photo.width - PHOTO_W) // 2)
    photo = photo.crop((left, 0, left + PHOTO_W, H))
    # 살짝 채도·밝기 정돈 없이 원본 유지. 왼쪽 60px 를 배경색으로 페이드.
    fade = Image.new("L", (PHOTO_W, H), 255)
    fd = ImageDraw.Draw(fade)
    for x in range(72):
        fd.line([(x, 0), (x, H)], fill=int(255 * (x / 72)))
    canvas.paste(photo, (W - PHOTO_W, 0), fade)

    # ── 사진 위 부드러운 그림자 띠(사진·면 경계 자연스럽게) ──
    shade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    sd.rectangle([(W - PHOTO_W - 10, 0), (W - PHOTO_W + 30, H)], fill=(241, 243, 246, 90))
    shade = shade.filter(ImageFilter.GaussianBlur(18))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), shade).convert("RGB")

    d = ImageDraw.Draw(canvas)
    x0 = 84

    # ── 상단 라벨: 브랜드 바 + 작은 글자 ──
    d.rounded_rectangle([(x0, 96), (x0 + 6, 96 + 30)], radius=3, fill=BRAND)
    d.text((x0 + 20, 92), "부천 상동 · 대한예수교장로회(고신)", font=font(FONT_BOLD, 24), fill=BRAND)

    # ── 교회 이름 ──
    d.text((x0 - 4, 150), "부천참빛교회", font=font(FONT_BOLD, 104), fill=INK)

    # ── 한 줄 소개 ──
    d.text((x0, 296), "인생은 만남입니다", font=font(FONT_BOLD, 40), fill=INK_SOFT)
    d.text((x0, 352), "참빛이신 예수님과의 만남이 당신의 인생을 바꿉니다", font=font(FONT_REG, 26), fill=INK_SOFT)

    # ── 예배 시간 / 주소 ──
    y = 446
    d.text((x0, y), "주일낮예배", font=font(FONT_BOLD, 24), fill=MUTED)
    d.text((x0 + 150, y), "오전 7:30 · 9:20 · 11:20 · 오후 1:30", font=font(FONT_BOLD, 26), fill=INK)
    y += 44
    d.text((x0, y), "오시는 길", font=font(FONT_BOLD, 24), fill=MUTED)
    d.text((x0 + 150, y), "부천시 송내대로265번길 29 · 7호선 상동역 도보 5분", font=font(FONT_REG, 25), fill=INK)

    # ── 하단 URL ──
    d.text((x0, 560), "chambitcc.kro.kr", font=font(FONT_BOLD, 24), fill=BRAND)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
