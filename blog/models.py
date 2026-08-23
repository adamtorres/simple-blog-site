from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Viewer(models.Model):
    username = models.CharField(max_length=150, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.username


class Post(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="blog_posts")
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return f"/posts/{self.slug}/"

    def is_viewed_by(self, viewer):
        """Return True if the given Viewer has viewed this post."""
        return self.viewlog_set.filter(viewer=viewer).exists()

    @property
    def viewer_count(self):
        """Return the number of unique viewers who have read this post."""
        return self.viewlog_set.distinct("viewer__id").count()

    def save(self, *args, **kwargs):
        if not self.pk:
            self.created_at = timezone.now()
        super().save(*args, **kwargs)


class ViewLog(models.Model):
    viewer = models.ForeignKey(Viewer, on_delete=models.CASCADE, related_name="view_logs")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="viewlog_set")
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["viewer", "post"]
        ordering = ["-viewed_at"]

    def __str__(self):
        return f"{self.viewer.username} -> {self.post.title}"
