import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import axios from 'axios';

import { API } from '@/lib/api';

export default function CategoryPage() {
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        const [catRes, prodRes] = await Promise.all([
          axios.get(`${API}/categories`),
          axios.get(`${API}/products?category_id=${categoryId}`)
        ]);
        const cat = catRes.data.find(c => c.id === categoryId);
        setCategory(cat);
        setProducts(prodRes.data);
      } catch (e) {
        setError('Unable to load this category right now.');
        console.error('Failed to load data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8" data-testid="category-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-gray-400 hover:text-brand-green transition-colors" data-testid="back-home">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-gray-900">{category?.name || 'Category'}</h1>
            <p className="text-sm text-gray-400 font-body">{products.length} products</p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-heading font-bold text-gray-400">{error || 'No products found in this category'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
