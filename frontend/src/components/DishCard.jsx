import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

import { useCart } from "../context/CartContext";
import { showToast } from "./Toast";
import { formatCurrency } from "../utils/format";
import DishImage from "./DishImage.jsx";

export default function DishCard({ dish, badge }) {
  const { addToCart } = useCart();
  const id = dish?.dish_id ?? dish?.id;
  const name = dish?.dish_name ?? dish?.name ?? "Món ăn";
  const price = Number(dish?.price ?? 0);
  const category = dish?.category_name ?? dish?.category ?? "Thực đơn";

  const handleQuickAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart({ id, name, price, image_url: dish?.image_url });
    showToast(`Đã thêm "${name}" vào giỏ hàng`);
  };

  return (
    <Link
      to={`/dish/${id}`}
      className="group block bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1.5 no-underline relative rounded-2xl"
      style={{ border: "1px solid #E8DDD4", color: "inherit" }}
      onMouseEnter={(event) => {
        event.currentTarget.style.boxShadow = "0 12px 40px rgba(62,39,35,0.12)";
        event.currentTarget.style.borderColor = "#F5D680";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.boxShadow = "none";
        event.currentTarget.style.borderColor = "#E8DDD4";
      }}
    >
      <div className="aspect-[4/3] relative overflow-hidden" style={{ background: "#F7EFE4" }}>
        <DishImage
          src={dish?.image_url}
          alt={name}
          className="transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />

        <div
          className="absolute top-3 right-3 text-[12px] font-bold px-3 py-1.5 rounded-full shadow-md"
          style={{
            background: "linear-gradient(135deg, #E6B422, #D4A017)",
            color: "#3E2723",
            boxShadow: "0 2px 8px rgba(230,180,34,0.35)",
          }}
        >
          {formatCurrency(price)}
        </div>

        {badge && (
          <div
            className="absolute top-3 left-3 text-[11px] font-bold px-3 py-1.5 rounded-full text-white flex items-center gap-1"
            style={{ background: "rgba(62,39,35,0.85)", backdropFilter: "blur(8px)" }}
          >
            {badge}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="text-[12px] font-bold uppercase tracking-wide mb-2" style={{ color: "#B88900" }}>
          {category}
        </div>

        <h3 className="font-display text-lg font-semibold leading-tight mb-2 transition-colors line-clamp-2" style={{ color: "#3E2723" }}>
          <span className="group-hover:text-gold-600">{name}</span>
        </h3>

        {dish?.description && (
          <div
            className="text-[13px] leading-relaxed line-clamp-2 prose-lite min-h-[42px]"
            style={{ color: "#8D6E63" }}
            dangerouslySetInnerHTML={{ __html: dish.description }}
          />
        )}
      </div>

      <div className="px-5 pb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={handleQuickAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold cursor-pointer transition-all duration-200 hover:scale-105 flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #E6B422, #D4A017)",
            color: "#3E2723",
            border: "none",
            boxShadow: "0 2px 8px rgba(230,180,34,0.3)",
          }}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Thêm
        </button>
      </div>
    </Link>
  );
}
