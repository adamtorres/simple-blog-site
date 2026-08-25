from django.shortcuts import get_object_or_404, render

from .models import Game


def game_list(request):
    """Show all active games."""
    games = Game.objects.filter(is_active=True)
    return render(request, "game/list.html", {"games": games})


def game_detail(request, slug):
    """Load a single game in an iframe."""
    game = get_object_or_404(Game, slug=slug, is_active=True)
    return render(request, "game/play.html", {"game": game})
