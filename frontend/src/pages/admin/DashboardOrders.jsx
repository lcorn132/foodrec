import { formatCurrency } from "../../utils/format";
import { useEffect, useState } from "react";
import { getAllOrders, updateOrderStatus } from "../../api/userApi";
import Loading from "../../components/Loading";

const STATUSES = ["pending", "confirmed", "cooking", "delivering", "completed", "cancelled"];
const SM = {
  pending: { l: "Chờ xác nhận", c: "#F59E0B", bg: "#FDF3D7", icon: "🕐" },
  confirmed: { l: "Đã xác nhận", c: "#3B82F6", bg: "#DBEAFE", icon: "✅" },
  cooking: { l: "Đang nấu", c: "#F97316", bg: "#FFEDD5", icon: "🍳" },
  delivering: { l: "Đang giao", c: "#8B5CF6", bg: "#EDE9FE", icon: "🚚" },
  completed: { l: "Hoàn thành", c: "#16A34A", bg: "#DCFCE7", icon: "✔️" },
  cancelled: { l: "Đã hủy", c: "#EF4444", bg: "#FEE2E2", icon: "❌" },
};

export default function DashboardOrders() {
  const [orders, setOrders] = useState([]); // Chứa TẤT CẢ đơn hàng
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [processingId, setProcessingId] = useState(null); // Trạng thái nút đang loading

  const load = (alive = true) => {
    setLoading(true);
    // [V6] Gọi API lấy tất cả, không truyền filter xuống backend nữa
    getAllOrders()
      .then(r => {
        if (alive) setOrders(r.data?.orders || []);
      })
      .catch(() => {
        if (alive) setOrders([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
  };

  useEffect(() => {
    let alive = true;
    load(alive);
    return () => { alive = false; };
  }, []); // Chỉ gọi API 1 lần lúc mới vào trang

  const handleStatus = async (id, status) => {
    
    setProcessingId(id);
    try {
      await updateOrderStatus(id, status);
      // Cập nhật state trực tiếp cho nhanh, không cần gọi lại API
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } catch (e) {
      alert("Cập nhật thất bại. Vui lòng thử lại!");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <Loading label="Đang tải dữ liệu đơn hàng..." />;

  // [V6] Tính toán thống kê dựa trên TẤT CẢ đơn hàng
  const statCounts = {};
  orders.forEach(o => { statCounts[o.status] = (statCounts[o.status] || 0) + 1; });

  // [V6] Lọc danh sách hiển thị bằng Frontend
  const displayOrders = filter ? orders.filter(o => o.status === filter) : orders;

  return (
    <div className="space-y-6 bg-[#FFFAF3] p-4 rounded-2xl min-h-screen">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: "#3E2723" }}>📦 Quản Lý Đơn Hàng</h1>
        <p className="text-sm" style={{ color: "#8D6E63" }}>Tổng cộng: {orders.length} đơn hàng trên hệ thống</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUSES.map(s => {
          const st = SM[s];
          const cnt = statCounts[s] || 0;
          return (
            <button key={s} onClick={() => setFilter(filter === s ? "" : s)}
              className="p-3 rounded-xl text-center cursor-pointer transition-all hover:shadow-md hover:-translate-y-1"
              style={{ 
                background: filter === s ? st.bg : "white", 
                border: filter === s ? `2px solid ${st.c}` : "1px solid #E8DDD4",
                opacity: filter && filter !== s ? 0.6 : 1
              }}>
              <div className="text-lg">{st.icon}</div>
              <div className="font-display text-xl font-bold" style={{ color: "#3E2723" }}>{cnt}</div>
              <div className="text-[10px] font-semibold" style={{ color: st.c }}>{st.l}</div>
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {displayOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl" style={{ border: "1px dashed #E8DDD4" }}>
          <p className="text-4xl mb-3">📭</p>
          <p style={{ color: "#8D6E63" }}>Không có đơn hàng nào{filter ? ` ở trạng thái "${SM[filter]?.l}"` : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayOrders.map(o => {
            const st = SM[o.status] || SM.pending;
            const expanded = expandedId === o.id;
            const isProcessing = processingId === o.id;

            return (
              <div key={o.id} className="bg-white rounded-2xl overflow-hidden transition-all shadow-sm" style={{ border: "1px solid #E8DDD4" }}>
                {/* Header row */}
                <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-[#FFFAF3] transition-colors"
                     onClick={() => setExpandedId(expanded ? null : o.id)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: st.bg }}>{st.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-base font-bold" style={{ color: "#3E2723" }}>#{o.id}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.c }}>{st.l}</span>
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: "#8D6E63" }}>
                      👤 {o.customer_name || "Khách"} • 📞 {o.customer_phone || "–"} • {o.order_date?.slice(0, 16)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-display text-lg font-bold" style={{ color: "#D4A017" }}>{formatCurrency(o.total_amount)}</div>
                    <div className="text-[10px]" style={{ color: "#8D6E63" }}>{o.dish_ids?.length || 0} món • {o.payment_method === 'cod' ? 'COD' : 'Online'}</div>
                  </div>
                  <span className="text-lg transition-transform" style={{ transform: expanded ? "rotate(180deg)" : "none", color: "#8D6E63" }}>▾</span>
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="px-4 pb-4 pt-0" style={{ borderTop: "1px solid #EFEBE9" }}>
                    <div className="py-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#4E342E" }}>Chi tiết món ăn</div>
                      <div className="flex flex-wrap gap-2">
                        {(o.dish_names || []).map((name, i) => {
                          const isRecommended = i > 0 && o.dish_names.length > 2;
                          return (
                            <span key={i} className="text-[12px] px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
                              style={{
                                background: isRecommended ? "#FDF3D7" : "#EFEBE9",
                                color: isRecommended ? "#D4A017" : "#5D4037",
                                border: isRecommended ? "1px solid #E6B422" : "1px solid transparent",
                              }}>
                              {isRecommended && <span className="text-[10px]">🤖</span>}
                              {name}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {o.address && <div className="text-[12px] py-1 font-medium" style={{ color: "#5D4037" }}>📍 Giao đến: {o.address}</div>}
                    {o.note && <div className="text-[12px] py-1 italic" style={{ color: "#EF4444" }}>📝 Ghi chú: {o.note}</div>}

                    {/* Action buttons (V6) */}
                    {o.status !== "completed" && o.status !== "cancelled" && (
                      <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: "1px dashed #EFEBE9" }}>
                        {isProcessing ? (
                          <span className="text-sm font-semibold italic text-gray-500">⏳ Đang xử lý...</span>
                        ) : (
                          <>
                            {o.status === "pending" && <button onClick={() => handleStatus(o.id, "confirmed")} className="text-[12px] font-bold px-4 py-2 rounded-lg cursor-pointer hover:opacity-80 transition" style={{ background: "#3B82F6", color: "white", border: "none" }}>✓ Xác nhận đơn</button>}
                            {o.status === "confirmed" && <button onClick={() => handleStatus(o.id, "cooking")} className="text-[12px] font-bold px-4 py-2 rounded-lg cursor-pointer hover:opacity-80 transition" style={{ background: "#F97316", color: "white", border: "none" }}>🍳 Bắt đầu nấu</button>}
                            {o.status === "cooking" && <button onClick={() => handleStatus(o.id, "delivering")} className="text-[12px] font-bold px-4 py-2 rounded-lg cursor-pointer hover:opacity-80 transition" style={{ background: "#8B5CF6", color: "white", border: "none" }}>🚚 Đưa cho Shipper</button>}
                            {o.status === "delivering" && <button onClick={() => handleStatus(o.id, "completed")} className="text-[12px] font-bold px-4 py-2 rounded-lg cursor-pointer hover:opacity-80 transition" style={{ background: "#16A34A", color: "white", border: "none" }}>✅ Đã giao thành công</button>}
                            
                            {/* Cho phép hủy đơn ở nhiều giai đoạn */}
                            {(o.status === "pending" || o.status === "confirmed" || o.status === "cooking") && (
                              <button onClick={() => handleStatus(o.id, "cancelled")} className="text-[12px] font-bold px-4 py-2 rounded-lg cursor-pointer hover:opacity-80 transition ml-auto" style={{ background: "#FEE2E2", color: "#EF4444", border: "1px solid #FECACA" }}>✗ Hủy đơn</button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}