Technologies Used and External Integrations

Bespoke Furniture Creations was built as a full-stack system made up of three separate applications that all talk to one shared backend: a web application for customers and staff, a mobile app for delivery drivers, and the backend itself, which exposes a REST API and handles all the business logic. Below is an explanation of the main technologies behind each part, along with the external services the system connects to.

Backend

The backend was built with Python and Django, using Django REST Framework on top of it to expose the application's data and logic as a REST API. Django was chosen because it comes with a lot of the groundwork already handled — user accounts, database migrations, an admin interface for quickly inspecting data, and a mature ecosystem of well-tested packages — which meant more time could go into the actual business logic of the furniture company rather than rebuilding basic infrastructure from scratch.

A few supporting libraries were added on top of Django to handle specific jobs. Authentication is handled with JSON Web Tokens through the djangorestframework-simplejwt package, which lets the web app, the mobile app, and any other client log a user in once and then include a token with every request afterwards, rather than having to send a username and password each time. Configuration values such as API keys and secret keys are kept out of the codebase entirely and loaded from a local environment file using django-environ, so nothing sensitive ever ends up committed to version control. Cross-origin requests between the frontend and the API during development are handled by django-cors-headers, and filtering on list endpoints (for example, letting staff filter orders by status) is handled by django-filter.

A handful of other packages handle more specialised jobs: Pillow processes uploaded images, such as photographs customers attach of a hand-drawn furniture design; ReportLab generates the PDF delivery sheets drivers use on their rounds; and the official Stripe Python library integrates with Stripe's payment API on the server side. The database itself is SQLite, which is simple to set up and entirely sufficient for a system of this size.

The backend's automated test suite is built with pytest, along with pytest-django to integrate it with Django's testing tools. There are 66 tests in total, covering both the API endpoints themselves and, more importantly, the algorithms behind delivery route planning — things like how orders get grouped by geography, how a van's available space is filled, and how a delivery route gets ordered. Every one of these tests runs without making a single real network request; anywhere the system talks to an external API, that call sits behind a small interface that can be swapped out for a fake version during testing, so the test suite stays fast and doesn't depend on the outside world being available.

Frontend (Web Application)

The customer-facing storefront and the staff dashboard are both part of one web application built with React and TypeScript. React was chosen for its component-based structure, which suits an application with a lot of reusable interface pieces — product cards, order tables, forms — and TypeScript was added on top to catch mistakes at compile time rather than after the fact, which matters in an application with this many different forms and data views. The project is built and served during development using Vite, and page navigation within the app (moving between the product catalogue, the checkout form, the dashboard, and so on) is handled by React Router without needing to reload the page each time.

Communication with the backend happens through Axios, and payment is handled through Stripe's own official React components, which embed Stripe's secure, pre-built card entry form directly into the checkout page rather than the application ever having to handle raw card details itself.

Mobile Application (Driver App)

The delivery driver's app is a separate mobile application built with Expo and React Native, which allowed one codebase to be built and tested on a phone without needing separate native development environments for iOS and Android. It uses Expo's built-in file-based navigation system to move between screens, and stores the driver's login session securely on the device using expo-secure-store. Like the web app, it communicates with the same backend API over HTTP using Axios, meaning both the website and the mobile app are really just two different front ends built on top of one shared source of truth.

External APIs and Third-Party Services

Three external services are integrated into the backend, each doing a job that would not have made sense to build from scratch.

The first is Google Maps Platform, specifically its Geocoding API and Distance Matrix API. The Geocoding API converts a customer's delivery address into map coordinates, and the Distance Matrix API provides realistic road travel times between delivery stops, which is what makes it possible to plan efficient multi-stop van routes rather than simply guessing at an order.

The second is Stripe, which handles real payment processing in test mode. When a customer pays by card, the backend creates a Payment Intent through Stripe's API, and the actual card details are collected and processed entirely by Stripe rather than passing through this system's own servers. Stripe also sends the backend a webhook notification once a payment has actually succeeded or failed, and this webhook is treated as the final word on whether an order has been paid for, rather than trusting a confirmation message sent from the customer's browser, which could in theory be interrupted or lost.

The third is postcodes.io, a free and publicly available UK postcode lookup service that does not require an account or an API key. It is used at checkout to confirm that a postcode a customer has typed in is a real one and to look up the town or city it belongs to, giving immediate feedback rather than only discovering an invalid address after an order has already been placed.

Deployment and Tooling

The project is version-controlled with Git and hosted on GitHub, and the live deployment runs on PythonAnywhere, where a single Django application serves both the REST API and the built React frontend from one domain. Frontend dependencies and build steps are managed with npm across both the web and mobile applications.

Why These Choices Were Made

Taken together, these choices were made to keep the system practical to build within a coursework timeframe while still reflecting how a real system like this would actually be built. Django and DRF made it possible to move quickly on the backend without sacrificing structure. React and TypeScript kept a fairly large frontend maintainable. Expo meant the mobile app didn't need a separate development setup to get working and demonstrable. And rather than trying to reinvent things that already exist and are done well — geocoding, route timing, payment processing, address validation — the system integrates with dedicated external services for each of those, in the same way a production application would.
