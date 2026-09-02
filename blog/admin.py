from datetime import datetime

from django.contrib import admin
from django.contrib.messages import constants as messages

from .models import Post, Viewer


def _get_default_title():
    now = datetime.now()
    hour = now.hour
    if 6 <= hour < 12:
        period = "morning"
    elif 12 <= hour < 17:
        period = "afternoon"
    elif 17 <= hour < 21:
        period = "evening"
    else:
        period = "night"
    return f"{now.month}/{now.day} {period}"


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ["title", "author", "status", "created_at"]
    prepopulated_fields = {"slug": ("title",)}
    list_filter = ["created_at", "status"]
    fields = ["title", "slug", "content", "private_content", "status"]
    actions = ["approve_selected"]

    def get_changeform_initial_data(self, request):
        return {"author": request.user.pk, "title": _get_default_title()}

    def save_model(self, request, obj, form, change):
        # Set author on new posts (author field not in admin form)
        if not change:
            obj.author = request.user
        obj.save()

    def approve_selected(self, request, queryset):
        queryset.update(status="approved")
        self.message_user(
            request,
            "Selected posts have been approved.",
            level=messages.SUCCESS,
        )

    approve_selected.short_description = "Approve selected posts"


@admin.register(Viewer)
class ViewerAdmin(admin.ModelAdmin):
    list_display = ["username", "created_at", "view_private"]
    list_filter = ["created_at", "view_private"]
