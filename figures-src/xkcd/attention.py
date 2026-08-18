"""Chapter 3: attention, as actually spent on a widget in a chat."""
import sys; sys.path.insert(0, "figures-src")
import numpy as np
from _style import ACCENT, DANGER, GOOD, INK, MUTED, caption, clean, sketch

t = np.linspace(0, 10, 400)
attention = 100 * np.exp(-t / 1.1) + 4

with sketch(figsize=(7.2, 3.3)) as (fig, ax):
    ax.plot(t, attention, color=ACCENT, lw=2.6)
    ax.fill_between(t[t <= 0.8], attention[t <= 0.8], color=GOOD, alpha=0.22)
    clean(ax, xlabel="seconds since your widget appeared", ylabel="attention")
    ax.set_yticks([])
    ax.set_xticks([0, 2, 4, 6, 8, 10])
    ax.set_ylim(0, 118)

    ax.annotate("everything you get\nto communicate", xy=(0.55, 62), xytext=(2.4, 96),
                fontsize=10, color=GOOD,
                arrowprops=dict(arrowstyle="->", color=GOOD, lw=1.5,
                                connectionstyle="arc3,rad=0.25"))
    ax.annotate("where you put\nthe onboarding tour", xy=(6.4, 8), xytext=(5.0, 44),
                fontsize=10, color=DANGER,
                arrowprops=dict(arrowstyle="->", color=DANGER, lw=1.5,
                                connectionstyle="arc3,rad=-0.25"))

    caption(fig, "The half-second is not a worst case. It is the design target.", y=-0.03)

fig.savefig(sys.argv[1], bbox_inches="tight", facecolor="white")
