import { BrowserRouter, Route, Routes } from "react-router-dom";

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
import DashboardOrders from "./pages/admin/DashboardOrders";
import DashboardDishes from "./pages/admin/DashboardDishes";
import DashboardPreprocessing from "./pages/admin/DashboardPreprocessing";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/dish/:id" element={<DishDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
          <Route path="/checkout" element={<AuthGuard><CheckoutPage /></AuthGuard>} />

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="preprocessing" element={<DashboardPreprocessing />} />
            <Route path="orders" element={<DashboardOrders />} />
            <Route path="dishes-manage" element={<DashboardDishes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
