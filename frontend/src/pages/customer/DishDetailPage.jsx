import { formatCurrency } from "../../utils/format.js";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

import { getDishById } from "../../api/dishesApi.js";
import { getRecommendationsForDish } from "../../api/recommendationsApi.js";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import PageHero from "../../components/PageHero.jsx";
import Loading from "../../components/Loading.jsx";
import RecommendationList from "../../components/RecommendationList.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { showToast } from "../../components/Toast.jsx";


function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return value.split(",").map((s) => s.trim());
  return [];
}

const categoryEmojis = {
  'Khai vị': '🥩', 'Rau': '🥬', 'Bò': '🥩', 'Heo': '🐷',
  'Gà / Vịt': '🍗', 'Hải sản': '🦐', 'Lẩu': '🍲', 'Cơm': '🍚', 'Tráng miệng': '🍮',
};

export default function DishDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [dish, setDish] = useState(null);
  const [loadingDish, setLoadingDish] = useState(true);
  const [errorDish, setErrorDish] = useState("");
  const [recs, setRecs] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoadingDish(true);
      setErrorDish("");
      setRecs(null);
      setQty(1);
      try {
        const data = await getDishById(id);
        if (!alive) return;
        setDish(data);
      } catch (e) {
        if (!alive) return;
        setDish(null);
        setErrorDish(e?.response?.data?.message || e?.message || "Không thể tải thông tin món ăn.");
        setLoadingDish(false);
        return;
      } finally {
        if (alive) setLoadingDish(false);
      }
      try {
        const recData = await getRecommendationsForDish(id, 10);
        if (!alive) return;
        const items = Array.isArray(recData) ? recData : recData?.items ?? [];
        setRecs(items);
      } catch {
        if (!alive) return;
        setRecs([]);
      }
    }
    run();
    return () => { alive = false; };
  }, [id]);

  const tags = useMemo(() => asArray(dish?.tags), [dish?.tags]);
  const ingredients = useMemo(
    () => asArray(dish?.ingredients ?? dish?.nguyen_lieu),
    [dish?.ingredients, dish?.nguyen_lieu],
  );
  const detailedIngredients = useMemo(
    () => asArray(dish?.detailed_ingredients),
    [dish?.detailed_ingredients],
  );

  const displayIngredients = detailedIngredients.length > 0 ? detailedIngredients : ingredients;
  const cat = dish?.category ?? '';
  const emoji = categoryEmojis[cat] ?? '🍽️';
  const canAdd = Boolean(dish?.id);

  return (
    <div className="min-h-dvh" style={{ background: '#FFFAF3' }}>
      <Header />

      <PageHero
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Thực đơn', href: '/menu' },
          { label: dish?.name ?? 'Chi tiết món' },
        ]}
      />

      <main className="max-w-[1200px] mx-auto px-6 py-10 pb-16 space-y-14">
        {loadingDish ? (
          <div className="bg-white rounded-2xl" style={{ border: '1px solid #E8DDD4' }}>
            <Loading label="Đang tải chi tiết món..." />
          </div>
        ) : errorDish ? (
          <div className="rounded-2xl p-5" style={{ border: '1px solid #FECDD3', background: '#FFF1F2' }}>
            <div className="text-sm font-semibold text-rose-800">Có lỗi</div>
            <div className="mt-1 text-sm text-rose-700">{errorDish}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* IMAGE */}
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #EFEBE9, #FDF3D7)', border: '1px solid #E8DDD4' }}>
              <div className="absolute inset-4 rounded-2xl pointer-events-none z-[1]"
                   style={{ border: '1px solid rgba(230,180,34,0.25)' }} />
              <div className="absolute top-6 left-6 flex gap-2 z-[2]">
                <span className="text-[12px] font-bold px-3.5 py-1.5 rounded-full text-white"
                      style={{ background: 'linear-gradient(135deg, #E6B422, #D4A017)', color: '#3E2723' }}>
                  ⭐ Bán chạy
                </span>
                {cat && (
                  <span className="text-[12px] font-bold px-3.5 py-1.5 rounded-full text-white"
                        style={{ background: 'rgba(62,39,35,0.85)', backdropFilter: 'blur(8px)' }}>
                    {cat}
                  </span>
                )}
              </div>
              <span className="text-[120px] animate-bounce-in">{emoji}</span>
            </div>

            {/* INFO */}
            <div className="py-2 space-y-5">
              {cat && (
                <div className="inline-flex text-[12px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider"
                     style={{ background: '#FDF3D7', color: '#D4A017' }}>
                  {cat}
                </div>
              )}

              <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight" style={{ color: '#3E2723' }}>
                {dish?.name}
              </h1>

              <div className="flex items-center gap-4 flex-wrap">
                {dish?.avg_rating && (
                  <div className="flex items-center gap-1 text-sm font-bold px-3.5 py-1.5 rounded-lg"
                       style={{ background: '#FDF3D7', color: '#D4A017' }}>
                    ⭐ {dish.avg_rating.toFixed?.(1) ?? dish.avg_rating}
                  </div>
                )}
                {dish?.total_ratings && (
                  <span className="text-[13px]" style={{ color: '#8D6E63' }}>{dish.total_ratings} đánh giá</span>
                )}
              </div>

              {/* Price box */}
              <div className="flex items-center justify-between px-6 py-5 rounded-2xl"
                   style={{ background: 'linear-gradient(135deg, #FDF6EC, #FDF3D7)', border: '1px solid #FAE8B0' }}>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: '#8D6E63' }}>Giá</div>
                  <div className="font-display text-[32px] font-bold" style={{ color: '#3E2723' }}>
                    {formatCurrency(dish?.price)}
                  </div>
                </div>
                {dish?.price_range && (
                  <div className="text-right">
                    <div className="text-[12px]" style={{ color: '#8D6E63' }}>Mức giá</div>
                    <div className="text-sm font-semibold" style={{ color: '#D4A017' }}>
                      {dish.price_range.charAt(0).toUpperCase() + dish.price_range.slice(1)}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {dish?.description ? (
                <p className="text-[15px] leading-relaxed pb-5"
                   style={{ color: '#5D4037', borderBottom: '1px solid #E8DDD4' }}>
                  {dish.description}
                </p>
              ) : (
                <p className="text-sm" style={{ color: '#8D6E63' }}>Chưa có mô tả cho món ăn này.</p>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span key={t} className="text-[13px] font-semibold px-3.5 py-1.5 rounded-lg transition-colors duration-300 cursor-default"
                          style={{ background: '#EFEBE9', color: '#6D4C41' }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Ingredients */}
              {displayIngredients.length > 0 && (
                <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E8DDD4' }}>
                  <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#3E2723' }}>
                    🧾 Nguyên liệu
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {displayIngredients.map((ing) => (
                      <div key={ing} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                           style={{ background: '#FFFAF3', color: '#5D4037' }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#E6B422' }} />
                        {ing}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to cart */}
              <div className="flex gap-3 items-center flex-wrap">
                <div className="flex items-center rounded-xl overflow-hidden"
                     style={{ border: '2px solid #E8DDD4' }}>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-11 h-12 flex items-center justify-center text-lg font-bold cursor-pointer transition-colors hover:bg-brown-50"
                    style={{ color: '#6D4C41', background: 'transparent', border: 'none' }}
                  >
                    −
                  </button>
                  <div className="w-12 h-12 flex items-center justify-center text-base font-bold"
                       style={{ color: '#3E2723', borderLeft: '1px solid #E8DDD4', borderRight: '1px solid #E8DDD4' }}>
                    {qty}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(20, q + 1))}
                    className="w-11 h-12 flex items-center justify-center text-lg font-bold cursor-pointer transition-colors hover:bg-brown-50"
                    style={{ color: '#6D4C41', background: 'transparent', border: 'none' }}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!canAdd}
                  onClick={() => {
                    for (let i = 0; i < qty; i++) {
                      addToCart({
                        id: dish.id,
                        name: dish.name,
                        price: dish.price,
                        image_url: dish.image_url,
                      });
                    }
                    showToast(`Đã thêm ${qty} × ${dish.name} vào giỏ hàng`);
                  }}
                  className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-base font-bold cursor-pointer transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #E6B422, #D4A017)',
                    color: '#3E2723',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(230,180,34,0.35)',
                  }}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Thêm vào giỏ hàng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <RecommendationList title="Món Tương Tự" recommendations={recs} />
      </main>

      <Footer minimal />
    </div>
  );
}
