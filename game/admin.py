from django.contrib import admin
from django.utils.html import format_html

from .models import Game


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ["title", "slug", "thumbnail_preview", "is_active", "created_at"]
    list_filter = ["is_active"]
    actions = ["activate_games", "deactivate_games"]
    prepopulated_fields = {"slug": ("title",)}
    fields = [
        "title",
        "slug",
        "template_file",
        "description",
        "thumbnail",
        "is_active",
    ]

    def thumbnail_preview(self, obj):
        if obj.thumbnail:
            return format_html(
                '<img src="{}" style="height:40px;" />',
                obj.thumbnail.url,
            )
        return "—"

    thumbnail_preview.allow_tags = True
    thumbnail_preview.short_description = "Thumbnail"

    def activate_games(self, request, queryset):
        queryset.update(is_active=True)

    activate_games.short_description = "Activate selected games"

    def deactivate_games(self, request, queryset):
        queryset.update(is_active=False)

    deactivate_games.short_description = "Deactivate selected games"
