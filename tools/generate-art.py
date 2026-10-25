#!/usr/bin/env python3
"""Rebuild the badge, Open Graph image and palette posters.

Writes:
  static/88x31.png and static/88x31.gif
  static/assets/og.png
  static/assets/meadow-poster.png
  static/assets/meadow-light-poster.png

Needs Pillow, fonttools and brotli. The pixel font is read from
static/assets/aleis-dot.woff2.

Run: python3 tools/generate-art.py
"""

import math
import os
import tempfile

from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "static", "assets")
FONT_WOFF2 = os.path.join(ASSETS, "aleis-dot.woff2")


def load_font():
    """Convert the bundled woff2 to a temp TTF PIL can use."""
    ttf = os.path.join(tempfile.gettempdir(), "aleis-dot.ttf")
    if not os.path.exists(ttf):
        f = TTFont(FONT_WOFF2)
        f.flavor = None
        f.save(ttf)
    return ttf


TTF = load_font()
FONTS = {}


def font(size):
    if size not in FONTS:
        FONTS[size] = ImageFont.truetype(TTF, size)
    return FONTS[size]


# The same 5x7-ish glyphs used by static/js/meadow.js.
GLYPHS = {
    "a": (2, [".##.", "...#", ".###", "#..#", ".###"]),
    "l": (0, ["##.", ".#.", ".#.", ".#.", ".#.", ".#.", ".##"]),
    "e": (2, [".##.", "#..#", "####", "#...", ".###"]),
    "i": (0, [".#.", "...", ".#.", ".#.", ".#.", ".#.", ".#."]),
    "s": (2, [".##.", "#...", ".##.", "...#", ".##."]),
}
GAP = 2.5


def flower_sprite(size, petal, center, petals=5):
    """Draw a small flower, then scale it up without smoothing."""
    s = 16
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = cy = s / 2.0
    for k in range(petals):
        a = -math.pi / 2 + 2 * math.pi * k / petals
        px = cx + math.cos(a) * 4.0
        py = cy + math.sin(a) * 4.0
        d.ellipse([px - 3.1, py - 3.1, px + 3.1, py + 3.1], fill=petal)
    d.ellipse([cx - 2.5, cy - 2.5, cx + 2.5, cy + 2.5], fill=center)
    return im.resize((size, size), Image.NEAREST)


def wordmark(img, x, y, scale, ink, petal, center):
    """Draw the pixel 'aleis' wordmark (flower + letters). Width = 36*scale."""
    draw = ImageDraw.Draw(img)
    fl = flower_sprite(8 * scale, petal, center)
    img.paste(fl, (x, y), fl)
    cur = x + 8 * scale
    for ch in "aleis":
        top, rows = GLYPHS[ch]
        for ry, row in enumerate(rows):
            for cx, c in enumerate(row):
                if c == "#":
                    draw.rectangle(
                        [cur + cx * scale, y + (top + ry) * scale,
                         cur + cx * scale + scale - 1, y + (top + ry) * scale + scale - 1],
                        fill=ink,
                    )
        cur += (len(rows[0]) + GAP) * scale


