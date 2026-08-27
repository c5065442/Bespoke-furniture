 # Deploying to PythonAnywhere (afeez.pythonanywhere.com)

Django serves both the API and the built React frontend from one PythonAnywhere web app — no separate Node hosting needed. This has been tested locally under `config.settings.prod` and works correctly (root serves the built app, client-side routes like `/products/5` don't 404, `/api/v1/...` and `/admin/` are unaffected).

## 1. One-time PythonAnywhere account setup

You need a PythonAnywhere account with username **afeez** (so it matches `ALLOWED_HOSTS` and `STATIC_ROOT` already set in `backend/config/settings/prod.py`). If your actual username has different casing, tell me and I'll fix those two values to match exactly — Linux filesystem paths are case-sensitive even though the hostname check isn't.

> **Free-tier limitation to know about up front:** PythonAnywhere's free "Beginner" accounts can only make outbound internet requests to an allowlisted set of domains. This project calls three external APIs at runtime — Stripe, Google Maps, and postcodes.io. If any aren't on the allowlist, that specific feature (payments / route planning / postcode validation) will fail on the live site even though everything else works. Check **Account → Beginner Whitelist** the first time you test Stripe checkout or delivery planning live; if a domain is missing, PythonAnywhere has a request form on that page to add it, or you can upgrade to a paid plan for unrestricted access.

## 2. Get the code onto PythonAnywhere

Open a **Bash console** from the PythonAnywhere dashboard:

```bash
git clone https://github.com/c5065442/Furniture-Creation-.git bespoke-furniture
cd bespoke-furniture
```

(If you'd rather not deal with git auth on the server, use the **Files** tab to upload a zip instead and extract it — either way you need the repo contents at `/home/afeez/bespoke-furniture/`.)

## 3. Backend: virtualenv + dependencies

Still in the Bash console:

```bash
cd ~/bespoke-furniture/backend
mkvirtualenv --python=python3.10 bfc-venv
pip install -r requirements.txt
```

## 4. Backend: environment variables

Create `~/bespoke-furniture/backend/.env` (this file is gitignored — it never comes from the repo, you create it directly on the server):

```bash
nano .env
```

```
SECRET_KEY=<generate a new one — see below, don't reuse your local dev key>
DEBUG=False
GOOGLE_MAPS_API_KEY=<your key, or leave blank>
STRIPE_SECRET_KEY=<your key, or leave blank>
STRIPE_PUBLISHABLE_KEY=<your key, or leave blank>
STRIPE_WEBHOOK_SECRET=<your key, or leave blank>
```

Generate a fresh production `SECRET_KEY` (don't reuse the one in your local `.env`):
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## 5. Database + static files

```bash
python manage.py migrate --settings=config.settings.prod
python manage.py createsuperuser --settings=config.settings.prod
python manage.py collectstatic --settings=config.settings.prod --noinput
mkdir -p /home/afeez/media
```

(`collectstatic` gathers Django admin's own CSS/JS into `/home/afeez/static/` — this is separate from the frontend's own assets, handled next.)

Optional: `python manage.py seed_demo_data --settings=config.settings.prod` for a populated demo catalog.

## 6. Build the frontend

PythonAnywhere consoles have Node available (or install via `nvm` if not):

```bash
cd ~/bespoke-furniture/frontend
npm install
npm run build
```

This produces `frontend/dist/` — Vite automatically picks up `.env.production` (already in the repo, pointing the API base URL at the relative `/api/v1`, so it works on whatever domain it's served from). No manual config needed here.

## 7. Configure the PythonAnywhere web app

**Web** tab → **Add a new web app** → choose **Manual configuration** (not one of the Django wizard options, since this project uses a settings-module split) → your Python version.

- **Source code**: `/home/afeez/bespoke-furniture/backend`
- **Working directory**: `/home/afeez/bespoke-furniture/backend`
- **Virtualenv**: `/home/afeez/.virtualenvs/bfc-venv`

**WSGI configuration file** (click the link on the Web tab to edit it) — replace its contents with:

```python
import os
import sys

path = '/home/afeez/bespoke-furniture/backend'
if path not in sys.path:
    sys.path.insert(0, path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.prod'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

**Static files table** (further down the Web tab) — add these mappings so PythonAnywhere serves them directly (fast, bypasses Django entirely):

| URL | Directory |
|---|---|
| `/static/` | `/home/afeez/static/` |
| `/media/` | `/home/afeez/media/` |
| `/assets/` | `/home/afeez/bespoke-furniture/frontend/dist/assets/` |
| `/images/` | `/home/afeez/bespoke-furniture/frontend/dist/images/` |
| `/favicon.svg` | `/home/afeez/bespoke-furniture/frontend/dist/favicon.svg` |
| `/icons.svg` | `/home/afeez/bespoke-furniture/frontend/dist/icons.svg` |

Click the big green **Reload** button at the top of the Web tab.

## 8. Verify

Visit `https://afeez.pythonanywhere.com/` — should load the storefront. Check:
- `https://afeez.pythonanywhere.com/api/v1/products/` returns product JSON
- `https://afeez.pythonanywhere.com/admin/` reaches Django admin
- Refresh the page on a client-side route (e.g. `/products`) — should load correctly, not 404
- Log in as staff and confirm the dashboard loads

## 9. Redeploying after future changes

```bash
cd ~/bespoke-furniture
git pull
cd backend && workon bfc-venv && pip install -r requirements.txt && python manage.py migrate --settings=config.settings.prod
cd ../frontend && npm install && npm run build
```
Then hit **Reload** on the Web tab again.

## Not covered by this deployment

The **mobile driver app** (Expo/React Native) isn't a website and doesn't deploy to PythonAnywhere — it stays a separate app run via Expo Go or a built binary, pointed at `https://afeez.pythonanywhere.com/api/v1` in its own `.env`.
