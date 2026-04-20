import { Link } from 'react-router-dom';

export default function Footer({ minimal = false }) {
  if (minimal) {
    return (
      <footer style={{ background: '#3E2723' }} className="text-white/60 py-10 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="border-t border-white/[0.08] pt-5 text-center text-[13px] text-white/30">
            © 2026 FoodRec — Nhóm 10. Đồ án Hệ thống gợi ý thực đơn thông minh.
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer style={{ background: '#3E2723' }} className="text-white/60 pt-16 pb-8 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 no-underline mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                   style={{ background: '#E6B422', boxShadow: '0 4px 12px rgba(230,180,34,0.3)' }}>
                🍜
              </div>
              <span className="text-[26px] font-bold text-white font-display">
                Food<span style={{ color: '#F0C94D' }}>Rec</span>
              </span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed">
              Hệ thống gợi ý thực đơn thông minh, sử dụng AI để mang đến trải nghiệm ẩm thực cá nhân hóa tốt nhất.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Liên kết</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-white/50 hover:text-gold-400 transition-colors no-underline">Trang chủ</Link></li>
              <li><Link to="/menu" className="text-sm text-white/50 hover:text-gold-400 transition-colors no-underline">Thực đơn</Link></li>
              <li><Link to="/cart" className="text-sm text-white/50 hover:text-gold-400 transition-colors no-underline">Giỏ hàng</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Danh mục</h4>
            <ul className="space-y-2">
              {['Khai vị', 'Rau', 'Món chính', 'Lẩu', 'Tráng miệng'].map((c) => (
                <li key={c}>
                  <Link to="/menu" className="text-sm text-white/50 hover:text-gold-400 transition-colors no-underline">{c}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li>📍 TP. Hồ Chí Minh</li>
              <li>📞 0941 855 234</li>
              <li>✉️ info@foodrec.vn</li>
              <li>🕐 10:00 – 22:00</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.08] pt-6 text-center text-[13px] text-white/30">
          © 2026 FoodRec — Nhóm 10. Đồ án Hệ thống gợi ý thực đơn thông minh.
        </div>
      </div>
    </footer>
  );
}
