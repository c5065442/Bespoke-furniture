from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import OrderViewSet, StripeWebhookView

router = DefaultRouter()
router.register("orders", OrderViewSet, basename="order")

urlpatterns = router.urls + [
    path("payments/webhook/", StripeWebhookView.as_view(), name="stripe-webhook"),
]
