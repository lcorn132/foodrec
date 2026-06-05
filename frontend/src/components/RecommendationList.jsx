import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

import { formatCurrency } from "../utils/format";
import Loading from "./Loading.jsx";
import DishImage from "./DishImage.jsx";
import { useCart } from "../context/CartContext.jsx";
import { showToast } from "./Toast.jsx";
import { makeCartDish } from "../utils/dishVariants.js";

function shortReason(strategy, fallback) {
  if (strategy === "cross_cluster_mapping") return "Đi kèm rất hợp mâm này";
  if (strategy === "intra_cluster_knn") return "Hợp vị với món đang xem";
  return fallback || "Đáng thử cho bữa ăn này";
}

function toPercent(score) {
  const n = typeof score === "number" ? score : Number(score);
  if (!Number.isFinite(n)) return null;
  const pct = n <= 1 ? n * 100 : n;
  return Math.round(Math.max(0, Math.min(100, pct)));
}

export default function RecommendationList({ recommendations, title = "Món ăn bạn có thể thích", showAddButton = false }) {
  const { addToCart } = useCart();
  const isLoading = recommendations == null;

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-2.5">
        <span className="text-[22px]">✨</span>
        <h2 className="font-display text-2xl font-bold" style={{ color: "#3E2723" }}>{title}</h2>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border" style={{ borderColor: "#E8DDD4" }}>
          <Loading label="Đang tải gợi ý..." />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center bg-white" style={{ borderColor: "#E8DDD4" }}>
          <div className="text-lg font-semibold mb-2" style={{ color: "#3E2723" }}>
            Chưa có gợi ý phù hợp
          </div>
          <div className="text-sm" style={{ color: "#8D6E63" }}>
            Hãy thử xem thêm món trong thực đơn để hệ thống đề xuất tốt hơn.
          </div>
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-3 scroll-smooth" style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
          {recommendations.map((rec, index) => {
            const dish = rec?.dish ?? rec;
            const pct = toPercent(rec?.score);
            const reason = shortReason(rec?.strategy, rec?.reason);
            const category = dish?.category_name ?? dish?.category ?? "Thực đơn";
            const id = dish?.dish_id ?? dish?.id;
            const name = dish?.dish_name ?? dish?.name ?? "Món ăn";
            const handleAdd = (event) => {
              event.preventDefault();
              event.stopPropagation();
              const cartDish = makeCartDish({ ...dish, id, name });
              addToCart(cartDish);
              showToast(`Đã thêm ${cartDish.name} vào giỏ hàng`);
            };

            return (
              <Link
                key={id ?? index}
                to={`/dish/${id}`}
                className="group flex w-[280px] flex-shrink-0 flex-col overflow-hidden rounded-2xl no-underline transition-all duration-300 hover:-translate-y-1 sm:w-[300px]"
                style={{
                  scrollSnapAlign: "start",
                  background: "white",
                  border: "1px solid #E8DDD4",
                  color: "inherit",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.boxShadow = "0 12px 40px rgba(62,39,35,0.12)";
                  event.currentTarget.style.borderColor = "#F5D680";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.boxShadow = "none";
                  event.currentTarget.style.borderColor = "#E8DDD4";
                }}
              >
                <div className="aspect-[16/10] relative overflow-hidden" style={{ background: "#F7EFE4" }}>
                  <DishImage src={dish?.image_url} alt={name} className="transition-transform duration-500 group-hover:scale-105" />

                  {pct != null && (
                    <div className="absolute top-2.5 left-2.5 text-[11px] font-bold px-3 py-1.5 rounded-full text-white flex items-center gap-1" style={{ background: "linear-gradient(135deg, #4E342E, #5D4037)" }}>
                      ✨ {pct}%
                    </div>
                  )}

                  <div className="absolute top-2.5 right-2.5 text-[12px] font-bold px-3 py-1 rounded-full" style={{ background: "linear-gradient(135deg, #E6B422, #D4A017)", color: "#3E2723" }}>
                    {formatCurrency(dish?.price)}
                  </div>
                </div>

                <div className="flex min-h-[205px] flex-1 flex-col p-4">
                  <div className="mb-1.5 text-[12px] font-bold uppercase tracking-wide" style={{ color: "#B88900" }}>{category}</div>
                  <h3 className="font-display min-h-[44px] text-[16px] font-semibold leading-snug transition-colors group-hover:text-gold-600 line-clamp-2" style={{ color: "#3E2723" }}>
                    {name}
                  </h3>

                  {reason && (
                    <div className="mt-3 inline-flex w-fit max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold" style={{ background: "#FFF7E6", color: "#6D4C41", border: "1px solid #FAE8B0" }}>
                      <span className="text-[13px]">✨</span>
                      <span className="truncate">{reason}</span>
                    </div>
                  )}

                  {showAddButton && (
                    <button
                      type="button"
                      onClick={handleAdd}
                      className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5"
                      style={{ background: "linear-gradient(135deg, #E6B422, #D4A017)", color: "#3E2723", border: "none" }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Thêm món
                    </button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
