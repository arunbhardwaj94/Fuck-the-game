import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const CartContext = createContext();
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function getSessionId() {
  let sid = localStorage.getItem('bastarmart_session');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('bastarmart_session', sid);
  }
  return sid;
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [cartOpen, setCartOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState('');
  const sessionId = getSessionId();

  const fetchCart = useCallback(async () => {
    setCartLoading(true);
    setCartError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/cart/${sessionId}`);
      setCart(res.data);
    } catch (e) {
      console.error('Failed to fetch cart', e);
      setCartError('Failed to load cart');
    } finally {
      setCartLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    setCartError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/cart/${sessionId}/add`, { product_id: productId, quantity });
      setCart(res.data);
      return true;
    } catch (e) {
      console.error('Failed to add to cart', e);
      setCartError('Failed to add item to cart');
      return false;
    }
  };

  const updateCartItem = async (productId, quantity) => {
    setCartError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/cart/${sessionId}/update`, { product_id: productId, quantity });
      setCart(res.data);
      return true;
    } catch (e) {
      console.error('Failed to update cart', e);
      setCartError('Failed to update cart');
      return false;
    }
  };

  const clearCart = async () => {
    setCartError('');
    try {
      await axios.delete(`${API_BASE_URL}/cart/${sessionId}`);
      setCart({ items: [], total: 0, delivery_fee: 0, grand_total: 0 });
      return true;
    } catch (e) {
      console.error('Failed to clear cart', e);
      setCartError('Failed to clear cart');
      return false;
    }
  };

  const getItemQuantity = (productId) => {
    const item = cart.items.find(i => i.product_id === productId);
    return item ? item.quantity : 0;
  };

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, cartOpen, setCartOpen, cartLoading, cartError, sessionId, addToCart, updateCartItem, clearCart, getItemQuantity, cartCount, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
