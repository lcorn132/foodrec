import { useEffect, useState } from "react";
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

function Section({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function DashboardPreprocessing() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await axios.get("/analytics/preprocessing-report");
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await axios.post("/analytics/preprocessing-report/refresh");
      setData(res.data);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Đang tải báo cáo tiền xử lý...</div>;
  if (!data) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">Không tải được dữ liệu tiền xử lý.</div>;

  const summary = data.summary || {};
  const cleaning = data.cleaning || {};
  const transformation = data.transformation || {};
  const reduction = data.reduction || {};
  const tx = transformation.transactions || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tiền xử lý dữ liệu thực phẩm thật</h1>
          <p className="mt-1 max-w-4xl text-sm text-slate-600">
            Dữ liệu gốc lấy từ Open Food Facts. Pipeline xử lý bằng code: thu thập, làm sạch, tăng cường đặc trưng, biến đổi thành giao dịch nguyên liệu và thu giảm dữ liệu.
          </p>
        </div>
        <button onClick={refresh} disabled={refreshing} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60">
          {refreshing ? "Đang chạy..." : "Chạy lại pipeline"}
        </button>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
        <p className="font-semibold">Nguồn dữ liệu: {data.data_source?.name}</p>
        <p className="mt-1">{data.data_source?.note}</p>
        <p className="mt-1 text-xs">File gốc: {data.data_source?.raw_file} · File sạch: {data.data_source?.clean_products_file} · Giao dịch: {data.data_source?.transactions_file}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Dòng dữ liệu thô" value={summary.raw_rows ?? 0} note="Sản phẩm thật" icon="📥" />
        <Card title="Sản phẩm sạch" value={summary.clean_product_rows ?? 0} note={`${summary.unique_categories ?? 0} nhóm thực phẩm`} icon="🥫" />
        <Card title="Nguyên liệu unique" value={summary.unique_ingredients ?? 0} note={`${summary.unique_countries ?? 0} quốc gia`} icon="🧂" />
        <Card title="Giao dịch Apriori" value={summary.transactions_count ?? 0} note={`${summary.avg_ingredients_per_product ?? 0} nguyên liệu/sản phẩm`} icon="🔗" />
      </div>

      <Section title="1. Làm sạch và tăng cường dữ liệu" subtitle="Áp dụng các bước tiền xử lý trong môn học: kiểm tra thiếu/trùng, chuẩn hóa, lọc nhiễu, tăng cường đặc trưng.">
        <div className="grid gap-3 md:grid-cols-2">
          {(cleaning.steps || []).map((step) => (
            <div key={step.name} className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{step.name}</p>
                  <p className="mt-1 text-xs text-slate-600">{step.detail}</p>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">{step.count ?? "-"}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="2. Biến đổi dữ liệu thành giao dịch" subtitle={transformation.description}>
        <div className="grid gap-3 md:grid-cols-4">
          <Card title="Số giao dịch" value={tx.count ?? 0} icon="🧾" />
          <Card title="Ít nhất" value={tx.min_item_count ?? 0} note="nguyên liệu/sản phẩm" icon="↘️" />
          <Card title="Nhiều nhất" value={tx.max_item_count ?? 0} note="nguyên liệu/sản phẩm" icon="↗️" />
          <Card title="Trung bình" value={tx.avg_item_count ?? 0} note="nguyên liệu/sản phẩm" icon="📊" />
        </div>

        <div className="mt-4 space-y-3">
          {(tx.preview || []).map((row) => (
            <div key={row.transaction_id} className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-900">{row.product_name}</p>
              <p className="mt-1 text-xs text-slate-500">{row.transaction_id} · {row.main_category || "Chưa phân nhóm"} · {row.item_count} nguyên liệu</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {String(row.items || "").split("|").map((item) => item.trim()).filter(Boolean).slice(0, 20).map((item) => (
                  <span key={`${row.transaction_id}-${item}`} className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="3. Thu giảm dữ liệu trước Apriori" subtitle={reduction.description}>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">Nguyên liệu xuất hiện nhiều sau làm sạch</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {(reduction.top_repeated_items || []).slice(0, 12).map((item) => (
              <div key={item.item} className="rounded-lg bg-white p-3 ring-1 ring-slate-100">
                <p className="text-sm font-semibold text-slate-800">{item.item}</p>
                <p className="mt-1 text-xs text-slate-500">Xuất hiện trong {item.transaction_count} sản phẩm</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Ghi chú phương pháp">
        <div className="space-y-2">
          {(data.method_notes || []).map((note) => (
            <p key={note} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">• {note}</p>
          ))}
        </div>
      </Section>
    </div>
  );
}
