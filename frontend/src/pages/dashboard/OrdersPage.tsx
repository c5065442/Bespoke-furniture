import { useEffect, useState } from "react";
import { listAllOrders, markOrderPaid, updateOrderStatus } from "../../api/delivery";
import type { Order } from "../../api/types";

const STATUSES = [
  "PENDING", "CONFIRMED", "IN_PRODUCTION", "READY_FOR_DELIVERY",
  "SCHEDULED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED",
];

const PAYMENT_STATUS_LABELS: Record<Order["payment_status"], string> = {
  UNPAID: "Unpaid",
  PROCESSING: "Processing",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  function reload() {
    listAllOrders(statusFilter ? { status: statusFilter } : undefined)
      .then(setOrders)
      .catch(() => setError("Could not load orders."));
  }

  useEffect(reload, [statusFilter]);

  async function handleStatusChange(order: Order, status: string) {
    try {
      const updated = await updateOrderStatus(order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch {
      setError(`Could not update order ${order.order_number}.`);
    }
  }

  async function handleMarkPaid(order: Order) {
    try {
      const updated = await markOrderPaid(order.id);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch {
      setError(`Could not mark order ${order.order_number} as paid.`);
    }
  }

  return (
    <div>
      <h2>Orders</h2>
      <label>
        Filter by status
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Delivery</th>
            <th>Payment</th>
            <th>Bespoke</th>
            <th>Total</th>
            <th>Placed</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.order_number}</td>
              <td>{order.customer_name}</td>
              <td>
                <select value={order.status} onChange={(e) => handleStatusChange(order, e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td>{order.delivery_method ?? "—"}</td>
              <td>
                {PAYMENT_STATUS_LABELS[order.payment_status]}
                {order.payment_method !== "CARD" && order.payment_status !== "PAID" && (
                  <button onClick={() => handleMarkPaid(order)} style={{ marginLeft: "0.5rem" }}>
                    Mark paid
                  </button>
                )}
              </td>
              <td>{order.is_bespoke ? "Yes" : "No"}</td>
              <td>£{order.total_price}</td>
              <td>{new Date(order.placed_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
