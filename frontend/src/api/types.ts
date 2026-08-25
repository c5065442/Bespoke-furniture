export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface ProductVariant {
  id: number;
  product: number;
  sku: string;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
  weight_kg: string;
  finish: number | null;
  finish_name: string;
  colour: string;
  price: string;
  is_active: boolean;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
}

export interface ProductListItem {
  id: number;
  category: number;
  category_name: string;
  name: string;
  slug: string;
  base_price: string;
  is_bespoke_only: boolean;
  primary_image: string | null;
}

export interface Product {
  id: number;
  category: number;
  category_name: string;
  name: string;
  slug: string;
  description: string;
  is_bespoke_only: boolean;
  base_price: string;
  is_active: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface CustomAttachment {
  id: number;
  order_item: number;
  file: string;
  original_filename: string;
  content_type: string;
  notes: string;
}

export interface OrderItem {
  id: number;
  order: number;
  product_variant: number | null;
  product_label: string;
  custom_description: string;
  quantity: number;
  unit_price: string;
  finish_name: string;
  colour: string;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
  weight_kg: string;
  requires_van: boolean;
  attachments: CustomAttachment[];
}

export interface Order {
  id: number;
  order_number: string;
  customer: number;
  customer_name: string;
  delivery_address: number;
  status: string;
  delivery_method: "VAN" | "PARCEL" | null;
  payment_method: "CARD" | "CASH_ON_DELIVERY" | "BANK_TRANSFER";
  payment_status: "UNPAID" | "PROCESSING" | "PAID" | "FAILED" | "REFUNDED";
  paid_at: string | null;
  is_bespoke: boolean;
  placed_at: string;
  total_price: string;
  notes: string;
  items: OrderItem[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
