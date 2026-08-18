"""Chapter 2: the same widget, seen by both of its users."""
import sys; sys.path.insert(0, "figures-src")
import matplotlib.patches as mp
from _style import ACCENT, GOOD, INK, MUTED, WARM, bare, caption, sketch

with sketch(figsize=(7.6, 3.4)) as (fig, ax):
    bare(ax, (0, 100), (0, 66))

    ax.add_patch(mp.FancyBboxPatch((36, 22), 28, 32, boxstyle="round,pad=1.4",
                                   facecolor="#FFFFFF", edgecolor=INK, linewidth=2))
    ax.text(50, 48, "YOUR WIDGET", ha="center", color=INK, fontsize=10)
    for y in (41, 36, 31):
        ax.add_patch(mp.Rectangle((40, y), 20, 3, facecolor="#DCE4EC", edgecolor=MUTED,
                                  linewidth=0.9))
    ax.add_patch(mp.FancyBboxPatch((42, 24), 16, 4.5, boxstyle="round,pad=0.6",
                                   facecolor=ACCENT, edgecolor=ACCENT))
    ax.text(50, 26.2, "Approve", ha="center", va="center", color="white", fontsize=8)

    ax.text(12, 58, "the human sees", color=GOOD, fontsize=10.5, ha="center")
    ax.text(12, 47, "a card", color=INK, fontsize=9.5, ha="center")
    ax.text(12, 42, "three rows", color=INK, fontsize=9.5, ha="center")
    ax.text(12, 37, "a blue button", color=INK, fontsize=9.5, ha="center")
    ax.annotate("", xy=(34, 38), xytext=(22, 42),
                arrowprops=dict(arrowstyle="->", color=GOOD, lw=1.6,
                                connectionstyle="arc3,rad=0.2"))

    ax.text(87, 58, "the model sees", color=WARM, fontsize=10.5, ha="center")
    ax.text(87, 47, 'name: "approve_x"', color=INK, fontsize=9, ha="center")
    ax.text(87, 42, "description: ...", color=INK, fontsize=9, ha="center")
    ax.text(87, 37, "structuredContent", color=INK, fontsize=9, ha="center")
    ax.annotate("", xy=(66, 38), xytext=(77, 42),
                arrowprops=dict(arrowstyle="->", color=WARM, lw=1.6,
                                connectionstyle="arc3,rad=-0.2"))

    ax.text(50, 14, "Ship a beautiful card with a vague schema and you have\n"
                    "built an accessible interface for exactly one of them.",
            ha="center", va="center", color=MUTED, fontsize=10)

fig.savefig(sys.argv[1], bbox_inches="tight", facecolor="white")
