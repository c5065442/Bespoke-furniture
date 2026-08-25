from unittest.mock import MagicMock, patch

import pytest

from apps.customers.models import Customer, DeliveryAddress
from apps.orders.models import Order, OrderItem
from apps.orders.payments import PaymentError, create_payment_intent, handle_webhook_event

pytestmark = pytest.mark.django_db


@pytest.fixture
def order():
    customer = Customer.objects.create(first_name="Jane", last_name="Doe", email="jane-pay@example.com")
    address = DeliveryAddress.objects.create(customer=customer, line1="1 St", city="Sheffield", postcode="S1 2AB")
    order = Order.objects.create(
        delivery_address=address, customer=customer, total_price=150, payment_method=Order.PaymentMethod.CARD
    )
    OrderItem.objects.create(order=order, quantity=1, unit_price=150, width_mm=500, height_mm=500, depth_mm=500, weight_kg=10)
    return order


class TestCreatePaymentIntent:
    def test_requires_stripe_secret_key(self, order, settings):
        settings.STRIPE_SECRET_KEY = ""
        with pytest.raises(PaymentError):
            create_payment_intent(order)

    def test_rejects_non_card_orders(self, order, settings):
        settings.STRIPE_SECRET_KEY = "sk_test_fake"
        order.payment_method = Order.PaymentMethod.CASH_ON_DELIVERY
        order.save()
        with pytest.raises(PaymentError):
            create_payment_intent(order)

    def test_rejects_already_paid_orders(self, order, settings):
        settings.STRIPE_SECRET_KEY = "sk_test_fake"
        order.payment_status = Order.PaymentStatus.PAID
        order.save()
        with pytest.raises(PaymentError):
            create_payment_intent(order)

    @patch("stripe.PaymentIntent.create")
    def test_creates_intent_for_order_total_in_pence(self, mock_create, order, settings):
        settings.STRIPE_SECRET_KEY = "sk_test_fake"
        settings.STRIPE_PUBLISHABLE_KEY = "pk_test_fake"
        mock_create.return_value = MagicMock(id="pi_123", client_secret="secret_123")

        result = create_payment_intent(order)

        mock_create.assert_called_once()
        assert mock_create.call_args.kwargs["amount"] == 15000  # £150.00 -> pence
        assert mock_create.call_args.kwargs["currency"] == "gbp"
        assert result == {"client_secret": "secret_123", "publishable_key": "pk_test_fake"}

        order.refresh_from_db()
        assert order.stripe_payment_intent_id == "pi_123"
        assert order.payment_status == Order.PaymentStatus.PROCESSING

    @patch("stripe.PaymentIntent.retrieve")
    @patch("stripe.PaymentIntent.create")
    def test_reuses_existing_incomplete_intent(self, mock_create, mock_retrieve, order, settings):
        settings.STRIPE_SECRET_KEY = "sk_test_fake"
        order.stripe_payment_intent_id = "pi_existing"
        order.save()
        mock_retrieve.return_value = MagicMock(status="requires_payment_method", client_secret="secret_existing")

        result = create_payment_intent(order)

        mock_retrieve.assert_called_once_with("pi_existing")
        mock_create.assert_not_called()
        assert result["client_secret"] == "secret_existing"

    @patch("stripe.PaymentIntent.create")
    @patch("stripe.PaymentIntent.retrieve")
    def test_creates_new_intent_if_existing_one_already_succeeded(self, mock_retrieve, mock_create, order, settings):
        settings.STRIPE_SECRET_KEY = "sk_test_fake"
        order.stripe_payment_intent_id = "pi_old"
        order.save()
        mock_retrieve.return_value = MagicMock(status="succeeded")
        mock_create.return_value = MagicMock(id="pi_new", client_secret="secret_new")

        result = create_payment_intent(order)

        mock_create.assert_called_once()
        assert result["client_secret"] == "secret_new"


class TestHandleWebhookEvent:
    def test_requires_webhook_secret(self, order, settings):
        settings.STRIPE_SECRET_KEY = "sk_test_fake"
        settings.STRIPE_WEBHOOK_SECRET = ""
        with pytest.raises(PaymentError):
            handle_webhook_event(b"{}", "sig")

    @patch("stripe.Webhook.construct_event")
    def test_payment_succeeded_marks_order_paid_and_confirmed(self, mock_construct, order, settings):
        settings.STRIPE_SECRET_KEY = "sk_test_fake"
        settings.STRIPE_WEBHOOK_SECRET = "whsec_fake"
        order.stripe_payment_intent_id = "pi_123"
        order.status = Order.Status.PENDING
        order.save()
        mock_construct.return_value = {"type": "payment_intent.succeeded", "data": {"object": {"id": "pi_123"}}}

        handle_webhook_event(b"{}", "sig")

        order.refresh_from_db()
        assert order.payment_status == Order.PaymentStatus.PAID
        assert order.status == Order.Status.CONFIRMED
        assert order.paid_at is not None

    @patch("stripe.Webhook.construct_event")
    def test_payment_failed_marks_order_failed(self, mock_construct, order, settings):
        settings.STRIPE_SECRET_KEY = "sk_test_fake"
        settings.STRIPE_WEBHOOK_SECRET = "whsec_fake"
        order.stripe_payment_intent_id = "pi_123"
        order.save()
        mock_construct.return_value = {"type": "payment_intent.payment_failed", "data": {"object": {"id": "pi_123"}}}

        handle_webhook_event(b"{}", "sig")

        order.refresh_from_db()
        assert order.payment_status == Order.PaymentStatus.FAILED

    @patch("stripe.Webhook.construct_event")
    def test_unknown_payment_intent_id_is_ignored_not_errored(self, mock_construct, settings):
        settings.STRIPE_SECRET_KEY = "sk_test_fake"
        settings.STRIPE_WEBHOOK_SECRET = "whsec_fake"
        mock_construct.return_value = {"type": "payment_intent.succeeded", "data": {"object": {"id": "pi_nonexistent"}}}

        handle_webhook_event(b"{}", "sig")  # should not raise
