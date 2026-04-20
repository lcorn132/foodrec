import { useEffect, useMemo, useState } from "react";

import { getCategories, getDishes } from "../../api/dishesApi.js";
import DishCard from "../../components/DishCard.jsx";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import PageHero from "../../components/PageHero.jsx";
import Loading from "../../components/Loading.jsx";

// [V6] Đã Việt hóa và thêm mục "Tất cả"
const PRICE_RANGES = [
  { key: "", label: "Tất cả mức giá", min: undefined, max: undefined },
  { key: "budget", label: "Bình dân (Dưới 50k)", min: 0, max: 50000 },
  { key: "affordable", label: "Vừa phải (50k - 100k)", min: 50000, max: 100000 },
  { key: "moderate", label: "Trung bình (100k - 200k)", min: 100000, max: 200000 },
  { key: "premium", label: "Cao cấp (Trên 200k)", min: 200000, max: undefined },
];

function normalizeCategories(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.categories)) return data.categories;
  return [];
}

function normalizeDishes(data) {
  if (Array.isArray(data)) return { items: data, hasMore: false };
  const items = Array.isArray(data?.items) ? data.items : [];
  const hasMore = Boolean(data?.hasMore ?? data?.has_more ?? false);
  return { items, hasMore };
}

export default function MenuPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priceRange, setPriceRange] = useState(""); 

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);

  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const range = useMemo(
    () => PRICE_RANGES.find((r) => r.key === priceRange) ?? null,
    [priceRange],
  );

  useEffect(() => {
    let alive = true;
    async function run() {
      setCatLoading(true);
      try {
        const data = await getCategories();
        if (!alive) return;
        setCategories(normalizeCategories(data));
      } catch {
        if (!alive) return;
        setCategories([]);
      } finally {
        if (alive) setCatLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, []);

  useEffect(() => { setPage(1); }, [search, category, priceRange]);

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const params = {
          q: search || undefined,
          category: category || undefined,

          min_price: range?.min !== undefined ? range.min : undefined,
          max_price: range?.max !== undefined ? range.max : undefined,

          minPrice: range?.min !== undefined ? range.min : undefined,
          maxPrice: range?.max !== undefined ? range.max : undefined,
        
          page,
          limit: 12,
        };
        const data = await getDishes(params);
        if (!alive) return;
        const normalized = normalizeDishes(data);
        setHasMore(normalized.hasMore || normalized.items.length === 12);
        setDishes((prev) => (page === 1 ? normalized.items : [...prev, ...normalized.items]));
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || e?.message || "Không thể tải danh sách món ăn.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [search, category, range?.min, range?.max, page]);

  const isInitialLoading = loading && page === 1;
  const isLoadingMore = loading && page > 1;

  return (
    <div className="min-h-dvh" style={{ background: '#FFFAF3' }}>
      <Header />

      <PageHero
        title="Thực Đơn"
        subtitle="Tìm kiếm và lọc hơn 160 món ăn Việt Nam theo sở thích của bạn"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Thực đơn' },
        ]}
      />

      {/* ===== FILTER BAR ===== */}
      <div className="sticky top-[72px] z-40 bg-white px-6 py-5"
           style={{ borderBottom: '1px solid #E8DDD4', boxShadow: '0 2px 12px rgba(62,39,35,0.04)' }}>
        <div className="max-w-[1200px] mx-auto grid gap-4 sm:grid-cols-12 sm:items-end">
          {/* Search */}
          <div className="sm:col-span-6">
            <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#4E342E' }}>
              Tìm kiếm
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nhập tên món ăn..."
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-300"
              style={{
                border: '1.5px solid #E8DDD4',
                background: '#FFFAF3',
                color: '#2C1810',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#E6B422'; e.target.style.boxShadow = '0 0 0 3px rgba(230,180,34,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E8DDD4'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Category (3 cột) */}
          <div className="sm:col-span-3">
            <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#4E342E' }}>
              Danh mục
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={catLoading}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer transition-all duration-300 appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                border: '1.5px solid #E8DDD4',
                background: '#FFFAF3',
                color: '#2C1810',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238D6E63' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '36px',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#E6B422'; e.target.style.boxShadow = '0 0 0 3px rgba(230,180,34,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E8DDD4'; e.target.style.boxShadow = 'none'; }}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={typeof c === "string" ? c : c.id} value={typeof c === "string" ? c : c.name}>
                  {typeof c === "string" ? c : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price (Đã chuyển sang dạng Select Combobox - 3 cột) */}
          <div className="sm:col-span-3">
            <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#4E342E' }}>
              Mức giá
            </label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer transition-all duration-300 appearance-none"
              style={{
                border: '1.5px solid #E8DDD4',
                background: '#FFFAF3',
                color: '#2C1810',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238D6E63' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '36px',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#E6B422'; e.target.style.boxShadow = '0 0 0 3px rgba(230,180,34,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E8DDD4'; e.target.style.boxShadow = 'none'; }}
            >
              {PRICE_RANGES.map((r) => (
                <option key={r.key || "all"} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ===== RESULTS ===== */}
      <main className="max-w-[1200px] mx-auto px-6 py-8 pb-16">
        <div className="text-sm mb-6" style={{ color: '#8D6E63' }}>
          {!isInitialLoading && !error && (
            <>Hiển thị <strong style={{ color: '#4E342E' }}>{dishes.length}</strong> món ăn</>
          )}
        </div>

        {isInitialLoading ? (
          <div className="bg-white rounded-2xl" style={{ border: '1px solid #E8DDD4' }}>
            <Loading label="Đang tải thực đơn..." />
          </div>
        ) : error ? (
          <div className="rounded-2xl p-5" style={{ border: '1px solid #FECDD3', background: '#FFF1F2' }}>
            <div className="text-sm font-semibold text-rose-800">Có lỗi</div>
            <div className="mt-1 text-sm text-rose-700">{error}</div>
          </div>
        ) : dishes.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed p-12 text-center bg-white" style={{ borderColor: '#E8DDD4' }}>
            <div className="text-5xl mb-4">🔍</div>
            <div className="text-base font-semibold" style={{ color: '#3E2723' }}>Không tìm thấy món ăn</div>
            <div className="mt-1 text-sm" style={{ color: '#8D6E63' }}>Hãy thử thay đổi từ khóa hoặc bộ lọc.</div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {dishes.map((dish) => (
                <DishCard key={dish.id ?? dish.dish_id} dish={dish} />
              ))}
            </div>

            <div className="flex items-center justify-center mt-10">
              {hasMore ? (
                <button
                  type="button"
                  disabled={isLoadingMore}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-9 py-3.5 rounded-xl text-[15px] font-bold text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #4E342E, #5D4037)',
                    boxShadow: '0 4px 24px rgba(62,39,35,0.08)',
                  }}
                >
                  {isLoadingMore ? "Đang tải..." : "Tải thêm món ăn"}
                </button>
              ) : (
                <div className="text-sm" style={{ color: '#8D6E63' }}>Bạn đã xem hết.</div>
              )}
            </div>
          </>
        )}
      </main>

      <Footer minimal />
    </div>
  );
}