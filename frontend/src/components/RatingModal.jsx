/**
 * [V6] Modal đánh giá món ăn sau khi đơn hàng hoàn thành
 * Cho phép chọn sao 1-5 + bình luận cho từng món
 */
import { useState } from "react";
import { createRating } from "../api/userApi";
import { showToast } from "./Toast";

export default function RatingModal({ order, dishes, userId, onClose, onDone }) {
  const [ratings, setRatings] = useState(
    dishes.map((d) => ({ dish_id: d.id, dish_name: d.name, stars: 5, comment: "" }))
  );
  const [submitting, setSubmitting] = useState(false);

  const setStar = (idx, stars) => {
    setRatings((p) => p.map((r, i) => (i === idx ? { ...r, stars } : r)));
  };
  const setComment = (idx, comment) => {
    setRatings((p) => p.map((r, i) => (i === idx ? { ...r, comment } : r)));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      for (const r of ratings) {
        await createRating({
          dish_id: r.dish_id,
          rating: r.stars,
          comment: r.comment,
          customer_id: userId,
        });
      }
      showToast("Đã gửi đánh giá thành công!");
      onDone?.();
    } catch {
      showToast("Có lỗi khi gửi đánh giá", "error");
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-[520px] max-h-[80vh] overflow-y-auto p-6" style={{ border: "1px solid #E8DDD4" }} onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl font-bold mb-1" style={{ color: "#3E2723" }}>⭐ Đánh giá đơn hàng #{order.id}</h3>
        <p className="text-[12px] mb-5" style={{ color: "#8D6E63" }}>Chia sẻ trải nghiệm của bạn về từng món ăn</p>

        <div className="space-y-4">
          {ratings.map((r, idx) => (
            <div key={r.dish_id} className="p-4 rounded-xl" style={{ background: "#FFFAF3", border: "1px solid #EFEBE9" }}>
              <div className="font-semibold text-sm mb-2" style={{ color: "#3E2723" }}>{r.dish_name}</div>
              {/* Stars */}
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setStar(idx, s)} className="text-xl cursor-pointer bg-transparent border-none p-0 transition-transform hover:scale-125"
                    style={{ filter: s <= r.stars ? "none" : "grayscale(1) opacity(0.3)" }}>⭐</button>
                ))}
                <span className="text-sm font-bold ml-2" style={{ color: "#D4A017" }}>{r.stars}/5</span>
              </div>
              <textarea value={r.comment} onChange={(e) => setComment(idx, e.target.value)} rows={2}
                placeholder="Nhập bình luận (tùy chọn)..."
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{ border: "1.5px solid #E8DDD4", background: "white", fontFamily: "Be Vietnam Pro" }} />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-5 pt-4" style={{ borderTop: "1px solid #E8DDD4" }}>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm cursor-pointer" style={{ background: "#EFEBE9", color: "#5D4037", border: "none" }}>Hủy</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50"
            style={{ background: "#E6B422", color: "#3E2723", border: "none" }}>
            {submitting ? "Đang gửi..." : "✅ Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}
