from datetime import timedelta

from django.shortcuts import redirect, render
from django.utils.timezone import get_default_timezone

from blog.models import Post, Viewer


def _get_viewer(request):
    """Return the Viewer from session, or fall back to cookie."""
    viewer_id = request.session.get("viewer_id")
    if viewer_id:
        try:
            return Viewer.objects.get(id=viewer_id)
        except Viewer.DoesNotExist:
            request.session.pop("viewer_id", None)

    cookie_id = request.COOKIES.get("viewer_id")
    if cookie_id:
        try:
            viewer = Viewer.objects.get(id=cookie_id)
            request.session["viewer_id"] = viewer.id
            request.session["viewer_username"] = viewer.username
            return viewer
        except Viewer.DoesNotExist:
            pass

    return None


def _previous_sunday(d):
    """Return the Sunday on or before the given date."""
    return d - timedelta(days=d.weekday() + 1)


def _get_weeks_and_posts():
    """Return a list of week dicts sorted newest-first, each with its posts."""
    tz = get_default_timezone()

    all_posts = list(
        Post.objects.filter(status="approved").select_related("author").order_by("-created_at")
    )

    # Group posts by their Sunday-start date.
    week_groups = {}
    for post in all_posts:
        created = post.created_at
        if created.tzinfo is not None:
            created = created.astimezone(tz)
        sunday = _previous_sunday(created.date())
        week_groups.setdefault(sunday, []).append(post)

    # Build week entries sorted newest-first.
    weeks = []
    for idx, (sunday, posts) in enumerate(sorted(week_groups.items(), reverse=True)):
        saturday = sunday + timedelta(days=6)
        weeks.append({
            "sunday": sunday,
            "saturday": saturday,
            "year": sunday.year,
            "week_number": idx + 1,
            "posts": sorted(posts, key=lambda p: p.created_at, reverse=True),
        })

    return weeks


def weekly_summary(request):
    """Show available weeks sorted newest-first."""
    viewer = _get_viewer(request)
    if viewer is None:
        return redirect("blog:home")

    weeks = _get_weeks_and_posts()

    context = {
        "weeks": weeks,
        "viewer": viewer,
        "is_staff": request.user.is_staff if hasattr(request, "user") else False,
    }
    return render(request, "blog/weekly_summary.html", context)


def weekly_summary_week(request, year, week_number):
    """Show all posts from a specific week (Sunday-Saturday)."""
    viewer = _get_viewer(request)
    if viewer is None:
        return redirect("blog:home")

    weeks = _get_weeks_and_posts()

    # Find the matching week entry.
    target = None
    for w in weeks:
        if w["year"] == year and w["week_number"] == week_number:
            target = w
            break

    if target is None:
        return render(request, "blog/weekly_summary.html", {
            "weeks": weeks,
            "viewer": viewer,
            "is_staff": False,
            "no_week": True,
            "year": year,
            "week_number": week_number,
        })

    context = {
        "week": target,
        "viewer": viewer,
        "viewer_post_ids": set(viewer.view_logs.values_list("post_id", flat=True)),
        "is_staff": request.user.is_staff if hasattr(request, "user") else False,
        "show_private_content": viewer.view_private,
    }
    return render(request, "blog/weekly_summary_week.html", context)
