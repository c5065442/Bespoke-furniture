import { useEffect, useState } from "react";
import { listMyOrders } from "../../api/orders";
import type { Order } from "../../api/types";
import { Modal } from "../../components/Modal";
import { StripePaymentForm } from "../../components/StripePaymentForm";

const PAYMENT_LABELS: Record<Order["payment_method"], string> = {
  CARD: "Card",
  CASH_ON_DELIVERY: "Cash on delivery",
  BANK_TRANSFER: "Bank transfer",
};

const PAYMENT_STATUS_LABELS: Record<Order["payment_status"], string> = {
  UNPAID: "Unpaid",
  PROCESSING: "Processing",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
};

export function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);

  function reload() {
    listMyOrders()
      .then(setOrders)
      .catch(() => setError("Could not load your orders."))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  if (loading) return <p>Loading your orders…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="my-orders-page">
      <h2>My Orders</h2>
      {orders.length === 0 && <p className="hint">You haven't placed any orders yet.</p>}
      {orders.map((order) => {
        const needsPayment = order.payment_method === "CARD" && order.payment_status !== "PAID";
        return (
          <div key={order.id} className="run-detail" style={{ marginBottom: "1rem" }}>
            <h3>{order.order_number}</h3>
            <p className="hint">
              Placed {new Date(order.placed_at).toLocaleDateString()} · Status: {order.status} · Paying by{" "}
              {PAYMENT_LABELS[order.payment_method]} · Payment: {PAYMENT_STATUS_LABELS[order.payment_status]}
            </p>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_label}</td>
                    <td>{item.quantity}</td>
                    <td>£{item.unit_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="price">Total: £{order.total_price}</p>
            {needsPayment && <button onClick={() => setPayingOrder(order)}>Pay now</button>}
          </div>
        );
      })}

      {payingOrder && (
        <Modal onClose={() => setPayingOrder(null)}>
          <div className="order-confirmation">
            <h2>Pay for {payingOrder.order_number}</h2>
            <StripePaymentForm
              orderId={payingOrder.id}
              onPaid={() => {
                setPayingOrder(null);
                reload();
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
