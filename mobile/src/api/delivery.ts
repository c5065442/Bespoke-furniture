import client, { API_BASE_URL } from "./client";

export interface CustomAttachment {
  id: number;
  file: string;
  original_filename: string;
  content_type: string;
}

export interface OrderItem {
  id: number;
  product_label: string;
  custom_description: string;
  quantity: number;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
  attachments: CustomAttachment[];
}

export interface OrderDetail {
  id: number;
  order_number: string;
  customer_name: string;
  notes: string;
  items: OrderItem[];
}

export interface RouteStop {
  id: number;
  delivery_run: number;
  order: number;
  order_detail: OrderDetail;
  sequence: number;
  load_position: number;
  status: "PENDING" | "ARRIVED" | "DELIVERED" | "FAILED";
  driver_notes: string;
}

export interface DeliveryRun {
  id: number;
  run_date: string;
  van_name: string;
  status: string;
  total_duration_min: number | null;
  stops: RouteStop[];
}

export function attachmentUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${origin}${path}`;
}

export async function getRunsToday(): Promise<DeliveryRun[]> {
  const { data } = await client.get<DeliveryRun[]>("/driver/runs/today/");
  return data;
}

export async function updateStopStatus(
  runId: number,
  stopId: number,
  status: RouteStop["status"],
  driverNotes?: string
): Promise<RouteStop> {
  const { data } = await client.patch<RouteStop>(`/delivery-runs/${runId}/stops/${stopId}/`, {
    status,
    ...(driverNotes !== undefined ? { driver_notes: driverNotes } : {}),
  });
  return data;
}
