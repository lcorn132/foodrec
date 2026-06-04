import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const NAV = [
  {
    section: "Quản lý",
    items: [
      { to: "/dashboard/orders", label: "Quản lý đơn hàng", icon: "📦" },
      { to: "/dashboard/dishes-manage", label: "Quản lý món ăn", icon: "🍽️" },
    ],
  },
  {
    section: "Báo cáo",
    items: [
      { to: "/dashboard", label: "Tổng quan", icon: "📊", end: true },
      { to: "/dashboard/preprocessing", label: "Dữ liệu", icon: "⚙️" },
    ],
  },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const width = collapsed ? 72 : 270;

  return (
    <div className="min-h-dvh flex" style={{ background: "#FFFAF3" }}>
      <aside
        className="fixed left-0 top-0 z-50 flex h-dvh flex-shrink-0 flex-col overflow-y-auto overflow-x-hidden transition-all duration-300"
        style={{ width, background: "linear-gradient(180deg, #3E2723 0%, #2C1810 100%)" }}
      >
        <div className="flex flex-shrink-0 items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            type="button"
            className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl text-xl"
            style={{ background: "#E6B422", boxShadow: "0 4px 12px rgba(230,180,34,0.3)", border: "none" }}
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Mở menu" : "Thu gọn menu"}
          >
            🍜
          </button>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-display whitespace-nowrap text-lg font-bold leading-tight text-white">
                Food<span style={{ color: "#F0C94D" }}>Rec</span>
              </div>
              <div className="whitespace-nowrap text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
                Trang quản trị
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-2 py-3">
          {NAV.map((section) => (
            <div key={section.section}>
              {!collapsed && (
                <div className="mt-3 px-3 py-2 text-[9px] font-bold uppercase tracking-[2px] first:mt-0" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {section.section}
                </div>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `my-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium no-underline transition-all ${isActive ? "text-white" : "text-white/40 hover:bg-white/5 hover:text-white/80"}`}
                  style={({ isActive }) => (isActive ? { background: "rgba(230,180,34,0.15)", borderLeft: "3px solid #E6B422" } : {})}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0 text-base">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="flex-shrink-0 px-2 pb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <NavLink to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-medium text-white/30 no-underline transition-all hover:bg-white/5 hover:text-white/60">
            <span>🌐</span>
            {!collapsed && "Về trang khách hàng"}
          </NavLink>
        </div>
      </aside>

      <main className="min-h-dvh flex-1 transition-all duration-300" style={{ marginLeft: width }}>
        <div className="sticky top-0 z-40 flex items-center justify-between bg-white/90 px-8 py-3 backdrop-blur-lg" style={{ borderBottom: "1px solid #E8DDD4" }}>
          <div>
            <h2 className="font-display text-base font-bold" style={{ color: "#3E2723" }}>FoodRec - Trang quản trị</h2>
            <p className="text-[11px]" style={{ color: "#8D6E63" }}>Quản lý món ăn, đơn hàng và báo cáo dữ liệu</p>
          </div>
          <div className="rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ background: "#DCFCE7", color: "#16A34A" }}>
            Đang hoạt động
          </div>
        </div>
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
