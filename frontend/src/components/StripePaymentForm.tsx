import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import { createPaymentIntent } from "../api/orders";

interface StripePaymentFormProps {
  orderId: number;
  onPaid: () => void;
}

const stripePromiseCache = new Map<string, Promise<Stripe | null>>();

function getStripePromise(publishableKey: string) {
  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, loadStripe(publishableKey));
  }
  return stripePromiseCache.get(publishableKey)!;
}

function CheckoutForm({ onPaid }: { onPaid: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please check your card details and try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      onPaid();
    } else {
      setError("Payment was not completed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      <PaymentElement />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={!stripe || submitting}>
        {submitting ? "Processing…" : "Pay now"}
      </button>
      <p className="hint">Test mode — use card 4242 4242 4242 4242, any future date, any CVC.</p>
    </form>
  );
}

export function StripePaymentForm({ orderId, onPaid }: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createPaymentIntent(orderId)
      .then((data) => {
        setClientSecret(data.client_secret);
        setPublishableKey(data.publishable_key);
      })
      .catch(() =>
        setError(
          "Could not start payment. The store may not have Stripe configured yet — contact us to arrange payment."
        )
      );
  }, [orderId]);

  if (error) return <p className="error">{error}</p>;
  if (!clientSecret || !publishableKey) return <p className="hint">Loading payment form…</p>;

  return (
    <Elements stripe={getStripePromise(publishableKey)} options={{ clientSecret }}>
      <CheckoutForm onPaid={onPaid} />
    </Elements>
  );
}
