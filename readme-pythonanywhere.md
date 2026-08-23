**Clone the repo**

```bash
git clone https://github.com/adamtorres/simple-blog-site.git
cd simple-blog-site
```

**Create the virtual environment**

```bash
mkvirtualenv -a ~/simple-blog-site -r ~/simple-blog-site/requirements.txt --copies simple-blog-site-venv

python -m pip list
Package       Version
------------- -------
asgiref       3.12.1
Django        6.1
Markdown      3.10.3
pip           25.2
python-dotenv 1.2.3
sqlparse      0.6.0
```

**Create the web app**

Created a "manual configuration" web app.

Selected python version 3.13.

The last panel quote:

> Manual configuration involves editing your own WSGI configuration file in /var/www/. Usually this imports a WSGI-compatible application which you've stored elsewhere
> When you click "Next", we will create a WSGI file for you, including a simple "Hello World" app which you can use to get started, as well as some comments on how to use other frameworks.
> You will also be able to specify a virtualenv to use for your app.

| Field                   | Default Value                                      |
| :---                    | :---                                               |
| Source code             | Enter the path to your web app source code         |
| Working directory       | /home/<username>/                              |
| WSGI configuration file | /var/www/<username>_pythonanywhere_com_wsgi.py |
| Python version          | 3.13                                               |
| Virtualenv              | none                                               |
| Static files            | none                                               |

**Configure the web app**

Overly complex way to find the path for the virtualenv.

```
find ~ -type d -name "bin" -prune -o -type f -name "pyvenv.cfg" -exec dirname {} \;
```

Change these settings

| Field                   | Modified Value                                      |
| :---                    | :---                                               |
|Source code              | `/home/<username>/simple-blog-site` |
|Working directory        | `/home/<username>/simple-blog-site` |
|Virtualenv               | `/home/<username>/.virtualenvs/simple-blog-site-venv` |

Add a static folder entry

| URL | Directory |
| :--- | :--- |
| `/static/` | `/home/<username>/simple-blog-site/public` |

**Modify `/var/www/<username>_pythonanywhere_com_wsgi.py`**

Remove the current code that provides the "Hello World" page.  There is a lot of commented code showing Django and Flask use-cases.  The below is the code used to point to the `wsgi.py` in this repo.

```python
import sys

path = '/home/<username>/simple-blog-site'
if path not in sys.path:
    sys.path.append(path)

from simple_blog.wsgi import application  # noqa
```

**Complete the setup of the application**

Using sqlite3 to keep things simple.

Verify the python environment is active.  The prompt should start with `(simple-blog-site-venv)`.

Run the migrations.

```bash
cd ~/simple-blog-site
./manage.py migrate
```

Add the environment values.  Need to set the secret and add the domain to allowed hosts.

```bash
cp .env.example .env
vi .env
```

Create the superuser

```bash
./manage.py createsuperuser
```

Collect the static files (custom css and files used by the built-in admin site).

```bash
./manage.py collectstatic
```

**Finally**

Restart the web app one more time just to make sure all changes are applied.

And now, the [site](http://<username>.pythonanywhere.com) should be up.
