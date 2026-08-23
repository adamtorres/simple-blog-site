from django.shortcuts import redirect


def viewer_logout(request):
    """Clear the viewer session and redirect to home."""
    request.session.pop("viewer_id", None)
    return redirect("blog:home")
