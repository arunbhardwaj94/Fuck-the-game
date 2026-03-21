import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart, updateCartItem, getItemQuantity } = useCart();
  const quantity = getItemQuantity(product.id);
  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200 group relative flex flex-col"
      data-testid={`product-card-${product.id}`}
    >
      {discount > 0 && (
        <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md" data-testid="discount-badge">
          {discount}% OFF
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={product.image || 'https://via.placeholder.com/200?text=Product'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-400 font-body mb-1 truncate">{product.unit}</p>
        <h3 className="font-heading font-bold text-sm text-gray-900 leading-tight mb-2 line-clamp-2 flex-1">{product.name}</h3>

        <div className="flex items-end justify-between mt-auto">
          <div>
            <span className="font-heading font-extrabold text-base text-gray-900">&#8377;{product.price}</span>
            {discount > 0 && (
              <span className="text-xs text-gray-400 line-through ml-1">&#8377;{product.mrp}</span>
            )}
          </div>

          {quantity === 0 ? (
            <Button
              data-testid={`add-to-cart-${product.id}`}
              onClick={() => addToCart(product.id)}
              className="bg-white border-2 border-brand-green text-brand-green hover:bg-brand-green hover:text-white uppercase text-[11px] font-bold py-1 px-3 h-8 rounded-lg active:scale-95 transition-all duration-150"
            >
              ADD
            </Button>
          ) : (
            <div className="flex items-center gap-0 bg-brand-green rounded-lg overflow-hidden" data-testid={`quantity-controls-${product.id}`}>
              <button
                data-testid={`decrease-qty-${product.id}`}
                onClick={() => updateCartItem(product.id, quantity - 1)}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-brand-green-dark transition-colors duration-150"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center text-white font-bold text-sm font-heading">{quantity}</span>
              <button
                data-testid={`increase-qty-${product.id}`}
                onClick={() => addToCart(product.id)}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-brand-green-dark transition-colors duration-150"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
