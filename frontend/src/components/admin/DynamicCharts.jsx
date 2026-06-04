const COLORS = ["#A16207", "#2563EB", "#059669", "#DC2626", "#7C3AED", "#EA580C", "#0F766E", "#D97706"];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function normalizeData(data = []) {
  const rows = data
    .map((item) => ({ label: String(item.label || ""), value: Number(item.value) || 0 }))
    .filter((item) => item.label);
  const max = Math.max(...rows.map((item) => item.value), 1);
  const total = rows.reduce((sum, item) => sum + item.value, 0);
  return { rows, max, total };
}

function BarChart({ data }) {
  const { rows, max } = normalizeData(data);
  return (
    <div className="flex h-[300px] items-end gap-3 border-b border-l border-slate-200 px-4 pt-4">
      {rows.map((item, index) => {
        const height = Math.max(8, (item.value / max) * 220);
        return (
          <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <div className="text-[12px] font-bold text-slate-900">{formatNumber(item.value)}</div>
            <div
              className="w-full max-w-[54px] rounded-t-md"
              style={{ height, background: COLORS[index % COLORS.length] }}
            />
            <div className="h-14 w-full overflow-hidden text-center text-[11px] font-medium leading-snug text-slate-600">
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBarChart({ data }) {
  const { rows, max } = normalizeData(data);
  return (
    <div className="space-y-3">
      {rows.slice(0, 12).map((item, index) => (
        <div key={item.label} className="grid grid-cols-[minmax(150px,1fr)_minmax(180px,2fr)_64px] items-center gap-3 text-sm">
          <div className="truncate font-semibold text-slate-700" title={item.label}>
            {item.label}
          </div>
          <div className="h-5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%`, background: COLORS[index % COLORS.length] }}
            />
          </div>
          <div className="text-right font-bold text-slate-950">{formatNumber(item.value)}</div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }) {
  const { rows, total } = normalizeData(data);
  let cursor = 0;
  const gradient = rows
    .map((item, index) => {
      const start = cursor;
      const end = total ? cursor + (item.value / total) * 100 : cursor;
      cursor = end;
      return `${COLORS[index % COLORS.length]} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr] md:items-center">
      <div className="relative mx-auto h-56 w-56 rounded-full" style={{ background: `conic-gradient(${gradient || "#E5E7EB 0 100%"})` }}>
        <div className="absolute inset-12 flex flex-col items-center justify-center rounded-full bg-white text-center">
          <div className="text-3xl font-bold text-slate-950">{formatNumber(total)}</div>
          <div className="text-xs font-semibold text-slate-500">tổng số</div>
        </div>
      </div>
      <div className="space-y-3">
        {rows.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-3 w-3 flex-none rounded-sm" style={{ background: COLORS[index % COLORS.length] }} />
              <span className="truncate font-semibold text-slate-700">{item.label}</span>
            </div>
            <span className="font-bold text-slate-950">{formatNumber(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DynamicCharts({ charts = [], limit }) {
  const visibleCharts = limit ? charts.slice(0, limit) : charts;
  if (!visibleCharts.length) return null;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {visibleCharts.map((chart) => (
        <section key={chart.id || chart.title} className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 text-base font-bold text-slate-950">{chart.title}</h3>
          {chart.type === "donut" ? (
            <DonutChart data={chart.data} />
          ) : chart.type === "horizontal_bar" ? (
            <HorizontalBarChart data={chart.data} />
          ) : (
            <BarChart data={chart.data} />
          )}
        </section>
      ))}
    </div>
  );
}
