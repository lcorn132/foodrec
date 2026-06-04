import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getTrending } from "../../api/recommendationsApi.js";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import DishCard from "../../components/DishCard.jsx";
import Loading from "../../components/Loading.jsx";

const FEATURES = [
  { value: "119", label: "món ăn thật", note: "Từ thực đơn Cơm Niêu Việt Nam" },
  { value: "0", label: "hóa đơn giả", note: "Không dùng dữ liệu giao dịch sinh" },
  { value: "Content", label: "gợi ý món đi kèm", note: "Dựa trên thuộc tính món ăn" },
  { value: "K-Means", label: "gom cụm món ăn", note: "Theo giá, mô tả và đặc trưng món" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
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
        if (alive) setTrending(items);
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

  return (
    <div className="min-h-dvh" style={{ background: "#FFFAF3" }}>
      <Header />

      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #3E2723 0%, #4E342E 55%, #5D4037 100%)" }}>
        <div className="max-w-[1200px] mx-auto px-6 py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold mb-5" style={{ background: "rgba(230,180,34,0.15)", border: "1px solid rgba(230,180,34,0.3)", color: "#F0C94D" }}>
              Hệ thống gợi ý thực đơn dựa trên khai phá dữ liệu
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-bold text-white leading-[1.15] mb-5">
              FoodRec
              <span className="block" style={{ color: "#F0C94D" }}>Cơm Niêu Việt Nam</span>
            </h1>
            <p className="text-[17px] text-white/75 leading-relaxed mb-8 max-w-[560px]">
              Ứng dụng sử dụng dữ liệu thực đơn thật, tiền xử lý dữ liệu, gom cụm món ăn và tính độ tương đồng nội dung để gợi ý món đi kèm phù hợp cho khách hàng.
            </p>
            <div className="flex gap-4 flex-wrap">
              <button type="button" onClick={() => navigate("/menu")} className="btn-primary">
                Xem thực đơn
              </button>
              <button type="button" onClick={() => navigate("/dashboard/preprocessing")} className="btn-outline">
                Xem xử lý dữ liệu
              </button>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden min-h-[360px] bg-white/10" style={{ border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(16px)" }}>
            {trending[0]?.image_url ? (
              <img src={trending[0].image_url} alt={trending[0].name} className="w-full h-[360px] object-cover" loading="eager" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-[360px] flex items-center justify-center text-white/70">
                Đang tải hình ảnh thực đơn...
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-6 py-8" style={{ background: "#FDF6EC", borderBottom: "1px solid #E8DDD4" }}>
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((item) => (
            <div key={item.label} className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E8DDD4" }}>
              <div className="font-display text-3xl font-bold mb-1" style={{ color: "#3E2723" }}>{item.value}</div>
              <div className="text-sm font-bold" style={{ color: "#5D4037" }}>{item.label}</div>
              <div className="text-xs mt-1 leading-relaxed" style={{ color: "#8D6E63" }}>{item.note}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6" style={{ background: "#FFFAF3" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <span className="section-label">Thực đơn nổi bật</span>
            <h2 className="section-title">9 món được nạp từ dữ liệu sau tiền xử lý</h2>
            <p className="text-base mt-3 max-w-[640px] mx-auto" style={{ color: "#8D6E63" }}>
              Danh sách bên dưới lấy trực tiếp từ dữ liệu món ăn đã làm sạch và đang dùng cho hệ thống gợi ý.
            </p>
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
          ) : trending.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-8 text-center bg-white" style={{ borderColor: "#E8DDD4" }}>
              <div className="text-sm font-semibold" style={{ color: "#3E2723" }}>Chưa có dữ liệu món ăn</div>
              <div className="mt-1 text-sm" style={{ color: "#8D6E63" }}>Hãy chạy pipeline ở trang quản lý dữ liệu.</div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trending.map((dish) => (
                <DishCard key={dish.id ?? dish.dish_id} dish={dish} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <button type="button" onClick={() => navigate("/menu")} className="btn-primary">
              Xem tất cả thực đơn
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 px-6" style={{ background: "#FDF6EC" }}>
        <div className="max-w-[980px] mx-auto text-center">
          <span className="section-label">Quy trình dữ liệu</span>
          <h2 className="section-title">Tải dữ liệu, xử lý, sinh biểu đồ và nạp lên web</h2>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "#6D4C41" }}>
            Admin có thể tải file Excel thực đơn thô, chạy pipeline để chuẩn hóa giá, trích xuất danh mục, làm sạch mô tả, gom cụm K-Means, tính điểm tương đồng content-based và sinh các biểu đồ đánh giá dữ liệu.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
