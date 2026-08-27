from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponse, JsonResponse
from django.urls import include, path, re_path
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from django.views.generic import TemplateView


@csrf_exempt
@require_GET
def api_index(request):
    return JsonResponse(
        {
            "service": "Bespoke Furniture Creations API",
            "available_versions": ["v1"],
            "v1": request.build_absolute_uri("/api/v1/"),
        }
    )


@csrf_exempt
@require_GET
def favicon(request):
    return HttpResponse(
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>"
        "<rect width='64' height='64' rx='12' fill='#1a1a2e'/><path "
        "d='M16 21h32v7H16zm0 13h32v7H16zm0 13h20v7H16z' fill='#e94560'/>"
        "</svg>",
        content_type="image/svg+xml",
    )


# Serves frontend/dist/index.html (added to TEMPLATES DIRS in settings) for
# both the site root and, via the catch-all below, every client-side React
# Router path — so a direct link or a page refresh on e.g. /dashboard/orders
# doesn't 404, it just hands the same page back and lets React Router take
# over in the browser.
frontend_index = TemplateView.as_view(template_name="index.html")

urlpatterns = [
    path("favicon.ico", favicon),
    path("api/", api_index),
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.products.urls")),
    path("api/v1/", include("apps.customers.urls")),
    path("api/v1/", include("apps.orders.urls")),
    path("api/v1/", include("apps.delivery.urls")),
    path("api/v1/", include("apps.manufacturing.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # In dev the frontend is served separately by the Vite dev server on
    # :5173, so the root here just stays the plain JSON API index.
    urlpatterns += [path("", api_index)]
else:
    # In production Django serves the built frontend directly: the root,
    # plus a catch-all for every path that isn't one of the API/admin/media
    # prefixes above. frontend/dist's own JS/CSS/image assets are served by
    # PythonAnywhere's static file mappings, not by Django — see DEPLOYMENT.md.
    urlpatterns += [
        path("", frontend_index, name="home"),
        re_path(r"^(?!api/|admin/|media/|favicon\.ico).*$", frontend_index),
    ]
