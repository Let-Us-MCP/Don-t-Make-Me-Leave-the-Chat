"""Chapter 10: the trust budget, which is shared and not yours."""
import sys; sys.path.insert(0, "figures-src")
import numpy as np
from _style import ACCENT, DANGER, GOOD, MUTED, caption, clean, sketch

x = np.arange(9)
trust = [70, 74, 78, 81, 84, 30, 33, 35, 36]

with sketch(figsize=(7.2, 3.3)) as (fig, ax):
    colors = [GOOD] * 5 + [DANGER] + [MUTED] * 3
    ax.bar(x, trust, color=colors, edgecolor="#15181D", linewidth=1.6, width=0.68)
    clean(ax, xlabel="renders the user has seen, from anybody", ylabel="willingness to click")
    ax.set_yticks([]); ax.set_xticks([])
    ax.set_ylim(0, 104)
    ax.annotate("one widget asked for\na password", xy=(5, 33), xytext=(2.6, 88),
                fontsize=10, color=DANGER,
                arrowprops=dict(arrowstyle="->", color=DANGER, lw=1.6,
                                connectionstyle="arc3,rad=-0.25"))
    caption(fig, "It was not even your widget. You still pay for it.", y=-0.03)

fig.savefig(sys.argv[1], bbox_inches="tight", facecolor="white")
