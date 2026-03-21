import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

const WHATSAPP_NUMBER = '916264178646';

export default function CartSheet() {
  const { cart, cartOpen, setCartOpen, updateCartItem, clearCart } = useCart();
  const [address, setAddress] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);

  const sendToWhatsApp = () => {
    if (!address.trim()) {
      toast.error('Please enter your delivery address');
      return;
    }
    let message = `*New Order - Bastar Mart*\n\n`;
    message += `*Items:*\n`;
    cart.items.forEach((item, i) => {
      message += `${i + 1}. ${item.name} x${item.quantity} - Rs.${item.item_total}\n`;
    });
    message += `\n*Total: Rs.${cart.total}*\n`;
    message += `\n*Delivery Address:*\n${address}\n`;
    message += `\nThank you for ordering from Bastar Mart!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Redirecting to WhatsApp...');
  };

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col" data-testid="cart-sheet">
        <SheetHeader className="p-4 pb-3 border-b border-gray-100 bg-brand-green-light">
          <SheetTitle className="font-heading font-extrabold text-brand-green-dark flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> My Cart
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
            <Button
              data-testid="start-shopping-btn"
              onClick={() => setCartOpen(false)}
              className="bg-brand-green hover:bg-brand-green-dark text-white rounded-xl font-heading font-bold"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="cart-items-list">
              {cart.items.map(item => (
                <div key={item.product_id} className="flex gap-3 bg-white rounded-xl p-3 border border-gray-100" data-testid={`cart-item-${item.product_id}`}>
                  <img
                    src={item.image || 'https://via.placeholder.com/80?text=Item'}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover bg-gray-50 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading font-bold text-sm text-gray-900 truncate">{item.name}</h4>
                    <p className="text-xs text-gray-400 font-body">{item.unit}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-heading font-extrabold text-sm">&#8377;{item.item_total}</span>
                      <div className="flex items-center gap-0 bg-brand-green rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateCartItem(item.product_id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-white hover:bg-brand-green-dark transition-colors duration-150"
                          data-testid={`cart-decrease-${item.product_id}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-white font-bold text-xs font-heading">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItem(item.product_id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-white hover:bg-brand-green-dark transition-colors duration-150"
                          data-testid={`cart-increase-${item.product_id}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <button
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:text-red-600 font-body flex items-center gap-1"
                  data-testid="clear-cart-btn"
                >
                  <Trash2 className="w-3 h-3" /> Clear Cart
                </button>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-body">Total</p>
                  <p className="font-heading font-extrabold text-xl text-gray-900">&#8377;{cart.total}</p>
                </div>
              </div>

              {/* Address & WhatsApp Checkout */}
              {!showAddressForm ? (
                <Button
                  data-testid="whatsapp-checkout-btn"
                  onClick={() => setShowAddressForm(true)}
                  className="w-full h-12 bg-[#25D366] hover:bg-[#1da851] text-white rounded-xl font-heading font-bold text-base active:scale-[0.98] transition-transform duration-150 gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Order via WhatsApp
                </Button>
              ) : (
                <div className="space-y-2" data-testid="whatsapp-address-form">
                  <Input
                    data-testid="delivery-address-input"
                    type="text"
                    placeholder="Enter your delivery address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-10 rounded-xl font-body text-sm"
                  />
                  <Button
                    data-testid="send-whatsapp-btn"
                    onClick={sendToWhatsApp}
                    className="w-full h-12 bg-[#25D366] hover:bg-[#1da851] text-white rounded-xl font-heading font-bold text-base active:scale-[0.98] transition-transform duration-150 gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Send Order to WhatsApp
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
