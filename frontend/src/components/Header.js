import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, MapPin, ChevronDown, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { cartCount, setCartOpen, cart } = useCart();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0" data-testid="logo-link">
            <div className="w-9 h-9 bg-brand-green rounded-xl flex items-center justify-center">
              <span className="text-white font-accent text-lg font-bold">B</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-heading font-extrabold text-lg text-brand-green-dark leading-none">bastar mart</h1>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>Delivery in 10 minutes</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl" data-testid="search-form">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                data-testid="search-input"
                type="text"
                placeholder="Search for atta, dal, coke and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-10 bg-gray-50 border-gray-200 rounded-xl font-body text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to="/admin" data-testid="admin-link">
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-brand-green">
                <User className="w-5 h-5" />
              </Button>
            </Link>
            <Button
              data-testid="cart-button"
              onClick={() => setCartOpen(true)}
              className="bg-brand-green hover:bg-brand-green-dark text-white rounded-xl px-4 h-10 gap-2 font-heading font-bold text-sm relative"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <>
                  <span className="hidden sm:inline">{cartCount} items</span>
                  <span className="hidden sm:inline font-body">&#8377;{cart.total}</span>
                  <Badge
                    className="sm:hidden absolute -top-1 -right-1 bg-brand-yellow text-black text-[10px] px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-0"
                    data-testid="cart-badge"
                  >
                    {cartCount}
                  </Badge>
                </>
              )}
              {cartCount === 0 && <span className="hidden sm:inline">My Cart</span>}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
