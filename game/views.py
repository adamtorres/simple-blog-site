import json
import random

from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render

from .models import Game


ANIMAL_TYPES = [
    {"name": "cat", "icons": ["cat-1.svg", "cat-2.svg", "cat-3.svg"]},
    {"name": "dog", "icons": ["dog-1.svg", "dog-2.svg", "dog-3.svg"]},
    {"name": "horse", "icons": ["horse-1.svg", "horse-2.svg", "horse-3.svg"]},
    {"name": "mouse", "icons": ["mouse-1.svg", "mouse-2.svg", "mouse-3.svg"]},
    {"name": "duck", "icons": ["duck-1.svg", "duck-2.svg", "duck-3.svg"]},
    {"name": "parrot", "icons": ["parrot-1.svg", "parrot-2.svg", "parrot-3.svg"]},
    {"name": "fish", "icons": ["fish-1.svg", "fish-2.svg", "fish-3.svg"]},
]

TERRITORY_COLORS = [
    "#ff6b6b",  # red
    "#4ecdc4",  # teal
    "#45b7d1",  # blue
    "#f9ca24",  # yellow
    "#6c5ce7",  # purple
    "#a29bfe",  # lavender
    "#fd79a8",  # pink
    "#00b894",  # green
    "#e17055",  # orange
    "#74b9ff",  # light blue
]


def generate_catdoku(n):
    """Place N cats legally and flood-fill regions."""
    def is_safe(r, c, placed):
        for pr, pc in placed:
            if pr == r or pc == c:
                return False
            if abs(pr - r) <= 1 and abs(pc - c) <= 1:
                return False
        return True

    def backcheck_place(r, placed):
        if r == n:
            return True
        columns = list(range(n))
        random.shuffle(columns)
        for c in columns:
            if is_safe(r, c, placed):
                placed.append((r, c))
                if backcheck_place(r + 1, placed):
                    return True
                placed.pop()
        return False

    cats = []
    while not backcheck_place(0, cats):
        cats = []

    grid = [[-1] * n for _ in range(n)]
    queue = []
    for rid, (r, c) in enumerate(cats):
        grid[r][c] = rid
        queue.append((r, c, rid))

    random.shuffle(queue)
    while queue:
        r, c, rid = queue.pop(0)
        neighbors = [(r-1, c), (r+1, c), (r, c-1), (r, c+1)]
        random.shuffle(neighbors)
        for nr, nc in neighbors:
            if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == -1:
                grid[nr][nc] = rid
                queue.append((nr, nc, rid))

    return cats, grid


def animaldoku_generate_grid(request):
    """API endpoint: generate a new animaldoku grid."""
    grid_size = int(request.POST.get("grid_size", 10))
    cats, region_grid = generate_catdoku(grid_size)

    animal = random.choice(ANIMAL_TYPES)
    variation = random.choice(animal["icons"])
    colors = random.sample(TERRITORY_COLORS, grid_size)

    return JsonResponse({
        "grid_size": grid_size,
        "cat_positions": cats,
        "region_grid": region_grid,
        "animal_type": animal["name"],
        "animal_variation": variation,
        "territory_colors": colors,
    })


def game_list(request):
    """Show all active games."""
    games = Game.objects.filter(is_active=True)
    return render(request, "game/list.html", {"games": games})


def game_detail(request, slug):
    """Load a single game in an iframe."""
    game = get_object_or_404(Game, slug=slug, is_active=True)
    return render(request, "game/play.html", {"game": game})
