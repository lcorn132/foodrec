/**
 * [V6] App.jsx
 * - AuthGuard bảo vệ /profile, /checkout
 * - Loại bỏ tabs học thuật (Classification, Clustering, Correlation)
 * - Đổi Association → "Phân tích Combo"
 */
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import AuthGuard from "./components/AuthGuard";

import HomePage from "./pages/customer/HomePage";
import MenuPage from "./pages/customer/MenuPage";
import DishDetailPage from "./pages/customer/DishDetailPage";
import CartPage from "./pages/customer/CartPage";
import LoginPage from "./pages/customer/LoginPage";
import RegisterPage from "./pages/customer/RegisterPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import ProfilePage from "./pages/customer/ProfilePage";

import DashboardLayout from "./layouts/DashboardLayout";
import DashboardOverview from "./pages/admin/DashboardOverview";
import DashboardComboAnalysis from "./pages/admin/DashboardComboAnalysis";
import DashboardOrders from "./pages/admin/DashboardOrders";
import DashboardDishes from "./pages/admin/DashboardDishes";
import DashboardRatings from "./pages/admin/DashboardRatings";
import DashboardPreprocessing from "./pages/admin/DashboardPreprocessing";
import DashboardApriori from "./pages/admin/DashboardApriori";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* Customer — public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/dish/:id" element={<DishDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* [V6] Customer — protected (cần đăng nhập) */}
          <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
          <Route path="/checkout" element={<AuthGuard><CheckoutPage /></AuthGuard>} />

          {/* Dashboard — admin */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="combo-analysis" element={<DashboardComboAnalysis />} />
            <Route path="preprocessing" element={<DashboardPreprocessing />} />
            <Route path="apriori" element={<DashboardApriori />} />
            <Route path="orders" element={<DashboardOrders />} />
            <Route path="dishes-manage" element={<DashboardDishes />} />
            <Route path="ratings-manage" element={<DashboardRatings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
