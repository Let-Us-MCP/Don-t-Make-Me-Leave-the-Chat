"""Chapter 13: the listing is a render too."""
import sys; sys.path.insert(0, "figures-src")
import matplotlib.patches as mp
from _style import ACCENT, GOOD, INK, MUTED, WARM, bare, caption, sketch

with sketch(figsize=(7.4, 3.3)) as (fig, ax):
    bare(ax, (0, 100), (0, 62))

    ax.add_patch(mp.FancyBboxPatch((6, 16), 40, 34, boxstyle="round,pad=1.3",
                                   facecolor="#FFFFFF", edgecolor=MUTED, linewidth=1.6))
    ax.text(26, 44, "what you shipped", ha="center", color=INK, fontsize=10.5)
    ax.text(26, 32, "6 months\n4 engineers\n1 design system",
            ha="center", va="center", color=MUTED, fontsize=9.5)

    ax.add_patch(mp.FancyBboxPatch((56, 22), 38, 22, boxstyle="round,pad=1.3",
                                   facecolor="#FFF6DA", edgecolor=WARM, linewidth=2))
    ax.text(75, 38, "what gets read", ha="center", color=WARM, fontsize=10.5)
    ax.text(75, 29, '"Compare loan offers by\ntotal cost."',
            ha="center", va="center", color=INK, fontsize=9.5)

    ax.annotate("", xy=(54, 33), xytext=(48, 33),
                arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.8))

    caption(fig, "One sentence decides whether anybody ever sees the other thing.", y=0.02)

fig.savefig(sys.argv[1], bbox_inches="tight", facecolor="white")
