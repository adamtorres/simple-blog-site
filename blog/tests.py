from django.contrib.auth.models import User
from django.test import Client, TestCase

from .models import Post, Viewer


class ApprovalWorkflowTest(TestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            "test_author", "a@test.com", "pass"
        )
        self.author.is_staff = True
        self.author.is_superuser = True
        self.author.save()

        self.approver = User.objects.create_user(
            "test_approver", "b@test.com", "pass"
        )
        self.approver.is_staff = True
        self.approver.is_superuser = True
        self.approver.save()

        self.viewer = Viewer.objects.create(username="viewer1")
        self.client = Client()

    def tearDown(self):
        Post.objects.filter(
            slug__in=["self-approve-test", "approved-post", "bulk-test", "pending-test", "approved-test"]
        ).delete()
        Viewer.objects.filter(username="viewer1").delete()

    def _admin_login(self, username="test_author", password="pass"):
        self.client.post(
            "/admin/login/",
            {"username": username, "password": password},
            follow=True,
        )

    def _viewer_login(self):
        self.client.post(
            "/viewer/login/",
            {"username": "viewer1"},
            follow=True,
        )

    def test_author_cannot_self_approve_via_form(self):
        post = Post.objects.create(
            title="Self Approve Test", slug="self-approve-test",
            content="Content", author=self.author, status="pending",
        )
        self._admin_login("test_author")
        self.client.post(
            f"/admin/blog/post/{post.pk}/change/",
            {"title": "Self Approve Test", "slug": "self-approve-test",
             "content": "Content", "status": "approved"},
            follow=True,
        )
        post.refresh_from_db()
        self.assertEqual(post.status, "pending")

    def test_different_admin_can_approve(self):
        post = Post.objects.create(
            title="Approved Post", slug="approved-post",
            content="Content", author=self.author, status="pending",
        )
        self._admin_login("test_approver")
        self.client.post(
            f"/admin/blog/post/{post.pk}/change/",
            {"title": "Approved Post", "slug": "approved-post",
             "content": "Content", "status": "approved"},
            follow=True,
        )
        post.refresh_from_db()
        self.assertEqual(post.status, "approved")

    def test_author_edit_reverts_approved_to_pending(self):
        post = Post.objects.create(
            title="Approved Post", slug="approved-post",
            content="Content", author=self.author, status="approved",
        )
        self._admin_login("test_author")
        self.client.post(
            f"/admin/blog/post/{post.pk}/change/",
            {"title": "Approved Post", "slug": "approved-post",
             "content": "Updated", "status": "approved"},
            follow=True,
        )
        post.refresh_from_db()
        self.assertEqual(post.status, "pending")

    def test_non_author_edit_keeps_approved(self):
        post = Post.objects.create(
            title="Approved Post", slug="approved-post",
            content="Content", author=self.author, status="approved",
        )
        self._admin_login("test_approver")
        self.client.post(
            f"/admin/blog/post/{post.pk}/change/",
            {"title": "Approved Post", "slug": "approved-post",
             "content": "Fixed typo", "status": "approved"},
            follow=True,
        )
        post.refresh_from_db()
        self.assertEqual(post.status, "approved")

    def test_author_cannot_self_approve_via_bulk_action(self):
        post = Post.objects.create(
            title="Bulk Test", slug="bulk-test",
            content="Content", author=self.author, status="pending",
        )
        self._admin_login("test_author")
        self.client.post(
            "/admin/blog/post/approve_selected/",
            {"action": "approve_selected", "_selected_action": [str(post.pk)]},
            follow=True,
        )
        post.refresh_from_db()
        self.assertEqual(post.status, "pending")

    def test_viewer_sees_only_approved_posts(self):
        Post.objects.create(
            title="Pending", slug="pending-test",
            content="Content", author=self.author, status="pending",
        )
        post_approved = Post.objects.create(
            title="Approved", slug="approved-test",
            content="Content", author=self.author, status="approved",
        )
        self._viewer_login()
        resp = self.client.get("/posts/")
        self.assertContains(resp, "Approved")
        self.assertNotContains(resp, "Pending")
        self.assertEqual(self.client.get("/posts/pending-test/").status_code, 404)
        self.assertEqual(self.client.get("/posts/approved-test/").status_code, 200)
