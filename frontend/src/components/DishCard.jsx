import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { showToast } from "./Toast";
import { formatCurrency } from "../utils/format";

const EMOJIS = {
  "Khai vị": "🥩",
  Rau: "🥬",
  Bò: "🥩",
  Heo: "🐷",
  "Gà / Vịt": "🍗",
  "Hải sản": "🦐",
  Lẩu: "🍲",
  Cơm: "🍚",
  "Tráng miệng": "🍮",
};

export default function DishCard({ dish, badge }) {
  const { addToCart } = useCart();
  const price = dish.price ?? 0;
  const emoji = EMOJIS[dish.category_name ?? dish.category] ?? "🍽️";
  const name = dish.dish_name ?? dish.name;
  const id = dish.dish_id ?? dish.id;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ id, name, price, image_url: dish.image_url });
    showToast(`Đã thêm "${name}" vào giỏ hàng`);
  };

  return (
    <Link
      to={`/dish/${id}`}
      className="group block bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 no-underline relative"
      style={{ border: "1px solid #E8DDD4", color: "inherit" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(62,39,35,0.12)";
        e.currentTarget.style.borderColor = "#F5D680";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "#E8DDD4";
      }}
    >
      <div className="aspect-[16/10] flex items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #EFEBE9, #FDF3D7)" }}>
        <span className="text-[56px] group-hover:scale-110 group-hover:-rotate-[5deg] transition-transform duration-500">{emoji}</span>
        <div
          className="absolute top-3 right-3 text-[12px] font-bold px-3 py-1.5 rounded-full shadow-md"
          style={{ background: "linear-gradient(135deg, #E6B422, #D4A017)", color: "#3E2723", boxShadow: "0 2px 8px rgba(230,180,34,0.35)" }}
        >
          {formatCurrency(price)}
        </div>
        {badge && (
          <div className="absolute top-3 left-3 text-[11px] font-bold px-3 py-1.5 rounded-full text-white flex items-center gap-1" style={{ background: "rgba(62,39,35,0.85)", backdropFilter: "blur(8px)" }}>
            {badge}
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg font-semibold leading-tight mb-2 transition-colors line-clamp-2" style={{ color: "#3E2723" }}>
          <span className="group-hover:text-gold-600">{name}</span>
        </h3>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-medium" style={{ color: "#8D6E63" }}>{dish.category_name ?? dish.category}</span>
        </div>
        {dish.description && (
          <div
            className="text-[13px] leading-relaxed line-clamp-2 prose-lite"
            style={{ color: "#8D6E63" }}
            dangerouslySetInnerHTML={{ __html: dish.description }}
          />
        )}
      </div>

      <div className="px-5 pb-4 flex items-center justify-end">
        <button
          onClick={handleQuickAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold cursor-pointer transition-all duration-200 hover:scale-105 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #E6B422, #D4A017)", color: "#3E2723", border: "none", boxShadow: "0 2px 8px rgba(230,180,34,0.3)" }}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Thêm
        </button>
      </div>
    </Link>
  );
}
