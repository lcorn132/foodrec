import { useEffect, useState } from "react";

import { getOverview, getPipelineStatus, getTopDishes } from "../../api/analyticsApi";
import Loading from "../../components/Loading";
import DynamicCharts from "../../components/admin/DynamicCharts.jsx";
import { formatCurrency } from "../../utils/format";

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");

function chartImageUrl(chart) {
  const path = `${chart.url}?v=${chart.modified || Date.now()}`;
  return API_ORIGIN ? `${API_ORIGIN}${path}` : path;
}

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

function MiniReportCharts({ charts }) {
  if (!charts.length) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {charts.slice(0, 4).map((chart, index) => (
        <figure key={chart.name} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <figcaption className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">
            Hình {index + 1}. {chart.title}
          </figcaption>
          <img src={chartImageUrl(chart)} alt={chart.title} className="block aspect-[80/47] w-full object-contain p-3" />
        </figure>
      ))}
    </div>
  );
}

export default function DashboardOverview() {
  const [overview, setOverview] = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [topDishes, setTopDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOverview().catch(() => null),
      getPipelineStatus().catch(() => null),
      getTopDishes(5).catch(() => ({ data: [] })),
    ]).then(([overviewData, pipelineData, topData]) => {
      setOverview(overviewData);
      setPipelineStatus(pipelineData);
      setTopDishes(topData?.data || []);
      setLoading(false);
    });
  }, []);

  const summary = pipelineStatus?.summary || {};
  const stats = pipelineStatus?.statistics || {};
  const chartData = stats?.chart_data || [];
  const chartImages = pipelineStatus?.charts || [];
  const clusterCount = summary.kmeans_clusters ?? 0;
  const silhouette = stats?.kmeans?.silhouette_score;

  if (loading) return <Loading label="Đang tải dữ liệu tổng quan..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: "#3E2723" }}>Tổng quan</h1>
        <p className="text-sm" style={{ color: "#8D6E63" }}>
          Theo dõi món ăn, đơn hàng và kết quả phân tích dữ liệu sau lần upload mới nhất.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="💰" value={formatCurrency(overview?.total_revenue || 0)} label="Doanh thu" sub="Đơn hoàn thành" color="#16A34A" />
        <StatCard icon="📦" value={overview?.total_orders ?? 0} label="Đơn hàng" sub={`${overview?.completed_orders || 0} hoàn thành`} />
        <StatCard icon="🍽️" value={overview?.total_dishes ?? 0} label="Món ăn" sub="Dữ liệu sạch" color="#3B82F6" />
        <StatCard icon="🧠" value={`${clusterCount} cụm`} label="K-Means" sub={silhouette ? `Silhouette ${silhouette}` : `${summary.content_similarity_rows || 0} quan hệ`} color="#8B5CF6" />
      </div>

      <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid #E8DDD4" }}>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-bold" style={{ color: "#3E2723" }}>Ảnh biểu đồ cho báo cáo</h3>
            <p className="text-[13px] leading-6" style={{ color: "#8D6E63" }}>
              Các ảnh này được sinh lại từ dữ liệu và kết quả thuật toán sau mỗi lần chạy xử lý.
            </p>
          </div>
          <span className="text-xs font-semibold" style={{ color: "#8D6E63" }}>{summary.clean_dishes || 0} món sạch</span>
        </div>
        <MiniReportCharts charts={chartImages} />
        {!chartImages.length && (
          <div className="rounded-xl px-4 py-8 text-center text-sm" style={{ background: "#FDF8F3", color: "#8D6E63" }}>
            Chưa có ảnh biểu đồ. Vào phần quản lý dữ liệu để upload và chạy xử lý.
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid #E8DDD4" }}>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-bold" style={{ color: "#3E2723" }}>Biểu đồ dữ liệu trên dashboard</h3>
            <p className="text-[13px]" style={{ color: "#8D6E63" }}>
              Render từ cùng dữ liệu thống kê sau lần upload và chạy xử lý mới nhất.
            </p>
          </div>
          <span className="text-xs font-semibold" style={{ color: "#8D6E63" }}>{summary.content_similarity_rows || 0} quan hệ tương đồng</span>
        </div>
        {chartData.length ? (
          <DynamicCharts charts={chartData} limit={4} />
        ) : (
          <div className="rounded-xl px-4 py-8 text-center text-sm" style={{ background: "#FDF8F3", color: "#8D6E63" }}>
            Chưa có biểu đồ. Upload dữ liệu và chạy xử lý để dashboard tự cập nhật.
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid #E8DDD4" }}>
        <h3 className="font-display mb-1 text-lg font-bold" style={{ color: "#3E2723" }}>Hướng xử lý dữ liệu hiện tại</h3>
        <p className="text-[13px] leading-relaxed" style={{ color: "#8D6E63" }}>
          Hệ thống sử dụng dữ liệu thực đơn thật, chuẩn hóa giá và mô tả, gom cụm K-Means++ theo đặc trưng món ăn, sau đó tính điểm tương đồng nội dung để phục vụ gợi ý. Phần hóa đơn/giao dịch sinh giả đã được loại bỏ khỏi thống kê.
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
