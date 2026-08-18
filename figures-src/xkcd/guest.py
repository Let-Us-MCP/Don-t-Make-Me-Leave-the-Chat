"""Chapter 1: the guest who rearranges the furniture."""
import sys; sys.path.insert(0, "figures-src")
from _style import ACCENT, DANGER, GOOD, INK, MUTED, WARM, bare, caption, sketch

with sketch(figsize=(7.4, 3.2)) as (fig, ax):
    bare(ax, (0, 100), (0, 62))

    # The conversation, as a corridor of bubbles.
    for i, y in enumerate([50, 40, 30, 20, 10]):
        w = [26, 20, 28, 17, 23][i]
        x = 4 if i % 2 else 26
        ax.add_patch(__import__("matplotlib").patches.FancyBboxPatch(
            (x, y - 3), w, 6, boxstyle="round,pad=1.1", facecolor="#EDF1F5",
            edgecolor=MUTED, linewidth=1.2))

    ax.text(3, 58, "the conversation", color=MUTED, fontsize=10)

    # The guest.
    ax.add_patch(__import__("matplotlib").patches.FancyBboxPatch(
        (68, 12), 29, 36, boxstyle="round,pad=1.4", facecolor="#FFF6DA",
        edgecolor=WARM, linewidth=2.2))
    ax.text(82.5, 42, "YOUR APP", ha="center", color=WARM, fontsize=12)
    ax.text(82.5, 34, "* 4 tabs", ha="center", color=INK, fontsize=9)
    ax.text(82.5, 29, "* a settings gear", ha="center", color=INK, fontsize=9)
    ax.text(82.5, 24, "* an export button", ha="center", color=INK, fontsize=9)
    ax.text(82.5, 19, "* a tour", ha="center", color=INK, fontsize=9)

    ax.annotate("", xy=(66, 28), xytext=(58, 28),
                arrowprops=dict(arrowstyle="->", color=DANGER, lw=1.8,
                                connectionstyle="arc3,rad=-0.3"))
    ax.text(61, 35, "so anyway", ha="center", color=DANGER, fontsize=9)
    ax.text(61, 31, "here's me", ha="center", color=DANGER, fontsize=9)

    caption(fig, "Everybody was having a nice time until the guest brought slides.", y=0.04)

fig.savefig(sys.argv[1], bbox_inches="tight", facecolor="white")
