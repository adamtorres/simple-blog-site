from django.contrib import admin
from django.contrib.messages import constants as messages

from .models import Post, Viewer


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ["title", "author", "status", "created_at"]
    prepopulated_fields = {"slug": ("title",)}
    list_filter = ["created_at", "status"]
    fields = ["title", "slug", "content", "status"]
    actions = ["approve_selected"]

    def get_changeform_initial_data(self, request):
        return {"author": request.user.pk}

    def save_model(self, request, obj, form, change):
        # Set author on new posts (author field not in admin form)
        if not change:
            obj.author = request.user

        if change:
            old = Post.objects.get(pk=obj.pk)

            # Prevent author from approving their own post
            if (
                obj.status == "approved"
                and old.status != "approved"
                and request.user == obj.author
            ):
                obj.status = old.status
                self.message_user(
                    request,
                    "Authors cannot approve their own posts. Please ask a different admin to approve.",
                    level=messages.WARNING,
                )

            # If author edits an approved post, revert to pending
            if request.user == obj.author and old.status == "approved":
                obj.status = "pending"

        obj.save()

    def approve_selected(self, request, queryset):
        # Block approving your own posts — skip them silently
        queryset.exclude(author=request.user).update(status="approved")
        self.message_user(
            request,
            "Selected posts have been approved. (Your own posts were skipped.)",
            level=messages.WARNING,
        )

    approve_selected.short_description = "Approve selected posts"


@admin.register(Viewer)
class ViewerAdmin(admin.ModelAdmin):
    list_display = ["username", "created_at"]
    list_filter = ["created_at"]
