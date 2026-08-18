"""Chapter 11: problems found against users tested, both kinds of user."""
import sys; sys.path.insert(0, "figures-src")
import numpy as np
from _style import ACCENT, GOOD, MUTED, WARM, caption, clean, sketch

n = np.arange(0, 11)
found = 100 * (1 - (1 - 0.31) ** n)

with sketch(figsize=(7.2, 3.3)) as (fig, ax):
    ax.plot(n, found, color=ACCENT, lw=2.6, marker="o", markersize=5)
    ax.axvline(5, color=MUTED, lw=1.2, ls=":")
    clean(ax, xlabel="humans watched", ylabel="problems found")
    ax.set_yticks([0, 50, 100]); ax.set_yticklabels(["0", "half", "most"])
    ax.set_ylim(0, 112)
    ax.annotate("stop here, fix, repeat", xy=(5, found[5]), xytext=(5.6, 44),
                fontsize=10, color=GOOD,
                arrowprops=dict(arrowstyle="->", color=GOOD, lw=1.5,
                                connectionstyle="arc3,rad=-0.2"))
    ax.text(0.3, 96, "and then run it again with the model as the user,\n"
                     "because that half of the audience never gets tired",
            fontsize=9.5, color=WARM, va="top")
    caption(fig, "Krug's curve, unchanged. The audience doubled, the curve did not.", y=-0.03)

fig.savefig(sys.argv[1], bbox_inches="tight", facecolor="white")
