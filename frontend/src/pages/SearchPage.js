import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/ProductCard';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      searchProducts(q);
    }
  }, [searchParams]);

  const searchProducts = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/products?search=${encodeURIComponent(q)}`);
      setProducts(res.data);
    } catch (e) {
      console.error('Search failed', e);
      setError('Search is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  return (
    <div className="pb-20 md:pb-8" data-testid="search-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSearch} className="mb-8" data-testid="search-page-form">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              data-testid="search-page-input"
              type="text"
              placeholder="Search for products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11 pr-4 h-12 bg-white border-gray-200 rounded-xl font-body text-base focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
              autoFocus
            />
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600 font-body">{error}</div>
        ) : products.length > 0 ? (
          <>
            <p className="text-sm text-gray-400 font-body mb-4">{products.length} results for "{searchParams.get('q')}"</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : searchParams.get('q') ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="font-heading font-bold text-gray-400">No products found for "{searchParams.get('q')}"</p>
            <p className="text-sm text-gray-400 font-body mt-1">Try different keywords</p>
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="font-heading font-bold text-gray-400">Search for your favourite products</p>
          </div>
        )}
      </div>
    </div>
  );
}
