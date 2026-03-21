import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import CartSheet from "@/components/CartSheet";
import MobileNav from "@/components/MobileNav";
import HomePage from "@/pages/HomePage";
import CategoryPage from "@/pages/CategoryPage";
import SearchPage from "@/pages/SearchPage";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";

function AppLayout({ children }) {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-64px)]">{children}</main>
      <CartSheet />
      <MobileNav />
    </>
  );
}

function AdminLayout({ children }) {
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-center" richColors />
          <Routes>
            <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
            <Route path="/category/:categoryId" element={<AppLayout><CategoryPage /></AppLayout>} />
            <Route path="/search" element={<AppLayout><SearchPage /></AppLayout>} />
            <Route path="/bastar-admin" element={<AdminLayout><AdminLogin /></AdminLayout>} />
            <Route path="/bastar-admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
