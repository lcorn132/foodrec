import { useEffect, useState } from "react";
import { getAllRatings, replyRating, deleteRating } from "../../api/userApi";
import Loading from "../../components/Loading";

export default function DashboardRatings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | low | high | norep
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const load = () => {
    setLoading(true);
    getAllRatings(500).then(r => setRatings(r.data?.ratings || [])).catch(() => setRatings([])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = ratings.filter(r => {
    if (filter === "low") return r.rating <= 2;
    if (filter === "high") return r.rating >= 4;
    if (filter === "norep") return !r.admin_reply;
    return true;
  });

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    await replyRating(id, replyText).catch(() => {});
    setReplyId(null); setReplyText(""); load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa đánh giá này?")) return;
    await deleteRating(id).catch(() => {}); load();
  };

  // Stats
  const avgRating = ratings.length > 0 ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : 0;
  const lowCount = ratings.filter(r => r.rating <= 2).length;
  const noRepCount = ratings.filter(r => !r.admin_reply).length;

  if (loading) return <Loading label="Đang tải đánh giá..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: "#3E2723" }}>⭐ Quản Lý Đánh Giá</h1>
        <p className="text-sm" style={{ color: "#8D6E63" }}>{ratings.length} đánh giá • TB: {avgRating}/5</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: "Tất cả", v: ratings.length, k: "all", c: "#3E2723" },
          { l: "⚠️ 1-2 sao", v: lowCount, k: "low", c: "#EF4444" },
          { l: "⭐ 4-5 sao", v: ratings.filter(r => r.rating >= 4).length, k: "high", c: "#16A34A" },
          { l: "Chưa trả lời", v: noRepCount, k: "norep", c: "#F59E0B" },
        ].map(s => (
          <button key={s.k} onClick={() => setFilter(filter === s.k ? "all" : s.k)}
            className="p-4 rounded-xl text-left cursor-pointer transition-all hover:shadow-md"
            style={{ background: filter === s.k ? `${s.c}10` : "white", border: filter === s.k ? `2px solid ${s.c}` : "1px solid #E8DDD4" }}>
            <div className="font-display text-2xl font-bold" style={{ color: "#3E2723" }}>{s.v}</div>
            <div className="text-[12px] font-semibold" style={{ color: s.c }}>{s.l}</div>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl" style={{ border: "1px solid #E8DDD4" }}>
          <p style={{ color: "#8D6E63" }}>Không có đánh giá nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-2xl p-5 transition-all hover:shadow-sm"
                 style={{ border: r.rating <= 2 ? "1.5px solid #FCA5A5" : "1px solid #E8DDD4", background: r.rating <= 2 ? "#FFFBFB" : "white" }}>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                       style={{ background: "linear-gradient(135deg, #E6B422, #D4A017)", color: "#3E2723" }}>
                    {(r.customer_name || "?")[0]}
                  </div>
                  <div>
                    <span className="font-bold text-sm" style={{ color: "#3E2723" }}>{r.customer_name}</span>
                    <span className="text-[11px] ml-2" style={{ color: "#8D6E63" }}>{r.rating_date?.slice(0, 16)}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className="text-sm">{s <= r.rating ? "⭐" : "☆"}</span>
                      ))}
                      <span className="text-[11px] ml-1" style={{ color: "#8D6E63" }}>về <strong style={{ color: "#D4A017" }}>{r.dish_name}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {r.rating <= 2 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#EF4444" }}>⚠️ Cần xử lý</span>}
                  <button onClick={() => handleDelete(r.id)} className="text-[11px] px-2 py-1 rounded cursor-pointer" style={{ background: "#FEE2E2", color: "#EF4444", border: "none" }}>🗑️</button>
                </div>
              </div>

              {r.comment && <p className="text-sm mb-3 pl-12" style={{ color: "#5D4037" }}>"{r.comment}"</p>}

              {r.admin_reply && (
                <div className="rounded-xl p-3 mb-2 ml-12" style={{ background: "#DCFCE7", border: "1px solid #BBF7D0" }}>
                  <div className="text-[10px] font-bold mb-0.5" style={{ color: "#16A34A" }}>↩️ Phản hồi từ nhà hàng</div>
                  <p className="text-[13px]" style={{ color: "#15803D" }}>{r.admin_reply}</p>
                  <span className="text-[10px]" style={{ color: "#16A34A" }}>{r.reply_date?.slice(0, 16)}</span>
                </div>
              )}

              {replyId === r.id ? (
                <div className="flex gap-2 mt-2 ml-12">
                  <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Nhập phản hồi..."
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ border: "1.5px solid #E8DDD4", background: "#FFFAF3" }}
                    onKeyDown={e => e.key === "Enter" && handleReply(r.id)} autoFocus />
                  <button onClick={() => handleReply(r.id)} className="px-4 py-2 rounded-lg text-sm font-bold cursor-pointer" style={{ background: "#16A34A", color: "white", border: "none" }}>Gửi</button>
                  <button onClick={() => { setReplyId(null); setReplyText(""); }} className="px-3 py-2 rounded-lg text-sm cursor-pointer" style={{ background: "#EFEBE9", color: "#5D4037", border: "none" }}>Hủy</button>
                </div>
              ) : !r.admin_reply && (
                <button onClick={() => { setReplyId(r.id); setReplyText(""); }} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer ml-12 mt-1"
                  style={{ background: "#FDF3D7", color: "#D4A017", border: "none" }}>↩️ Trả lời</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
