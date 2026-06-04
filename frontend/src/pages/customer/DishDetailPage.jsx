import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ExternalLink, ShoppingCart } from "lucide-react";

import { getDishById } from "../../api/dishesApi.js";
import { getRecommendationsForDish } from "../../api/recommendationsApi.js";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import PageHero from "../../components/PageHero.jsx";
import Loading from "../../components/Loading.jsx";
import RecommendationList from "../../components/RecommendationList.jsx";
import DishImage from "../../components/DishImage.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { showToast } from "../../components/Toast.jsx";
import { formatCurrency } from "../../utils/format.js";

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
      } catch (error) {
        if (!alive) return;
        setDish(null);
        setErrorDish(error?.message || "Không thể tải thông tin món ăn.");
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
        if (alive) setRecs([]);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [id]);

  const category = dish?.category ?? "";
  const canAdd = Boolean(dish?.id);

  return (
    <div className="min-h-dvh" style={{ background: "#FFFAF3" }}>
      <Header />

      <PageHero
        title={dish?.name || "Chi tiết món ăn"}
        subtitle={category || "Thông tin món ăn và gợi ý món phù hợp"}
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Thực đơn", href: "/menu" },
          { label: dish?.name ?? "Chi tiết món" },
        ]}
      />

      <main className="max-w-[1200px] mx-auto px-6 py-10 pb-16 space-y-14">
        {loadingDish ? (
          <div className="bg-white rounded-2xl" style={{ border: "1px solid #E8DDD4" }}>
            <Loading label="Đang tải chi tiết món..." />
          </div>
        ) : errorDish ? (
          <div className="rounded-2xl p-5" style={{ border: "1px solid #FECDD3", background: "#FFF1F2" }}>
            <div className="text-sm font-semibold text-rose-800">Có lỗi</div>
            <div className="mt-1 text-sm text-rose-700">{errorDish}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div
              className="relative rounded-3xl overflow-hidden aspect-[4/3]"
              style={{ background: "#F7EFE4", border: "1px solid #E8DDD4" }}
            >
              <DishImage src={dish?.image_url} alt={dish?.name} />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />
              {category && (
                <span
                  className="absolute top-6 left-6 text-[12px] font-bold px-3.5 py-1.5 rounded-full text-white"
                  style={{ background: "rgba(62,39,35,0.85)", backdropFilter: "blur(8px)" }}
                >
                  {category}
                </span>
              )}
            </div>

            <div className="py-2 space-y-5">
              {category && (
                <div className="inline-flex text-[12px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider" style={{ background: "#FDF3D7", color: "#B88900" }}>
                  {category}
                </div>
              )}

              <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight" style={{ color: "#3E2723" }}>
                {dish?.name}
              </h1>

              <div className="flex items-center justify-between px-6 py-5 rounded-2xl" style={{ background: "linear-gradient(135deg, #FDF6EC, #FDF3D7)", border: "1px solid #FAE8B0" }}>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: "#8D6E63" }}>Giá bán</div>
                  <div className="font-display text-[32px] font-bold" style={{ color: "#3E2723" }}>
                    {formatCurrency(dish?.price)}
                  </div>
                </div>
                {dish?.price_range && (
                  <div className="text-right">
                    <div className="text-[12px]" style={{ color: "#8D6E63" }}>Mức giá</div>
                    <div className="text-sm font-semibold" style={{ color: "#B88900" }}>
                      {PRICE_RANGE_LABELS[dish.price_range] ?? dish.price_range}
                    </div>
                  </div>
                )}
              </div>

              {dish?.description ? (
                <div
                  className="text-[15px] leading-relaxed pb-5 prose-lite"
                  style={{ color: "#5D4037", borderBottom: "1px solid #E8DDD4" }}
                  dangerouslySetInnerHTML={{ __html: dish.description }}
                />
              ) : (
                <p className="text-sm" style={{ color: "#8D6E63" }}>Chưa có mô tả cho món ăn này.</p>
              )}

              <div className="flex gap-3 items-center flex-wrap">
                <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "2px solid #E8DDD4" }}>
                  <button
                    type="button"
                    onClick={() => setQty((value) => Math.max(1, value - 1))}
                    className="w-11 h-12 flex items-center justify-center text-lg font-bold cursor-pointer transition-colors hover:bg-brown-50"
                    style={{ color: "#6D4C41", background: "transparent", border: "none" }}
                  >
                    -
                  </button>
                  <div className="w-12 h-12 flex items-center justify-center text-base font-bold" style={{ color: "#3E2723", borderLeft: "1px solid #E8DDD4", borderRight: "1px solid #E8DDD4" }}>
                    {qty}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQty((value) => Math.min(20, value + 1))}
                    className="w-11 h-12 flex items-center justify-center text-lg font-bold cursor-pointer transition-colors hover:bg-brown-50"
                    style={{ color: "#6D4C41", background: "transparent", border: "none" }}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!canAdd}
                  onClick={() => {
                    for (let index = 0; index < qty; index += 1) {
                      addToCart({ id: dish.id, name: dish.name, price: dish.price, image_url: dish.image_url });
                    }
                    showToast(`Đã thêm ${qty} x ${dish.name} vào giỏ hàng`);
                  }}
                  className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-base font-bold cursor-pointer transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #E6B422, #D4A017)", color: "#3E2723", border: "none", boxShadow: "0 4px 16px rgba(230,180,34,0.35)" }}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Thêm vào giỏ hàng
                </button>
              </div>

              {dish?.source_url && (
                <Link
                  to={dish.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold no-underline"
                  style={{ color: "#8D6E63" }}
                >
                  Xem thêm thông tin món ăn
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}

        <RecommendationList title="Có thể bạn cũng thích" recommendations={recs} />
      </main>

      <Footer minimal />
    </div>
  );
}
