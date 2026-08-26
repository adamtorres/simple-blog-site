from django.shortcuts import get_object_or_404, redirect, render

from blog.models import Viewer


def home(request):
    """Landing page: form for viewers to enter their username."""
    # Auto-redirect if a valid viewer cookie exists.
    cookie_id = request.COOKIES.get("viewer_id")
    if cookie_id:
        try:
            viewer = Viewer.objects.get(id=cookie_id)
            request.session["viewer_id"] = viewer.id
            request.session["viewer_username"] = viewer.username
            return redirect("blog:post_list")
        except Viewer.DoesNotExist:
            pass

    # Pre-populate username from the cookie for convenience.
    saved_username = None
    cookie_id = request.COOKIES.get("viewer_id")
    if cookie_id:
        try:
            viewer = Viewer.objects.get(id=cookie_id)
            saved_username = viewer.username
        except Viewer.DoesNotExist:
            pass

    return render(request, "home.html", {
        "is_staff": request.user.is_staff if hasattr(request, "user") else False,
        "saved_username": saved_username,
    })
