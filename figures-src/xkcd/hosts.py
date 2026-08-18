"""Chapter 12: hosts are the new browsers."""
import sys; sys.path.insert(0, "figures-src")
import matplotlib.patches as mp
from _style import ACCENT, DANGER, GOOD, INK, MUTED, WARM, bare, caption, sketch

with sketch(figsize=(7.4, 3.2)) as (fig, ax):
    bare(ax, (0, 100), (0, 58))
    ax.text(50, 51, "one widget, four houses", ha="center", color=INK, fontsize=12)

    labels = ["renders it", "renders it,\nnarrower", "shows the text\ninstead",
              "shows nothing\nat all"]
    colors = [GOOD, GOOD, WARM, DANGER]
    for i, (label, color) in enumerate(zip(labels, colors)):
        x = 6 + i * 23.5
        ax.add_patch(mp.FancyBboxPatch((x, 16), 19, 24, boxstyle="round,pad=1.1",
                                       facecolor="#FFFFFF", edgecolor=color, linewidth=1.8))
        ax.text(x + 9.5, 28, label, ha="center", va="center", color=color, fontsize=9.5)

    caption(fig, "You get to choose which of these is a designed experience\n"
                 "and which is an accident.", y=0.04)

fig.savefig(sys.argv[1], bbox_inches="tight", facecolor="white")
