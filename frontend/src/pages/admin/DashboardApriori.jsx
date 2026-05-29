import { useEffect, useMemo, useState } from "react";
import axios from "../../api/axios";

function Card({ title, value, note, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function RuleCard({ rule, index }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
        <div className="flex flex-wrap gap-1">
          {(rule.antecedent || []).map((item) => (
            <span key={`a-${item}`} className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
              {item}
            </span>
          ))}
        </div>
        <span className="font-bold text-slate-400">→</span>
        <div className="flex flex-wrap gap-1">
          {(rule.consequent || []).map((item) => (
            <span key={`c-${item}`} className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Metric label="Support" value={`${((rule.support || 0) * 100).toFixed(1)}%`} />
        <Metric label="Confidence" value={`${((rule.confidence || 0) * 100).toFixed(1)}%`} />
        <Metric label="Lift" value={(rule.lift || 0).toFixed(2)} />
        <Metric label="Số set chứa" value={rule.support_count ?? "–"} />
      </div>
    </div>
  );
}

function ItemsetRow({ row }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-1.5">
        {(row.itemset || []).map((item) => (
          <span key={item} className="rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-100">
            {item}
          </span>
        ))}
      </div>
      <div className="flex gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-1">support {((row.support || 0) * 100).toFixed(1)}%</span>
        <span className="rounded-full bg-slate-100 px-2 py-1">count {row.count}</span>
      </div>
    </div>
  );
}

export default function DashboardApriori() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("rules");
  const [dishName, setDishName] = useState("");
  const [recs, setRecs] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  const loadData = async () => {
    try {
      const res = await axios.get("/analytics/apriori/full");
      setData(res.data);
    } catch (error) {
      console.error("Không tải được Apriori report", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await axios.post("/analytics/apriori/refresh");
      setData(res.data);
    } catch (error) {
      console.error("Không chạy lại được Apriori", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRecommend = async () => {
    const q = dishName.trim();
    if (!q) return;
    setRecLoading(true);
    try {
      const res = await axios.get("/analytics/apriori/dish-recommendations", {
        params: { dish_name: q },
      });
      setRecs(res.data?.recommendations || []);
    } catch (error) {
      console.error("Không tải được gợi ý món", error);
      setRecs([]);
    } finally {
      setRecLoading(false);
    }
  };

  const summary = data?.summary || {};
  const dish = data?.dish_association || {};
  const stats = dish.stats || {};
  const transactions = dish.transactions_preview || [];
  const rules = dish.rules || [];
  const itemsets = dish.frequent_itemsets || [];
  const topItems = dish.single_item_supports || [];

  const tabs = useMemo(() => [
    { id: "rules", label: "Luật kết hợp" },
    { id: "itemsets", label: "Tập phổ biến" },
    { id: "transactions", label: "Giao dịch set menu" },
    { id: "recommend", label: "Gợi ý món" },
  ], []);

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Đang tải phân tích Apriori...</div>;
  }

  if (!data) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">Không tải được dữ liệu Apriori.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Apriori — Mối quan hệ giữa các món ăn</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Phân tích từ set menu Cơm Niêu Việt Nam và dữ liệu tăng cường dẫn xuất có đánh dấu. Giao dịch gốc vẫn được giữ riêng để báo cáo rõ nguồn dữ liệu thật.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {refreshing ? "Đang chạy..." : "Chạy lại Apriori"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Số giao dịch" value={summary.transactions_count ?? 0} note={`${summary.original_transactions_count ?? 0} gốc · ${summary.augmented_transactions_count ?? 0} tăng cường`} icon="🧾" />
        <Card title="Món unique" value={summary.total_unique_items ?? 0} note="Sau làm sạch và thu giảm" icon="🍽️" />
        <Card title="Tập phổ biến" value={summary.total_freq_itemsets ?? 0} note={`min_support = ${summary.min_support_count ?? 0} set`} icon="📦" />
        <Card title="Luật hợp lệ" value={summary.total_rules ?? 0} note={`min_conf = ${Math.round((summary.min_confidence || 0) * 100)}%`} icon="🔗" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Ngưỡng support" value={`${((stats.min_support || 0) * 100).toFixed(0)}% / ${stats.min_support_count ?? 0} giao dịch`} />
          <Metric label="Ngưỡng confidence" value={`${((stats.min_confidence || 0) * 100).toFixed(0)}%`} />
          <Metric label="Ngưỡng lift" value={stats.min_lift ?? "–"} />
          <Metric label="Kích thước giao dịch TB" value={stats.mean_transaction_size ?? "–"} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "rules" && (
        <div className="space-y-4">
          {rules.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
              Chưa có luật thỏa ngưỡng hiện tại. Có thể giảm min_support hoặc min_confidence trong service nếu muốn nhiều luật hơn.
            </div>
          ) : rules.map((rule, index) => <RuleCard key={`${index}-${rule.antecedent?.join("-")}`} rule={rule} index={index} />)}
        </div>
      )}

      {activeTab === "itemsets" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Món xuất hiện lặp lại trong các set menu</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {topItems.slice(0, 12).map((item) => (
                <div key={item.item} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-800">{item.item}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.count} set · {((item.support || 0) * 100).toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {itemsets.map((row, index) => <ItemsetRow key={`${index}-${row.itemset?.join("-")}`} row={row} />)}
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.transaction_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{tx.transaction_id} — {tx.set_name}</p>
                  <p className="text-xs text-slate-500">{Number(tx.price_vnd || 0).toLocaleString("vi-VN")}đ · {tx.item_count} món dùng khai phá</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(tx.items || []).map((item) => (
                  <span key={`${tx.transaction_id}-${item}`} className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "recommend" && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-900">Gợi ý món đi kèm từ luật kết hợp</h2>
            <p className="mt-1 text-sm text-slate-600">Nhập đúng tên một món có mặt trong set menu, ví dụ: “Cá kho làng vũ đại” hoặc “Gân bò xào cải chua”.</p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRecommend()}
              placeholder="Nhập tên món..."
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring-2"
            />
            <button
              onClick={handleRecommend}
              disabled={recLoading}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {recLoading ? "Đang tìm..." : "Tìm gợi ý"}
            </button>
          </div>
          <div className="space-y-2">
            {recs.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Chưa có kết quả gợi ý.</p>
            ) : recs.map((rec) => (
              <div key={rec.dish} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-bold text-slate-900">{rec.dish}</p>
                <p className="mt-1 text-xs text-slate-500">Confidence {((rec.confidence || 0) * 100).toFixed(1)}% · Lift {(rec.lift || 0).toFixed(2)} · Support {((rec.support || 0) * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
