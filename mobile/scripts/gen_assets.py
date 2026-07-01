"""Generate DreamLog app assets (icon, adaptive icon, splash) with no external
deps — a diagonal purple gradient background and a white crescent moon.

Run:  python scripts/gen_assets.py
"""
import math
import os
import struct
import zlib

OUT = os.path.join(os.path.dirname(__file__), "..", "assets")

GRAD = [(0x6C, 0x63, 0xF7), (0xA2, 0x5F, 0xE0), (0xE6, 0x67, 0xB8)]
BG = (0x14, 0x10, 0x1F)


def lerp(a, b, t):
    return int(a + (b - a) * t)


def grad_color(t):
    # t in [0,1] across the two gradient legs.
    if t < 0.5:
        u = t / 0.5
        c0, c1 = GRAD[0], GRAD[1]
    else:
        u = (t - 0.5) / 0.5
        c0, c1 = GRAD[1], GRAD[2]
    return (lerp(c0[0], c1[0], u), lerp(c0[1], c1[1], u), lerp(c0[2], c1[2], u))


def write_png(path, width, height, pixels):
    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type 0
        row = pixels[y]
        for px in row:
            raw += bytes(px)
    compressed = zlib.compress(bytes(raw), 9)
    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)  # 8-bit RGB
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", header))
        f.write(chunk(b"IDAT", compressed))
        f.write(chunk(b"IEND", b""))


def render(size, gradient_bg=True, moon_scale=0.42):
    cx, cy = size / 2, size / 2
    r = size * moon_scale
    # Offset circle to carve the crescent.
    ox, oy = cx + r * 0.42, cy - r * 0.30
    orr = r * 0.92
    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            if gradient_bg:
                t = (x + y) / (2 * size)
                base = grad_color(t)
            else:
                base = BG
            # Crescent: inside main circle AND outside offset circle.
            d1 = math.hypot(x - cx, y - cy)
            d2 = math.hypot(x - ox, y - oy)
            if d1 <= r and d2 > orr:
                # Soft white moon.
                row.append((0xF5, 0xF3, 0xFA))
            else:
                row.append(base)
        pixels.append(row)
    return pixels


def main():
    os.makedirs(OUT, exist_ok=True)
    # App icon: gradient bg + moon, 1024.
    write_png(os.path.join(OUT, "icon.png"), 1024, 1024, render(1024, True))
    # Adaptive icon foreground: moon on solid dark (bg supplied by app.json).
    write_png(
        os.path.join(OUT, "adaptive-icon.png"), 1024, 1024, render(1024, False, 0.34)
    )
    # Splash: moon on dark bg, 1284 square.
    write_png(os.path.join(OUT, "splash.png"), 1284, 1284, render(1284, False, 0.22))
    print("Assets written to", os.path.abspath(OUT))


if __name__ == "__main__":
    main()
