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

function Section({ title, children, subtitle }) {
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
    } catch (error) {
      console.error("Không tải được preprocessing report", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await axios.post("/analytics/preprocessing-report/refresh");
      setData(res.data);
    } catch (error) {
      console.error("Không chạy lại được pipeline", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Đang tải báo cáo tiền xử lý...</div>;
  }

  if (!data) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">Không tải được dữ liệu tiền xử lý.</div>;
  }

  const summary = data.summary || {};
  const cleaning = data.cleaning || {};
  const transformation = data.transformation || {};
  const reduction = data.reduction || {};
  const tx = transformation.transactions || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tiền xử lý dữ liệu set menu</h1>
          <p className="mt-1 max-w-4xl text-sm text-slate-600">
            Quy trình được cài đặt bằng code: dữ liệu thô → làm sạch → biến đổi thành giao dịch → thu giảm để phục vụ Apriori.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {refreshing ? "Đang chạy..." : "Chạy lại pipeline"}
        </button>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
        <p className="font-semibold">Nguồn dữ liệu: {data.data_source?.name}</p>
        <p className="mt-1">{data.data_source?.note}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-900">Dữ liệu thu thập thật</p>
          <div className="mt-2 space-y-2">
            {(data.data_source?.real_collected_data || []).map((item) => (
              <p key={item} className="text-sm text-emerald-800">{item}</p>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-bold text-slate-900">Dữ liệu mô phỏng</p>
          <div className="mt-2 space-y-2">
            {(data.data_source?.simulated_data || []).map((item) => (
              <p key={item} className="text-sm text-slate-600">{item}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Dòng dữ liệu thô" value={summary.raw_rows ?? 0} note="Các món/dòng mô tả set" icon="📥" />
        <Card title="Set menu" value={summary.set_menu_count ?? 0} note="Giao dịch gốc" icon="🧾" />
        <Card title="Item dùng khai phá" value={summary.mining_item_rows ?? 0} note={`${summary.unique_mining_items ?? 0} món unique`} icon="🍽️" />
        <Card title="Giao dịch sạch" value={summary.transactions_count ?? 0} note={`${summary.avg_items_per_transaction ?? 0} món/set trung bình`} icon="🔗" />
      </div>

      <Section
        title="1. Làm sạch dữ liệu"
        subtitle="Áp dụng các kỹ thuật: kiểm tra thiếu, chuẩn hóa biểu diễn, tách dữ liệu gộp và chống trùng lặp."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {(cleaning.steps || []).map((step) => (
            <div key={step.name} className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{step.name}</p>
                  <p className="mt-1 text-xs text-slate-600">{step.detail}</p>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">{step.count}</span>
              </div>
            </div>
          ))}
        </div>

        {(cleaning.correction_examples || []).length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Giá trị thô</th>
                  <th className="px-3 py-2">Sau chuẩn hóa</th>
                </tr>
              </thead>
              <tbody>
                {(cleaning.correction_examples || []).map((row, index) => (
                  <tr key={`${row.raw}-${index}`} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-700">{row.raw}</td>
                    <td className="px-3 py-2 font-medium text-emerald-700">{row.clean}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        title="2. Biến đổi dữ liệu thành giao dịch"
        subtitle={transformation.description}
      >
        <div className="grid gap-3 md:grid-cols-4">
          <Card title="Số giao dịch" value={tx.count ?? 0} icon="🧾" />
          <Card title="Min món/set" value={tx.min_item_count ?? 0} icon="↘️" />
          <Card title="Max món/set" value={tx.max_item_count ?? 0} icon="↗️" />
          <Card title="Trung bình" value={tx.avg_item_count ?? 0} icon="📊" />
        </div>

        <div className="mt-4 space-y-3">
          {(tx.preview || []).map((row) => (
            <div key={row.transaction_id} className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-900">{row.transaction_id} — {row.set_name}</p>
              <p className="mt-1 text-xs text-slate-500">{Number(row.price_vnd || 0).toLocaleString("vi-VN")}đ · {row.item_count} món dùng khai phá</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {String(row.items || "").split("|").map((item) => item.trim()).filter(Boolean).map((item) => (
                  <span key={`${row.transaction_id}-${item}`} className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="3. Thu giảm dữ liệu trước Apriori"
        subtitle={reduction.description}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {(reduction.excluded_item_groups || []).map((group) => (
            <div key={group.group} className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-100">
              <p className="text-sm font-bold text-amber-900">{group.group}</p>
              <p className="mt-1 text-xs text-amber-800">{group.rows} dòng bị loại khỏi dữ liệu khai phá</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(group.items || []).map((item) => (
                  <span key={item} className="rounded-full bg-white px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">Các món xuất hiện lặp lại sau khi làm sạch</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {(reduction.top_repeated_items || []).map((item) => (
              <div key={item.item} className="rounded-lg bg-white p-3 ring-1 ring-slate-100">
                <p className="text-sm font-semibold text-slate-800">{item.item}</p>
                <p className="mt-1 text-xs text-slate-500">Xuất hiện trong {item.transaction_count} set</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {(data.method_notes || []).length > 0 && (
        <Section title="Ghi chú phương pháp">
          <div className="space-y-2">
            {(data.method_notes || []).map((note) => (
              <p key={note} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">• {note}</p>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
