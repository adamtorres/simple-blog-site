from django.db import migrations, transaction


def lowercase_usernames(apps, schema_editor):
    Viewer = apps.get_model("blog", "Viewer")
    ViewLog = apps.get_model("blog", "ViewLog")

    # Group all viewers by their lowercase username
    groups = {}
    for viewer in Viewer.objects.all():
        key = viewer.username.lower()
        if key not in groups:
            groups[key] = []
        groups[key].append(viewer)

    # For each group, pick the highest-ID viewer as the keeper
    for key, viewers in groups.items():
        viewers.sort(key=lambda v: v.id, reverse=True)
        keep = viewers[0]

        # Merge any duplicates into the keeper
        if len(viewers) > 1:
            for duplicate in viewers[1:]:
                keep_post_ids = set(
                    ViewLog.objects.filter(viewer=keep).values_list("post_id", flat=True)
                )
                dup_conflicts = ViewLog.objects.filter(
                    viewer=duplicate, post_id__in=keep_post_ids
                )
                dup_conflicts.delete()
                ViewLog.objects.filter(viewer=duplicate).update(viewer=keep)
                duplicate.delete()

        # Normalize the username to lowercase
        target = Viewer.objects.get(pk=keep.pk)
        if target.username != key:
            target.username = key
            target.save(update_fields=["username"])


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(lowercase_usernames, migrations.RunPython.noop),
    ]