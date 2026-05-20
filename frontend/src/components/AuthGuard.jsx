/**
 * [V6] Route Guard — bảo vệ trang yêu cầu đăng nhập
 * Wrap quanh component cần bảo vệ: <AuthGuard><ProfilePage /></AuthGuard>
 * Nếu chưa đăng nhập → redirect /login
 */
import { Navigate } from "react-router-dom";

export default function AuthGuard({ children }) {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("foodrec_user"));
    } catch {
      return null;
    }
  })();

  if (!user || !user.id) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
