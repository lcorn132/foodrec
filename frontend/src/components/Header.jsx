import { Link } from 'react-router-dom';
import { ShoppingCart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useState, useEffect, useRef } from 'react';

export default function Header() {
  const { count } = useCart();
  const [user, setUser] = useState(null);
  const [bounce, setBounce] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    const check = () => {
      try { setUser(JSON.parse(localStorage.getItem("foodrec_user"))); } catch { setUser(null); }
    };
    check();
    window.addEventListener("storage", check);
    const interval = setInterval(check, 2000);
    return () => { window.removeEventListener("storage", check); clearInterval(interval); };
  }, []);

  // Bounce animation khi count tăng
  useEffect(() => {
    if (count > prevCount.current) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 600);
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  return (
    <header className="sticky top-0 z-50 shadow-lg" style={{ background: 'linear-gradient(135deg, #3E2723, #4E342E)' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex justify-between items-center h-[72px]">
          <Link to="/" className="flex items-center gap-3 no-underline group">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:shadow-lg transition-all duration-300"
                 style={{ background: '#E6B422', boxShadow: '0 4px 12px rgba(230,180,34,0.3)' }}>🍜</div>
            <span className="text-[26px] font-bold text-white font-display tracking-tight">
              Food<span style={{ color: '#F0C94D' }}>Rec</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link to="/" className="hidden md:block text-white/80 hover:text-white hover:bg-white/10 font-medium text-[15px] px-4 py-2 rounded-lg transition-all duration-300">Trang chủ</Link>
            <Link to="/menu" className="hidden md:block text-white/80 hover:text-white hover:bg-white/10 font-medium text-[15px] px-4 py-2 rounded-lg transition-all duration-300">Thực đơn</Link>

            {user ? (
              <Link to="/profile" className="hidden md:flex items-center gap-2 font-semibold text-[14px] px-4 py-2 rounded-lg transition-all duration-300 no-underline"
                style={{ background: 'rgba(230,180,34,0.15)', color: '#F0C94D' }}>
                <User className="w-4 h-4" />{user.name || 'Tài khoản'}
              </Link>
            ) : (
              <Link to="/login" className="hidden md:flex items-center gap-1.5 font-semibold text-[14px] px-4 py-2 rounded-lg transition-all duration-300 no-underline"
                style={{ background: 'rgba(230,180,34,0.15)', color: '#F0C94D' }}>Đăng nhập</Link>
            )}

            <Link to="/cart"
              className="relative flex items-center justify-center w-11 h-11 rounded-full text-white ml-2 transition-all duration-300 hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.1)', animation: bounce ? 'cartBounce 0.6s ease' : 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#E6B422'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}>
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 text-white text-[11px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg"
                      style={{ background: '#EF4444', border: '2px solid #3E2723', animation: bounce ? 'badgePop 0.4s ease' : 'none' }}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </div>

      <style>{`
        @keyframes cartBounce {
          0%, 100% { transform: scale(1); }
          30% { transform: scale(1.25); }
          60% { transform: scale(0.95); }
        }
        @keyframes badgePop {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </header>
  );
}
