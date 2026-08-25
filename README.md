# Bespoke Furniture Creations

An order management and delivery planning system for a fictitious bespoke furniture company: a customer storefront, automated delivery route optimisation, a staff dashboard, manufacturing list generation, driver exports, predictive delivery-run batching, and a driver mobile app.

## Architecture

```
backend/    Django + Django REST Framework API (SQLite in dev)
frontend/   React (Vite) web app — public storefront + staff dashboard
mobile/     Expo (React Native) driver app
```

All three clients talk to the same backend REST API (`/api/v1/...`) using JWT authentication (`djangorestframework-simplejwt`). Staff/admin/sales/warehouse/driver roles are distinguished by a `role` field on a single custom `User` model.

### Backend app layout

- `apps/accounts` — custom `User` model + JWT auth endpoints
- `apps/products` — product catalog (`Product` → `ProductVariant` SKUs, `FinishOption`)
- `apps/customers` — `Customer`, `DeliveryAddress`, `CustomerPreference`
- `apps/orders` — `Order`, `OrderItem` (snapshotted at order time), `CustomAttachment` (uploaded design photos)
- `apps/delivery` — `Van`, `DeliveryRun`, `RouteStop`, `DeliverySettings`, and the optimisation pipeline in `apps/delivery/services/`:
  - `geocoding.py` — Google Geocoding API client (behind a swappable interface; cached on `DeliveryAddress`)
  - `classification.py` — van vs. national-parcel decision per order item
  - `clustering.py` — postcode-district pre-filter + haversine clustering
  - `capacity.py` — greedy best-fit-decreasing van load selection
  - `routing.py` — nearest-neighbour + 2-opt route ordering via Google Distance Matrix
  - `forecasting.py` — predictive delivery-run batching heuristic
  - `export_csv.py` / `export_pdf.py` — driver run exports (ReportLab for PDF)
  - `planning.py` — orchestrates the above into draft `DeliveryRun`s
- `apps/manufacturing` — `ManufacturingList`/`ManufacturingListItem`, generated when a run is locked

## Prerequisites

- Python 3.13 (avoid 3.14 — Django/Pillow wheel support lags on it)
- Node.js 20+
- A Google Maps Platform API key with the Geocoding API and Distance Matrix (or Directions) API enabled, for live route planning against real addresses
- A free Stripe account (test mode) for real card payments — https://dashboard.stripe.com/register

## Backend setup

```sh
cd backend
py -3.13 -m venv .venv
./.venv/Scripts/pip install -r requirements-dev.txt
cp .env.example .env   # fill in GOOGLE_MAPS_API_KEY / STRIPE_* keys; a real SECRET_KEY is auto-generated below
./.venv/Scripts/python manage.py migrate
./.venv/Scripts/python manage.py createsuperuser
./.venv/Scripts/python manage.py seed_demo_data   # optional: realistic demo products/vans/orders
./.venv/Scripts/python manage.py runserver
```

Run the test suite: `./.venv/Scripts/python -m pytest apps/`

**Without a Google Maps API key**, product browsing, ordering, the staff dashboard, and manufacturing/exports all work normally. Only live geocoding/route planning (`POST /api/v1/delivery-runs/plan/`) requires a real key — the delivery services are built behind swappable client interfaces so this is the only part that's blocked.

**Without Stripe keys**, everything still works except real card payments — `Cash on delivery` and `Bank transfer` orders can be marked paid manually by staff (dashboard → Orders → "Mark paid"), and `Card` orders fail with a clear "Stripe is not configured" message instead of crashing. To enable real (test-mode) card payments:
1. Get your test keys from https://dashboard.stripe.com/test/apikeys and set `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` in `backend/.env`.
2. For local webhook delivery, install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run `stripe listen --forward-to localhost:8000/api/v1/payments/webhook/`; it will print a webhook signing secret — set that as `STRIPE_WEBHOOK_SECRET`.
3. Test with card `4242 4242 4242 4242`, any future expiry, any CVC — Stripe test mode never touches real money.

## Frontend setup

```sh
cd frontend
npm install
cp .env.example .env   # defaults to http://127.0.0.1:8000/api/v1
npm run dev
```

Visit `http://localhost:5173`. Staff/admin accounts can sign in and reach `/dashboard`; anyone can browse `/products` and place an order.

## Mobile (driver app) setup

```sh
cd mobile
npm install
cp .env.example .env
# On a physical device or the Android emulator, EXPO_PUBLIC_API_BASE_URL must
# point at your machine's LAN IP (or 10.0.2.2 for the Android emulator), not 127.0.0.1.
npx expo start
```

Sign in with a user whose `role` is `DRIVER` (the seed script creates `driver1` / `DevDriver123!`) and assign them to a locked `DeliveryRun` (via Django admin or the API) to see it appear under "My Runs".

## Typical demo flow

1. Seed data: `python manage.py seed_demo_data`
2. As a customer: browse products at `/products`, place an order (optionally attaching a design photo)
3. As staff: sign in, confirm the order in the dashboard (triggers van/parcel classification)
4. Delivery Planning: pick a date, click "Plan runs", review the draft route, reorder stops if needed, lock the run
5. Locking generates the manufacturing list and unlocks CSV/PDF export
6. The "Suggested runs" widget shows which regions need scheduling next, based on pending order volume and age
7. As a driver (mobile app): sign in, view the locked run under "My Runs", open a stop, mark it delivered
