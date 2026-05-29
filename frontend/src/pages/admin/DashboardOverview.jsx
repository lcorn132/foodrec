import { useEffect, useState } from "react";
import { getOverview, getTopDishes, getAssociationRules, getRecommendationRate } from "../../api/analyticsApi";
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

function BarChartCombo({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-center py-8 text-sm" style={{ color: "#8D6E63" }}>Chưa đủ dữ liệu để hiển thị biểu đồ.</p>;
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div>
      <div className="flex items-end gap-3 justify-center" style={{ height: 220 }}>
        {data.map((d, i) => {
          const h = Math.max((d.value / maxVal) * 180, 16);
          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1" style={{ maxWidth: 120 }}>
              <span className="text-[12px] font-bold" style={{ color: "#3E2723" }}>{d.value}%</span>
              <div
                className="w-full rounded-t-lg transition-all duration-500"
                style={{ height: h, background: "linear-gradient(180deg, #E6B422, #D4A01788)" }}
                title={`${d.label}: ${d.value}%`}
              />
              <div className="text-[11px] font-medium text-center leading-tight mt-1" style={{ color: "#5D4037", minHeight: 34 }}>{d.label}</div>
            </div>
          );
        })}
      </div>
      <p className="text-center mt-4 text-[11px]" style={{ color: "#8D6E63" }}>
        Biểu đồ thể hiện confidence của các cặp món trong dữ liệu Apriori.
      </p>
    </div>
  );
}

export default function DashboardOverview() {
  const [ov, setOv] = useState(null);
  const [topDishes, setTopDishes] = useState([]);
  const [rules, setRules] = useState(null);
  const [recRate, setRecRate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOverview().catch(() => null),
      getTopDishes(5).catch(() => ({ data: [] })),
      getAssociationRules(0.04, 0.35).catch(() => ({ rules: [] })),
      getRecommendationRate().catch(() => ({ rate: 0 })),
    ]).then(([o, t, ar, rr]) => {
      setOv(o);
      setTopDishes(t?.data || []);
      setRules(ar);
      setRecRate(rr);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading label="Đang tải dữ liệu tổng quan..." />;

  const comboChartData = (rules?.rules || []).slice(0, 5).map((r) => ({
    label: `${r.antecedent?.split(" ").slice(0, 2).join(" ")} + ${r.consequent?.split(" ").slice(0, 2).join(" ")}`,
    value: Math.round((r.confidence || 0) * 100),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: "#3E2723" }}>Tổng quan</h1>
        <p className="text-sm" style={{ color: "#8D6E63" }}>Theo dõi doanh thu, đơn hàng, thực đơn và hiệu quả gợi ý.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon="💰" value={formatCurrency(ov?.total_revenue || 0)} label="Doanh thu" sub="Đã ghi nhận" color="#16A34A" />
        <StatCard icon="📦" value={ov?.total_orders ?? 0} label="Đơn hàng" sub={`${ov?.completed_orders || 0} hoàn thành`} />
        <StatCard icon="🍽️" value={ov?.total_dishes ?? 0} label="Món trong thực đơn" sub="Đang bán" color="#3B82F6" />
        <StatCard icon="🔗" value={`${recRate?.rate || 0}%`} label="Mức bao phủ luật" sub={`${recRate?.orders_with_recs || 0}/${recRate?.total_orders || 0} giao dịch`} color="#8B5CF6" />
      </div>

      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8DDD4" }}>
        <h3 className="font-display text-lg font-bold mb-1" style={{ color: "#3E2723" }}>Top 5 cặp món trong dữ liệu Apriori</h3>
        <p className="text-[12px] mb-5" style={{ color: "#8D6E63" }}>
          Dựa trên {rules?.total_transactions || 0} giao dịch gồm set menu thật và dữ liệu tăng cường.
        </p>
        <BarChartCombo data={comboChartData} />
      </div>

      {topDishes.length > 0 && (
        <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8DDD4" }}>
          <h3 className="font-display text-lg font-bold mb-4" style={{ color: "#3E2723" }}>Món được quan tâm nhiều</h3>
          <div className="space-y-3">
            {topDishes.map((d, i) => (
              <div key={d.dish_id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gold-100/20 transition-colors" style={{ border: "1px solid #EFEBE9" }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm font-bold"
                  style={{ background: i < 3 ? "linear-gradient(135deg, #E6B422, #D4A017)" : "#EFEBE9", color: i < 3 ? "#3E2723" : "#8D6E63" }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ color: "#3E2723" }}>{d.name}</div>
                  <div className="text-[11px]" style={{ color: "#8D6E63" }}>{d.category}</div>
                </div>
                <span className="font-bold text-sm px-2.5 py-0.5 rounded-lg" style={{ background: "#FDF3D7", color: "#D4A017" }}>
                  {d.n_orders || d.order_count || d.count || 0} lượt
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
