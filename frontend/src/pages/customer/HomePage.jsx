import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getTrending } from "../../api/recommendationsApi.js";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import DishCard from "../../components/DishCard.jsx";
import Loading from "../../components/Loading.jsx";

const FEATURES = [
  { icon: "🤖", title: "AI Thông Minh", desc: "Gợi ý dựa trên sở thích" },
  { icon: "🥬", title: "Nguyên Liệu Tươi", desc: "Chọn lọc kỹ lưỡng" },
  { icon: "🍳", title: "Hương Vị Chính Gốc", desc: "Ẩm thực thuần Việt" },
  { icon: "🚀", title: "Đặt Hàng Nhanh", desc: "Giao món tận nơi" },
];

const HIW_STEPS = [
  { icon: "📋", title: "Khám Phá Thực Đơn", desc: "Duyệt qua hơn 160 món ăn Việt Nam đa dạng, từ khai vị cho đến tráng miệng." },
  { icon: "🤖", title: "AI Phân Tích", desc: "Hệ thống tự động phân tích sở thích, đánh giá và lịch sử để hiểu khẩu vị của bạn." },
  { icon: "✨", title: "Nhận Gợi Ý", desc: "Nhận danh sách món ăn được đề xuất với % phù hợp, thêm vào giỏ và đặt hàng." },
];

const TESTIMONIALS = [
  { name: "Anh Minh Luân", loc: "Quận 11, TP.HCM", initials: "ML", text: "Hệ thống gợi ý rất chính xác! Lần nào đề xuất cũng đúng ý mình. Cơm Niêu ở đây ngon xuất sắc, lớp cháy giòn rụm." },
  { name: "Anh Max Nguyen", loc: "Khách du lịch", initials: "MN", text: "Rất tiện lợi! Chỉ cần chọn vài món, hệ thống tự đề xuất thêm món phù hợp. Đồ ăn Việt Nam chính gốc, tuyệt vời!" },
  { name: "Chị Thu Thảo", loc: "Bình Thạnh, TP.HCM", initials: "TT", text: "Tôi chọn nhà hàng để mời đối tác vì không gian trang nhã. Hệ thống đặt hàng rất thuận tiện." },
];

