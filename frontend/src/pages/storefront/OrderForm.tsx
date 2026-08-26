import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createOrder, type NewOrderItemInput, type PaymentMethod } from "../../api/orders";
import type { Order, Product, ProductVariant } from "../../api/types";
import { lookupPostcode } from "../../api/postcode";
import { useAuth } from "../../auth/AuthContext";
import { Modal } from "../../components/Modal";
import { StripePaymentForm } from "../../components/StripePaymentForm";

type PostcodeStatus = "idle" | "checking" | "valid" | "invalid" | "error";

interface LocationState {
  product?: Product;
  productVariant?: ProductVariant;
  bespoke?: boolean;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CARD", label: "Card" },
  { value: "CASH_ON_DELIVERY", label: "Cash on delivery" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
];

export function OrderForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = (location.state as LocationState) ?? {};
  const isBespoke = Boolean(state.bespoke) || !state.productVariant;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [postcodeStatus, setPostcodeStatus] = useState<PostcodeStatus>("idle");
  const [postcodeCity, setPostcodeCity] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [designNotes, setDesignNotes] = useState("");
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(500);
  const [depth, setDepth] = useState(500);
  const [weight, setWeight] = useState(10);
  const [price, setPrice] = useState(100);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName((prev) => prev || user.first_name);
      setLastName((prev) => prev || user.last_name);
      setEmail((prev) => prev || user.email);
    }
  }, [user]);

  async function handlePostcodeBlur() {
    if (!postcode.trim()) {
      setPostcodeStatus("idle");
      return;
    }
    setPostcodeStatus("checking");
    try {
      const result = await lookupPostcode(postcode);
      if (result.valid) {
        setPostcodeStatus("valid");
        setPostcodeCity(result.city ?? null);
        setCity((prev) => prev || result.city || "");
      } else {
        setPostcodeStatus("invalid");
        setPostcodeCity(null);
      }
    } catch {
      setPostcodeStatus("error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const item: NewOrderItemInput = state.productVariant
      ? {
          product_variant: state.productVariant.id,
          quantity,
          custom_description: designNotes,
          attachment,
        }
      : {
          custom_description: designNotes || `Bespoke ${state.product?.name ?? "item"}`,
          quantity,
          width_mm: width,
          height_mm: height,
          depth_mm: depth,
          weight_kg: weight,
          unit_price: price,
          attachment,
        };

    try {
      const order = await createOrder({
        customer_email: email,
        customer_first_name: firstName,
        customer_last_name: lastName,
        customer_phone: phone,
        delivery_address: { line1, city, postcode },
        payment_method: paymentMethod,
        items: [item],
      });
      setPlacedOrder(order);
    } catch {
      setError("Could not place your order. Please check the form and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form className="order-form" onSubmit={handleSubmit}>
        <h2>{state.product ? `Order: ${state.product.name}` : "Place an order"}</h2>

        <fieldset>
          <legend>Your details</legend>
          <label>
            First name
            <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </label>
          <label>
            Last name
            <input required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </label>
          <label>
            Email
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Delivery address</legend>
          <label>
            Address line 1
            <input required value={line1} onChange={(e) => setLine1(e.target.value)} />
          </label>
          <label>
            City
            <input required value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <label>
            Postcode
            <input
              required
              value={postcode}
              onChange={(e) => {
                setPostcode(e.target.value);
                setPostcodeStatus("idle");
              }}
              onBlur={handlePostcodeBlur}
            />
          </label>
          {postcodeStatus === "checking" && <p className="hint">Checking postcode…</p>}
          {postcodeStatus === "valid" && (
            <p className="hint">Recognised postcode{postcodeCity ? ` in ${postcodeCity}` : ""}.</p>
          )}
          {postcodeStatus === "invalid" && (
            <p className="error">That postcode wasn't recognised — please double-check it.</p>
          )}
        </fieldset>

        <fieldset>
          <legend>Order details</legend>
          <label>
            Quantity
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </label>

          {isBespoke && (
            <>
              <p className="hint">
                Fully bespoke item — tell us the approximate size and, if you like, attach a photo or scan of your
                hand-drawn design.
              </p>
              <label>
                Width (mm)
                <input type="number" min={1} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
              </label>
              <label>
                Height (mm)
                <input type="number" min={1} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
              </label>
              <label>
                Depth (mm)
                <input type="number" min={1} value={depth} onChange={(e) => setDepth(Number(e.target.value))} />
              </label>
              <label>
                Weight (kg, estimate)
                <input type="number" min={0.1} step={0.1} value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
              </label>
              <label>
                Estimated price (£)
                <input type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
              </label>
            </>
          )}

          <label>
            Notes / design description
            <textarea value={designNotes} onChange={(e) => setDesignNotes(e.target.value)} rows={3} />
          </label>

          <label>
            Attach a photo of your hand-drawn design (optional)
            <input type="file" accept="image/*,.pdf" onChange={(e) => setAttachment(e.target.files?.[0] ?? null)} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Payment method</legend>
          <label>
            How would you like to pay?
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </label>
          <p className="hint">
            {paymentMethod === "CARD"
              ? "Card payments are processed securely by Stripe (test mode) after you place the order."
              : "You'll arrange this payment directly with us — no online payment needed now."}
          </p>
        </fieldset>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Placing order…" : "Place order"}
        </button>
      </form>

      {placedOrder && (
        <Modal onClose={() => navigate("/products")}>
          <div className="order-confirmation">
            {placedOrder.payment_method === "CARD" && !paid ? (
              <>
                <h2>Almost there</h2>
                <p>
                  Your order <strong>{placedOrder.order_number}</strong> has been created. Complete payment below to
                  confirm it.
                </p>
                <StripePaymentForm orderId={placedOrder.id} onPaid={() => setPaid(true)} />
              </>
            ) : (
              <>
                <h2>Order placed!</h2>
                <p>
                  Your order <strong>{placedOrder.order_number}</strong> has been placed
                  {placedOrder.payment_method === "CARD"
                    ? ", and payment was received"
                    : `, paying by ${PAYMENT_METHODS.find((m) => m.value === placedOrder.payment_method)?.label.toLowerCase()}`}
                  . We'll be in touch to confirm details.
                </p>
                <button onClick={() => navigate("/products")}>Back to products</button>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
