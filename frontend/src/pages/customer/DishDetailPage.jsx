import { formatCurrency } from "../../utils/format.js";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

import { getDishById } from "../../api/dishesApi.js";
import { getRecommendationsForDish } from "../../api/recommendationsApi.js";
import { createRating, getDishRatings } from "../../api/userApi.js";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import PageHero from "../../components/PageHero.jsx";
import Loading from "../../components/Loading.jsx";
import RecommendationList from "../../components/RecommendationList.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { showToast } from "../../components/Toast.jsx";


const categoryEmojis = {
  'Khai vị': '🥩', 'Rau': '🥬', 'Bò': '🥩', 'Heo': '🐷',
  'Gà / Vịt': '🍗', 'Hải sản': '🦐', 'Lẩu': '🍲', 'Cơm': '🍚', 'Tráng miệng': '🍮',
};

const PRICE_RANGE_LABELS = {
  budget: "Bình dân",
  affordable: "Vừa phải",
  moderate: "Trung bình",
  premium: "Cao cấp",
};

export default function DishDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [dish, setDish] = useState(null);
  const [loadingDish, setLoadingDish] = useState(true);
  const [errorDish, setErrorDish] = useState("");
  const [recs, setRecs] = useState(null);
  const [qty, setQty] = useState(1);
  const [ratingData, setRatingData] = useState({ ratings: [], avg_rating: 0, total: 0 });
  const [ratingValue, setRatingValue] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

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
        const items = Array.isArray(recData) ? recData : recData?.recommendations ?? recData?.items ?? [];
        setRecs(items);
      } catch {
        if (!alive) return;
        setRecs([]);
      }
      try {
        const ratingRes = await getDishRatings(id);
        if (!alive) return;
        setRatingData(ratingRes.data ?? { ratings: [], avg_rating: 0, total: 0 });
      } catch {
        if (!alive) return;
        setRatingData({ ratings: [], avg_rating: 0, total: 0 });
      }
    }
    run();
    return () => { alive = false; };
  }, [id]);

  const cat = dish?.category ?? '';
  const emoji = categoryEmojis[cat] ?? '🍽️';
  const canAdd = Boolean(dish?.id);
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("foodrec_user")); } catch { return null; }
  })();

  const handleSubmitRating = async () => {
    if (!dish?.id || submittingRating) return;
    setSubmittingRating(true);
    try {
      await createRating({
        dish_id: dish.id,
        rating: ratingValue,
        comment,
        customer_id: user?.id,
      });
      const ratingRes = await getDishRatings(id);
      setRatingData(ratingRes.data ?? { ratings: [], avg_rating: 0, total: 0 });
      setComment("");
      setRatingValue(5);
      showToast("Đã gửi đánh giá của bạn");
    } catch (error) {
      showToast(error?.message || "Không gửi được đánh giá", "error");
    } finally {
      setSubmittingRating(false);
    }
  };

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
                      {PRICE_RANGE_LABELS[dish.price_range] ?? dish.price_range}
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

        {!loadingDish && !errorDish && (
          <section className="bg-white rounded-3xl p-6" style={{ border: '1px solid #E8DDD4' }}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold" style={{ color: '#3E2723' }}>Đánh giá món ăn</h2>
                <p className="mt-1 text-sm" style={{ color: '#8D6E63' }}>
                  {ratingData.total ? `${ratingData.total} lượt đánh giá` : "Chưa có đánh giá nào"}
                </p>
              </div>
              <div className="rounded-2xl px-5 py-3 text-center" style={{ background: '#FDF3D7', color: '#3E2723' }}>
                <div className="text-3xl font-bold">⭐ {ratingData.avg_rating || 0}</div>
                <div className="text-xs font-semibold" style={{ color: '#8D6E63' }}>Điểm trung bình</div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl p-4" style={{ background: '#FFFAF3', border: '1px solid #E8DDD4' }}>
              <div className="grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#4E342E' }}>Số sao</label>
                  <select
                    value={ratingValue}
                    onChange={(e) => setRatingValue(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1.5px solid #E8DDD4', background: 'white', color: '#2C1810' }}
                  >
                    {[5, 4, 3, 2, 1].map((star) => (
                      <option key={star} value={star}>{star} sao</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#4E342E' }}>Nhận xét</label>
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Bạn thấy món này thế nào?"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1.5px solid #E8DDD4', background: 'white', color: '#2C1810' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSubmitRating}
                  disabled={submittingRating}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #E6B422, #D4A017)', color: '#3E2723', border: 'none' }}
                >
                  {submittingRating ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {(ratingData.ratings || []).length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed p-6 text-center text-sm" style={{ borderColor: '#E8DDD4', color: '#8D6E63' }}>
                  Hãy là người đầu tiên đánh giá món này.
                </div>
              ) : (
                ratingData.ratings.map((rating) => (
                  <div key={rating.id} className="rounded-2xl p-4" style={{ border: '1px solid #E8DDD4', background: '#FFFAF3' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold" style={{ color: '#3E2723' }}>{rating.customer_name || "Ẩn danh"}</div>
                      <div className="text-sm font-bold" style={{ color: '#D4A017' }}>{"⭐".repeat(rating.rating)}</div>
                    </div>
                    {rating.comment && <p className="mt-2 text-sm" style={{ color: '#5D4037' }}>{rating.comment}</p>}
                    {rating.admin_reply && (
                      <div className="mt-3 rounded-xl px-3 py-2 text-sm" style={{ background: '#DCFCE7', color: '#15803D' }}>
                        Phản hồi: {rating.admin_reply}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Recommendations */}
        <RecommendationList title="Món Tương Tự" recommendations={recs} />
      </main>

      <Footer minimal />
    </div>
  );
}
