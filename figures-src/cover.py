"""The cover. Generated, so its provenance is unambiguous and no third-party
artwork is involved.

The image is a conversation seen edge on: a column of message blocks with one
bright block sitting inside the flow rather than on top of it. That is the whole
argument of the book, drawn once.
"""
import sys
sys.path.insert(0, "figures-src")

import matplotlib
matplotlib.use("Agg")
import matplotlib.patches as mp
import matplotlib.pyplot as plt
import numpy as np

INK = "#0F1216"
PAPER = "#F7F5F0"
ACCENT = "#0F5C8C"
WARM = "#B4531A"
GOOD = "#2C6E49"
MUTED = "#8A93A0"

rng = np.random.default_rng(20260728)

W, H = 1200, 1800
fig = plt.figure(figsize=(W / 200, H / 200), dpi=200)
ax = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(0, 100)
ax.set_ylim(0, 150)
ax.axis("off")
fig.patch.set_facecolor(PAPER)

# The conversation: alternating blocks, receding.
y = 100.0
i = 0
while y > 14:
    h = rng.uniform(3.2, 7.2)
    w = rng.uniform(26, 56)
    right = i % 3 == 1
    x = 100 - 9 - w if right else 9
    alpha = 0.10 + 0.5 * (1 - abs(y - 76) / 74)
    ax.add_patch(mp.FancyBboxPatch(
        (x, y - h), w, h, boxstyle="round,pad=0.9,rounding_size=1.6",
        facecolor=INK if right else "#FFFFFF",
        edgecolor=INK, linewidth=0.9, alpha=alpha))
    y -= h + rng.uniform(3.4, 5.6)
    i += 1

# The app: one block that belongs to the flow instead of interrupting it.
ax.add_patch(mp.FancyBboxPatch(
    (9, 60), 82, 30, boxstyle="round,pad=1.2,rounding_size=2.4",
    facecolor="#FFFFFF", edgecolor=ACCENT, linewidth=2.6))
ax.add_patch(mp.FancyBboxPatch(
    (14, 80), 34, 5.0, boxstyle="round,pad=0.6,rounding_size=1.2",
    facecolor=ACCENT, edgecolor="none", alpha=0.9))
for k, wbar in enumerate([58, 44]):
    ax.add_patch(mp.FancyBboxPatch(
        (14, 73.5 - k * 5.4), wbar, 2.8, boxstyle="round,pad=0.5,rounding_size=1.0",
        facecolor="#DDE4EB", edgecolor="none"))
ax.add_patch(mp.FancyBboxPatch(
    (14, 62.8), 18, 4.2, boxstyle="round,pad=0.6,rounding_size=1.2",
    facecolor=GOOD, edgecolor="none"))

# A single quiet mark: the cursor, still in the conversation.
ax.plot([9, 9], [24, 32], color=WARM, lw=3.2, solid_capstyle="round")

SANS = ["Helvetica Neue", "Helvetica", "Arial", "DejaVu Sans"]
ax.text(9, 128, "DON'T MAKE ME", color=INK, fontsize=27, fontfamily=SANS,
        fontweight="bold", va="bottom")
ax.text(9, 119, "LEAVE THE CHAT", color=ACCENT, fontsize=27, fontfamily=SANS,
        fontweight="bold", va="bottom")
ax.plot([9, 34], [115, 115], color=WARM, lw=2.4, solid_capstyle="round")
ax.text(9, 108.5, "A common sense approach to MCP Apps", color="#3C4450",
        fontsize=12.5, fontfamily=SANS, va="bottom")
ax.text(9, 5, "KRIMLER", color=INK, fontsize=11.5, fontfamily=SANS,
        fontweight="bold", va="bottom")

fig.savefig(sys.argv[1], facecolor=PAPER)
