import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { ChatWidget } from "./components/ChatWidget";
import { DashboardLayout } from "./components/DashboardLayout";
import { Navbar } from "./components/Navbar";
import { RequireAuth, RequireStaff } from "./components/RequireAuth";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { CustomersPage } from "./pages/dashboard/CustomersPage";
import { DeliveryPlanningPage } from "./pages/dashboard/DeliveryPlanningPage";
import { OrdersPage } from "./pages/dashboard/OrdersPage";
import { ProductsPage } from "./pages/dashboard/ProductsPage";
import { MyOrdersPage } from "./pages/storefront/MyOrdersPage";
import { OrderForm } from "./pages/storefront/OrderForm";
import { ProductDetail } from "./pages/storefront/ProductDetail";
import { ProductList } from "./pages/storefront/ProductList";

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/order/new" element={<OrderForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/my-orders"
            element={
              <RequireAuth>
                <MyOrdersPage />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireStaff>
                <DashboardLayout />
              </RequireStaff>
            }
          >
            <Route index element={<OrdersPage />} />
            <Route path="delivery-planning" element={<DeliveryPlanningPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="products" element={<ProductsPage />} />
          </Route>
        </Routes>
      </main>
      <ChatWidget />
    </div>
  );
}

export default App;
