import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Package, Plus, Trash2, LogOut, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import axios from 'axios';

import { API } from '@/lib/api';

export default function ProfilePage() {
  const { user, logout, updateProfile, addresses, fetchAddresses, addAddress, deleteAddress, getUserHeaders } = useUser();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [addressDialog, setAddressDialog] = useState(false);
  const [addrForm, setAddrForm] = useState({ label: 'Home', full_address: '', city: '', pincode: '', phone: '' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (!user) { navigate('/auth?redirect=/profile'); return; }
    fetchAddresses();
    fetchOrders();
  }, [user, navigate, fetchAddresses]);

  useEffect(() => {
    if (user) setProfileForm({ name: user.name || '', phone: user.phone || '' });
  }, [user]);

  const fetchOrders = async () => {
    try {
      const headers = getUserHeaders();
      const res = await axios.get(`${API}/orders`, { headers });
      setOrders(res.data.orders || []);
    } catch (e) { console.error('Failed to fetch orders'); }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profileForm);
      toast.success('Profile updated!');
      setEditingProfile(false);
    } catch (e) { toast.error('Failed to update profile'); }
  };

  const handleAddAddress = async () => {
    if (!addrForm.full_address.trim()) { toast.error('Address is required'); return; }
    try {
      await addAddress(addrForm);
      toast.success('Address saved!');
      setAddressDialog(false);
      setAddrForm({ label: 'Home', full_address: '', city: '', pincode: '', phone: '' });
    } catch (e) { toast.error('Failed to save address'); }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await deleteAddress(id);
      toast.success('Address removed');
    } catch (e) { toast.error('Failed to remove'); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const getStatusColor = (status) => {
    const colors = { confirmed: 'bg-blue-100 text-blue-700', preparing: 'bg-yellow-100 text-yellow-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (!user) return null;

  return (
    <div className="pb-20 md:pb-8" data-testid="profile-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6" data-testid="profile-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-brand-green-light rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-brand-green" />
              </div>
              <div>
                {editingProfile ? (
                  <div className="flex flex-col gap-2">
                    <Input data-testid="edit-name" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="Name" className="h-9 rounded-lg text-sm w-48" />
                    <Input data-testid="edit-phone" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="Phone" className="h-9 rounded-lg text-sm w-48" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveProfile} className="bg-brand-green text-white rounded-lg text-xs h-7 px-3" data-testid="save-profile-btn">Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingProfile(false)} className="text-xs h-7 px-3">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="font-heading font-extrabold text-lg text-gray-900">{user.name}</h2>
                    <p className="text-sm text-gray-400 font-body">{user.email}</p>
                    {user.phone && <p className="text-xs text-gray-400 font-body">{user.phone}</p>}
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!editingProfile && (
                <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)} className="rounded-lg text-xs" data-testid="edit-profile-btn">Edit</Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 rounded-lg text-xs" data-testid="user-logout-btn">
                <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="bg-white border border-gray-100 rounded-xl p-1 mb-6 w-full" data-testid="profile-tabs">
            <TabsTrigger value="orders" className="flex-1 rounded-lg font-heading font-bold text-sm data-[state=active]:bg-brand-green data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-1.5" /> My Orders
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex-1 rounded-lg font-heading font-bold text-sm data-[state=active]:bg-brand-green data-[state=active]:text-white">
              <MapPin className="w-4 h-4 mr-1.5" /> Addresses
            </TabsTrigger>
          </TabsList>

          {/* ORDERS */}
          <TabsContent value="orders" data-testid="orders-tab">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-heading font-bold text-gray-400">No orders yet</p>
                <p className="text-sm text-gray-400 font-body mt-1">Your order history will appear here</p>
                <Button onClick={() => navigate('/')} className="mt-4 bg-brand-green text-white rounded-xl font-heading font-bold" data-testid="start-shopping-link">Start Shopping</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden" data-testid={`order-${order.id}`}>
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                      <div>
                        <p className="font-heading font-bold text-sm text-gray-900">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-400 font-body flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor(order.status)} text-xs font-body capitalize border-0`}>{order.status}</Badge>
                        <span className="font-heading font-extrabold text-base">&#8377;{order.total}</span>
                      </div>
                    </div>
                    <div className="p-4 flex gap-2 overflow-x-auto">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 shrink-0">
                          <img src={item.image || 'https://via.placeholder.com/32'} alt="" className="w-8 h-8 rounded object-cover" />
                          <div>
                            <p className="text-xs font-heading font-bold text-gray-700 truncate max-w-[100px]">{item.name}</p>
                            <p className="text-[10px] text-gray-400">x{item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ADDRESSES */}
          <TabsContent value="addresses" data-testid="addresses-tab">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-gray-900">Saved Addresses</h3>
              <Button onClick={() => setAddressDialog(true)} className="bg-brand-green hover:bg-brand-green-dark text-white rounded-xl font-heading font-bold text-sm" data-testid="add-address-btn">
                <Plus className="w-4 h-4 mr-1" /> Add Address
              </Button>
            </div>
            {addresses.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-heading font-bold text-gray-400">No saved addresses</p>
                <p className="text-sm text-gray-400 font-body mt-1">Add an address for faster checkout</p>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map(addr => (
                  <div key={addr.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start justify-between group" data-testid={`address-${addr.id}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-brand-green-light rounded-lg flex items-center justify-center mt-0.5 shrink-0">
                        <MapPin className="w-4 h-4 text-brand-green" />
                      </div>
                      <div>
                        <p className="font-heading font-bold text-sm text-gray-900">{addr.label}</p>
                        <p className="text-sm text-gray-500 font-body mt-0.5">{addr.full_address}</p>
                        {(addr.city || addr.pincode) && <p className="text-xs text-gray-400 font-body">{[addr.city, addr.pincode].filter(Boolean).join(' - ')}</p>}
                        {addr.phone && <p className="text-xs text-gray-400 font-body">{addr.phone}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteAddress(addr.id)} className="text-gray-300 hover:text-red-500 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`delete-address-${addr.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ADD ADDRESS DIALOG */}
      <Dialog open={addressDialog} onOpenChange={setAddressDialog}>
        <DialogContent className="max-w-md rounded-2xl" data-testid="address-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-lg">Add Address</DialogTitle>
            <DialogDescription className="text-sm text-gray-400 font-body">Save a delivery address for faster checkout</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider">Label</label>
              <div className="flex gap-2 mt-1">
                {['Home', 'Work', 'Other'].map(l => (
                  <button key={l} onClick={() => setAddrForm({ ...addrForm, label: l })} className={`px-4 py-1.5 rounded-lg text-sm font-heading font-bold transition-colors ${addrForm.label === l ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-500'}`} data-testid={`label-${l.toLowerCase()}`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider">Full Address *</label>
              <Input data-testid="address-full" value={addrForm.full_address} onChange={e => setAddrForm({ ...addrForm, full_address: e.target.value })} placeholder="House/Flat no., Street, Area" className="mt-1 h-12 rounded-xl text-base font-body" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider">City</label>
                <Input data-testid="address-city" value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} placeholder="City" className="mt-1 h-12 rounded-xl text-base font-body" />
              </div>
              <div>
                <label className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider">Pincode</label>
                <Input data-testid="address-pincode" value={addrForm.pincode} onChange={e => setAddrForm({ ...addrForm, pincode: e.target.value })} placeholder="Pincode" className="mt-1 h-12 rounded-xl text-base font-body" />
              </div>
            </div>
            <div>
              <label className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider">Phone</label>
              <Input data-testid="address-phone" value={addrForm.phone} onChange={e => setAddrForm({ ...addrForm, phone: e.target.value })} placeholder="Contact number" className="mt-1 h-12 rounded-xl text-base font-body" />
            </div>
            <Button data-testid="save-address-btn" onClick={handleAddAddress} className="w-full h-12 bg-brand-green hover:bg-brand-green-dark text-white font-heading font-bold rounded-xl text-base active:scale-[0.98] transition-transform">Save Address</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
