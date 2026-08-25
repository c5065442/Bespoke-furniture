import client from "./client";
import type { Paginated, Product, ProductCategory, ProductListItem, ProductVariant } from "./types";

export async function listProducts(): Promise<ProductListItem[]> {
  const { data } = await client.get<Paginated<ProductListItem>>("/products/");
  return data.results;
}

export async function getProduct(id: number | string): Promise<Product> {
  const { data } = await client.get<Product>(`/products/${id}/`);
  return data;
}

export async function listCategories(): Promise<ProductCategory[]> {
  const { data } = await client.get<Paginated<ProductCategory>>("/categories/");
  return data.results;
}

export interface ProductInput {
  category: number;
  name: string;
  slug: string;
  description?: string;
  is_bespoke_only?: boolean;
  base_price: number;
  is_active?: boolean;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data } = await client.post<Product>("/products/", input);
  return data;
}

export async function updateProduct(id: number, input: Partial<ProductInput>): Promise<Product> {
  const { data } = await client.patch<Product>(`/products/${id}/`, input);
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await client.delete(`/products/${id}/`);
}

export interface ProductVariantInput {
  product: number;
  sku: string;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
  weight_kg: number;
  finish?: number | null;
  colour?: string;
  price: number;
  is_active?: boolean;
}

export async function createProductVariant(input: ProductVariantInput): Promise<ProductVariant> {
  const { data } = await client.post<ProductVariant>("/product-variants/", input);
  return data;
}

export async function deleteProductVariant(id: number): Promise<void> {
  await client.delete(`/product-variants/${id}/`);
}
