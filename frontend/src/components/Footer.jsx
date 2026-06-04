import { Link } from "react-router-dom";

export default function Footer({ minimal = false }) {
  const year = new Date().getFullYear();

  if (minimal) {
    return (
      <footer style={{ background: "#3E2723" }} className="text-white/60 py-10 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="border-t border-white/[0.08] pt-5 text-center text-[13px] text-white/40">
            © {year} FoodRec. Cơm ngon giao tận nơi.
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer style={{ background: "#3E2723" }} className="text-white/60 pt-16 pb-8 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <Link to="/" className="flex items-center gap-3 no-underline mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: "#E6B422", boxShadow: "0 4px 12px rgba(230,180,34,0.3)" }}
              >
                🍜
              </div>
              <span className="text-[26px] font-bold text-white">
                Food<span style={{ color: "#F0C94D" }}>Rec</span>
              </span>
            </Link>
            <p className="text-sm text-white/55 leading-relaxed">
              Chọn món Việt dễ hơn với gợi ý phối món theo khẩu vị, giỏ hàng và thời điểm dùng bữa.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">Liên kết</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-white/55 hover:text-gold-400 transition-colors no-underline">Trang chủ</Link></li>
              <li><Link to="/menu" className="text-sm text-white/55 hover:text-gold-400 transition-colors no-underline">Thực đơn</Link></li>
              <li><Link to="/cart" className="text-sm text-white/55 hover:text-gold-400 transition-colors no-underline">Giỏ hàng</Link></li>
              <li><Link to="/profile" className="text-sm text-white/55 hover:text-gold-400 transition-colors no-underline">Tài khoản</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">Danh mục</h4>
            <ul className="space-y-2">
              {["Cơm niêu", "Món mặn", "Rau và canh", "Lẩu", "Khai vị"].map((category) => (
                <li key={category}>
                  <Link to="/menu" className="text-sm text-white/55 hover:text-gold-400 transition-colors no-underline">{category}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-white/55">
              <li>TP. Hồ Chí Minh</li>
              <li>0941 855 234</li>
              <li>info@foodrec.vn</li>
              <li>10:00 - 22:00 hằng ngày</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.08] pt-6 text-center text-[13px] text-white/40">
          © {year} FoodRec. Cơm ngon giao tận nơi.
        </div>
      </div>
    </footer>
  );
}
