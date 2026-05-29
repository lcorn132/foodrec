import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";

const NAV = [
  {
    section: "Quản lý",
    items: [
      { to: "/dashboard/orders", label: "Quản lý đơn hàng", icon: "📦" },
      { to: "/dashboard/dishes-manage", label: "Quản lý thực đơn", icon: "🍽️" },
    ],
  },
  {
    section: "Báo cáo",
    items: [
      { to: "/dashboard", label: "Tổng quan", icon: "📊", end: true },
      { to: "/dashboard/combo-analysis", label: "Phân tích nguyên liệu", icon: "🔗" },
      { to: "/dashboard/apriori", label: "Luật kết hợp", icon: "🔍" },
      { to: "/dashboard/preprocessing", label: "Dữ liệu", icon: "⚙️" },
    ],
  },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const w = collapsed ? 72 : 270;

  return (
    <div className="min-h-dvh flex" style={{ background: "#FFFAF3" }}>
      <aside
        className="flex-shrink-0 flex flex-col fixed top-0 left-0 h-dvh z-50 overflow-y-auto overflow-x-hidden transition-all duration-300"
        style={{ width: w, background: "linear-gradient(180deg, #3E2723 0%, #2C1810 100%)" }}
      >
        <div className="px-4 py-4 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            type="button"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 cursor-pointer"
            style={{ background: "#E6B422", boxShadow: "0 4px 12px rgba(230,180,34,0.3)", border: "none" }}
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Mở menu" : "Thu gọn menu"}
          >
            🍜
          </button>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-display text-lg font-bold text-white leading-tight whitespace-nowrap">
                Food<span style={{ color: "#F0C94D" }}>Rec</span>
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: "rgba(255,255,255,0.25)" }}>
                Trang quản trị
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 px-2">
          {NAV.map((sec) => (
            <div key={sec.section}>
              {!collapsed && (
                <div className="px-3 py-2 mt-3 first:mt-0 text-[9px] font-bold uppercase tracking-[2px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {sec.section}
                </div>
              )}
              {sec.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all no-underline my-0.5 ${isActive ? "text-white" : "text-white/40 hover:text-white/80 hover:bg-white/5"}`}
                  style={({ isActive }) => (isActive ? { background: "rgba(230,180,34,0.15)", borderLeft: "3px solid #E6B422" } : {})}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="px-2 pb-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <NavLink to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-medium text-white/30 hover:text-white/60 hover:bg-white/5 transition-all no-underline">
            <span>🌐</span>{!collapsed && "Về trang khách hàng"}
          </NavLink>
        </div>
      </aside>

      <main className="flex-1 min-h-dvh transition-all duration-300" style={{ marginLeft: w }}>
        <div className="sticky top-0 z-40 px-8 py-3 flex items-center justify-between bg-white/90 backdrop-blur-lg" style={{ borderBottom: "1px solid #E8DDD4" }}>
          <div>
            <h2 className="font-display text-base font-bold" style={{ color: "#3E2723" }}>FoodRec - Trang quản trị</h2>
            <p className="text-[11px]" style={{ color: "#8D6E63" }}>Quản lý thực đơn, đơn hàng và báo cáo dữ liệu</p>
          </div>
          <div className="text-[11px] font-semibold px-3 py-1.5 rounded-full" style={{ background: "#DCFCE7", color: "#16A34A" }}>
            Đang hoạt động
          </div>
        </div>
        <div className="p-6 lg:p-8"><Outlet /></div>
      </main>
    </div>
  );
}
