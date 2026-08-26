from django.shortcuts import redirect, render

from blog.models import Viewer


def viewer_login(request):
    """Process viewer login by username. Creates or retrieves Viewer and sets session + optional cookie."""
    if request.method != "POST":
        return redirect("blog:home")

    username = request.POST.get("username", "").strip().lower()
    if not username:
        return render(request, "home.html", {
            "error": "Please enter a username.",
            "is_staff": request.user.is_staff if hasattr(request, "user") else False,
        })

    viewer = Viewer.objects.filter(username__iexact=username).first()
    if viewer:
        # Normalize existing entries to lowercase
        if viewer.username != username:
            viewer.username = username
            viewer.save()
    else:
        viewer = Viewer.objects.create(username=username)

    request.session["viewer_id"] = viewer.id
    request.session["viewer_username"] = viewer.username

    # Set a persistent signed cookie as a backup for the next visit.
    response = redirect("blog:post_list")
    response.set_cookie(
        "viewer_id",
        str(viewer.id),
        max_age=30 * 24 * 60 * 60,  # 30 days
        httponly=True,
        samesite="Lax",
    )
    return response
