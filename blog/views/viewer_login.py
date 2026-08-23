from django.shortcuts import redirect, render

from blog.models import Viewer


def viewer_login(request):
    """Process viewer login by username. Creates or retrieves Viewer and sets session."""
    if request.method != "POST":
        return redirect("blog:home")

    username = request.POST.get("username", "").strip()
    if not username:
        return render(request, "home.html", {
            "error": "Please enter a username.",
            "is_staff": request.user.is_staff if hasattr(request, "user") else False,
        })

    viewer, created = Viewer.objects.get_or_create(username=username)
    request.session["viewer_id"] = viewer.id

    return redirect("blog:post_list")
