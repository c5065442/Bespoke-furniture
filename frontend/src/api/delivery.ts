import client from "./client";
import type { Order, Paginated } from "./types";

export interface Van {
  id: number;
  registration: string;
  name: string;
  max_weight_kg: string;
  load_length_mm: number;
  load_width_mm: number;
  load_height_mm: number;
  load_volume_m3: number;
  is_active: boolean;
  home_depot: number;
}

export interface RouteStop {
  id: number;
  delivery_run: number;
  order: number;
  order_detail: Order;
  sequence: number;
  load_position: number;
  status: "PENDING" | "ARRIVED" | "DELIVERED" | "FAILED";
  eta: string | null;
  delivered_at: string | null;
  driver_notes: string;
}

export interface DeliveryRun {
  id: number;
  run_date: string;
  van: number;
  van_name: string;
  driver: number | null;
  driver_name: string | null;
  status: "DRAFT" | "PLANNED" | "LOCKED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  total_distance_km: number | null;
  total_duration_min: number | null;
  locked_at: string | null;
  stops: RouteStop[];
}

export async function listVans(): Promise<Van[]> {
  const { data } = await client.get<Paginated<Van>>("/vans/");
  return data.results;
}

export async function listDeliveryRuns(params?: { run_date?: string; status?: string }): Promise<DeliveryRun[]> {
  const { data } = await client.get<Paginated<DeliveryRun>>("/delivery-runs/", { params });
  return data.results;
}

export async function getDeliveryRun(id: number): Promise<DeliveryRun> {
  const { data } = await client.get<DeliveryRun>(`/delivery-runs/${id}/`);
  return data;
}

export async function planDeliveryRuns(runDate: string, vanIds?: number[]): Promise<DeliveryRun[]> {
  const { data } = await client.post<DeliveryRun[]>("/delivery-runs/plan/", {
    run_date: runDate,
    van_ids: vanIds,
  });
  return data;
}

export async function reorderStops(
  runId: number,
  order: { stop_id: number; sequence: number }[]
): Promise<DeliveryRun> {
  const { data } = await client.patch<DeliveryRun>(`/delivery-runs/${runId}/stops/reorder/`, order);
  return data;
}

export async function lockDeliveryRun(runId: number): Promise<DeliveryRun> {
  const { data } = await client.post<DeliveryRun>(`/delivery-runs/${runId}/lock/`);
  return data;
}

export async function updateOrderStatus(orderId: number, status: string): Promise<Order> {
  const { data } = await client.patch<Order>(`/orders/${orderId}/status/`, { status });
  return data;
}

export async function listAllOrders(params?: { status?: string; delivery_method?: string }): Promise<Order[]> {
  const { data } = await client.get<Paginated<Order>>("/orders/", { params });
  return data.results;
}

export async function markOrderPaid(orderId: number): Promise<Order> {
  const { data } = await client.post<Order>(`/orders/${orderId}/mark-paid/`);
  return data;
}

export interface RegionSuggestion {
  region: string;
  pending_order_count: number;
  pending_volume_m3: number;
  pending_weight_kg: number;
  oldest_pending_order_days: number;
  suggested_action: "SCHEDULE_NOW" | "WAIT";
  suggested_date: string | null;
  rationale: string;
}

export async function getDeliveryRunSuggestions(): Promise<RegionSuggestion[]> {
  const { data } = await client.get<RegionSuggestion[]>("/delivery-runs/suggestions/");
  return data;
}

export async function downloadRunExport(runId: number, format: "csv" | "pdf"): Promise<void> {
  const response = await client.get(`/delivery-runs/${runId}/export/${format}/`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `delivery_run_${runId}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
