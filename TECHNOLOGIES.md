# Technologies, Frameworks & External Integrations

This document lists every technology, framework, library, and external API used in the Bespoke Furniture Creations system, and why each was chosen.

## 1. Backend

| Technology | Version | Purpose |
|---|---|---|
| Python | 3.13 | Core backend language |
| Django | 5.0.14 | Web framework — models, ORM, admin, migrations |
| Django REST Framework (DRF) | 3.17.2 | Builds the REST API (serializers, viewsets, routers, permissions) |
| djangorestframework-simplejwt | 5.5.1 | JSON Web Token (JWT) authentication for the API |
| django-cors-headers | 4.9.0 | Cross-Origin Resource Sharing, so the React dev server can call the API during development |
| django-environ | 0.14.0 | Loads configuration (secrets, API keys) from a `.env` file rather than hardcoding them |
| django-filter | 25.1 | Query-parameter filtering on API list endpoints (e.g. filter orders by status) |
| Pillow | 12.3.0 | Image processing, required by Django's `ImageField` (product photos, design uploads) |
| ReportLab | 5.0.0 | Generates PDF driver delivery sheets |
| Requests | 2.34.2 | HTTP client used to call external REST APIs (Google Maps, postcodes.io) from the backend |
| Stripe (Python SDK) | 15.5.1 | Server-side integration with the Stripe Payments API |
| SQLite | — | Relational database (development and current deployment) |

**Testing:** pytest, pytest-django, and `factory_boy`/DRF's `APIClient`, covering both the algorithmic delivery-optimisation services and the API layer — 66 automated tests, with every external API call mocked so the suite never depends on network access.

## 2. Frontend (Web)

| Technology | Purpose |
|---|---|
| React 19 + TypeScript | Component-based UI, statically typed |
| Vite | Development server and production build tool |
| React Router | Client-side routing (storefront, staff dashboard, account pages) |
| Axios | HTTP client for calling the Django REST API |
| @stripe/stripe-js, @stripe/react-stripe-js | Embeds Stripe's hosted card-entry UI (Payment Element) for checkout |
| Google Fonts (Fraunces, Inter) | Display and body typefaces |

## 3. Mobile App (Driver App)

| Technology | Purpose |
|---|---|
| Expo / React Native | Cross-platform native app framework |
| expo-router | File-based navigation |
| expo-secure-store | Secure on-device storage of authentication tokens |
| Axios | HTTP client, shared API contract with the web app |

## 4. External APIs & Third-Party Services

The backend both **exposes** its own REST API to the three clients above and **consumes** three external REST APIs itself:

### Google Maps Platform
- **Geocoding API** — converts a customer's delivery address/postcode into latitude/longitude coordinates.
- **Distance Matrix API** — provides real road-network travel times between delivery stops, used to sequence multi-stop van routes.
- Requires an API key (`GOOGLE_MAPS_API_KEY`), stored in an untracked `.env` file, never committed to source control.

### Stripe API
- **Payment Intents API** — creates and confirms real (test-mode) card payments at checkout.
- **Webhooks API** — Stripe notifies the backend when a payment succeeds or fails; this is the authoritative source of truth for payment status (rather than trusting the browser alone).
- Requires a publishable key, secret key, and webhook signing secret (all in `.env`).

### postcodes.io
- A free, public, keyless UK postcode lookup API.
- Validates a customer's postcode live during checkout and resolves it to a town/city, without requiring any account or API key.

## 5. Development & Deployment Tooling

| Tool | Purpose |
|---|---|
| Git & GitHub | Version control and source hosting |
| PythonAnywhere | Production hosting — a single Django application serves both the REST API and the built React frontend |
| npm | Frontend/mobile package management and build scripts |

## 6. Architectural Note: Why These Choices

- **Django + DRF** was chosen for rapid, structured REST API development with a mature ORM, built-in admin interface, and strong authentication/permission tooling — well suited to a data-heavy system (orders, delivery routes, manufacturing lists) built under coursework time constraints.
- **React + TypeScript** gives compile-time type safety across a large number of forms and data views (orders, delivery planning, product catalog), reducing runtime bugs.
- **Expo/React Native** was chosen over a native iOS/Android toolchain so the driver app could be built and demonstrated (via Expo Go) without platform-specific build tooling.
- Every external API integration (Google Maps, Stripe, postcodes.io) is implemented behind a small **client interface** with a real implementation and a "fake" test implementation — a deliberate design choice so the automated test suite is fast, deterministic, and never dependent on network access or API quotas.
