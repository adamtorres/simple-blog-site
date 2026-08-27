from django.shortcuts import get_object_or_404, redirect, render

from blog.models import Post, Viewer


def _get_viewer(request):
    """Return the Viewer from session, or fall back to cookie."""
    viewer_id = request.session.get("viewer_id")
    if viewer_id:
        try:
            return Viewer.objects.get(id=viewer_id)
        except Viewer.DoesNotExist:
            request.session.pop("viewer_id", None)

    # Fallback: check the persistent cookie.
    cookie_id = request.COOKIES.get("viewer_id")
    if cookie_id:
        try:
            viewer = Viewer.objects.get(id=cookie_id)
            # Restore the session so the user stays logged in for this visit.
            request.session["viewer_id"] = viewer.id
            request.session["viewer_username"] = viewer.username
            return viewer
        except Viewer.DoesNotExist:
            pass

    return None


def unread_posts(request):
    """Show all unread approved posts consolidated on one page, ordered oldest first."""
    viewer = _get_viewer(request)

    if viewer is None:
        return redirect("blog:home")

    # Fetch approved posts the viewer has NOT yet read, oldest first.
    viewed_post_ids = viewer.view_logs.values_list("post_id", flat=True)
    unread_posts_qs = (
        Post.objects.filter(status="approved")
        .exclude(id__in=viewed_post_ids)
        .order_by("created_at")
    )

    # Mark all unread posts as read (create ViewLog entries if needed).
    viewer_id = viewer.id
    for post in unread_posts_qs:
        viewer.view_logs.get_or_create(post=post)

    context = {
        "posts": list(unread_posts_qs),
        "viewer": viewer,
        "is_staff": request.user.is_staff if hasattr(request, "user") else False,
    }
    return render(request, "blog/unread_posts.html", context)
