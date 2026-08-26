from django.core.paginator import Paginator
from django.shortcuts import redirect, render

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


def post_list(request):
    """Paginated list of all posts with read/unread status."""
    viewer = _get_viewer(request)

    if viewer is None:
        return redirect("blog:home")

    all_posts = Post.objects.filter(status="approved")
    paginator = Paginator(all_posts, 10)
    page_number = request.GET.get("page", 1)
    page_obj = paginator.get_page(page_number)

    viewer_post_ids = set(viewer.view_logs.values_list("post_id", flat=True))

    context = {
        "page_obj": page_obj,
        "viewer": viewer,
        "viewer_post_ids": viewer_post_ids,
        "is_staff": request.user.is_staff if hasattr(request, "user") else False,
    }
    return render(request, "blog/post_list.html", context)
