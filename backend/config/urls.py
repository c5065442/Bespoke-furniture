from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponse, JsonResponse
from django.urls import include, path
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET


@csrf_exempt
@require_GET
def api_root(request):
    return JsonResponse(
        {
            "service": "Bespoke Furniture Creations API",
            "status": "ok",
            "admin": request.build_absolute_uri("/admin/"),
            "api_v1": request.build_absolute_uri("/api/v1/"),
        }
    )


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


urlpatterns = [
    path("", api_root),
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
