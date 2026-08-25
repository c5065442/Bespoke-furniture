import { useEffect, useState } from "react";
import { getCustomerOrders, listCustomers, type Customer } from "../../api/customers";
import type { Order } from "../../api/types";

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCustomers(search || undefined)
      .then(setCustomers)
      .catch(() => setError("Could not load customers."));
  }, [search]);

  async function selectCustomer(customer: Customer) {
    setSelected(customer);
    try {
      setOrders(await getCustomerOrders(customer.id));
    } catch {
      setError("Could not load this customer's order history.");
    }
  }

  return (
    <div className="customers-page">
      <h2>Customers</h2>
      <input
        placeholder="Search by name, email, or phone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {error && <p className="error">{error}</p>}

      <div className="planning-layout">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} onClick={() => selectCustomer(customer)} className="clickable-row">
                <td>
                  {customer.first_name} {customer.last_name}
                </td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {selected && (
          <div className="run-detail">
            <h3>
              {selected.first_name} {selected.last_name}
            </h3>
            <p>{selected.email} · {selected.phone}</p>

            {selected.preference && (
              <p className="hint">
                Preferences: {selected.preference.preferred_colour || "no colour set"},{" "}
                {selected.preference.delivery_notes || "no delivery notes"}
              </p>
            )}

            <h4>Addresses</h4>
            <ul>
              {selected.addresses.map((addr) => (
                <li key={addr.id}>
                  {addr.line1}, {addr.city}, {addr.postcode}
                </li>
              ))}
            </ul>

            <h4>Order history</h4>
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.order_number}</td>
                    <td>{order.status}</td>
                    <td>£{order.total_price}</td>
                    <td>{new Date(order.placed_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
