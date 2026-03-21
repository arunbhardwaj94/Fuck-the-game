import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Clock, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          axios.get(`${API}/categories`),
          axios.get(`${API}/products?limit=20`)
        ]);
        setCategories(catRes.data);
        setProducts(prodRes.data);
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Seed data if empty
  useEffect(() => {
    if (!loading && categories.length === 0) {
      axios.post(`${API}/seed`).then(() => {
        window.location.reload();
      }).catch(console.error);
    }
  }, [loading, categories.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="loading-spinner">
        <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8" data-testid="home-page">
      {/* Hero */}
      <section className="bg-brand-yellow relative overflow-hidden" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex items-center gap-8">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-body font-medium text-brand-green-dark">
                <Zap className="w-4 h-4 text-brand-green" />
                Groceries delivered in minutes
              </div>
              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-black leading-tight tracking-tight">
                Fresh Groceries,<br />
                <span className="text-brand-green">Lightning Fast</span>
              </h2>
              <p className="font-body text-base text-gray-700 max-w-md">
                Get your daily essentials delivered to your doorstep in just 10 minutes. Fresh produce, dairy, snacks & more.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm font-body text-gray-700">
                  <Clock className="w-4 h-4 text-brand-green" /> 10 min delivery
                </div>
                <div className="flex items-center gap-2 text-sm font-body text-gray-700">
                  <Truck className="w-4 h-4 text-brand-green" /> Free delivery above &#8377;199
                </div>
              </div>
            </div>
            <div className="hidden md:block w-80 lg:w-96 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1773048806365-4ef3a8be3fba?w=500&h=400&fit=crop"
                alt="Fast Delivery"
                className="w-full h-auto rounded-2xl object-cover shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-10 md:py-14" data-testid="categories-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-extrabold text-xl md:text-2xl text-gray-900 mb-6">Shop by Category</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                  data-testid={`category-card-${cat.id}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-brand-green-light border-2 border-transparent group-hover:border-brand-green transition-all duration-200 group-hover:scale-105">
                    <img
                      src={cat.image || 'https://via.placeholder.com/100?text=Category'}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-xs md:text-sm font-heading font-bold text-gray-700 text-center leading-tight group-hover:text-brand-green transition-colors duration-200">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products by Category */}
      {categories.map(cat => {
        const catProducts = products.filter(p => p.category_id === cat.id);
        if (catProducts.length === 0) return null;
        return (
          <section key={cat.id} className="pb-10 md:pb-14" data-testid={`product-section-${cat.id}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading font-extrabold text-lg md:text-xl text-gray-900">{cat.name}</h2>
                <Link
                  to={`/category/${cat.id}`}
                  className="text-brand-green text-sm font-heading font-bold flex items-center gap-1 hover:gap-2 transition-all duration-200"
                  data-testid={`see-all-${cat.id}`}
                >
                  see all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {catProducts.slice(0, 6).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
