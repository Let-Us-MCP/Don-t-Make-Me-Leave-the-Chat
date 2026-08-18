"""Chapter 9: who actually pressed the button."""
import sys; sys.path.insert(0, "figures-src")
import matplotlib.patches as mp
from _style import ACCENT, DANGER, GOOD, INK, MUTED, WARM, bare, caption, sketch

with sketch(figsize=(7.4, 3.2)) as (fig, ax):
    bare(ax, (0, 100), (0, 58))

    ax.add_patch(mp.FancyBboxPatch((6, 26), 26, 20, boxstyle="round,pad=1.2",
                                   facecolor="#EDF1F5", edgecolor=MUTED, linewidth=1.4))
    ax.text(19, 39, "the human", ha="center", color=INK, fontsize=10.5)
    ax.text(19, 32, "read it,\nmeant it", ha="center", color=MUTED, fontsize=9)

    ax.add_patch(mp.FancyBboxPatch((37, 26), 26, 20, boxstyle="round,pad=1.2",
                                   facecolor="#FFF6DA", edgecolor=WARM, linewidth=1.8))
    ax.text(50, 39, "the model", ha="center", color=WARM, fontsize=10.5)
    ax.text(50, 32, "inferred it\nfrom a sentence", ha="center", color=MUTED, fontsize=9)

    ax.add_patch(mp.FancyBboxPatch((70, 26), 26, 20, boxstyle="round,pad=1.2",
                                   facecolor="#FAECEC", edgecolor=DANGER, linewidth=1.8))
    ax.text(83, 39, "DELETE", ha="center", color=DANGER, fontsize=12)
    ax.text(83, 32, "irreversible", ha="center", color=MUTED, fontsize=9)

    ax.annotate("", xy=(68, 36), xytext=(65, 36),
                arrowprops=dict(arrowstyle="->", color=DANGER, lw=2))
    ax.annotate("", xy=(35, 36), xytext=(33, 36),
                arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.6))

    ax.text(50, 14, "One of these two users is confident on purpose.\n"
                    "Build the undo for the other one.",
            ha="center", va="center", color=INK, fontsize=10.5)

fig.savefig(sys.argv[1], bbox_inches="tight", facecolor="white")
