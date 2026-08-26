import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listProducts } from "../../api/products";
import type { ProductListItem } from "../../api/types";

const furnitureImages: Record<string, string> = {
  "live edge": "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=1200&q=85",
  "coffee table": "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=1200&q=85",
  "solid wood top": "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=85",
  "standing desk": "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=85",
  "outdoor dining set": "/images/outdoor-dining-set.jpg",
  "dining set": "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=85",
  "entryway console": "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=85",
  "toy storage": "/images/kids-toy-storage.jpg",
  "shoe storage bench": "/images/shoe-storage-bench.jpg",
  "kids bunk bed": "/images/kids-bunk-bed.jpg",
  "bunk bed": "https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=1200&q=85",
  kids: "https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=1200&q=85",
  "oak dresser": "/images/oak-dresser.jpg",
  "shaker double wardrobe": "/images/shaker-double-wardrobe.jpg",
  "pine shelf": "https://images.unsplash.com/photo-1597072689227-8882273e8f6a?auto=format&fit=crop&w=1200&q=85",
  "bookshelf room divider": "/images/book-shelf-room-divider.jpg",
  farmhouse: "/images/farmhouse-dinig%20table.jpg",
  dining: "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=1200&q=85",
  shelf: "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=1200&q=85",
  dresser: "https://images.unsplash.com/photo-1558997519-83ea9252cfab?auto=format&fit=crop&w=1200&q=85",
  table: "https://images.unsplash.com/photo-1616486338812-3dadaa1817b8?auto=format&fit=crop&w=1200&q=85",
  chair: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85",
  wardrobe: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=85",
  bed: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85",
  bookcase: "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=1200&q=85",
  sideboard: "/images/mid-century-sideboard.jpg",
  coffee: "https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=1200&q=85",
  desk: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85",
  bench: "/images/outdoor-garden%20bench.jpg",
  console: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=85",
  tv: "/images/low-tv-mediaunit.jpeg",
};

function getFurnitureImage(product: ProductListItem) {
  const searchableName = product.name.toLowerCase();
  const matchedType = Object.keys(furnitureImages).find((type) => searchableName.includes(type));
  return matchedType ? furnitureImages[matchedType] : furnitureImages.table;
}

export function ProductList() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All pieces");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch(() => setError("Could not load products. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ["All pieces", ...Array.from(new Set(products.map((product) => product.category_name).filter(Boolean)))],
    [products],
  );
  const visibleProducts = selectedCategory === "All pieces"
    ? products
    : products.filter((product) => product.category_name === selectedCategory);

  return (
    <div>
      <div className="page-hero">
        <div className="page-hero-copy">
          <p className="eyebrow">Made slowly. Made for you.</p>
          <h1>Bespoke furniture, built around you</h1>
          <p>Thoughtful pieces for considered rooms. Choose a starting point from our collection, then make it yours.</p>
          <div className="page-hero-actions">
            <a className="button" href="#collection">Explore the collection <span aria-hidden="true">↓</span></a>
            <Link className="text-link" to="/order/new">Start a custom piece <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <div className="page-hero-mark" aria-hidden="true">
          <span>01</span>
          <strong>crafted<br />for living</strong>
        </div>
      </div>

      <div className="value-strip" aria-label="Our approach">
        <span><strong>01</strong> Made to order</span>
        <span><strong>02</strong> Honest materials</span>
        <span><strong>03</strong> Built to last</span>
      </div>

      {loading && <p className="hint">Loading products…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <section id="collection" className="collection-section">
          <div className="collection-heading">
            <div>
              <p className="eyebrow">The collection</p>
              <h2>Pieces with presence</h2>
            </div>
            <span className="collection-count">{visibleProducts.length} {visibleProducts.length === 1 ? "piece" : "pieces"}</span>
          </div>
          <div className="category-tabs" role="tablist" aria-label="Filter collection">
            {categories.map((category) => (
              <button
                key={category}
                className={selectedCategory === category ? "active" : "quiet"}
                onClick={() => setSelectedCategory(category)}
                role="tab"
                aria-selected={selectedCategory === category}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="product-grid">
          {visibleProducts.length === 0 && <p className="hint">No products in this category yet.</p>}
          {visibleProducts.map((product, index) => (
            <Link key={product.id} to={`/products/${product.id}`} className="product-card">
              <div className="product-card-image">
                <img src={product.primary_image ?? getFurnitureImage(product)} alt={product.name} />
                {product.is_bespoke_only && <span className="badge badge-overlay">Bespoke only</span>}
                <span className="product-card-index">0{index + 1}</span>
              </div>
              <div className="product-card-body">
                <p className="product-card-category">{product.category_name}</p>
                <h3>{product.name}</h3>
                <div className="product-card-footer">
                  <p className="price">from £{product.base_price}</p>
                  <span className="card-arrow" aria-hidden="true">↗</span>
                </div>
              </div>
            </Link>
          ))}
          </div>
        </section>
      )}
    </div>
  );
}
