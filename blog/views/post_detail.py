from django.shortcuts import get_object_or_404, redirect, render

from blog.models import Post, Viewer


def _get_viewer(request):
    """Return the Viewer from session, or None."""
    viewer_id = request.session.get("viewer_id")
    if viewer_id:
        try:
            return Viewer.objects.get(id=viewer_id)
        except Viewer.DoesNotExist:
            request.session.pop("viewer_id", None)
    return None


def post_detail(request, slug):
    """Show a single post and record the view."""
    viewer = _get_viewer(request)

    if viewer is None:
        return redirect("blog:home")

    post = get_object_or_404(Post, slug=slug)

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