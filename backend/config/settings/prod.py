from .base import *

# PythonAnywhere usernames are case-sensitive in filesystem paths (Linux),
# even though Django's ALLOWED_HOSTS check is not — using the exact login
# casing here (lowercase, matching https://afeez.pythonanywhere.com/)
# avoids a STATIC_ROOT that silently points at a directory that doesn't exist.
ALLOWED_HOSTS = ['afeez.pythonanywhere.com', '127.0.0.1', 'localhost']

DEBUG = False

# Kept outside the git-cloned project directory so `git pull` on future
# deploys never touches collected static files or uploaded media.
STATIC_ROOT = '/home/afeez/static/'
MEDIA_ROOT = '/home/afeez/media/'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# PythonAnywhere terminates HTTPS at its own proxy in front of the app, so
# the Django process itself only ever sees plain HTTP — redirecting/forcing
# secure cookies at the Django level here would break every request.
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False