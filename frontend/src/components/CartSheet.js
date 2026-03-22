import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle, MapPin, ChevronRight, Truck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import axios from 'axios';

const WHATSAPP_NUMBER = '916264178646';
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FREE_DELIVERY_THRESHOLD = 499;
const DELIVERY_FEE = 25;

export default function CartSheet() {
  const { cart, cartOpen, setCartOpen, updateCartItem, clearCart, fetchCart } = useCart();
  const { user, addresses, fetchAddresses, getUserHeaders } = useUser();
  const navigate = useNavigate();
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [quickAddress, setQuickAddress] = useState('');
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [placing, setPlacing] = useState(false);

  // Delivery fee calculation
  const subtotal = cart.total || 0;
  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryFee = subtotal === 0 ? 0 : (isFreeDelivery ? 0 : DELIVERY_FEE);
  const grandTotal = Math.round((subtotal + deliveryFee) * 100) / 100;
  const remainingForFree = FREE_DELIVERY_THRESHOLD - subtotal;

  useEffect(() => {
    if (cartOpen && user) fetchAddresses();
  }, [cartOpen, user, fetchAddresses]);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) setSelectedAddressId(addresses[0].id);
  }, [addresses, selectedAddressId]);

  const handleCheckout = () => {
    if (!user) {
      setCartOpen(false);
      toast.info('Please login to checkout');
      navigate('/auth?redirect=/');
      return;
    }
    setCheckoutMode(true);
  };

  const placeOrder = async () => {
    if (!selectedAddressId) { toast.error('Please select a delivery address'); return; }
    setPlacing(true);
    try {
      const headers = getUserHeaders();
      await axios.post(`${API}/orders`, { address_id: selectedAddressId, payment_method: 'cod' }, { headers });
      toast.success('Order placed successfully!');
      setCheckoutMode(false);
      setCartOpen(false);
      fetchCart();
      navigate('/profile');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to place order');
    } finally { setPlacing(false); }
  };

  const sendToWhatsApp = () => {
    const addr = addresses.find(a => a.id === selectedAddressId);
    const addressText = addr ? `${addr.full_address}, ${addr.city} ${addr.pincode}` : quickAddress;
    if (!addressText.trim()) { toast.error('Please select or enter address'); return; }
    let message = `*New Order - Bastar Mart*\n\n`;
    if (user) message += `*Customer:* ${user.name} (${user.email})\n`;
    message += `*Items:*\n`;
    cart.items.forEach((item, i) => { message += `${i + 1}. ${item.name} x${item.quantity} - Rs.${item.item_total}\n`; });
    message += `\n*Subtotal: Rs.${subtotal}*\n`;
    message += `*Delivery: ${isFreeDelivery ? 'FREE' : `Rs.${DELIVERY_FEE}`}*\n`;
    message += `*Grand Total: Rs.${grandTotal}*\n`;
    message += `*Payment: Cash on Delivery*\n`;
    message += `\n*Delivery Address:*\n${addressText}\n`;
    message += `\nThank you for ordering from Bastar Mart!`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    toast.success('Redirecting to WhatsApp...');
  };

  // Delivery fee info bar
  const DeliveryBanner = () => {
    if (cart.items.length === 0) return null;
    if (isFreeDelivery) {
      return (
        <div className="mx-4 mt-3 bg-brand-green-light rounded-lg px-3 py-2 flex items-center gap-2" data-testid="free-delivery-banner">
          <Truck className="w-4 h-4 text-brand-green shrink-0" />
          <p className="text-xs font-body text-brand-green font-medium">Yay! You get <span className="font-bold">FREE delivery</span> on this order!</p>
        </div>
      );
    }
    return (
      <div className="mx-4 mt-3 bg-amber-50 rounded-lg px-3 py-2 flex items-center gap-2" data-testid="delivery-upsell-banner">
        <Truck className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-xs font-body text-amber-700">Add <span className="font-bold">&#8377;{Math.ceil(remainingForFree)}</span> more for <span className="font-bold text-brand-green">FREE delivery!</span></p>
      </div>
    );
  };

  return (
    <Sheet open={cartOpen} onOpenChange={(open) => { setCartOpen(open); if (!open) setCheckoutMode(false); }}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col" data-testid="cart-sheet">
        <SheetHeader className="p-4 pb-3 border-b border-gray-100 bg-brand-green-light">
          <SheetTitle className="font-heading font-extrabold text-brand-green-dark flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> {checkoutMode ? 'Checkout' : 'My Cart'}
          </SheetTitle>
          <SheetDescription className="text-sm text-gray-500 font-body">
            {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'} in your cart
          </SheetDescription>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-200" />
            <p className="font-heading font-bold text-gray-400">Your cart is empty</p>
            <p className="text-sm text-gray-400 font-body">Add items to get started</p>
            <Button data-testid="start-shopping-btn" onClick={() => setCartOpen(false)} className="bg-brand-green hover:bg-brand-green-dark text-white rounded-xl font-heading font-bold">Start Shopping</Button>
          </div>
        ) : checkoutMode ? (
          /* CHECKOUT VIEW */
          <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="checkout-view">
            {/* Order Summary with delivery */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <p className="font-heading font-bold text-sm text-gray-700">Order Summary</p>
              {cart.items.map(item => (
                <div key={item.product_id} className="flex justify-between text-sm font-body">
                  <span className="text-gray-600 truncate mr-2">{item.name} x{item.quantity}</span>
                  <span className="font-heading font-bold shrink-0">&#8377;{item.item_total}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm font-body">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-heading font-bold">&#8377;{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm font-body">
                  <span className="text-gray-500">Delivery Fee</span>
                  {isFreeDelivery ? (
                    <span className="font-heading font-bold text-brand-green" data-testid="delivery-fee-free">FREE</span>
                  ) : (
                    <span className="font-heading font-bold text-gray-700" data-testid="delivery-fee-amount">&#8377;{DELIVERY_FEE}</span>
                  )}
                </div>
                <div className="border-t border-gray-200 pt-1.5 mt-1 flex justify-between">
                  <span className="font-heading font-bold text-gray-900">Total</span>
                  <span className="font-heading font-extrabold text-lg text-gray-900" data-testid="checkout-grand-total">&#8377;{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Address Selection */}
            <div>
              <p className="font-heading font-bold text-sm text-gray-700 mb-2 flex items-center gap-1"><MapPin className="w-4 h-4 text-brand-green" /> Delivery Address</p>
              {addresses.length > 0 ? (
                <div className="space-y-2">
                  {addresses.map(addr => (
                    <button key={addr.id} onClick={() => setSelectedAddressId(addr.id)} className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${selectedAddressId === addr.id ? 'border-brand-green bg-brand-green-light' : 'border-gray-100 bg-white'}`} data-testid={`select-address-${addr.id}`}>
                      <p className="font-heading font-bold text-sm">{addr.label}</p>
                      <p className="text-xs text-gray-500 font-body mt-0.5">{addr.full_address}</p>
                    </button>
                  ))}
                  <button onClick={() => { setCartOpen(false); navigate('/profile'); }} className="text-sm text-brand-green font-heading font-bold flex items-center gap-1 hover:underline mt-1" data-testid="manage-addresses-link">
                    Manage addresses <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input data-testid="quick-address-input" placeholder="Enter delivery address..." value={quickAddress} onChange={e => setQuickAddress(e.target.value)} className="h-12 rounded-xl text-base font-body" />
                  <button onClick={() => { setCartOpen(false); navigate('/profile'); }} className="text-xs text-brand-green font-body font-medium hover:underline" data-testid="save-address-link">Save address for next time</button>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="font-heading font-bold text-sm text-gray-700">Payment: Cash on Delivery (COD)</p>
            </div>
          </div>
        ) : (
          /* CART ITEMS VIEW */
          <>
            <DeliveryBanner />
            <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="cart-items-list">
              {cart.items.map(item => (
                <div key={item.product_id} className="flex gap-3 bg-white rounded-xl p-3 border border-gray-100" data-testid={`cart-item-${item.product_id}`}>
                  <img src={item.image || 'https://via.placeholder.com/80?text=Item'} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-gray-50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading font-bold text-sm text-gray-900 truncate">{item.name}</h4>
                    <p className="text-xs text-gray-400 font-body">{item.unit}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-heading font-extrabold text-sm">&#8377;{item.item_total}</span>
                      <div className="flex items-center gap-0 bg-brand-green rounded-lg overflow-hidden">
                        <button onClick={() => updateCartItem(item.product_id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center text-white hover:bg-brand-green-dark transition-colors duration-150" data-testid={`cart-decrease-${item.product_id}`}>
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-white font-bold text-xs font-heading">{item.quantity}</span>
                        <button onClick={() => updateCartItem(item.product_id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-white hover:bg-brand-green-dark transition-colors duration-150" data-testid={`cart-increase-${item.product_id}`}>
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer Actions */}
        {cart.items.length > 0 && (
          <div className="border-t border-gray-100 p-4 space-y-2.5 bg-white">
            {!checkoutMode && (
              <>
                <div className="flex items-center justify-between">
                  <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-600 font-body flex items-center gap-1" data-testid="clear-cart-btn">
                    <Trash2 className="w-3 h-3" /> Clear Cart
                  </button>
                </div>
                {/* Price breakdown */}
                <div className="space-y-1 bg-gray-50 rounded-xl p-3" data-testid="cart-price-summary">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-heading font-bold">&#8377;{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gray-500">Delivery Fee</span>
                    {isFreeDelivery ? (
                      <span className="font-heading font-bold text-brand-green" data-testid="cart-delivery-free">FREE</span>
                    ) : (
                      <span className="font-heading font-bold" data-testid="cart-delivery-charge">&#8377;{DELIVERY_FEE}</span>
                    )}
                  </div>
                  <div className="border-t border-gray-200 pt-1.5 mt-1 flex justify-between">
                    <span className="font-heading font-bold text-gray-900">Total</span>
                    <span className="font-heading font-extrabold text-xl text-gray-900" data-testid="cart-grand-total">&#8377;{grandTotal}</span>
                  </div>
                </div>
              </>
            )}
            {checkoutMode ? (
              <div className="space-y-2">
                <Button data-testid="place-order-btn" onClick={placeOrder} disabled={placing} className="w-full h-12 bg-brand-green hover:bg-brand-green-dark text-white rounded-xl font-heading font-bold text-base active:scale-[0.98] transition-transform">
                  {placing ? 'Placing Order...' : `Place Order (COD) - ₹${grandTotal}`}
                </Button>
                <Button data-testid="whatsapp-order-btn" onClick={sendToWhatsApp} variant="outline" className="w-full h-11 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 rounded-xl font-heading font-bold text-sm gap-2">
                  <MessageCircle className="w-4 h-4" /> Order via WhatsApp
                </Button>
                <button onClick={() => setCheckoutMode(false)} className="w-full text-center text-sm text-gray-400 font-body hover:text-gray-600" data-testid="back-to-cart-btn">Back to cart</button>
              </div>
            ) : (
              <Button data-testid="checkout-btn" onClick={handleCheckout} className="w-full h-12 bg-brand-green hover:bg-brand-green-dark text-white rounded-xl font-heading font-bold text-base active:scale-[0.98] transition-transform">
                {user ? `Proceed to Checkout - ₹${grandTotal}` : 'Login & Checkout'}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
