import { useEffect, useState } from "react";

let _showToast = () => {};

export function showToast(message, type = "success") {
  _showToast({ message, type, id: Date.now() });
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _showToast = (t) => {
      setToasts((p) => [...p, t]);
      setTimeout(() => setToasts((p) => p.filter((x) => x.id !== t.id)), 3000);
    };
  }, []);

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className="pointer-events-auto px-4 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 min-w-[240px]"
          style={{
            background: t.type === "success" ? "#16A34A" : t.type === "error" ? "#EF4444" : "#3E2723",
            color: "white",
            animation: "toastSlideIn 0.4s ease, toastFadeOut 0.4s ease 2.6s forwards",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}>
          <span>{t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}</span>
          {t.message}
        </div>
      ))}
      <style>{`
        @keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes toastFadeOut { to { transform: translateX(100%); opacity: 0; } }
      `}</style>
    </div>
  );
}
