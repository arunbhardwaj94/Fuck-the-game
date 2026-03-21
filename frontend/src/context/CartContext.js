import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const CartContext = createContext();
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
  const sessionId = getSessionId();

  const fetchCart = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/cart/${sessionId}`);
      setCart(res.data);
    } catch (e) {
      console.error('Failed to fetch cart', e);
    }
  }, [sessionId]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      const res = await axios.post(`${API}/cart/${sessionId}/add`, { product_id: productId, quantity });
      setCart(res.data);
    } catch (e) {
      console.error('Failed to add to cart', e);
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      const res = await axios.post(`${API}/cart/${sessionId}/update`, { product_id: productId, quantity });
      setCart(res.data);
    } catch (e) {
      console.error('Failed to update cart', e);
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API}/cart/${sessionId}`);
      setCart({ items: [], total: 0 });
    } catch (e) {
      console.error('Failed to clear cart', e);
    }
  };

  const getItemQuantity = (productId) => {
    const item = cart.items.find(i => i.product_id === productId);
    return item ? item.quantity : 0;
  };

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, cartOpen, setCartOpen, addToCart, updateCartItem, clearCart, getItemQuantity, cartCount, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
