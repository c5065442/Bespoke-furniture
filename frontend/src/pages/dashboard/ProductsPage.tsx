import { useEffect, useState } from "react";
import {
  createProduct,
  createProductVariant,
  deleteProduct,
  deleteProductVariant,
  getProduct,
  listCategories,
  listProducts,
  updateProduct,
} from "../../api/products";
import type { Product, ProductCategory, ProductListItem } from "../../api/types";

const emptyForm = { category: "", name: "", slug: "", description: "", base_price: "", is_bespoke_only: false };

export function ProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reloadProducts() {
    listProducts().then(setProducts).catch(() => setError("Could not load products."));
  }

  useEffect(() => {
    reloadProducts();
    listCategories().then(setCategories).catch(() => setError("Could not load categories."));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      category: Number(form.category),
      name: form.name,
      slug: form.slug,
      description: form.description,
      base_price: Number(form.base_price),
      is_bespoke_only: form.is_bespoke_only,
    };
    try {
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      reloadProducts();
    } catch {
      setError("Could not save this product. Check all fields are filled in.");
    }
  }

  function startEdit(product: ProductListItem) {
    setEditingId(product.id);
    setForm({
      category: String(product.category),
      name: product.name,
      slug: product.slug,
      description: "",
      base_price: product.base_price,
      is_bespoke_only: product.is_bespoke_only,
    });
  }

  async function handleDelete(id: number) {
    try {
      await deleteProduct(id);
      reloadProducts();
      if (selected?.id === id) setSelected(null);
    } catch {
      setError("Could not delete this product.");
    }
  }

  async function viewVariants(id: number) {
    setSelected(await getProduct(id));
  }

  async function addVariant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const data = new FormData(e.currentTarget);
    try {
      await createProductVariant({
        product: selected.id,
        sku: String(data.get("sku")),
        width_mm: Number(data.get("width_mm")),
        height_mm: Number(data.get("height_mm")),
        depth_mm: Number(data.get("depth_mm")),
        weight_kg: Number(data.get("weight_kg")),
        colour: String(data.get("colour") || ""),
        price: Number(data.get("price")),
      });
      setSelected(await getProduct(selected.id));
      e.currentTarget.reset();
    } catch {
      setError("Could not add this variant. SKU must be unique.");
    }
  }

  async function removeVariant(variantId: number) {
    if (!selected) return;
    await deleteProductVariant(variantId);
    setSelected(await getProduct(selected.id));
  }

  return (
    <div className="products-page">
      <h2>Products</h2>
      {error && <p className="error">{error}</p>}

      <form className="order-form" onSubmit={handleSubmit}>
        <fieldset>
          <legend>{editingId ? "Edit product" : "New product"}</legend>
          <label>
            Name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>
            Slug
            <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </label>
          <label>
            Category
            <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Base price (£)
            <input
              required
              type="number"
              step="0.01"
              value={form.base_price}
              onChange={(e) => setForm({ ...form, base_price: e.target.value })}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.is_bespoke_only}
              onChange={(e) => setForm({ ...form, is_bespoke_only: e.target.checked })}
              style={{ width: "auto", display: "inline-block", marginRight: "0.5rem" }}
            />
            Bespoke only (no catalog SKUs)
          </label>
        </fieldset>
        <button type="submit">{editingId ? "Save changes" : "Create product"}</button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Base price</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.category_name}</td>
              <td>£{product.base_price}</td>
              <td>
                <button onClick={() => viewVariants(product.id)}>Variants</button>
                <button onClick={() => startEdit(product)}>Edit</button>
                <button onClick={() => handleDelete(product.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <div className="run-detail">
          <h3>Variants (SKUs) for {selected.name}</h3>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Dimensions (mm)</th>
                <th>Colour</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {selected.variants.map((variant) => (
                <tr key={variant.id}>
                  <td>{variant.sku}</td>
                  <td>
                    {variant.width_mm}×{variant.height_mm}×{variant.depth_mm}
                  </td>
                  <td>{variant.colour}</td>
                  <td>£{variant.price}</td>
                  <td>
                    <button onClick={() => removeVariant(variant.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <form className="order-form" onSubmit={addVariant}>
            <fieldset>
              <legend>Add variant</legend>
              <label>
                SKU
                <input name="sku" required />
              </label>
              <label>
                Width (mm)
                <input name="width_mm" type="number" required />
              </label>
              <label>
                Height (mm)
                <input name="height_mm" type="number" required />
              </label>
              <label>
                Depth (mm)
                <input name="depth_mm" type="number" required />
              </label>
              <label>
                Weight (kg)
                <input name="weight_kg" type="number" step="0.1" required />
              </label>
              <label>
                Colour
                <input name="colour" />
              </label>
              <label>
                Price (£)
                <input name="price" type="number" step="0.01" required />
              </label>
            </fieldset>
            <button type="submit">Add variant</button>
          </form>
        </div>
      )}
    </div>
  );
}
