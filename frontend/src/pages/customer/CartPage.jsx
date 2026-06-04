import { formatCurrency } from "../../utils/format.js";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";

import Header from "../../components/Header.jsx";
import Footer from "../../components/Footer.jsx";
import DishImage from "../../components/DishImage.jsx";
import PageHero from "../../components/PageHero.jsx";
import RecommendationList from "../../components/RecommendationList.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { getRecommendationsForCart } from "../../api/recommendationsApi.js";
import { getActiveVouchers, validateVoucher } from "../../api/vouchersApi.js";
import { makeCartDish, parseDishVariants } from "../../utils/dishVariants.js";
import { showToast } from "../../components/Toast.jsx";


const categoryEmojis = {
  'Khai vị': '🥩', 'Rau': '🥬', 'Bò': '🥩', 'Heo': '🐷',
  'Gà / Vịt': '🍗', 'Hải sản': '🦐', 'Lẩu': '🍲', 'Cơm': '🍚', 'Tráng miệng': '🍮',
};

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    voucher,
    updateQuantity,
    updateVariant,
    removeFromCart,
    getTotalItems,
    getTotalAmount,
    getDiscountAmount,
    getPayableAmount,
    setVoucher,
    clearVoucher,
  } = useCart();

  const [recs, setRecs] = useState(null);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const dishIds = useMemo(() => items.map((i) => i.id), [items]);
  const totalItems = getTotalItems();
  const totalAmount = getTotalAmount();
  const discountAmount = getDiscountAmount();
  const payableAmount = getPayableAmount();

  useEffect(() => {
    let alive = true;
    async function run() {
      if (dishIds.length === 0) { setRecs([]); return; }
      setRecs(null);
      try {
        const data = await getRecommendationsForCart(dishIds, 10);
        if (!alive) return;
        const items = Array.isArray(data) ? data : data?.recommendations ?? data?.items ?? [];
        setRecs(items);
      } catch {
        if (!alive) return;
        setRecs([]);
      }
    }
    run();
    return () => { alive = false; };
  }, [dishIds]);

  useEffect(() => {
    if (voucher && totalAmount < (voucher.voucher?.min_order_amount || 0)) {
      clearVoucher();
      setVoucherMessage("Mã giảm giá đã được gỡ vì đơn hàng không còn đạt mức tối thiểu.");
    }
  }, [totalAmount, voucher, clearVoucher]);

  useEffect(() => {
    let alive = true;
    async function loadVouchers() {
      try {
        const data = await getActiveVouchers(totalAmount);
        if (alive) setAvailableVouchers(data.items || []);
      } catch {
        if (alive) setAvailableVouchers([]);
      }
    }
    loadVouchers();
    return () => { alive = false; };
  }, [totalAmount]);

  const applyVoucher = async (code) => {
    setApplyingVoucher(true);
    setVoucherMessage("");
    try {
      const data = await validateVoucher({
        code,
        subtotal: totalAmount,
        items: items.map((item) => ({ id: item.id, qty: item.qty, price: item.price })),
      });
      setVoucher(data);
      setVoucherMessage(`${data.voucher.name}: giảm ${formatCurrency(data.discount_amount)} cho đơn này.`);
      showToast(`Đã áp dụng mã ${data.voucher.code}`);
    } catch (error) {
      clearVoucher();
      setVoucherMessage(error?.message || "Mã giảm giá không hợp lệ.");
    } finally {
      setApplyingVoucher(false);
    }
  };

  return (
    <div className="min-h-dvh" style={{ background: '#FFFAF3' }}>
      <Header />

      <PageHero
        title="Giỏ Hàng"
        subtitle="Kiểm tra lại món ăn trước khi đặt hàng"
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Giỏ hàng' },
        ]}
      />

      <main className="max-w-[1200px] mx-auto px-6 py-8 pb-16 space-y-12">
        {items.length === 0 ? (
          /* ===== EMPTY STATE ===== */
          <div className="rounded-3xl border-2 border-dashed p-16 text-center bg-white" style={{ borderColor: '#E8DDD4' }}>
            <div className="text-7xl mb-4">🛒</div>
            <h2 className="font-display text-2xl font-bold mb-2" style={{ color: '#3E2723' }}>
              Giỏ hàng đang trống
            </h2>
            <p className="text-[15px] mb-6" style={{ color: '#8D6E63' }}>
              Hãy thêm vài món từ thực đơn để nhận gợi ý phù hợp hơn.
            </p>
            <button
              onClick={() => navigate('/menu')}
              className="btn-primary"
            >
              🍽️ Khám Phá Thực Đơn
            </button>
          </div>
        ) : (
          /* ===== CART GRID ===== */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
            {/* Items */}
            <div className="space-y-4">
              {items.map((item) => {
                const parsedVariants = item.variantOptions?.length ? { baseName: item.baseName || item.name, options: item.variantOptions } : parseDishVariants(item.name);
                const canChangeVariant = parsedVariants.options.length > 1;
                return (
                  <div
                    key={item.cartKey || item.id}
                    className="flex gap-5 bg-white rounded-2xl p-5 transition-all duration-300 hover:shadow-lg"
                    style={{ border: '1px solid #E8DDD4' }}
                  >
                    {/* Image */}
                    <div className="w-[120px] h-[100px] flex-shrink-0 rounded-xl flex items-center justify-center"
                         style={{ background: 'linear-gradient(135deg, #EFEBE9, #FDF3D7)' }}>
                      <DishImage src={item.image_url} alt={item.name} rounded="rounded-xl" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="font-display text-lg font-semibold leading-tight" style={{ color: '#3E2723' }}>
                            {item.name}
                          </h3>
                          {item.variant && (
                            <div className="mt-1 text-xs font-semibold" style={{ color: '#B88900' }}>
                              Kiểu chế biến: {item.variant}
                            </div>
                          )}
                          {canChangeVariant && (
                            <select
                              value={item.variant || parsedVariants.options[0]}
                              onChange={(event) => {
                                const nextItem = makeCartDish(
                                  {
                                    id: item.id,
                                    name: `${parsedVariants.baseName}: ${parsedVariants.options.join("/")}`,
                                    price: item.price,
                                    image_url: item.image_url,
                                  },
                                  event.target.value,
                                );
                                updateVariant(item.cartKey || item.id, nextItem);
                              }}
                              className="mt-2 rounded-lg px-3 py-2 text-xs font-semibold outline-none"
                              style={{ border: '1px solid #E8DDD4', color: '#5D4037', background: '#FFF7E6' }}
                            >
                              {parsedVariants.options.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.cartKey || item.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer"
                          style={{ background: 'transparent', border: 'none', color: '#8D6E63' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8D6E63'; }}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Xóa</span>
                        </button>
                      </div>

                      <div className="text-[15px] font-bold mb-3" style={{ color: '#D4A017' }}>
                        {formatCurrency(item.price)}
                      </div>

                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Qty */}
                        <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '2px solid #E8DDD4' }}>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartKey || item.id, item.qty - 1)}
                            className="w-9 h-9 flex items-center justify-center cursor-pointer transition-colors hover:bg-brown-50"
                            style={{ background: 'transparent', border: 'none', color: '#6D4C41' }}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="w-10 h-9 flex items-center justify-center text-sm font-bold"
                               style={{ color: '#3E2723', borderLeft: '1px solid #E8DDD4', borderRight: '1px solid #E8DDD4' }}>
                            {item.qty}
                          </div>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartKey || item.id, item.qty + 1)}
                            className="w-9 h-9 flex items-center justify-center cursor-pointer transition-colors hover:bg-brown-50"
                            style={{ background: 'transparent', border: 'none', color: '#6D4C41' }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-sm" style={{ color: '#5D4037' }}>
                          Thành tiền:{' '}
                          <strong style={{ color: '#3E2723' }}>
                            {formatCurrency((Number(item.price) || 0) * item.qty)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ===== SIDEBAR ===== */}
            <div className="lg:sticky lg:top-[104px]">
              <div className="bg-white rounded-3xl p-7" style={{ border: '1px solid #E8DDD4', boxShadow: '0 12px 40px rgba(62,39,35,0.12)' }}>
                <h3 className="font-display text-xl font-bold mb-5 pb-4" style={{ color: '#3E2723', borderBottom: '1px solid #E8DDD4' }}>
                  Tóm tắt đơn hàng
                </h3>

                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#8D6E63' }}>Số lượng món</span>
                    <span className="font-semibold" style={{ color: '#4E342E' }}>{totalItems} phần</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#8D6E63' }}>Tạm tính</span>
                    <span className="font-semibold" style={{ color: '#4E342E' }}>{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#8D6E63' }}>Phí giao hàng</span>
                    <span className="font-semibold" style={{ color: '#16A34A' }}>Miễn phí</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#8D6E63' }}>Giảm giá {voucher?.voucher?.code ? `(${voucher.voucher.code})` : ''}</span>
                      <span className="font-semibold" style={{ color: '#16A34A' }}>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  <div className="h-px my-2" style={{ background: '#E8DDD4' }} />

                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold" style={{ color: '#3E2723' }}>Tổng cộng</span>
                    <span className="font-display text-2xl font-bold" style={{ color: '#D4A017' }}>
                      {formatCurrency(payableAmount)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-base font-bold cursor-pointer transition-all duration-300 mt-5"
                  style={{
                    background: 'linear-gradient(135deg, #E6B422, #D4A017)',
                    color: '#3E2723',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(230,180,34,0.35)',
                  }}
                >
                  🛒 Đặt hàng ngay
                </button>

                {/* Promo */}
                <div className="mt-5 space-y-2">
                  <div className="text-sm font-bold" style={{ color: '#3E2723' }}>Ưu đãi dành cho bạn</div>
                  {availableVouchers.length ? availableVouchers.map((item) => {
                    const selected = voucher?.voucher?.code === item.code;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        disabled={!item.eligible || applyingVoucher}
                        onClick={() => applyVoucher(item.code)}
                        className="w-full rounded-xl p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-70"
                        style={{
                          background: selected ? '#FDF3D7' : '#FFFDF8',
                          border: selected ? '2px solid #E6B422' : '1px solid #E8DDD4',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-bold" style={{ color: '#3E2723' }}>{item.name}</div>
                            <div className="mt-1 text-xs leading-relaxed" style={{ color: '#8D6E63' }}>{item.description || item.message}</div>
                          </div>
                          <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: item.eligible ? '#DCFCE7' : '#FDF3D7', color: item.eligible ? '#16A34A' : '#B88900' }}>
                            {item.eligible ? item.short_hint : 'Sắp dùng được'}
                          </span>
                        </div>
                        {!item.eligible && (
                          <div className="mt-2 text-[12px] font-semibold" style={{ color: '#B45309' }}>{item.message}</div>
                        )}
                      </button>
                    );
                  }) : (
                    <div className="rounded-xl px-3 py-4 text-center text-sm" style={{ background: '#FDF8F3', color: '#8D6E63' }}>
                      Hiện chưa có ưu đãi đang bật.
                    </div>
                  )}
                </div>
                {voucherMessage && (
                  <div className="mt-2 text-[12px] font-medium" style={{ color: voucher ? '#16A34A' : '#B45309' }}>
                    {voucherMessage}
                  </div>
                )}

                {/* Trust */}
                <div className="flex justify-center gap-6 mt-5 pt-4" style={{ borderTop: '1px solid #E8DDD4' }}>
                  {[
                    { icon: '🔒', text: 'An toàn' },
                    { icon: '🚚', text: 'Giao nhanh' },
                    { icon: '💯', text: 'Chất lượng' },
                  ].map((b) => (
                    <div key={b.text} className="text-center">
                      <span className="text-xl block mb-0.5">{b.icon}</span>
                      <span className="text-[11px] font-medium" style={{ color: '#8D6E63' }}>{b.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <RecommendationList title="Gợi ý phối món đi kèm" recommendations={recs} showAddButton />
      </main>

      <Footer minimal />
    </div>
  );
}
