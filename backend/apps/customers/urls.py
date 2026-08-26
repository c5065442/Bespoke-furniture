from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CustomerViewSet, DeliveryAddressViewSet, PostcodeLookupView

router = DefaultRouter()
router.register("customers", CustomerViewSet, basename="customer")
router.register("delivery-addresses", DeliveryAddressViewSet, basename="deliveryaddress")

urlpatterns = router.urls + [
    path("postcode-lookup/", PostcodeLookupView.as_view(), name="postcode-lookup"),
]
