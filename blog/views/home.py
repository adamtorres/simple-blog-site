from django.shortcuts import render


def home(request):
    """Landing page: form for viewers to enter their username."""
    return render(request, "home.html", {
        "is_staff": request.user.is_staff if hasattr(request, "user") else False,
    })
