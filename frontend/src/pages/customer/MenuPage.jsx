import { useEffect, useMemo, useState } from "react";

import { getCategories, getDishes } from "../../api/dishesApi.js";
import DishCard from "../../components/DishCard.jsx";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import PageHero from "../../components/PageHero.jsx";
import Loading from "../../components/Loading.jsx";

const PRICE_RANGES = [
  { key: "", label: "Tất cả mức giá", min: undefined, max: undefined },
  { key: "budget", label: "Bình dân, dưới 50.000 đ", min: 0, max: 50_000 },
  { key: "affordable", label: "Vừa phải, 50.000 - 100.000 đ", min: 50_000, max: 100_000 },
  { key: "moderate", label: "Trung bình, 100.000 - 200.000 đ", min: 100_000, max: 200_000 },
  { key: "premium", label: "Cao cấp, trên 200.000 đ", min: 200_000, max: undefined },
];

const PAGE_SIZE = 9;

function normalizeCategories(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.categories)) return data.categories;
  return [];
}

function normalizeDishes(data) {
  if (Array.isArray(data)) return { items: data, total: data.length, totalPages: 1 };
  const items = Array.isArray(data?.items) ? data.items : [];
  return {
    items,
    total: Number(data?.total ?? items.length),
    totalPages: Number(data?.total_pages ?? data?.totalPages ?? 1),
  };
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
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const range = useMemo(() => PRICE_RANGES.find((item) => item.key === priceRange) ?? PRICE_RANGES[0], [priceRange]);

  useEffect(() => {
    let alive = true;

    async function run() {
      setCatLoading(true);
      try {
        const data = await getCategories();
        if (alive) setCategories(normalizeCategories(data));
      } catch {
        if (alive) setCategories([]);
      } finally {
        if (alive) setCatLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, category, priceRange]);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setError("");

      try {
        const data = await getDishes({
          q: search || undefined,
          category: category || undefined,
          min_price: range?.min,
          max_price: range?.max,
          page,
          limit: PAGE_SIZE,
        });

        if (!alive) return;
        const normalized = normalizeDishes(data);
        setTotal(normalized.total);
        setTotalPages(Math.max(1, normalized.totalPages));
        setDishes(normalized.items);
      } catch (err) {
        if (!alive) return;
        setError(err?.message || "Không thể tải danh sách món ăn.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [search, category, range?.min, range?.max, page]);

  const isInitialLoading = loading && page === 1;
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="min-h-dvh" style={{ background: "#FFFAF3" }}>
      <Header />

      <PageHero
        title="Thực đơn"
        subtitle="Những món Việt quen thuộc cho bữa trưa, bữa tối gia đình và các buổi gặp mặt."
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Thực đơn" },
        ]}
      />

      <div className="sticky top-[72px] z-40 bg-white px-6 py-5" style={{ borderBottom: "1px solid #E8DDD4", boxShadow: "0 2px 12px rgba(62,39,35,0.04)" }}>
        <div className="max-w-[1200px] mx-auto grid gap-4 sm:grid-cols-12 sm:items-end">
          <div className="sm:col-span-6">
            <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#4E342E" }}>
              Tìm kiếm
            </label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nhập tên món ăn..."
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-300"
              style={{ border: "1.5px solid #E8DDD4", background: "#FFFAF3", color: "#2C1810" }}
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#4E342E" }}>
              Danh mục
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              disabled={catLoading}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer transition-all duration-300 appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ border: "1.5px solid #E8DDD4", background: "#FFFAF3", color: "#2C1810" }}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((item) => {
                const value = typeof item === "string" ? item : item.name;
                return <option key={value} value={value}>{value}</option>;
              })}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#4E342E" }}>
              Mức giá
            </label>
            <select
              value={priceRange}
              onChange={(event) => setPriceRange(event.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer transition-all duration-300 appearance-none"
              style={{ border: "1.5px solid #E8DDD4", background: "#FFFAF3", color: "#2C1810" }}
            >
              {PRICE_RANGES.map((item) => (
                <option key={item.key || "all"} value={item.key}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-6 py-8 pb-16">
        <div className="text-sm mb-6" style={{ color: "#8D6E63" }}>
          {!isInitialLoading && !error && (
            <>Hiển thị <strong style={{ color: "#4E342E" }}>{dishes.length}</strong> / {total} món ăn</>
          )}
        </div>

        {isInitialLoading ? (
          <div className="bg-white rounded-2xl" style={{ border: "1px solid #E8DDD4" }}>
            <Loading label="Đang tải thực đơn..." />
          </div>
        ) : error ? (
          <div className="rounded-2xl p-5" style={{ border: "1px solid #FECDD3", background: "#FFF1F2" }}>
            <div className="text-sm font-semibold text-rose-800">Có lỗi</div>
            <div className="mt-1 text-sm text-rose-700">{error}</div>
          </div>
        ) : dishes.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed p-12 text-center bg-white" style={{ borderColor: "#E8DDD4" }}>
            <div className="text-base font-semibold" style={{ color: "#3E2723" }}>Không tìm thấy món ăn</div>
            <div className="mt-1 text-sm" style={{ color: "#8D6E63" }}>Hãy thử thay đổi từ khóa hoặc bộ lọc.</div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {dishes.map((dish) => (
                <DishCard key={dish.id ?? dish.dish_id} dish={dish} />
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
              <button
                type="button"
                disabled={page === 1 || loading}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ border: "1px solid #E8DDD4", background: "white", color: "#5D4037" }}
              >
                Trang trước
              </button>

              {pageNumbers.map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled={loading}
                  onClick={() => setPage(item)}
                  className="min-w-10 px-3 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  style={{
                    background: page === item ? "linear-gradient(135deg, #4E342E, #5D4037)" : "white",
                    color: page === item ? "white" : "#5D4037",
                    border: page === item ? "none" : "1px solid #E8DDD4",
                  }}
                >
                  {item}
                </button>
              ))}

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ border: "1px solid #E8DDD4", background: "white", color: "#5D4037" }}
              >
                Trang sau
              </button>
            </div>
          </>
        )}
      </main>

      <Footer minimal />
    </div>
  );
}
