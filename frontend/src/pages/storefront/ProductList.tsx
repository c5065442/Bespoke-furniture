import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listProducts } from "../../api/products";
import type { ProductListItem } from "../../api/types";

export function ProductList() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch(() => setError("Could not load products. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-hero">
        <h1>Bespoke furniture, built around you</h1>
        <p>Browse our range, or tell us your own design — every piece is made to your size, finish, and colour.</p>
      </div>

      {loading && <p className="hint">Loading products…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="product-grid">
          {products.length === 0 && <p className="hint">No products yet.</p>}
          {products.map((product) => (
            <Link key={product.id} to={`/products/${product.id}`} className="product-card">
              <div className="product-card-image">
                {product.primary_image ? (
                  <img src={product.primary_image} alt={product.name} />
                ) : (
                  <div className="product-card-placeholder" aria-hidden="true">
                    {product.name.charAt(0)}
                  </div>
                )}
                {product.is_bespoke_only && <span className="badge badge-overlay">Bespoke only</span>}
              </div>
              <div className="product-card-body">
                <p className="product-card-category">{product.category_name}</p>
                <h3>{product.name}</h3>
                <p className="price">from £{product.base_price}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
