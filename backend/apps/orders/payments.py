"""
Stripe (test mode) payment integration for Order.

Only CARD-method orders go through Stripe; CASH_ON_DELIVERY and
BANK_TRANSFER orders are settled manually by staff (payment_status is
updated directly, no PaymentIntent involved).

Flow:
  1. Order is created as usual (status=PENDING, payment_status=UNPAID).
  2. Customer hits "Pay now" -> POST /orders/{id}/create-payment-intent/
     -> create_payment_intent() creates (or reuses) a Stripe PaymentIntent
     for the order total and returns its client_secret to the frontend.
  3. Frontend confirms the payment with Stripe.js using that client_secret.
  4. Stripe calls our webhook (POST /payments/webhook/) with the result;
     handle_webhook_event() verifies the signature and updates the order.

Webhook-driven confirmation (rather than trusting the frontend's "it
worked") is deliberate: the frontend confirmation can be interrupted
(closed tab, lost connection) after Stripe has actually charged the card,
so the webhook is the only source of truth for whether payment succeeded.
"""

import stripe
from django.conf import settings
from django.utils import timezone

from .models import Order


class PaymentError(Exception):
    pass


def _configured_stripe():
    if not settings.STRIPE_SECRET_KEY:
        raise PaymentError(
            "STRIPE_SECRET_KEY is not set. Add your Stripe test secret key to backend/.env (see .env.example)."
        )
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def create_payment_intent(order: Order) -> dict:
    if order.payment_method != Order.PaymentMethod.CARD:
        raise PaymentError(f"Order {order.order_number} is not a card payment (method={order.payment_method}).")
    if order.payment_status == Order.PaymentStatus.PAID:
        raise PaymentError(f"Order {order.order_number} is already paid.")

    client = _configured_stripe()
    amount_pence = int(order.total_price * 100)

    if order.stripe_payment_intent_id:
        intent = client.PaymentIntent.retrieve(order.stripe_payment_intent_id)
        if intent.status in ("succeeded", "canceled"):
            intent = None
    else:
        intent = None

    if intent is None:
        intent = client.PaymentIntent.create(
            amount=amount_pence,
            currency="gbp",
            metadata={"order_number": order.order_number, "order_id": str(order.id)},
            automatic_payment_methods={"enabled": True},
        )
        order.stripe_payment_intent_id = intent.id
        order.payment_status = Order.PaymentStatus.PROCESSING
        order.save(update_fields=["stripe_payment_intent_id", "payment_status"])

    return {"client_secret": intent.client_secret, "publishable_key": settings.STRIPE_PUBLISHABLE_KEY}


def handle_webhook_event(payload: bytes, sig_header: str) -> None:
    client = _configured_stripe()
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise PaymentError(
            "STRIPE_WEBHOOK_SECRET is not set. Add it to backend/.env once you've created a webhook endpoint."
        )

    event = client.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    obj = event["data"]["object"]
    intent_id = obj.get("id")
    if not intent_id:
        return

    order = Order.objects.filter(stripe_payment_intent_id=intent_id).first()
    if not order:
        return

    if event["type"] == "payment_intent.succeeded":
        order.payment_status = Order.PaymentStatus.PAID
        order.paid_at = timezone.now()
        if order.status == Order.Status.PENDING:
            order.status = Order.Status.CONFIRMED
        order.save(update_fields=["payment_status", "paid_at", "status"])
    elif event["type"] == "payment_intent.payment_failed":
        order.payment_status = Order.PaymentStatus.FAILED
        order.save(update_fields=["payment_status"])
