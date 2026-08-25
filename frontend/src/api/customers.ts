import client from "./client";
import type { Order, Paginated } from "./types";

export interface DeliveryAddress {
  id: number;
  customer: number;
  label: string;
  line1: string;
  line2: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
  latitude: string | null;
  longitude: string | null;
  is_default: boolean;
}

export interface CustomerPreference {
  id: number;
  customer: number;
  preferred_finish: number | null;
  preferred_colour: string;
  delivery_notes: string;
}

export interface Customer {
  id: number;
  user: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  addresses: DeliveryAddress[];
  preference: CustomerPreference | null;
}

export async function listCustomers(search?: string): Promise<Customer[]> {
  const { data } = await client.get<Paginated<Customer>>("/customers/", {
    params: search ? { search } : undefined,
  });
  return data.results;
}

export async function getCustomerOrders(customerId: number): Promise<Order[]> {
  const { data } = await client.get<Order[]>(`/customers/${customerId}/orders/`);
  return data;
}
