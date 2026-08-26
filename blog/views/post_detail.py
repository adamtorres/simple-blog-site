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


def post_detail(request, slug):
    """Show a single post and record the view."""
    viewer = _get_viewer(request)

    if viewer is None:
        return redirect("blog:home")

    post = get_object_or_404(Post, slug=slug, status="approved")

    # Determine next/previous posts in chronological order
    all_posts = list(Post.objects.values_list("slug", flat=True).order_by("created_at"))
    current_idx = all_posts.index(slug)
    next_post_slug = all_posts[current_idx + 1] if current_idx + 1 < len(all_posts) else None
    prev_post_slug = all_posts[current_idx - 1] if current_idx - 1 >= 0 else None

    # Record the view (skip if already recorded)
    viewer.view_logs.get_or_create(post=post)

    context = {
        "post": post,
        "next_post_slug": next_post_slug,
        "prev_post_slug": prev_post_slug,
        "is_staff": request.user.is_staff if hasattr(request, "user") else False,
    }
    return render(request, "blog/post_detail.html", context)