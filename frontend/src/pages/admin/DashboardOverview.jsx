import { useEffect, useState } from "react";

import { getOverview, getTopDishes } from "../../api/analyticsApi";
import Loading from "../../components/Loading";
import { formatCurrency } from "../../utils/format";

function StatCard({ icon, value, label, sub, color = "#E6B422" }) {
  return (
    <div className="rounded-2xl bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg" style={{ border: "1px solid #E8DDD4" }}>
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl text-xl" style={{ background: `${color}18` }}>{icon}</div>
        {sub && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#DCFCE7", color: "#16A34A" }}>{sub}</span>}
      </div>
      <div className="font-display mb-0.5 text-2xl font-bold" style={{ color: "#3E2723" }}>{value}</div>
      <div className="text-[12px] font-medium" style={{ color: "#8D6E63" }}>{label}</div>
    </div>
  );
}

export default function DashboardOverview() {
  const [overview, setOverview] = useState(null);
  const [topDishes, setTopDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOverview().catch(() => null),
      getTopDishes(5).catch(() => ({ data: [] })),
    ]).then(([overviewData, topData]) => {
      setOverview(overviewData);
      setTopDishes(topData?.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading label="Đang tải dữ liệu tổng quan..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: "#3E2723" }}>Tổng quan</h1>
        <p className="text-sm" style={{ color: "#8D6E63" }}>
          Theo dõi thực đơn, đơn hàng và dữ liệu món ăn đã tiền xử lý.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="💰" value={formatCurrency(overview?.total_revenue || 0)} label="Doanh thu" sub="Đã ghi nhận" color="#16A34A" />
        <StatCard icon="📦" value={overview?.total_orders ?? 0} label="Đơn hàng" sub={`${overview?.completed_orders || 0} hoàn thành`} />
        <StatCard icon="🍽️" value={overview?.total_dishes ?? 0} label="Món trong thực đơn" sub="Dữ liệu sạch" color="#3B82F6" />
        <StatCard icon="🧠" value="Content" label="Hướng gợi ý" sub="Không hóa đơn giả" color="#8B5CF6" />
      </div>

      <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid #E8DDD4" }}>
        <h3 className="font-display mb-1 text-lg font-bold" style={{ color: "#3E2723" }}>Hướng xử lý dữ liệu hiện tại</h3>
        <p className="text-[13px] leading-relaxed" style={{ color: "#8D6E63" }}>
          Hệ thống sử dụng dữ liệu thực đơn thật, chuẩn hóa giá và mô tả, gom cụm K-Means rồi gợi ý món bằng content-based filtering dựa trên danh mục, cụm món, keyword và độ gần giá. Phần hóa đơn/giao dịch sinh giả đã được loại bỏ.
        </p>
      </div>

      {topDishes.length > 0 && (
        <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid #E8DDD4" }}>
          <h3 className="font-display mb-4 text-lg font-bold" style={{ color: "#3E2723" }}>Món được quan tâm nhiều</h3>
          <div className="space-y-3">
            {topDishes.map((dish, index) => (
              <div key={dish.dish_id} className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-gold-100/20" style={{ border: "1px solid #EFEBE9" }}>
                <div className="font-display flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style={{ background: index < 3 ? "linear-gradient(135deg, #E6B422, #D4A017)" : "#EFEBE9", color: index < 3 ? "#3E2723" : "#8D6E63" }}>
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold" style={{ color: "#3E2723" }}>{dish.name}</div>
                  <div className="text-[11px]" style={{ color: "#8D6E63" }}>{dish.category}</div>
                </div>
                <span className="rounded-lg px-2.5 py-0.5 text-sm font-bold" style={{ background: "#FDF3D7", color: "#D4A017" }}>
                  {dish.n_orders || dish.order_count || dish.count || 0} lượt
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
