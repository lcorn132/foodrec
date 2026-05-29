import { useEffect, useState } from "react";
import { getAssociationRules, getRecommendationRate } from "../../api/analyticsApi";
import Loading from "../../components/Loading";

function BarChart({ data }) {
  if (!data?.length) {
    return <p className="text-center py-10 text-sm" style={{ color: "#8D6E63" }}>Chưa đủ dữ liệu để phân tích</p>;
  }

  const max = Math.max(...data.map(d => d.pct), 1);

  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
               style={{ background: i < 3 ? "#E6B422" : "#EFEBE9", color: i < 3 ? "#3E2723" : "#8D6E63" }}>{i + 1}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold mb-1 truncate" style={{ color: "#3E2723" }}>{d.combo}</div>
            <div className="w-full h-7 rounded-full overflow-hidden" style={{ background: "#EFEBE9" }}>
              <div className="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700"
                   style={{ width: `${Math.max((d.pct / max) * 100, 8)}%`, background: "linear-gradient(90deg, #E6B422, #D4A01799)" }}>
                <span className="text-[11px] font-bold text-white drop-shadow">{d.pct}%</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 text-right" style={{ width: 60 }}>
            <div className="text-[11px] font-bold" style={{ color: "#16A34A" }}>{d.count} lần</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardComboAnalysis() {
  const [rules, setRules] = useState(null);
  const [recRate, setRecRate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAssociationRules(0.02, 0.25).catch(() => ({ rules: [], total_transactions: 0 })),
      getRecommendationRate().catch(() => ({ rate: 0 })),
    ]).then(([ar, rr]) => {
      setRules(ar);
      setRecRate(rr);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading label="Đang phân tích dữ liệu set menu..." />;

  const chartData = (rules?.rules || []).slice(0, 5).map((r) => ({
    combo: `${r.antecedent} + ${r.consequent}`,
    pct: Math.round((r.confidence || 0) * 100),
    count: r.count || 0,
  }));
  const tableData = (rules?.rules || []).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: "#3E2723" }}>Phân Tích Set Menu & Món Đi Kèm</h1>
        <p className="text-sm" style={{ color: "#8D6E63" }}>
          Phân tích từ {rules?.total_transactions || 0} giao dịch gồm set menu gốc và dữ liệu tăng cường dẫn xuất từ Cơm Niêu Việt Nam.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8DDD4" }}>
        <h3 className="font-display text-lg font-bold mb-1" style={{ color: "#3E2723" }}>Top Cặp Món Phổ Biến Trong Set Menu</h3>
        <p className="text-[12px] mb-5" style={{ color: "#8D6E63" }}>
          Tỷ lệ giao dịch có món B khi đã có món A.
        </p>
        <BarChart data={chartData} />
      </div>

      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8DDD4" }}>
        <h3 className="font-display text-lg font-bold mb-4" style={{ color: "#3E2723" }}>Chi Tiết Các Cặp Món</h3>
        {tableData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  {["#", "Khi khách gọi...", "", "Thường gọi thêm...", "Tỷ lệ đồng xuất hiện", "Mức độ liên quan", "Số lần"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-bold uppercase tracking-wider px-3 py-2.5"
                        style={{ color: "#4E342E", background: "#FDF6EC", borderBottom: "2px solid #E8DDD4" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((r, i) => (
                  <tr key={i} className="hover:bg-gold-100/20 transition-colors">
                    <td className="px-3 py-2.5 font-bold" style={{ color: "#D4A017", borderBottom: "1px solid #EFEBE9" }}>{i + 1}</td>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: "#3E2723", borderBottom: "1px solid #EFEBE9" }}>{r.antecedent}</td>
                    <td className="px-3 py-2.5 text-lg" style={{ color: "#D4A017", borderBottom: "1px solid #EFEBE9" }}>→</td>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: "#D4A017", borderBottom: "1px solid #EFEBE9" }}>{r.consequent}</td>
                    <td className="px-3 py-2.5" style={{ borderBottom: "1px solid #EFEBE9" }}>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                        {Math.round((r.confidence || 0) * 100)}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5" style={{ borderBottom: "1px solid #EFEBE9" }}>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: (r.lift || 0) > 1 ? "#DCFCE7" : "#FEE2E2", color: (r.lift || 0) > 1 ? "#16A34A" : "#EF4444" }}>
                        {(r.lift || 0) > 1.5 ? "Rất cao" : (r.lift || 0) > 1 ? "Cao" : "Trung bình"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: "#5D4037", borderBottom: "1px solid #EFEBE9" }}>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-sm" style={{ color: "#8D6E63" }}>Chưa đủ dữ liệu để phân tích combo.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E8DDD4" }}>
        <h3 className="font-display text-lg font-bold mb-3" style={{ color: "#3E2723" }}>Hiệu Quả Mô Hình Gợi Ý</h3>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#EFEBE9" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#16A34A" strokeWidth="8"
                strokeDasharray={`${(recRate?.rate || 0) * 2.64} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-xl font-bold" style={{ color: "#3E2723" }}>{recRate?.rate || 0}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#3E2723" }}>
              {recRate?.orders_with_recs || 0} / {recRate?.total_orders || 0} giao dịch chứa cặp món phổ biến
            </p>
            <p className="text-[12px] mt-1" style={{ color: "#8D6E63" }}>
              Minh họa khả năng gợi ý từ luật kết hợp dựa trên các cặp món thường xuất hiện cùng nhau.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
