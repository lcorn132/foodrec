import { Link } from "react-router-dom";

import { formatCurrency } from "../utils/format";
import Loading from "./Loading.jsx";
import DishImage from "./DishImage.jsx";

function toPercent(score) {
  const n = typeof score === "number" ? score : Number(score);
  if (!Number.isFinite(n)) return null;
  const pct = n <= 1 ? n * 100 : n;
  return Math.round(Math.max(0, Math.min(100, pct)));
}

export default function RecommendationList({ recommendations, title = "Món ăn bạn có thể thích" }) {
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
            const reason = rec?.reason;
            const category = dish?.category_name ?? dish?.category ?? "Thực đơn";
            const id = dish?.dish_id ?? dish?.id;
            const name = dish?.dish_name ?? dish?.name ?? "Món ăn";

            return (
              <Link
                key={id ?? index}
                to={`/dish/${id}`}
                className="flex-shrink-0 w-[280px] sm:w-[300px] group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 no-underline"
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

                <div className="p-4">
                  <div className="text-[12px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "#B88900" }}>{category}</div>
                  <h3 className="font-display text-[16px] font-semibold leading-tight mb-1.5 group-hover:text-gold-600 transition-colors line-clamp-2" style={{ color: "#3E2723" }}>
                    {name}
                  </h3>

                  {reason && (
                    <div className="mt-2.5 px-3 py-2 rounded-lg text-[12px] leading-relaxed" style={{ background: "#FDF3D7", color: "#5D4037", border: "1px solid #FAE8B0" }}>
                      {reason}
                    </div>
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