PALETTES = {
    "dark": {
        "bg": "#1f1a24", "text": "#ebe7f0", "head": "#f1edf5", "body": "#e3dde9",
        "subtle": "#b9b0c6", "muted": "#958aa3", "accent": "#c1b0e7",
        "line": "#3a3245", "sage": "#a4bba9", "stem": "#556658",
        "ground": [
            ("night", "#17131b"), ("base", "#1f1a24"), ("surface", "#2a2431"),
            ("overlay", "#3a3245"), ("dim", "#5f5769"), ("muted", "#958aa3"),
            ("subtle", "#b9b0c6"), ("text", "#ebe7f0"),
        ],
        "flowers": [
            ("poppy", ["#d68583", "#b06a69", "#623b3b"]),
            ("marigold", ["#e9b17c", "#c49365", "#5d4127"]),
            ("sage", ["#a4bba9", "#879b8c", "#3a4d3e"]),
            ("dew", ["#84c7d5", "#6ca6b2", "#1e5059"]),
            ("cornflower", ["#9cb8eb", "#8099c5", "#374866"]),
            ("lavender", ["#c1b0e7", "#a192c2", "#4c4161"]),
        ],
        "term": [
            ("0 black", "#2a2431"), ("1 red", "#b06a69"), ("2 green", "#879b8c"),
            ("3 yellow", "#c49365"), ("4 blue", "#8099c5"), ("5 magenta", "#a192c2"),
            ("6 cyan", "#6ca6b2"), ("7 white", "#b9b0c6"), ("8 black", "#5f5769"),
            ("9 red", "#d68583"), ("10 green", "#a4bba9"), ("11 yellow", "#e9b17c"),
            ("12 blue", "#9cb8eb"), ("13 magenta", "#c1b0e7"), ("14 cyan", "#84c7d5"),
            ("15 white", "#ebe7f0"),
        ],
        "petal": "#c1b0e7", "center": "#a4bba9",
    },
    "light": {
        "bg": "#f7e8ee", "text": "#382a3d", "head": "#2e2133", "body": "#423448",
        "subtle": "#5f4e63", "muted": "#857284", "accent": "#715c97",
        "line": "#e1ced7", "sage": "#507357", "stem": "#6b8970",
        "ground": [
            ("night", "#efdee4"), ("base", "#f7e8ee"), ("surface", "#fbf1f5"),
            ("overlay", "#e1ced7"), ("dim", "#ab98a5"), ("muted", "#857284"),
            ("subtle", "#5f4e63"), ("text", "#382a3d"),
        ],
        "flowers": [
            ("poppy", ["#b9454c", "#c86265", "#f8d4d3"]),
            ("marigold", ["#b76316", "#c57b3d", "#f6dac2"]),
            ("sage", ["#507357", "#6b8970", "#d0e2d3"]),
            ("dew", ["#217584", "#4c8b98", "#bfe4ec"]),
            ("cornflower", ["#4a68a0", "#6680b1", "#ceddf8"]),
            ("lavender", ["#715c97", "#8775aa", "#e0d7f4"]),
        ],
        "term": [
            ("0 black", "#fbf1f5"), ("1 red", "#c86265"), ("2 green", "#6b8970"),
            ("3 yellow", "#c57b3d"), ("4 blue", "#6680b1"), ("5 magenta", "#8775aa"),
            ("6 cyan", "#4c8b98"), ("7 white", "#5f4e63"), ("8 black", "#ab98a5"),
            ("9 red", "#b9454c"), ("10 green", "#507357"), ("11 yellow", "#b76316"),
            ("12 blue", "#4a68a0"), ("13 magenta", "#715c97"), ("14 cyan", "#217584"),
            ("15 white", "#382a3d"),
        ],
        "petal": "#a99cca", "center": "#507357",
    },
}

SITE = "aleis.pages.dev"


def make_badge():
    p = PALETTES["dark"]
    img = Image.new("RGB", (88, 31), p["bg"])
    wordmark(img, 8, 7, 2, p["text"], p["petal"], p["center"])
    img.save(os.path.join(ROOT, "static", "88x31.png"))
    img.convert("P", palette=Image.ADAPTIVE, colors=16).save(
        os.path.join(ROOT, "static", "88x31.gif")
    )
    print("wrote 88x31.png / 88x31.gif")


