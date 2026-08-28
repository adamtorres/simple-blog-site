# Simple Blog

## Purpose

This project has two purposes.

### Local AI

The first is to experiment with local AI code writing.  I'm using `Qwen_Qwen3.6-35B-A3B-Q4_K_M.gguf` on an Intel 6700K with an RTX5060ti 16GB running llama.cpp.

### Keeping people updated

The second reason is a simpler way to keep disparate people updated on a topic.  This is one-way only in that the readers can only read.  There is no like/comment/tag/share/etc.  The site is intentionally being kept simple.

## Setup

1. **Create a virtual environment and activate it:**

   **using venv**

   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

   **using pyenv**

   ```bash
   pyenv virtualenv --copies 3.14.3 some-venv-name
   pyenv local some-venv-name
   ```

2. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Set up the environment file:**

   ```bash
   cp .env.example .env
   ```

    Edit `.env` to customize settings. At minimum, set a proper `DJANGO_SECRET_KEY` before deploying to production. Other available variables: `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_TIME_ZONE`.

4. **Run migrations:**

   ```bash
   python manage.py migrate
   ```

5. **Create an admin user (optional, for Django admin access):**

   ```bash
   python manage.py createsuperuser
   ```

## Running

Start the development server:

```bash
python manage.py runserver
```

The site will be available at [http://localhost:8000](http://localhost:8000).

The Django admin interface is at `/admin/`.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DJANGO_SECRET_KEY` | Django secret key for cryptographic signing | (development fallback) |
| `DJANGO_DEBUG` | Enable debug mode | `True` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated list of allowed hostnames | `testserver,localhost,127.0.0.1` |
| `DJANGO_TIME_ZONE` | Display timezone for dates and times | `UTC` |

## Features

- **Viewers** enter a username to start reading posts — no password required. Username is used only to track which posts have been read.
- **Admins** can create, edit, and manage posts via the Django admin interface.
- Posts are rendered from Markdown using the `markdown` library.

## Project Structure

```
.
├── blog/                 # Blog app
│   ├── migrations/       # Database migrations
│   ├── management/
│   │   └── commands/     # Custom management commands
│   ├── templatetags/     # Custom template filters
│   ├── views/            # View functions (one file per view)
│   ├── admin.py
│   ├── models.py
│   ├── tests.py
│   └── urls.py
├── game/                 # Games app
│   ├── migrations/
│   ├── admin.py
│   ├── models.py
│   ├── tests.py
│   ├── urls.py
│   └── views.py
├── simple_blog/          # Project settings
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── static/               # Static files (CSS, JS)
├── templates/            # Templates
│   ├── blog/             # Blog templates
│   ├── game/             # Game templates
│   └── base.html         # Base template
├── .env.example          # Environment template
├── requirements.txt
└── manage.py
```