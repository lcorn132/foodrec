import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, MapPin, Phone, Sparkles, Utensils } from "lucide-react";

import { getTrending } from "../../api/recommendationsApi.js";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import DishCard from "../../components/DishCard.jsx";
import Loading from "../../components/Loading.jsx";

const HIGHLIGHTS = [
  { icon: Utensils, title: "Mâm cơm Việt trọn vị", text: "Cơm niêu, món mặn, rau canh và lẩu được phối hợp hài hòa cho từng bữa ăn." },
  { icon: Sparkles, title: "Gợi ý theo khẩu vị", text: "Đề xuất món phù hợp với món bạn đang xem, giỏ hàng và thời điểm dùng bữa." },
  { icon: Clock, title: "Phục vụ 10:00 - 22:00", text: "Sẵn sàng cho bữa trưa nhanh, bữa tối gia đình hoặc những buổi gặp mặt ấm cúng." },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setError("");

      try {
        const data = await getTrending(9);
        const items = data.trending ? data.trending.map((item) => item.dish) : [];
        if (alive) setFeatured(items);
      } catch (err) {
        if (alive) setError(err?.message || "Không thể tải danh sách món ăn nổi bật.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  const heroDish = featured[0];

  return (
    <div className="min-h-dvh" style={{ background: "#FFFAF3" }}>
      <Header />

      <section className="relative overflow-hidden" style={{ background: "#2F1B16" }}>
        {heroDish?.image_url && (
          <img
            src={heroDish.image_url}
            alt={heroDish.name}
            className="absolute inset-0 h-full w-full object-cover opacity-45"
            loading="eager"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#2F1B16] via-[#2F1B16]/82 to-[#2F1B16]/35" />
        <div className="relative max-w-[1200px] mx-auto px-6 min-h-[650px] flex items-center">
          <div className="max-w-[680px] py-20">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold mb-5" style={{ background: "rgba(230,180,34,0.16)", color: "#F5D680", border: "1px solid rgba(245,214,128,0.25)" }}>
              Cơm niêu ấm nóng mỗi ngày
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold text-white leading-tight mb-5">
              Bữa cơm Việt chỉn chu cho gia đình và bạn bè
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-8">
              Chọn món nhanh, phối món thông minh và đặt bữa ăn phù hợp cho trưa văn phòng, tối gia đình hoặc những dịp sum họp.
            </p>
            <div className="flex flex-wrap gap-4">
              <button type="button" onClick={() => navigate("/menu")} className="btn-primary">
                Xem món hôm nay
              </button>
              <button type="button" onClick={() => navigate("/cart")} className="btn-outline">
                Xem giỏ hàng
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-8" style={{ background: "#FDF6EC", borderBottom: "1px solid #E8DDD4" }}>
        <div className="max-w-[1200px] mx-auto grid gap-4 md:grid-cols-3">
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-white rounded-xl p-5 flex gap-4" style={{ border: "1px solid #E8DDD4" }}>
                <div className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#FDF3D7", color: "#B8860B" }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold" style={{ color: "#3E2723" }}>{item.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: "#8D6E63" }}>{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-18 px-6" style={{ background: "#FFFAF3" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="section-label">Món được gợi ý</span>
              <h2 className="section-title">Phù hợp cho bữa ăn hiện tại</h2>
              <p className="text-base mt-3 max-w-[680px]" style={{ color: "#8D6E63" }}>
                Danh sách món được ưu tiên theo thời điểm trong ngày và các lựa chọn đang được quan tâm.
              </p>
            </div>
            <button type="button" onClick={() => navigate("/menu")} className="btn-dark">
              Xem tất cả món
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl" style={{ border: "1px solid #E8DDD4" }}>
              <Loading label="Đang tải món nổi bật..." />
            </div>
          ) : error ? (
            <div className="rounded-2xl p-5" style={{ border: "1px solid #FECDD3", background: "#FFF1F2" }}>
              <div className="text-sm font-semibold text-rose-800">Có lỗi xảy ra</div>
              <div className="mt-1 text-sm text-rose-700">{error}</div>
            </div>
          ) : featured.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-8 text-center bg-white" style={{ borderColor: "#E8DDD4" }}>
              <div className="text-sm font-semibold" style={{ color: "#3E2723" }}>Nhà hàng đang cập nhật món</div>
              <div className="mt-1 text-sm" style={{ color: "#8D6E63" }}>Vui lòng quay lại sau ít phút.</div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((dish) => (
                <DishCard key={dish.id ?? dish.dish_id} dish={dish} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-16" style={{ background: "#FDF6EC" }}>
        <div className="max-w-[1200px] mx-auto grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <span className="section-label">Đặt bàn và giao món</span>
            <h2 className="section-title">Một bữa cơm ngon bắt đầu từ lựa chọn đúng món</h2>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "#6D4C41" }}>
              Bạn có thể chọn món lẻ, thêm vào giỏ hàng và để hệ thống gợi ý món đi kèm giúp bữa ăn cân bằng hơn.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: "1px solid #E8DDD4" }}>
            <div className="flex items-center gap-3 text-sm" style={{ color: "#5D4037" }}>
              <Phone className="h-5 w-5" style={{ color: "#D4A017" }} />
              <span className="font-semibold">0941 855 234</span>
            </div>
            <div className="flex items-center gap-3 text-sm" style={{ color: "#5D4037" }}>
              <MapPin className="h-5 w-5" style={{ color: "#D4A017" }} />
              <span>Phục vụ tại TP. Hồ Chí Minh</span>
            </div>
            <button type="button" onClick={() => navigate("/menu")} className="btn-primary w-full justify-center">
              Bắt đầu chọn món
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
