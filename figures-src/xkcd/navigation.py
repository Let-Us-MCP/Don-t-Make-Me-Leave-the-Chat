"""Chapter 8: the affordances you do not get."""
import sys; sys.path.insert(0, "figures-src")
import matplotlib.patches as mp
from _style import DANGER, GOOD, INK, MUTED, bare, caption, sketch

GONE = ["the URL", "the back button", "tabs", "bookmarks", "the address bar"]
KEPT = ["asking again", "scrolling up", "the transcript"]

with sketch(figsize=(7.4, 3.2)) as (fig, ax):
    bare(ax, (0, 100), (0, 60))
    ax.text(26, 52, "gone", ha="center", color=DANGER, fontsize=12)
    ax.text(76, 52, "what replaces it", ha="center", color=GOOD, fontsize=12)

    for i, name in enumerate(GONE):
        y = 42 - i * 7.4
        ax.text(26, y, name, ha="center", color=MUTED, fontsize=10.5)
        ax.plot([12, 40], [y + 0.4, y + 0.4], color=DANGER, lw=1.6)

    for i, name in enumerate(KEPT):
        y = 38 - i * 8.5
        ax.text(76, y, name, ha="center", color=INK, fontsize=10.5)

    ax.plot([51, 51], [6, 48], color=MUTED, lw=1.2, ls=":")
    caption(fig, "Three of them were doing more work than you thought.", y=0.02)

fig.savefig(sys.argv[1], bbox_inches="tight", facecolor="white")
