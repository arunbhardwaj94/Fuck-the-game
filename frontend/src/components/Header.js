import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, MapPin, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = 'https://static.prod-images.emergentagent.com/jobs/64a13bb5-87c1-4f94-afdc-a97288c0fbd7/images/5612fc865d65a91c4bfd6b2eab82d6bdc3fe008a6bee0f4de3f860e460a28608.png';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const { cartCount, setCartOpen, cart } = useCart();
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  const fetchSuggestions = useCallback(async (q) => {
    if (!q.trim() || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await axios.get(`${API}/products?search=${encodeURIComponent(q)}&limit=6`);
      setSuggestions(res.data);
    } catch (e) {
      console.error('Search failed', e);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const selectSuggestion = (product) => {
    setSearchQuery(product.name);
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(product.name)}`);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0" data-testid="logo-link">
            <img src={LOGO_URL} alt="Bastar Mart" className="w-9 h-9 rounded-xl object-contain" />
            <div className="hidden sm:block">
              <h1 className="font-heading font-extrabold text-lg text-brand-green-dark leading-none">bastar mart</h1>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>Delivery in 10 minutes</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>
          </Link>

          {/* Search with Live Suggestions */}
          <div className="flex-1 max-w-xl relative" ref={dropdownRef}>
            <form onSubmit={handleSearch} data-testid="search-form">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  data-testid="search-input"
                  type="text"
                  placeholder="Search for atta, dal, coke and more..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  className="pl-10 pr-4 h-10 bg-gray-50 border-gray-200 rounded-xl font-body text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                  autoComplete="off"
                />
              </div>
            </form>

            {/* Live Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden z-50"
                data-testid="search-suggestions"
              >
                {suggestions.map(product => (
                  <button
                    key={product.id}
                    onClick={() => selectSuggestion(product)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-green-light transition-colors text-left"
                    data-testid={`suggestion-${product.id}`}
                  >
                    <img
                      src={product.image || 'https://via.placeholder.com/32'}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover bg-gray-50 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm text-gray-900 truncate">{product.name}</p>
                      <p className="text-[11px] text-gray-400 font-body">{product.unit} &middot; {product.category_name}</p>
                    </div>
                    <span className="font-heading font-extrabold text-sm text-brand-green shrink-0">&#8377;{product.price}</span>
                  </button>
                ))}
                <button
                  onClick={handleSearch}
                  className="w-full text-center py-2.5 text-sm font-heading font-bold text-brand-green hover:bg-brand-green-light transition-colors border-t border-gray-50"
                  data-testid="search-see-all"
                >
                  See all results for "{searchQuery}"
                </button>
              </div>
            )}
          </div>

          {/* Cart Button */}
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
    </header>
  );
}
