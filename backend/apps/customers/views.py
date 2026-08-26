from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsStaff

from .models import Customer, CustomerPreference, DeliveryAddress
from .postcode_lookup import PostcodeLookupError, lookup_postcode
from .serializers import CustomerPreferenceSerializer, CustomerSerializer, DeliveryAddressSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.select_related("user", "preference").prefetch_related("addresses")
    serializer_class = CustomerSerializer
    permission_classes = [IsStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["email"]
    search_fields = ["first_name", "last_name", "email", "phone"]

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        customer = getattr(request.user, "customer_profile", None)
        if customer is None:
            return Response({"detail": "No customer profile for this user."}, status=404)
        return Response(CustomerSerializer(customer).data)

    @action(detail=True, methods=["get"])
    def orders(self, request, pk=None):
        from apps.orders.serializers import OrderSerializer

        customer = self.get_object()
        serializer = OrderSerializer(customer.orders.all(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get", "post"])
    def addresses(self, request, pk=None):
        customer = self.get_object()
        if request.method == "POST":
            serializer = DeliveryAddressSerializer(data={**request.data, "customer": customer.id})
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=201)
        serializer = DeliveryAddressSerializer(customer.addresses.all(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get", "patch"], url_path="preferences")
    def preferences(self, request, pk=None):
        customer = self.get_object()
        preference, _ = CustomerPreference.objects.get_or_create(customer=customer)
        if request.method == "PATCH":
            serializer = CustomerPreferenceSerializer(preference, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(CustomerPreferenceSerializer(preference).data)


class DeliveryAddressViewSet(viewsets.ModelViewSet):
    queryset = DeliveryAddress.objects.select_related("customer")
    serializer_class = DeliveryAddressSerializer
    permission_classes = [IsStaff]


class PostcodeLookupView(APIView):
    """
    GET /api/v1/postcode-lookup/?postcode=S1+2AB

    Public (used during guest checkout) endpoint that validates a UK
    postcode and resolves it to a city/region/coordinates by consuming the
    postcodes.io REST API server-side. Demonstrates Django both serving a
    REST endpoint and, internally, consuming one.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        postcode = request.query_params.get("postcode", "").strip()
        if not postcode:
            return Response({"detail": "postcode query parameter is required."}, status=400)

        try:
            result = lookup_postcode(postcode)
        except PostcodeLookupError as exc:
            return Response({"detail": str(exc)}, status=502)

        if result is None:
            return Response({"valid": False, "postcode": postcode})
        return Response({"valid": True, **result})
