"""Chapter 7: confidence against truth, in a widget that stopped looking."""
import sys; sys.path.insert(0, "figures-src")
import numpy as np
from _style import ACCENT, DANGER, GOOD, MUTED, caption, clean, sketch

t = np.linspace(0, 10, 300)
confidence = np.full_like(t, 100.0)
truth = 100 * np.exp(-t / 3.4)

with sketch(figsize=(7.2, 3.3)) as (fig, ax):
    ax.plot(t, confidence, color=DANGER, lw=2.6, label="what the widget still says")
    ax.plot(t, truth, color=GOOD, lw=2.6, label="how likely it is to be true")
    ax.fill_between(t, truth, confidence, color=DANGER, alpha=0.1)
    clean(ax, xlabel="minutes since the last fetch", ylabel="")
    ax.set_yticks([]); ax.set_ylim(0, 118)
    ax.legend(loc="center right", frameon=False, fontsize=9.5)
    ax.annotate("the model acted\nin here somewhere", xy=(4.4, 62), xytext=(4.0, 20),
                fontsize=10, color=MUTED,
                arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.4,
                                connectionstyle="arc3,rad=0.2"))
    caption(fig, "A timestamp costs one line and closes most of that gap.", y=-0.03)

fig.savefig(sys.argv[1], bbox_inches="tight", facecolor="white")
