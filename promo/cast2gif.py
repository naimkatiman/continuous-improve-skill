#!/usr/bin/env python3
"""Convert asciinema .cast file to animated GIF using pyte + Pillow."""

import json
import sys
from PIL import Image, ImageDraw, ImageFont

import pyte

CAST_FILE = sys.argv[1] if len(sys.argv) > 1 else "combined.cast"
OUT_FILE = sys.argv[2] if len(sys.argv) > 2 else "combined.gif"

# Terminal dimensions
COLS, ROWS = 90, 24
CELL_W, CELL_H = 8, 16  # pixels per character cell
PADDING = 16
IMG_W = COLS * CELL_W + PADDING * 2
IMG_H = ROWS * CELL_H + PADDING * 2

# Colors (Dracula-ish theme for dark terminal look)
BG = (40, 42, 54)
FG = (248, 248, 242)
ANSI_COLORS = {
    "black":   (40, 42, 54),
    "red":     (255, 85, 85),
    "green":   (80, 250, 123),
    "brown":   (241, 250, 140),   # yellow
    "blue":    (98, 114, 164),
    "magenta": (255, 121, 198),
    "cyan":    (139, 233, 253),
    "white":   (248, 248, 242),
    "default": (248, 248, 242),
}

# Try to use a monospace font
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 13)
except:
    try:
        font = ImageFont.truetype("/usr/share/fonts/TTF/DejaVuSansMono.ttf", 13)
    except:
        font = ImageFont.load_default()

# Parse cast file
with open(CAST_FILE) as f:
    lines = f.readlines()

header = json.loads(lines[0])
events = [json.loads(l) for l in lines[1:]]

# Set up terminal emulator
screen = pyte.Screen(COLS, ROWS)
stream = pyte.Stream(screen)

def render_frame():
    """Render current terminal screen state to a PIL Image."""
    img = Image.new("RGB", (IMG_W, IMG_H), BG)
    draw = ImageDraw.Draw(img)

    for row in range(ROWS):
        for col in range(COLS):
            char = screen.buffer[row][col]
            ch = char.data if char.data != " " else None
            if ch:
                fg_color = ANSI_COLORS.get(char.fg, FG) if char.fg != "default" else FG
                if char.bold and char.fg in ANSI_COLORS:
                    # Brighten bold colors slightly
                    fg_color = tuple(min(255, c + 40) for c in fg_color)
                x = PADDING + col * CELL_W
                y = PADDING + row * CELL_H
                draw.text((x, y), ch, fill=fg_color, font=font)

    return img

# Generate frames at ~4 fps (250ms per frame)
FPS = 4
FRAME_INTERVAL = 1.0 / FPS
total_duration = events[-1][0] if events else 0

frames = []
durations = []  # ms per frame
event_idx = 0
current_time = 0.0

print(f"Rendering {total_duration:.1f}s at {FPS}fps = ~{int(total_duration * FPS)} frames...")

while current_time <= total_duration + 0.5:
    # Feed all events up to current_time
    while event_idx < len(events) and events[event_idx][0] <= current_time:
        stream.feed(events[event_idx][2])
        event_idx += 1

    frame = render_frame()
    frames.append(frame)
    durations.append(int(FRAME_INTERVAL * 1000))
    current_time += FRAME_INTERVAL

# Hold last frame for 3 seconds
if frames:
    for _ in range(FPS * 3):
        frames.append(frames[-1].copy())
        durations.append(int(FRAME_INTERVAL * 1000))

print(f"Saving {len(frames)} frames to {OUT_FILE}...")

frames[0].save(
    OUT_FILE,
    save_all=True,
    append_images=frames[1:],
    duration=durations,
    loop=0,  # loop forever
    optimize=True,
)

import os
size_mb = os.path.getsize(OUT_FILE) / 1024 / 1024
print(f"Done! {OUT_FILE} ({size_mb:.1f} MB)")
