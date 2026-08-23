from django.core.paginator import Paginator
from django.shortcuts import redirect, render

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


def post_list(request):
    """Paginated list of all posts with read/unread status."""
    viewer = _get_viewer(request)

    if viewer is None:
        return redirect("blog:home")

    all_posts = Post.objects.all()
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
