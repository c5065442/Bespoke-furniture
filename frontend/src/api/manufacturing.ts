import client from "./client";

export interface ManufacturingListItem {
  id: number;
  manufacturing_list: number;
  order_item: number;
  product_label: string;
  quantity: number;
  finish_name: string;
  colour: string;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
  status: "PENDING" | "CUTTING" | "ASSEMBLY" | "FINISHING" | "READY";
}

export interface ManufacturingList {
  id: number;
  delivery_run: number;
  run_date: string;
  van_name: string;
  source_type: string;
  status: string;
  items: ManufacturingListItem[];
}

export async function getManufacturingListForRun(runId: number): Promise<ManufacturingList | null> {
  const { data } = await client.get<{ results: ManufacturingList[] }>("/manufacturing-lists/", {
    params: { delivery_run: runId },
  });
  return data.results?.[0] ?? null;
}
