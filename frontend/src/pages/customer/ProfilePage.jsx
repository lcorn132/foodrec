/**
 * [V6] ProfilePage
 * - Cập nhật thanh Tiến độ đơn hàng (Order Tracking Stepper)
 * - Nút Đánh giá hỗ trợ trạng thái "Đã đánh giá / Chỉnh sửa"
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PageHero from "../../components/PageHero";
import Loading from "../../components/Loading";
import RatingModal from "../../components/RatingModal";
import { getProfile, updateProfile, getCustomerOrders } from "../../api/userApi";
import { formatCurrency } from "../../utils/format";
import { validateProfile } from "../../utils/validation";
import { showToast } from "../../components/Toast";

const SM = {
  pending: { label: "Chờ xác nhận", color: "#F59E0B", bg: "#FDF3D7" },
  confirmed: { label: "Đã xác nhận", color: "#3B82F6", bg: "#DBEAFE" },
  cooking: { label: "Đang nấu", color: "#F97316", bg: "#FFEDD5" },
  delivering: { label: "Đang giao", color: "#8B5CF6", bg: "#EDE9FE" },
  completed: { label: "Hoàn thành", color: "#16A34A", bg: "#DCFCE7" },
  cancelled: { label: "Đã hủy", color: "#EF4444", bg: "#FEE2E2" },
};

const PRICE_RANGES = [
  { key: "", label: "Không chọn" },
  { key: "budget", label: "Bình dân (Dưới 50k)" },
  { key: "affordable", label: "Vừa phải (50k - 100k)" },
  { key: "moderate", label: "Trung bình (100k - 200k)" },
  { key: "premium", label: "Cao cấp (Trên 200k)" },
];

// [V6] Component Thanh Tiến Độ Đơn Hàng
function OrderTracker({ status }) {
  if (status === "cancelled") {
    return (
      <div className="mt-4 p-3 rounded-xl flex items-center justify-center gap-2" style={{ background: "#FEE2E2", color: "#EF4444" }}>
        <span className="text-lg">❌</span>
        <span className="text-sm font-bold">Đơn hàng đã bị hủy</span>
      </div>
    );
  }

  const flow = ["pending", "confirmed", "cooking", "delivering", "completed"];
  const currentIndex = flow.indexOf(status);

  return (
    <div className="relative mt-6 mb-4 px-2 sm:px-6">
      {/* Đường line nền */}
      <div className="absolute top-1/2 left-[10%] right-[10%] h-1 bg-[#E8DDD4] -z-10 -translate-y-1/2 rounded-full"></div>
      
      {/* Đường line chạy màu xanh */}
      <div className="absolute top-1/2 left-[10%] h-1 bg-[#16A34A] -z-10 -translate-y-1/2 rounded-full transition-all duration-700" 
           style={{ width: `${(currentIndex / (flow.length - 1)) * 80}%` }}></div>

      <div className="flex justify-between items-center relative z-10">
        {flow.map((s, idx) => {
          const isActive = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div key={s} className="flex flex-col items-center gap-1.5 w-16 bg-white py-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all duration-500
                ${isActive ? 'bg-[#16A34A] text-white shadow-md scale-110' : 'bg-[#E8DDD4] text-[#8D6E63]'}`}>
                {isActive ? '✓' : idx + 1}
              </div>
              <span className={`text-[10px] text-center font-semibold uppercase tracking-wide leading-tight
                ${isCurrent ? 'text-[#16A34A]' : isActive ? 'text-[#3E2723]' : 'text-[#8D6E63] hidden sm:block'}`}>
                {SM[s]?.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("profile");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [ratingOrder, setRatingOrder] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("foodrec_user");
    if (!stored) { navigate("/login"); return; }
    const u = JSON.parse(stored);
    if (!u?.id) { navigate("/login"); return; }
    setUser(u);
    Promise.all([
      getProfile(u.id).then(r => { setUser(r.data); setForm(r.data); }).catch(() => {}),
      getCustomerOrders(u.id).then(r => setOrders(r.data?.orders || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [navigate]);

  const handleSave = async () => {
    const { valid, errors: errs } = validateProfile({ ...form, phone: "" });
    setErrors(errs);
    if (!valid) {
      showToast("Vui lòng kiểm tra lại thông tin nhập!", "error");
      return;
    }
    try {
      await updateProfile(user.id, {
        name: form.name,
        phone: form.phone,
        email: form.email,
        preferred_categories: form.preferred_categories,
        preferred_price_range: form.preferred_price_range
      });
      const r = await getProfile(user.id);
      setUser(r.data);
      localStorage.setItem("foodrec_user", JSON.stringify(r.data));
      setEditing(false);
      showToast("Cập nhật thông tin thành công!");
      setTimeout(() => { window.dispatchEvent(new Event("userLoginChange")); }, 500);
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.response?.data?.detail || "Lưu thất bại do lỗi máy chủ!";
      showToast(errorMsg, "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("foodrec_user");
    window.dispatchEvent(new Event("userLoginChange"));
    navigate("/login");
  };

  if (loading) return <div className="min-h-dvh" style={{ background: "#FFFAF3" }}><Header /><Loading /></div>;

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#FFFAF3" }}>
      <Header />
      <PageHero title="Tài Khoản" subtitle="Quản lý thông tin và lịch sử đơn hàng"
        breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Tài khoản" }]} />

      <main className="flex-1 max-w-[900px] w-full mx-auto px-6 py-8 pb-16">
        <div className="flex gap-2 mb-6">
          {[{ k: "profile", l: "👤 Thông tin" }, { k: "orders", l: "📦 Lịch sử đơn hàng" }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
              style={{ background: tab === t.k ? "#3E2723" : "white", color: tab === t.k ? "white" : "#5D4037", border: tab === t.k ? "none" : "1px solid #E8DDD4" }}>{t.l}</button>
          ))}
        </div>

        {tab === "profile" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: "1px solid #E8DDD4" }}>
            <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid #EFEBE9" }}>
              <h3 className="font-display text-xl font-bold" style={{ color: "#3E2723" }}>Thông tin cá nhân</h3>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer transition-all hover:bg-[#FDE68A]" style={{ background: "#FDF3D7", color: "#D4A017", border: "none" }}>✏️ Chỉnh sửa</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(false); setForm(user); setErrors({}); }} className="text-sm px-4 py-2 rounded-lg cursor-pointer" style={{ background: "#EFEBE9", color: "#5D4037", border: "none" }}>Hủy</button>
                  <button onClick={handleSave} className="text-sm font-bold px-4 py-2 rounded-lg cursor-pointer hover:opacity-90" style={{ background: "#E6B422", color: "#3E2723", border: "none" }}>💾 Lưu</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#4E342E" }}>Họ tên</label>
                <input value={form.name || ""} disabled={!editing}
                  onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: null })); }}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none disabled:opacity-70 disabled:bg-[#F9FAFB]"
                  style={{ border: errors.name ? "1.5px solid #EF4444" : "1.5px solid #E8DDD4", background: "#FFFAF3" }} />
              </div>
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#4E342E" }}>Số điện thoại</label>
                <input value={form.phone || ""} disabled={true}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none disabled:opacity-70 disabled:bg-[#F9FAFB]"
                  style={{ border: "1.5px solid #E8DDD4", background: "#FFFAF3" }} />
              </div>
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#4E342E" }}>Email</label>
                <input value={form.email || ""} disabled={!editing}
                  onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: null })); }}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none disabled:opacity-70 disabled:bg-[#F9FAFB]"
                  style={{ border: errors.email ? "1.5px solid #EF4444" : "1.5px solid #E8DDD4", background: "#FFFAF3" }} />
              </div>
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#4E342E" }}>Danh mục yêu thích</label>
                <input value={form.preferred_categories || ""} disabled={!editing} placeholder="VD: Bò, Hải sản, Lẩu..."
                  onChange={e => { setForm(p => ({ ...p, preferred_categories: e.target.value })); }}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none disabled:opacity-70 disabled:bg-[#F9FAFB]"
                  style={{ border: "1.5px solid #E8DDD4", background: "#FFFAF3" }} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#4E342E" }}>Mức giá yêu thích (Hỗ trợ AI gợi ý)</label>
                <select value={form.preferred_price_range || ""} disabled={!editing}
                  onChange={e => { setForm(p => ({ ...p, preferred_price_range: e.target.value })); }}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none disabled:opacity-70 disabled:bg-[#F9FAFB] cursor-pointer"
                  style={{ border: "1.5px solid #E8DDD4", background: "#FFFAF3" }}>
                  {PRICE_RANGES.map(r => (
                    <option key={r.key} value={r.key}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 pt-5 flex justify-between items-center" style={{ borderTop: "1px solid #EFEBE9" }}>
              <span className="text-[12px] font-medium" style={{ color: "#8D6E63" }}>Ngày tham gia: {user?.created_date?.slice(0, 10) || "Gần đây"}</span>
              <button onClick={handleLogout}
                className="text-sm font-semibold px-5 py-2 rounded-lg cursor-pointer transition hover:bg-red-100" style={{ background: "#FEE2E2", color: "#EF4444", border: "none" }}>Đăng xuất</button>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl" style={{ border: "1px dashed #E8DDD4" }}>
                <div className="text-5xl mb-3">📦</div>
                <p className="font-display text-lg font-bold" style={{ color: "#3E2723" }}>Chưa có đơn hàng nào</p>
              </div>
            ) : orders.map(o => {
              const st = SM[o.status] || SM.pending;
              const isCompleted = o.status === "completed";
              // [Logic Đánh giá] Nếu API trả về o.is_rated = true thì hiện "Sửa đánh giá"
              const isRated = o.is_rated; 
              
              return (
                <div key={o.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow" style={{ border: "1px solid #E8DDD4" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="font-display text-base font-bold" style={{ color: "#3E2723" }}>Đơn #{o.id}</span>
                      <span className="text-[12px] ml-3 font-medium" style={{ color: "#8D6E63" }}>{o.order_date?.slice(0, 16)}</span>
                    </div>
                  </div>

                  {/* [V6] Component Thanh Tiến Độ */}
                  <OrderTracker status={o.status} />
                  
                  <div className="space-y-2 mb-4 mt-4 bg-[#FFFAF3] p-3 rounded-xl border border-[#EFEBE9]">
                    {o.dishes?.map((d, idx) => (
                      <div key={d.id || idx} className="flex justify-between text-sm" style={{ color: "#5D4037" }}>
                        <span className="flex gap-2">
                           <span className="font-bold text-[#8D6E63]">{d.qty || d.quantity || 1}x</span> 
                           {d.name}
                        </span>
                        <span className="font-semibold text-[#4E342E]">{formatCurrency((d.price || 0) * (d.qty || d.quantity || 1))}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-3" style={{ borderTop: "1px dashed #E8DDD4" }}>
                    <span className="text-sm font-medium" style={{ color: "#8D6E63" }}>{o.payment_method === "cod" ? "💵 COD" : "💳 Chuyển khoản"}</span>
                    <div className="flex items-center gap-4">
                      {/* [V6] Đổi chữ hiển thị dựa trên việc đã đánh giá hay chưa */}
                      {isCompleted && (
                        <button onClick={() => setRatingOrder(o)} className="text-[12px] font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                          style={{ 
                            background: isRated ? "#EFEBE9" : "#FDF3D7", 
                            color: isRated ? "#5D4037" : "#D4A017", 
                            border: isRated ? "1px solid #E8DDD4" : "1px solid #FDE68A" 
                          }}>
                          {isRated ? "✏️ Sửa đánh giá" : "⭐ Đánh giá món"}
                        </button>
                      )}
                      <span className="font-display text-xl font-bold" style={{ color: "#D4A017" }}>{formatCurrency(o.total_amount)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {ratingOrder && (
        <RatingModal
          order={ratingOrder}
          dishes={ratingOrder.dishes || []}
          userId={user?.id}
          onClose={() => setRatingOrder(null)}
          onDone={() => {
            setRatingOrder(null);
            // Có thể reload lại order API ở đây để cập nhật biến is_rated
            showToast("Đã lưu đánh giá!");
          }}
        />
      )}

      <Footer minimal />
    </div>
  );
}