const STATS = [
  { icon: "🍽️", value: "160+", label: "Món ăn đa dạng" },
  { icon: "👨‍🍳", value: "300+", label: "Khách hàng mỗi ngày" },
  { icon: "⭐", value: "4.8", label: "Đánh giá trung bình" },
  { icon: "🤖", value: "95%", label: "Độ chính xác gợi ý" },
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
        const data = await getTrending(10);
        const items = data.trending ? data.trending.map((item) => item.dish) : [];
        if (alive) setTrending(items);
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || e?.message || "Không thể tải danh sách món ăn phổ biến.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-dvh" style={{ background: '#FFFAF3' }}>
      <Header />

      {/* ===== HERO ===== */}
      <section className="relative min-h-[560px] flex items-center overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #3E2723 0%, #4E342E 40%, #5D4037 100%)' }}>
        {/* Decorations */}
        <div className="absolute inset-0"
             style={{ background: 'radial-gradient(circle at 20% 50%, rgba(230,180,34,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(230,180,34,0.06) 0%, transparent 40%)' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full right-[-100px] top-1/2 -translate-y-1/2"
             style={{ border: '1px solid rgba(230,180,34,0.1)' }} />

        <div className="max-w-[1200px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center relative z-[2] w-full">
          {/* Left */}
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold mb-5"
                 style={{ background: 'rgba(230,180,34,0.15)', border: '1px solid rgba(230,180,34,0.3)', color: '#F0C94D' }}>
              ✨ Hệ thống gợi ý AI thông minh
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-bold text-white leading-[1.15] mb-5">
              Khám Phá{' '}
              <em className="italic relative" style={{ color: '#F0C94D' }}>
                Hương Vị
                <span className="absolute bottom-1 left-0 right-0 h-[3px] rounded-full opacity-50" style={{ background: '#E6B422' }} />
              </em>
              <br />Phù Hợp Với Bạn
            </h1>
            <p className="text-[17px] text-white/70 leading-relaxed mb-8 max-w-[480px]">
              FoodRec sử dụng trí tuệ nhân tạo để gợi ý những món ăn Việt Nam phù hợp nhất với sở thích và khẩu vị của bạn.
            </p>
            <div className="flex gap-4 flex-wrap">
              <button onClick={() => navigate("/menu")} className="btn-primary">
                🍽️ Xem Thực Đơn
              </button>
              <a href="#about" className="btn-outline">Tìm hiểu thêm →</a>
            </div>
          </div>

          {/* Right — info card */}
          <div className="hidden lg:block animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="rounded-3xl p-8"
                 style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-[12px] font-semibold uppercase tracking-[2px] mb-4" style={{ color: '#F0C94D' }}>Gợi ý hôm nay</div>
              <div className="font-display text-[22px] font-semibold text-white mb-3">Phân tích sở thích & đề xuất thực đơn</div>
              <p className="text-sm text-white/60 mb-6">Hệ thống phân tích dữ liệu đánh giá, lịch sử đặt hàng để đưa ra gợi ý chính xác nhất.</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {['🌶 Cay vừa', '🥗 Healthy', '💰 Giá tốt', '🍚 Cơm niêu', '🥬 Chay'].map((t) => (
                  <span key={t} className="px-3.5 py-1.5 rounded-full text-[12px] font-medium text-white/70"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                {[{ v: '160+', l: 'Món ăn' }, { v: '95%', l: 'Độ chính xác' }, { v: '4.8', l: 'Đánh giá' }].map((s) => (
                  <div key={s.l}>
                    <div className="font-display text-[28px] font-bold" style={{ color: '#F0C94D' }}>{s.v}</div>
                    <div className="text-[12px] text-white/50 mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES STRIP ===== */}
      <div style={{ background: '#FDF6EC', borderBottom: '1px solid #E8DDD4' }}>
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="flex items-center gap-4 py-7 px-5 relative">
              {i < FEATURES.length - 1 && (
                <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-10" style={{ background: '#E8DDD4' }} />
              )}
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-[22px] flex-shrink-0"
                   style={{ background: 'linear-gradient(135deg, #FDF3D7, #FAE8B0)' }}>
                {f.icon}
              </div>
              <div>
                <h4 className="text-sm font-bold" style={{ color: '#4E342E' }}>{f.title}</h4>
                <p className="text-[12px]" style={{ color: '#8D6E63' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== ABOUT ===== */}
      <section id="about" className="py-20 px-6" style={{ background: '#FFFAF3' }}>
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div className="relative rounded-3xl overflow-hidden aspect-[4/3] flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #D7CCC8, #EFEBE9)', border: '1px solid #E8DDD4' }}>
            <div className="absolute inset-4 rounded-2xl pointer-events-none" style={{ border: '1px solid rgba(230,180,34,0.3)' }} />
            <div className="text-center p-10 relative z-[1]">
              <span className="text-[80px] block mb-4">🍲</span>
              <p className="font-display text-lg italic" style={{ color: '#795548' }}>"Mỗi món ăn là một câu chuyện"</p>
            </div>
          </div>
          <div>
            <span className="section-label text-left">Về FoodRec</span>
            <h2 className="section-title text-left mb-5">Hệ Thống Gợi Ý Thực Đơn Thông Minh</h2>
            <p className="text-[15px] leading-relaxed mb-6" style={{ color: '#5D4037' }}>
              FoodRec là hệ thống sử dụng trí tuệ nhân tạo để phân tích sở thích ẩm thực của bạn, từ đó đề xuất những món ăn phù hợp nhất. Chúng tôi kết hợp giữa công nghệ hiện đại và ẩm thực truyền thống Việt Nam.
            </p>
            <ul className="space-y-3 mb-7">
              <li className="flex gap-3 text-sm leading-relaxed" style={{ color: '#5D4037' }}>
                <span className="mt-0.5 flex-shrink-0">🍃</span>
                Thuật toán collaborative filtering phân tích dữ liệu đánh giá từ hàng trăm khách hàng để tìm ra xu hướng ẩm thực phù hợp.
              </li>
              <li className="flex gap-3 text-sm leading-relaxed" style={{ color: '#5D4037' }}>
                <span className="mt-0.5 flex-shrink-0">🍃</span>
                Thực đơn đa dạng với hơn 160 món từ khai vị, món chính đến tráng miệng, đáp ứng mọi khẩu vị và ngân sách.
              </li>
            </ul>
            <button onClick={() => navigate("/menu")} className="btn-primary">📋 Khám Phá Thực Đơn</button>
          </div>
        </div>
      </section>

      {/* ===== TRENDING DISHES ===== */}
      <section className="py-20 px-6" style={{ background: '#FDF6EC' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <span className="section-label">Thực đơn nổi bật</span>
            <h2 className="section-title">Món Ăn Phổ Biến Hôm Nay</h2>
            <p className="text-base mt-3 max-w-[560px] mx-auto" style={{ color: '#8D6E63' }}>
              Khám phá những món ăn được yêu thích nhất, được hệ thống AI đề xuất dựa trên đánh giá của thực khách
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl" style={{ border: '1px solid #E8DDD4' }}>
              <Loading label="Đang tải món phổ biến..." />
            </div>
          ) : error ? (
            <div className="rounded-2xl p-5" style={{ border: '1px solid #FECDD3', background: '#FFF1F2' }}>
              <div className="text-sm font-semibold text-rose-800">Có lỗi xảy ra</div>
              <div className="mt-1 text-sm text-rose-700">{error}</div>
            </div>
          ) : trending.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-8 text-center bg-white" style={{ borderColor: '#E8DDD4' }}>
              <div className="text-sm font-semibold" style={{ color: '#3E2723' }}>Chưa có dữ liệu món phổ biến</div>
              <div className="mt-1 text-sm" style={{ color: '#8D6E63' }}>Hãy quay lại sau hoặc thử xem thực đơn.</div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trending.map((dish) => (
                <DishCard key={dish.id ?? dish.dish_id} dish={dish} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <button onClick={() => navigate("/menu")} className="btn-primary">📋 Xem Tất Cả Thực Đơn</button>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 px-6" style={{ background: '#FFFAF3' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <span className="section-label">Cách hoạt động</span>
            <h2 className="section-title">Gợi Ý Thông Minh Trong 3 Bước</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[900px] mx-auto">
            {HIW_STEPS.map((step, i) => (
              <div key={step.title} className="relative text-center px-7 py-10 bg-white rounded-3xl transition-all duration-300 hover:shadow-lg"
                   style={{ border: '1px solid #E8DDD4' }}>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-extrabold"
                     style={{ background: 'linear-gradient(135deg, #E6B422, #D4A017)', color: '#3E2723', boxShadow: '0 4px 12px rgba(230,180,34,0.3)' }}>
                  {i + 1}
                </div>
                <span className="text-5xl mb-4 block">{step.icon}</span>
                <h3 className="font-display text-xl font-semibold mb-2.5" style={{ color: '#3E2723' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8D6E63' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 px-6" style={{ background: 'linear-gradient(135deg, #3E2723, #4E342E)' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <span className="text-[13px] font-bold uppercase tracking-[3px] mb-3 block" style={{ color: '#F0C94D' }}>Khách hàng nói gì</span>
            <h2 className="font-display text-4xl font-bold text-white">Trải Nghiệm Từ Thực Khách</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1000px] mx-auto">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1"
                   style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="font-display text-4xl mb-3" style={{ color: '#E6B422' }}>"</div>
                <p className="text-sm text-white/70 leading-relaxed italic mb-5">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold font-display"
                       style={{ background: 'linear-gradient(135deg, #E6B422, #F0C94D)', color: '#3E2723' }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-[12px] text-white/40">{t.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-20 px-6" style={{ background: '#FDF6EC' }}>
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center py-8 px-5 bg-white rounded-2xl transition-all duration-300 hover:shadow-lg"
                 style={{ border: '1px solid #E8DDD4' }}>
              <span className="text-4xl block mb-3">{s.icon}</span>
              <div className="font-display text-4xl font-bold mb-1" style={{ color: '#3E2723' }}>{s.value}</div>
              <div className="text-[13px] font-medium" style={{ color: '#8D6E63' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 px-6 relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #E6B422, #D4A017)' }}>
        <div className="max-w-[700px] mx-auto text-center relative z-[1]">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#3E2723' }}>
            Bắt Đầu Khám Phá Thực Đơn Ngay Hôm Nay
          </h2>
          <p className="text-base mb-8 leading-relaxed" style={{ color: '#5D4037' }}>
            Để hệ thống AI thông minh giúp bạn tìm ra những món ăn ngon nhất, phù hợp nhất với khẩu vị của bạn.
          </p>
          <button onClick={() => navigate("/menu")} className="btn-dark">🚀 Xem Thực Đơn Ngay</button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
