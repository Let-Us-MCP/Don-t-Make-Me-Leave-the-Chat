"""Chapter 4: the widget that re-asks."""
import sys; sys.path.insert(0, "figures-src")
import matplotlib.patches as mp
from _style import DANGER, GOOD, INK, MUTED, WARM, bare, caption, sketch

with sketch(figsize=(7.4, 3.4)) as (fig, ax):
    bare(ax, (0, 100), (0, 64))

    ax.add_patch(mp.FancyBboxPatch((6, 44), 56, 12, boxstyle="round,pad=1.4",
                                   facecolor="#EDF1F5", edgecolor=MUTED, linewidth=1.3))
    ax.text(34, 50, '"File the $62.40 Blue Bottle receipt from the 14th\n'
                    'against my usual cost centre."',
            ha="center", va="center", color=INK, fontsize=9.5)

    ax.add_patch(mp.FancyBboxPatch((22, 6), 56, 32, boxstyle="round,pad=1.4",
                                   facecolor="#FFFFFF", edgecolor=DANGER, linewidth=2))
    ax.text(50, 34, "NEW EXPENSE", ha="center", color=DANGER, fontsize=10)
    for i, label in enumerate(["Merchant", "Amount", "Date", "Cost centre"]):
        y = 27 - i * 5.4
        ax.text(28, y, label, color=MUTED, fontsize=8.5, va="center")
        ax.add_patch(mp.Rectangle((45, y - 2), 28, 4, facecolor="#FAFBFC",
                                  edgecolor=MUTED, linewidth=0.9))

    ax.annotate("", xy=(50, 40), xytext=(34, 43),
                arrowprops=dict(arrowstyle="->", color=DANGER, lw=1.8,
                                connectionstyle="arc3,rad=-0.25"))
    ax.text(72, 44, "so, tell me\nabout yourself", color=DANGER, fontsize=9.5, ha="center")

    caption(fig, "Four questions, all of them already answered, one line up.", y=0.02)

fig.savefig(sys.argv[1], bbox_inches="tight", facecolor="white")
