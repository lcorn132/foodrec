import { useEffect, useMemo, useState } from "react";
import axios from "../../api/axios";

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/api\/?$/, "");

function formatNumber(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function Card({ title, value, note }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-slate-950">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function DashboardPreprocessing() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [running, setRunning] = useState(false);
  const [files, setFiles] = useState([]);
  const [clearExisting, setClearExisting] = useState(false);
  const [message, setMessage] = useState("");

  const loadStatus = async () => {
    try {
      const res = await axios.get("/data-pipeline/status");
      setStatus(res.data);
    } catch (error) {
      setMessage(error.message || "Không tải được trạng thái dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const uploadFiles = async () => {
    if (!files.length) {
      setMessage("Bạn cần chọn ít nhất một file Excel.");
      return;
    }
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    setUploading(true);
    setMessage("");
    try {
      await axios.post(`/data-pipeline/upload?clear_existing=${clearExisting}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      });
      setFiles([]);
      setMessage("Đã upload dữ liệu raw. Bạn có thể chạy xử lý.");
      await loadStatus();
    } catch (error) {
      setMessage(error.message || "Upload thất bại.");
    } finally {
      setUploading(false);
    }
  };

  const runPipeline = async () => {
    setRunning(true);
    setMessage("");
    try {
      const res = await axios.post("/data-pipeline/run?load_to_db=true", null, { timeout: 180_000 });
      setStatus(res.data);
      const loaded = res.data?.db_load?.loaded ?? 0;
      setMessage(`Đã xử lý dữ liệu thật và nạp ${formatNumber(loaded)} món sạch vào web.`);
    } catch (error) {
      setMessage(error.message || "Pipeline xử lý thất bại.");
    } finally {
      setRunning(false);
    }
  };

  const summary = status?.summary || {};
  const rawFiles = status?.raw_files || [];
  const charts = status?.charts || [];
  const stats = status?.statistics || {};
  const clusterRows = useMemo(() => Object.entries(stats?.kmeans?.clusters || {}), [stats]);
  const similarityBuckets = useMemo(() => Object.entries(stats?.content_based_recommendation?.score_buckets || {}), [stats]);

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Đang tải trạng thái dữ liệu...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Quản lý dữ liệu và tiền xử lý</h1>
          <p className="mt-1 max-w-4xl text-sm text-slate-600">
            Upload Excel raw, làm sạch thực đơn thật, gom cụm K-Means theo cấu trúc mâm cơm Việt, tính gợi ý tương đồng và sinh biểu đồ báo cáo. Không dùng hóa đơn sinh giả.
          </p>
        </div>
        <button onClick={loadStatus} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Làm mới
        </button>
      </div>

      {message && <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-900">{message}</div>}

      <Section title="1. Upload dữ liệu gốc" subtitle="Chọn một hoặc nhiều file Excel .xlsx/.xlsm được cào từ website Cơm Niêu Việt Nam.">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <label className="flex-1">
            <span className="mb-2 block text-sm font-semibold text-slate-700">File Excel raw</span>
            <input
              type="file"
              multiple
              accept=".xlsx,.xlsm"
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
            />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" checked={clearExisting} onChange={(event) => setClearExisting(event.target.checked)} />
            Xóa raw cũ trước khi upload
          </label>
          <button onClick={uploadFiles} disabled={uploading} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            {uploading ? "Đang upload..." : "Upload dữ liệu"}
          </button>
        </div>

        <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">File raw hiện có</th>
                <th className="px-3 py-2 text-right">Dung lượng</th>
              </tr>
            </thead>
            <tbody>
              {rawFiles.length ? rawFiles.map((file) => (
                <tr key={file.name} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800">{file.name}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{formatNumber(file.size)} bytes</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="2" className="px-3 py-6 text-center text-slate-500">Chưa có file raw.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="2. Chạy xử lý và nạp dữ liệu lên web" subtitle="Pipeline sinh dữ liệu sạch, bảng gợi ý tương đồng, biểu đồ báo cáo và nạp dishes_clean.csv vào web.">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-600">
            Trạng thái processed:{" "}
            <span className={status?.processed_ready ? "font-bold text-emerald-700" : "font-bold text-amber-700"}>
              {status?.processed_ready ? "Đã sẵn sàng" : "Chưa có dữ liệu processed"}
            </span>
          </div>
          <button onClick={runPipeline} disabled={running || rawFiles.length === 0} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
            {running ? "Đang xử lý..." : "Chạy pipeline và nạp web"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card title="Dòng dữ liệu thô" value={formatNumber(summary.raw_rows)} note="Đọc từ Excel raw" />
          <Card title="Món sạch" value={formatNumber(summary.clean_dishes)} note="Nạp lên web" />
          <Card title="Dòng set menu parse" value={formatNumber(summary.set_menu_items)} note="Từ mô tả thật" />
          <Card title="Cụm K-Means" value={formatNumber(summary.kmeans_clusters)} note="4 vai trò mâm cơm Việt" />
          <Card title="Dòng gợi ý" value={formatNumber(summary.content_similarity_rows)} note="Tương đồng nội dung" />
        </div>
      </Section>

      <Section title="3. Thống kê sau tiền xử lý" subtitle="Các số liệu này dùng trực tiếp cho báo cáo và slide.">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900">Phân bố cụm K-Means</h3>
            <div className="mt-3 space-y-2">
              {clusterRows.map(([cluster, count]) => (
                <div key={cluster} className="flex items-center justify-between gap-4 rounded-md bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-700">{cluster}</span>
                  <span className="font-bold text-slate-950">{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-bold text-slate-900">Gợi ý tương đồng</h3>
            <div className="mt-3 space-y-2">
              {similarityBuckets.map(([bucket, count]) => (
                <div key={bucket} className="flex items-center justify-between gap-4 rounded-md bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-700">{bucket}</span>
                  <span className="font-bold text-slate-950">{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="4. Biểu đồ báo cáo" subtitle="Các biểu đồ được backend sinh sau khi chạy pipeline, lưu trong processed/report_assets/charts.">
        {charts.length ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {charts.map((chart) => (
              <figure key={chart.name} className="rounded-lg border border-slate-200 bg-white p-3">
                <img src={`${API_ORIGIN}${chart.url}`} alt={chart.name} className="w-full rounded-md bg-white" />
                <figcaption className="mt-2 text-xs font-medium text-slate-500">{chart.name}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">
            Chưa có biểu đồ. Hãy chạy pipeline sau khi upload dữ liệu.
          </div>
        )}
      </Section>
    </div>
  );
}
