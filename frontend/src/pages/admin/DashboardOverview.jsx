/**
 * [V6] Dashboard Tổng quan Kinh doanh
 * - Fix: Tổng đơn hàng đếm DYNAMIC từ API (không hardcode)
 * - formatCurrency chuẩn "100.000 ₫"
 * - Ngôn ngữ kinh doanh F&B, không thuật ngữ học thuật
 * - Biểu đồ Top cặp món (Bar Chart) dùng inline SVG
 */
import { useEffect, useState } from "react";
import { getOverview, getRatingDistribution, getTopDishes, getAssociationRules, getRecommendationRate } from "../../api/analyticsApi";
import Loading from "../../components/Loading";
import { formatCurrency } from "../../utils/format";

function StatCard({ icon, value, label, sub, color = "#E6B422" }) {
  return (
    <div className="bg-white rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5" style={{ border: "1px solid #E8DDD4" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: `${color}18` }}>{icon}</div>
        {sub && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#16A34A" }}>{sub}</span>}
      </div>
      <div className="font-display text-2xl font-bold mb-0.5" style={{ color: "#3E2723" }}>{value}</div>
      <div className="text-[12px] font-medium" style={{ color: "#8D6E63" }}>{label}</div>
    </div>
  );
}

// [V6] Bar chart component — inline SVG, không cần thư viện ngoài
function BarChartCombo({ data }) {
  if (!data || data.length === 0) return <p className="text-center py-8 text-sm" style={{ color: "#8D6E63" }}>Chưa đủ dữ liệu</p>;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barW = 100 / data.length;

  return (
    <div>
      <div className="flex items-end gap-3 justify-center" style={{ height: 200 }}>
        {data.map((d, i) => {
          const h = (d.value / maxVal) * 180;
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1" style={{ maxWidth: 100 }}>
              <span className="text-[12px] font-bold" style={{ color: "#3E2723" }}>{d.value}%</span>
              <div className="w-full rounded-t-lg relative group cursor-pointer transition-all duration-500 hover:opacity-90"
                   style={{ height: h, background: `linear-gradient(180deg, #E6B422, #D4A01788)`, minHeight: 8 }}>
                {/* Tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                  Tỷ lệ khách gọi thêm: {d.value}%
                </div>
              </div>
              <div className="text-[10px] font-medium text-center leading-tight mt-1" style={{ color: "#5D4037", minHeight: 32 }}>{d.label}</div>
            </div>
          );
        })}
      </div>
      <div className="text-center mt-3">
        <span className="text-[10px]" style={{ color: "#8D6E63" }}>Trục Y: Tỷ lệ khách gọi thêm (%) — Trục X: Cặp món ăn</span>
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  const [ov, setOv] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [topDishes, setTopDishes] = useState([]);
  const [rules, setRules] = useState(null);
  const [recRate, setRecRate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOverview().catch(() => null),
      getRatingDistribution().catch(() => ({ data: [] })),
      getTopDishes(5).catch(() => ({ data: [] })),
      getAssociationRules(0.15, 0.6).catch(() => ({ rules: [] })),
      getRecommendationRate().catch(() => ({ rate: 0 })),
    ]).then(([o, r, t, ar, rr]) => {
      setOv(o); setRatings(r?.data || []); setTopDishes(t?.data || []);
      setRules(ar); setRecRate(rr);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading label="Đang tải dữ liệu kinh doanh..." />;

  // [V6] Build bar chart data — Top 5 cặp món hay gọi cùng (ngôn ngữ F&B)
  const comboChartData = (rules?.rules || []).slice(0, 5).map((r) => ({
    label: `${r.antecedent?.split(" ").slice(0, 2).join(" ")} + ${r.consequent?.split(" ").slice(0, 2).join(" ")}`,
    value: Math.round((r.confidence || 0) * 100),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: "#3E2723" }}>Tổng Quan Kinh Doanh</h1>
        <p className="text-sm" style={{ color: "#8D6E63" }}>Số liệu thời gian thực từ hệ thống</p>
      </div>

      {/* [V6] Stat cards — DYNAMIC count từ API, không hardcode */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" value={formatCurrency(ov?.total_revenue || 0)} label="Tổng doanh thu" sub="Thực tế" color="#16A34A" />
        <StatCard icon="📦" value={ov?.total_orders ?? 0} label="Tổng đơn hàng" sub={`${ov?.completed_orders || 0} hoàn thành`} />
        <StatCard icon="🍽️" value={ov?.total_dishes ?? 0} label="Số món ăn" sub="Thực đơn" color="#3B82F6" />
        <StatCard icon="⭐" value={`${ov?.avg_rating ?? 0}/5`} label="Đánh giá trung bình" sub={`${ov?.total_ratings || 0} lượt`} color="#F59E0B" />
      </div>

      {/* [V6] BIỂU ĐỒ: Top 5 cặp món gọi cùng — Bar Chart */}
      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8DDD4" }}>
        <h3 className="font-display text-lg font-bold mb-1" style={{ color: "#3E2723" }}>📊 Top 5 Cặp Món Được Gọi Cùng Nhau</h3>
        <p className="text-[12px] mb-5" style={{ color: "#8D6E63" }}>
          Biểu đồ thể hiện tỷ lệ set menu có món B khi đã có món A (dựa trên {rules?.total_transactions || 0} set menu)
        </p>
        <BarChartCombo data={comboChartData} />
      </div>

      {/* [V6] Hiệu suất gợi ý — circular */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8DDD4" }}>
          <h3 className="font-display text-lg font-bold mb-4" style={{ color: "#3E2723" }}>🤖 Hiệu Suất Gợi Ý Thực Đơn</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#EFEBE9" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#16A34A" strokeWidth="8"
                  strokeDasharray={`${(recRate?.rate || 0) * 2.64} 264`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-2xl font-bold" style={{ color: "#3E2723" }}>{recRate?.rate || 0}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: "#3E2723" }}>{recRate?.orders_with_recs || 0} / {recRate?.total_orders || 0} set menu</p>
              <p className="text-[12px] leading-relaxed" style={{ color: "#8D6E63" }}>
                Tỷ lệ set menu có chứa cặp món phổ biến — dùng để minh họa khả năng sinh gợi ý từ luật kết hợp.
              </p>
            </div>
          </div>
        </div>

        {/* Rating summary */}
        <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8DDD4" }}>
          <h3 className="font-display text-lg font-bold mb-4" style={{ color: "#3E2723" }}>⭐ Phân Bố Đánh Giá</h3>
          <div className="space-y-2">
            {ratings.map((r) => {
              const max = Math.max(...ratings.map((x) => x.count), 1);
              return (
                <div key={r.stars} className="flex items-center gap-3">
                  <span className="text-[13px] font-medium w-[40px]" style={{ color: "#5D4037" }}>{r.stars}</span>
                  <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: "#EFEBE9" }}>
                    <div className="h-full rounded-full transition-all duration-700"
                         style={{ width: `${(r.count / max) * 100}%`, background: r.rating >= 4 ? "#16A34A" : r.rating >= 3 ? "#F59E0B" : "#EF4444" }} />
                  </div>
                  <span className="text-[12px] font-bold w-[32px] text-right" style={{ color: "#3E2723" }}>{r.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top dishes */}
      {topDishes.length > 0 && (
        <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8DDD4" }}>
          <h3 className="font-display text-lg font-bold mb-4" style={{ color: "#3E2723" }}>🔥 Top Món Bán Chạy</h3>
          <div className="space-y-3">
            {topDishes.map((d, i) => (
              <div key={d.dish_id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gold-100/20 transition-colors" style={{ border: "1px solid #EFEBE9" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm font-bold"
                     style={{ background: i < 3 ? "linear-gradient(135deg, #E6B422, #D4A017)" : "#EFEBE9", color: i < 3 ? "#3E2723" : "#8D6E63" }}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ color: "#3E2723" }}>{d.name}</div>
                  <div className="text-[11px]" style={{ color: "#8D6E63" }}>{d.category}</div>
                </div>
                <span className="font-bold text-sm px-2.5 py-0.5 rounded-lg" style={{ background: "#FDF3D7", color: "#D4A017" }}>⭐ {d.avg_rating}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
