"""Chapter 12: the fallback ladder, designed rather than suffered."""
import sys; sys.path.insert(0, "figures-src")
from _style import ACCENT, DANGER, GOOD, INK, MUTED, WARM, bare, box, diagram

RUNGS = [
    ("full app", "iframe renders, tool calls allowed", GOOD),
    ("app, no callbacks", "renders, but cannot call tools", ACCENT),
    ("static preview", "an image or a table, no interaction", WARM),
    ("content text", "the sentence you wrote for the model", MUTED),
    ("nothing", "the host does not support apps at all", DANGER),
]

with diagram(figsize=(7.2, 3.6)) as (fig, ax):
    bare(ax, (0, 100), (0, 100))
    for i, (name, detail, color) in enumerate(RUNGS):
        y = 82 - i * 17
        box(ax, 8, y, 34, 12, name, color=color, sub=None, fontsize=10.5)
        ax.text(46, y + 6, detail, va="center", color=INK, fontsize=9.5)
        if i < len(RUNGS) - 1:
            ax.annotate("", xy=(25, y - 5), xytext=(25, y),
                        arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.4))

    ax.text(50, 2, "Every rung is a design you own. The bottom one is where you end up "
                   "if you do not.",
            ha="center", color=MUTED, fontsize=9.5)

fig.savefig(sys.argv[1], bbox_inches="tight", facecolor="white")
