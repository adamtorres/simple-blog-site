from django.contrib import admin

from .models import Post, Viewer


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ["title", "author", "created_at"]
    prepopulated_fields = {"slug": ("title",)}
    list_filter = ["created_at"]

    def get_changeform_initial_data(self, request):
        return {"author": request.user.pk}


@admin.register(Viewer)
class ViewerAdmin(admin.ModelAdmin):
    list_display = ["username", "created_at"]
    list_filter = ["created_at"]
