import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function MobileNav() {
  const location = useLocation();
  const { cartCount, setCartOpen } = useCart();
  const isAdmin = location.pathname.startsWith('/admin');
  if (isAdmin) return null;

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-6 flex justify-between items-center z-50" data-testid="mobile-nav">
      {navItems.map(({ icon: Icon, label, path }) => {
        const active = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center gap-0.5 ${active ? 'text-brand-green' : 'text-gray-400'}`}
            data-testid={`mobile-nav-${label.toLowerCase()}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-body font-medium">{label}</span>
          </Link>
        );
      })}
      <button
        onClick={() => setCartOpen(true)}
        className="flex flex-col items-center gap-0.5 text-gray-400 relative"
        data-testid="mobile-nav-cart"
      >
        <ShoppingCart className="w-5 h-5" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-2 bg-brand-green text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {cartCount}
          </span>
        )}
        <span className="text-[10px] font-body font-medium">Cart</span>
      </button>
      <Link
        to="/admin"
        className={`flex flex-col items-center gap-0.5 ${location.pathname.startsWith('/admin') ? 'text-brand-green' : 'text-gray-400'}`}
        data-testid="mobile-nav-admin"
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-body font-medium">Admin</span>
      </Link>
    </nav>
  );
}
