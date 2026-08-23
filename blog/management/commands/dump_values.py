from django.core.management.base import BaseCommand
from simple_blog import settings


class Command(BaseCommand):
    help = 'Dump the settings values for specific keys.'

    def handle(self, *args, **options):
        keys_to_dump = ['SECRET_KEY', 'DEBUG', 'ALLOWED_HOSTS']
        for key in keys_to_dump:
            print(f"{key} = {settings.__dict__.get(key, None)!r}")
        self.stdout.write('Task completed')
