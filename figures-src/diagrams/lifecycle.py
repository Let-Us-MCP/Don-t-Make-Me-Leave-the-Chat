"""Chapter 6: the lifecycle of one render, on one page."""
import sys; sys.path.insert(0, "figures-src")
from _style import ACCENT, GOOD, INK, MUTED, WARM, bare, diagram

LANES = [("server", 70), ("host", 46), ("app", 22)]
EVENTS = [
    (9,  "server", "host", "1. predeclare\nui:// resource", ACCENT),
    (23, "host", "host", "2. prefetch\nthe template", MUTED),
    (37, "host", "app", "3. render in a\nsandboxed iframe", ACCENT),
    (51, "host", "app", "4. arguments,\nthen the result", GOOD),
    (65, "app", "host", "5. tools/call and\nui/set-context", WARM),
    (79, "host", "server", "6. forwarded\ncall", MUTED),
    (93, "host", "app", "7. teardown", MUTED),
]

with diagram(figsize=(8.4, 3.8)) as (fig, ax):
    bare(ax, (0, 100), (0, 100))
    for name, y in LANES:
        ax.plot([5, 97], [y, y], color=MUTED, lw=1.0, ls=":")
        ax.text(4, y, name, ha="right", va="center", color=INK, fontsize=10)

    ypos = dict(LANES)
    for i, (x, src, dst, label, color) in enumerate(EVENTS):
        y0, y1 = ypos[src], ypos[dst]
        if src == dst:
            ax.annotate("", xy=(x + 3.5, y0), xytext=(x - 3.5, y0),
                        arrowprops=dict(arrowstyle="->", color=color, lw=1.6,
                                        connectionstyle="arc3,rad=-1.5"))
            mid = y0 + 8
        else:
            ax.annotate("", xy=(x, y1), xytext=(x, y0),
                        arrowprops=dict(arrowstyle="->", color=color, lw=1.9))
            mid = (y0 + y1) / 2

        above = i % 2 == 0
        ty = 92 if above else 8
        ax.plot([x, x], [mid, ty + (-3 if above else 4)], color=color, lw=0.7, ls=":")
        ax.text(x, ty, label, ha="center", va="bottom" if above else "top",
                color=color, fontsize=8.5, linespacing=1.35)

fig.savefig(sys.argv[1], bbox_inches="tight", facecolor="white")
