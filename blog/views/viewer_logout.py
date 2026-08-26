from django.shortcuts import redirect


def viewer_logout(request):
    """Clear the viewer session and cookie, then redirect to home."""
    request.session.pop("viewer_id", None)
    request.session.pop("viewer_username", None)
    response = redirect("blog:home")
    response.delete_cookie("viewer_id")
    return response
