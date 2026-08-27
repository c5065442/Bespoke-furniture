from .base import *

ALLOWED_HOSTS = ['Afeez.pythonanywhere.com', '127.0.0.1', 'localhost']

DEBUG = False


STATIC_ROOT = '/home/Afeez/static/'


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


SECURE_SSL_REDIRECT = False  
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False