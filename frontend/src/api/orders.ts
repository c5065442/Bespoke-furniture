import client from "./client";
import type { Order, Paginated } from "./types";

export interface NewOrderItemInput {
  product_variant?: number;
  custom_description?: string;
  quantity: number;
  finish_name?: string;
  colour?: string;
  width_mm?: number;
  height_mm?: number;
  depth_mm?: number;
  weight_kg?: number;
  unit_price?: number;
  attachment?: File | null;
}

export type PaymentMethod = "CARD" | "CASH_ON_DELIVERY" | "BANK_TRANSFER";

export interface NewOrderInput {
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone?: string;
  delivery_address: {
    label?: string;
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
    country?: string;
  };
  notes?: string;
  payment_method: PaymentMethod;
  items: NewOrderItemInput[];
}

export async function createOrder(input: NewOrderInput): Promise<Order> {
  const form = new FormData();
  form.append("customer_email", input.customer_email);
  form.append("customer_first_name", input.customer_first_name);
  form.append("customer_last_name", input.customer_last_name);
  form.append("customer_phone", input.customer_phone ?? "");
  form.append("notes", input.notes ?? "");
  form.append("payment_method", input.payment_method);
  form.append("delivery_address", JSON.stringify(input.delivery_address));

  const itemsPayload = input.items.map(({ attachment, ...rest }) => rest);
  form.append("items", JSON.stringify(itemsPayload));

  input.items.forEach((item, index) => {
    if (item.attachment) {
      form.append(`attachment_${index}`, item.attachment);
    }
  });

  const { data } = await client.post<Order>("/orders/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listMyOrders(): Promise<Order[]> {
  const { data } = await client.get<Paginated<Order>>("/orders/");
  return data.results;
}

export interface PaymentIntentResponse {
  client_secret: string;
  publishable_key: string;
}

export async function createPaymentIntent(orderId: number): Promise<PaymentIntentResponse> {
  const { data } = await client.post<PaymentIntentResponse>(`/orders/${orderId}/create-payment-intent/`);
  return data;
}
