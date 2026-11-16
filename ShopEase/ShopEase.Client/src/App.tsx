import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CategoriesPage } from "./pages/CategoriesPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailsPage } from "./pages/ProductDetailsPage";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products/:id" element={<ProductDetailsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  );
}
