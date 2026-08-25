import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProduct } from "../../api/products";
import type { Product, ProductVariant } from "../../api/types";

export function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getProduct(id)
      .then((data) => {
        setProduct(data);
        setSelectedVariant(data.variants[0] ?? null);
      })
      .catch(() => setError("Could not load this product."));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!product) return <p>Loading…</p>;

  return (
    <div className="product-detail">
      <h2>{product.name}</h2>
      <p>{product.description}</p>

      {product.variants.length > 0 && (
        <label>
          Size / finish
          <select
            value={selectedVariant?.id ?? ""}
            onChange={(e) => setSelectedVariant(product.variants.find((v) => v.id === Number(e.target.value)) ?? null)}
          >
            {product.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.width_mm}×{variant.height_mm}×{variant.depth_mm}mm — {variant.finish_name || variant.colour} — £{variant.price}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="product-actions">
        <Link
          to="/order/new"
          state={selectedVariant ? { productVariant: selectedVariant, product } : { product }}
          className="button"
        >
          Order this
        </Link>
        <Link to="/order/new" state={{ bespoke: true, product }} className="button secondary">
          Request a fully bespoke version
        </Link>
      </div>
    </div>
  );
}