def make_og():
    p = PALETTES["dark"]
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), p["bg"])
    wordmark(img, 80, 80, 14, p["text"], p["petal"], p["center"])
    d = ImageDraw.Draw(img)
    # flowers first, so the labels always stay readable
    colors = [p["flowers"][i % 6][1][0] for i in range(14)]
    xs = [10, 90, 180, 260, 350, 430, 510, 600, 690, 780, 860, 950, 1040, 1130]
    for i, x in enumerate(xs):
        size = 46 + (i * 37) % 66
        y = 430 + (i * 53) % 90
        sx = x + size // 2
        d.line([(sx, y + size // 2), (sx, H + 10)], fill=p["stem"], width=max(3, size // 14))
        fl = flower_sprite(size, colors[i], p["center"])
        img.paste(fl, (x, y), fl)
    d.text((1120, 112), SITE, font=font(32), fill=p["muted"], anchor="rt")
    d.text((84, 250), "writing  ·  projects  ·  meadow", font=font(32), fill=p["subtle"])
    img.save(os.path.join(ASSETS, "og.png"))
    print("wrote og.png")


def make_poster(light=False):
    p = PALETTES["light" if light else "dark"]
    W, H = 1320, 1975
    img = Image.new("RGB", (W, H), p["bg"])
    d = ImageDraw.Draw(img)
    M = 80

    wordmark(img, M, 90, 8, p["text"], p["petal"], p["center"])
    d.text((W - M, 110), "meadow light" if light else "meadow", font=font(24),
           fill=p["muted"], anchor="rt")

    d.text((M, 250), "Meadow Light" if light else "Meadow", font=font(96), fill=p["head"])
    d.text((M, 380), "A smoky color palette that's meant to be easy on the eyes.",
           font=font(32), fill=p["subtle"])

    col_w = (W - 2 * M - 7 * 18) / 8.0

    # ground
    d.text((M, 520), "ground", font=font(48), fill=p["accent"])
    d.text((W - M, 536), "neutrals", font=font(32), fill=p["muted"], anchor="rt")
    y = 590
    for i, (name, hexv) in enumerate(p["ground"]):
        x = M + i * (col_w + 18)
        d.rectangle([x, y, x + col_w, y + 110], fill=hexv, outline=p["line"])
        d.text((x, y + 126), name, font=font(32), fill=p["body"])
        d.text((x, y + 166), hexv, font=font(24), fill=p["muted"])

    # flowers
    d.text((M, 830), "flowers", font=font(48), fill=p["accent"])
    d.text((W - M, 846), "main / soft / tint", font=font(32), fill=p["muted"], anchor="rt")
    y = 900
    col_w = (W - 2 * M - 5 * 22) / 6.0
    for i, (name, shades) in enumerate(p["flowers"]):
        x = M + i * (col_w + 22)
        d.text((x, y), name, font=font(32), fill=p["body"])
        by = y + 46
        for j, hexv in enumerate(shades):
            d.rectangle([x, by + j * 64, x + col_w, by + (j + 1) * 64 - 2],
                        fill=hexv, outline=p["line"])
        for j, hexv in enumerate(shades):
            d.text((x, by + 196 + j * 26), hexv, font=font(16), fill=p["muted"])

    # terminal
    d.text((M, 1300), "terminal", font=font(48), fill=p["accent"])
    d.text((W - M, 1316), "ansi 0-15", font=font(32), fill=p["muted"], anchor="rt")
    col_w = (W - 2 * M - 7 * 18) / 8.0
    for i, (name, hexv) in enumerate(p["term"]):
        row, col = divmod(i, 8)
        x = M + col * (col_w + 18)
        y = 1360 + row * 122
        d.rectangle([x, y, x + col_w, y + 48], fill=hexv, outline=p["line"])
        d.text((x, y + 60), name, font=font(16), fill=p["body"])
        d.text((x, y + 82), hexv, font=font(16), fill=p["muted"])

    # footer + meadow strip
    d.text((M, 1640), SITE, font=font(32), fill=p["muted"])
    d.text((W - M, 1640), "in use: editors, terminals", font=font(24),
           fill=p["muted"], anchor="rt")
    flcols = [p["flowers"][i % 6][1][0] for i in range(20)]
    for i in range(20):
        x = -20 + i * 70 + (i * 29) % 40
        size = 44 + (i * 31) % 70
        y = 1720 + (i * 47) % 110
        sx = x + size // 2
        d.line([(sx, y + size // 2), (sx, H + 10)], fill=p["stem"], width=max(3, size // 14))
        fl = flower_sprite(size, flcols[i], p["center"])
        img.paste(fl, (x, y), fl)

    out = "meadow-light-poster.png" if light else "meadow-poster.png"
    img.save(os.path.join(ASSETS, out), optimize=True)
    print("wrote", out)


if __name__ == "__main__":
    make_badge()
    make_og()
    make_poster(light=False)
    make_poster(light=True)
