"""Chapter 5: usefulness against widget count."""
import sys; sys.path.insert(0, "figures-src")
import numpy as np
from _style import ACCENT, DANGER, GOOD, MUTED, caption, clean, sketch

x = np.linspace(0, 10, 300)
y = 100 * (1 - np.exp(-x * 1.5)) - 7 * x

with sketch(figsize=(7.2, 3.3)) as (fig, ax):
    ax.plot(x, y, color=ACCENT, lw=2.6)
    clean(ax, xlabel="controls on your widget", ylabel="usefulness")
    ax.set_yticks([]); ax.set_xticks([0, 2, 4, 6, 8, 10])
    ax.set_ylim(-8, 110)
    ax.axhline(0, color=MUTED, lw=1, ls=":")

    ax.annotate("one slider", xy=(1.0, 71), xytext=(1.6, 100), fontsize=10, color=GOOD,
                arrowprops=dict(arrowstyle="->", color=GOOD, lw=1.5,
                                connectionstyle="arc3,rad=0.25"))
    ax.annotate("the settings gear", xy=(8.6, 26), xytext=(5.4, 52), fontsize=10,
                color=DANGER,
                arrowprops=dict(arrowstyle="->", color=DANGER, lw=1.5,
                                connectionstyle="arc3,rad=-0.2"))

    caption(fig, "The curve turns over sooner than anyone's roadmap assumes.", y=-0.03)

fig.savefig(sys.argv[1], bbox_inches="tight", facecolor="white")
