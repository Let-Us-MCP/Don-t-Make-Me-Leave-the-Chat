"""Chapter 2: one tool result, two audiences, one source."""
import sys; sys.path.insert(0, "figures-src")
import matplotlib.patches as mp
from _style import ACCENT, GOOD, INK, MUTED, WARM, arrow, bare, box, diagram

with diagram(figsize=(7.4, 3.2)) as (fig, ax):
    bare(ax, (0, 100), (0, 62))

    box(ax, 4, 26, 22, 16, "your handler", color=INK, sub="one calculation")
    box(ax, 40, 42, 26, 14, "content[]", color=WARM, sub="text the model reads")
    box(ax, 40, 12, 26, 14, "structuredContent", color=ACCENT, sub="data the app renders")
    box(ax, 76, 42, 20, 14, "the model", color=WARM)
    box(ax, 76, 12, 20, 14, "the human", color=ACCENT)

    arrow(ax, (26, 36), (40, 49), color=WARM)
    arrow(ax, (26, 32), (40, 19), color=ACCENT)
    arrow(ax, (66, 49), (76, 49), color=WARM)
    arrow(ax, (66, 19), (76, 19), color=ACCENT)

    ax.text(50, 4, "Two renderings of one fact. Compute the fact once, or they will drift.",
            ha="center", color=MUTED, fontsize=9.5)

fig.savefig(sys.argv[1], bbox_inches="tight", facecolor="white")
