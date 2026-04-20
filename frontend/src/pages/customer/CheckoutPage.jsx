/**
 * [V6] CheckoutPage - Optimized
 * - Fix lỗi hiển thị sai tổng tiền sau khi clearCart
 * - Cảnh báo rõ ràng khi validation fail
 * - Tự động điền (Prefill) thông tin khách hàng mượt hơn
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import PageHero from "../../components/PageHero.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { formatCurrency } from "../../utils/format.js";
import { validateCheckout } from "../../utils/validation.js";

const PAYMENTS = [
  { id: "cod", icon: "💵", label: "Thanh toán khi nhận hàng", desc: "Trả tiền mặt cho shipper", tag: "Phổ biến" },
  { id: "bank", icon: "🏦", label: "Chuyển khoản ngân hàng", desc: "QR Code / Số tài khoản" },
  { id: "momo", icon: "💜", label: "Ví MoMo", desc: "Thanh toán qua MoMo" },
  { id: "zalopay", icon: "💙", label: "ZaloPay", desc: "Thanh toán qua ZaloPay" },
];

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#4E342E" }}>
      {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
    </label>
    {children}
    {error && <p className="text-[12px] mt-1 font-medium" style={{ color: "#EF4444" }}>⚠️ {error}</p>}
  </div>
);

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotalItems, getTotalAmount, clearCart } = useCart();
  
  // Lấy user từ localStorage một cách an toàn
  const user = (() => { try { return JSON.parse(localStorage.getItem("foodrec_user")); } catch { return null; } })();

  // Form states (Prefill luôn nếu có user)
  const [customerName, setCustomerName] = useState(user?.name || user?.full_name || "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState("cod");

  // Logic states
  const [placing, setPlacing] = useState(false);
  const [errors, setErrors] = useState({});
  const [orderResult, setOrderResult] = useState(null); // [V6] Lưu lại ID và giá tổng trước khi clear giỏ hàng

  // Tính toán giỏ hàng (Chỉ có ý nghĩa khi chưa đặt hàng)
  const totalAmount = getTotalAmount();
  const shippingFee = totalAmount >= 300000 ? 0 : 25000;
  const grandTotal = totalAmount + shippingFee;

  // [V6] Validate & Gọi API đặt hàng
  const handlePlaceOrder = async () => {
    const { valid, errors: errs } = validateCheckout({ address, customerName, customerPhone });
    setErrors(errs);
    
    // Nếu có lỗi, bật thông báo ngay để khách biết
    if (!valid) {
      const errorMsgs = Object.values(errs).filter(Boolean).join("\n");
      alert("Vui lòng kiểm tra lại thông tin giao hàng:\n" + errorMsgs);
      return;
    }

    setPlacing(true);
  try {
    const { checkout: checkoutApi } = await import("../../api/userApi.js");
    
    // Lấy ID người dùng từ localStorage
    const storedUser = JSON.parse(localStorage.getItem("foodrec_user"));
    const customerId = storedUser?.id || storedUser?.user_id;

    const res = await checkoutApi({
      customer_id: customerId, // QUAN TRỌNG: Phải gửi ID này lên Backend
      items: items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      payment_method: payment, 
      address: address, 
      note: note,
      customer_name: customerName, 
      customer_phone: customerPhone,
    });

      const orderId = res.data?.order_id || Math.floor(Math.random() * 90000 + 10000);
      
      // Chụp hình lại tổng tiền (grandTotal) lưu vào state trước khi xóa giỏ hàng
      setOrderResult({
        id: orderId,
        total: grandTotal
      });
      
      // Bây giờ xóa giỏ hàng thì màn hình thành công vẫn giữ được số tiền đúng
      clearCart();

    } catch (error) { 
      console.error(error);
      alert("Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!");
    } finally {
      setPlacing(false);
    }
  };

  // Nếu giỏ hàng trống mà chưa đặt thành công thì đá về trang giỏ hàng
  if (items.length === 0 && !orderResult) { 
    navigate("/cart"); 
    return null; 
  }

  // ===================== MÀN HÌNH THÀNH CÔNG =====================
  if (orderResult) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: "#FFFAF3" }}>
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="text-center max-w-[480px] bg-white rounded-3xl p-10" style={{ border: "1px solid #E8DDD4", boxShadow: "0 12px 40px rgba(62,39,35,0.1)" }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#DCFCE7" }}>
              <CheckCircle2 className="w-10 h-10" style={{ color: "#16A34A" }} />
            </div>
            <h2 className="font-display text-2xl font-bold mb-3" style={{ color: "#3E2723" }}>Đặt Hàng Thành Công!</h2>
            <p className="text-sm mb-6" style={{ color: "#5D4037" }}>
              Đơn hàng <strong style={{ color: "#D4A017" }}>#{orderResult.id}</strong> đã được tiếp nhận.<br/>
              Tổng thanh toán: <strong className="text-lg text-[#3E2723]">{formatCurrency(orderResult.total)}</strong>
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <button onClick={() => navigate("/")} className="px-5 py-2.5 rounded-xl font-bold transition hover:-translate-y-1" style={{ background: "#E6B422", color: "#3E2723" }}>🏠 Về trang chủ</button>
              <button onClick={() => navigate("/profile")} className="px-5 py-2.5 rounded-xl font-bold transition hover:-translate-y-1" style={{ border: "1.5px solid #E8DDD4", color: "#5D4037", background: "transparent" }}>📦 Xem đơn hàng</button>
            </div>
          </div>
        </main>
        <Footer minimal />
      </div>
    );
  }

  // ===================== MÀN HÌNH THANH TOÁN =====================
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#FFFAF3" }}>
      <Header />
      <PageHero title="Thanh Toán" subtitle="Hoàn tất đơn hàng của bạn"
        breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Giỏ hàng", href: "/cart" }, { label: "Thanh toán" }]} />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
          {/* CỘT TRÁI - Nhập thông tin */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: "1px solid #E8DDD4" }}>
              <h3 className="font-display text-lg font-bold mb-5 flex items-center gap-2" style={{ color: "#3E2723" }}>📍 Thông tin giao hàng</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Họ tên người nhận" required error={errors.customerName}>
                    <input value={customerName} onChange={e => { setCustomerName(e.target.value); setErrors(p => ({ ...p, customerName: null })); }}
                      placeholder="VD: Nguyễn Văn A" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors focus:border-[#E6B422]"
                      style={{ border: errors.customerName ? "1.5px solid #EF4444" : "1.5px solid #E8DDD4", background: "#FFFAF3" }} />
                  </Field>
                  <Field label="Số điện thoại" required error={errors.customerPhone}>
                    <input value={customerPhone} onChange={e => { setCustomerPhone(e.target.value); setErrors(p => ({ ...p, customerPhone: null })); }}
                      placeholder="VD: 0912345678" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors focus:border-[#E6B422]"
                      style={{ border: errors.customerPhone ? "1.5px solid #EF4444" : "1.5px solid #E8DDD4", background: "#FFFAF3" }} />
                  </Field>
                </div>
                <Field label="Địa chỉ giao hàng (Số nhà, Đường, Quận, TP)" required error={errors.address}>
                  <input value={address} onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: null })); }}
                    placeholder="VD: 12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors focus:border-[#E6B422]"
                    style={{ border: errors.address ? "1.5px solid #EF4444" : "1.5px solid #E8DDD4", background: "#FFFAF3" }} />
                </Field>
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#4E342E" }}>Ghi chú cho nhà hàng (Không bắt buộc)</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Ví dụ: Không hành, ít cay, xin thêm nước mắm..."
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none focus:border-[#E6B422] transition-colors" style={{ border: "1.5px solid #E8DDD4", background: "#FFFAF3" }} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: "1px solid #E8DDD4" }}>
              <h3 className="font-display text-lg font-bold mb-5 flex items-center gap-2" style={{ color: "#3E2723" }}>💳 Phương thức thanh toán</h3>
              <div className="space-y-3">
                {PAYMENTS.map(m => (
                  <button key={m.id} onClick={() => setPayment(m.id)} className="w-full flex items-center gap-4 p-4 rounded-xl text-left cursor-pointer transition-all hover:bg-[#FDF6EC]"
                    style={{ background: payment === m.id ? "linear-gradient(135deg, #FDF6EC, #FDF3D7)" : "white",
                      border: payment === m.id ? "2px solid #E6B422" : "1.5px solid #E8DDD4" }}>
                    <span className="text-2xl">{m.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold flex items-center gap-2" style={{ color: "#3E2723" }}>
                        {m.label} {m.tag && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#16A34A" }}>{m.tag}</span>}
                      </div>
                      <div className="text-[12px] mt-0.5" style={{ color: "#8D6E63" }}>{m.desc}</div>
                    </div>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
                      style={{ border: payment === m.id ? "none" : "2px solid #BCAAA4", background: payment === m.id ? "#E6B422" : "transparent" }}>
                      {payment === m.id && <span className="text-white text-[12px] font-bold">✓</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI - Bill */}
          <div className="lg:sticky lg:top-[104px]">
            <div className="bg-white rounded-3xl p-7" style={{ border: "1px solid #E8DDD4", boxShadow: "0 12px 40px rgba(62,39,35,0.12)" }}>
              <h3 className="font-display text-lg font-bold mb-5 pb-4" style={{ color: "#3E2723", borderBottom: "1px solid #E8DDD4" }}>
                Tóm tắt đơn hàng ({getTotalItems()} món)
              </h3>
              <div className="space-y-3 mb-5 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#EFEBE9", border: "1px solid #E8DDD4" }}>
                      {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" /> : '🍽️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: "#3E2723" }}>{item.name}</div>
                      <div className="text-[12px] font-medium" style={{ color: "#8D6E63" }}>x {item.qty}</div>
                    </div>
                    <div className="text-sm font-bold flex-shrink-0" style={{ color: "#D4A017" }}>{formatCurrency((item.price || 0) * item.qty)}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 py-4" style={{ borderTop: "1px dashed #E8DDD4", borderBottom: "1px dashed #E8DDD4" }}>
                <div className="flex justify-between text-sm font-medium"><span style={{ color: "#8D6E63" }}>Tạm tính</span><span style={{ color: "#4E342E" }}>{formatCurrency(totalAmount)}</span></div>
                <div className="flex justify-between text-sm font-medium"><span style={{ color: "#8D6E63" }}>Phí giao hàng</span>
                  {shippingFee === 0 ? <span style={{ color: "#16A34A" }}>Miễn phí</span> : <span style={{ color: "#4E342E" }}>{formatCurrency(shippingFee)}</span>}
                </div>
                {shippingFee > 0 && totalAmount < 300000 && (
                  <div className="text-[11px] text-right italic" style={{ color: "#D4A017" }}>
                    Mua thêm {formatCurrency(300000 - totalAmount)} để được Freeship!
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center py-5">
                <span className="text-base font-semibold" style={{ color: "#3E2723" }}>Tổng cộng</span>
                <span className="font-display text-2xl font-bold" style={{ color: "#D4A017" }}>{formatCurrency(grandTotal)}</span>
              </div>

              <button onClick={handlePlaceOrder} disabled={placing}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-base font-bold cursor-pointer transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #E6B422, #D4A017)", color: "#3E2723", border: "none" }}>
                {placing ? "⏳ Đang xử lý..." : "✅ Đặt Hàng Ngay"}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer minimal />
    </div>
  );
}