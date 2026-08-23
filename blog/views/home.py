from django.shortcuts import render


def home(request):
    """Landing page: form for viewers to enter their username."""
    return render(request, "home.html")
