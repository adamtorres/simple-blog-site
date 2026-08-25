from django.db import models


class Game(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    template_file = models.CharField(
        max_length=200,
        help_text="Path in static/, e.g. 'games/2048.html'",
    )
    description = models.TextField(blank=True)
    thumbnail = models.ImageField(
        upload_to="game_thumbnails/",
        blank=True,
        null=True,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return f"/games/{self.slug}/"

    @property
    def thumbnail_url(self):
        if self.thumbnail:
            return self.thumbnail.url
        return None
