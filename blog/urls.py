from django.urls import path

from blog.views.home import home
from blog.views.post_detail import post_detail
from blog.views.post_list import post_list
from blog.views.unread_posts import unread_posts
from blog.views.viewer_login import viewer_login
from blog.views.viewer_logout import viewer_logout

app_name = "blog"

urlpatterns = [
    path("", home, name="home"),
    path("viewer/login/", viewer_login, name="viewer_login"),
    path("viewer/logout/", viewer_logout, name="viewer_logout"),
    path("posts/", post_list, name="post_list"),
    path("posts/unread/", unread_posts, name="unread_posts"),
    path("posts/<slug:slug>/", post_detail, name="post_detail"),
]
