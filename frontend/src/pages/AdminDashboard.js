import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Upload, LogOut, Package, LayoutGrid, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function AdminDashboard() {
  const { admin, logout, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productDialog, setProductDialog] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  // Product form
  const [pForm, setPForm] = useState({ name: '', price: '', mrp: '', description: '', category_id: '', image: '', unit: '1 pc', in_stock: true });
  // Category form
  const [cForm, setCForm] = useState({ name: '', image: '', description: '' });

  const headers = getAuthHeaders();

  const fetchData = useCallback(async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/categories`),
        axios.get(`${API_BASE_URL}/products?limit=100`)
      ]);
      setCategories(catRes.data);
      setProducts(prodRes.data);
    } catch (e) {
      console.error('Failed to fetch data', e);
    }
  }, []);

  useEffect(() => {
    if (!admin) { navigate('/bastar-admin'); return; }
    fetchData();
  }, [admin, navigate, fetchData]);

  // Cloudinary upload
  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const sigRes = await axios.get(`${API_BASE_URL}/cloudinary/signature?folder=bastarmart`, { headers });
      const sig = sigRes.data;
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', sig.api_key);
      form.append('timestamp', sig.timestamp);
      form.append('signature', sig.signature);
      form.append('folder', sig.folder);
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, { method: 'POST', body: form });
      const data = await uploadRes.json();
      if (data.secure_url) {
        setImagePreview(data.secure_url);
        toast.success('Image uploaded!');
        return data.secure_url;
      }
      throw new Error(data.error?.message || 'Upload failed');
    } catch (e) {
      toast.error('Image upload failed: ' + e.message);
      return '';
    } finally {
      setUploading(false);
    }
  };

  // PRODUCT CRUD
  const openProductDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setPForm({ name: product.name, price: String(product.price), mrp: String(product.mrp), description: product.description, category_id: product.category_id, image: product.image, unit: product.unit, in_stock: product.in_stock });
      setImagePreview(product.image);
    } else {
      setEditingProduct(null);
      setPForm({ name: '', price: '', mrp: '', description: '', category_id: '', image: '', unit: '1 pc', in_stock: true });
      setImagePreview('');
    }
    setProductDialog(true);
  };

  const saveProduct = async () => {
    if (!pForm.name || !pForm.price || !pForm.category_id) {
      toast.error('Name, price, and category are required');
      return;
    }
    const payload = { ...pForm, price: parseFloat(pForm.price), mrp: parseFloat(pForm.mrp) || parseFloat(pForm.price), image: imagePreview || pForm.image };
    try {
      if (editingProduct) {
        await axios.put(`${API_BASE_URL}/products/${editingProduct.id}`, payload, { headers });
        toast.success('Product updated!');
      } else {
        await axios.post(`${API_BASE_URL}/products`, payload, { headers });
        toast.success('Product created!');
      }
      setProductDialog(false);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save product');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/products/${id}`, { headers });
      toast.success('Product deleted');
      fetchData();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  // CATEGORY CRUD
  const openCategoryDialog = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCForm({ name: cat.name, image: cat.image, description: cat.description });
      setImagePreview(cat.image);
    } else {
      setEditingCategory(null);
      setCForm({ name: '', image: '', description: '' });
      setImagePreview('');
    }
    setCategoryDialog(true);
  };

  const saveCategory = async () => {
    if (!cForm.name) { toast.error('Category name is required'); return; }
    const payload = { ...cForm, image: imagePreview || cForm.image };
    try {
      if (editingCategory) {
        await axios.put(`${API_BASE_URL}/categories/${editingCategory.id}`, payload, { headers });
        toast.success('Category updated!');
      } else {
        await axios.post(`${API_BASE_URL}/categories`, payload, { headers });
        toast.success('Category created!');
      }
      setCategoryDialog(false);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save category');
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category and all its products?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/categories/${id}`, { headers });
      toast.success('Category deleted');
      fetchData();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const handleLogout = () => { logout(); navigate('/bastar-admin', { replace: true }); };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-dashboard">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
              <span className="text-white font-accent text-sm font-bold">B</span>
            </div>
            <h1 className="font-heading font-extrabold text-lg text-gray-900">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-body hidden sm:block">{admin?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-red-500" data-testid="admin-logout-btn">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 font-body uppercase tracking-wider">Products</p>
            <p className="font-heading font-extrabold text-2xl text-gray-900 mt-1">{products.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 font-body uppercase tracking-wider">Categories</p>
            <p className="font-heading font-extrabold text-2xl text-gray-900 mt-1">{categories.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 font-body uppercase tracking-wider">In Stock</p>
            <p className="font-heading font-extrabold text-2xl text-brand-green mt-1">{products.filter(p => p.in_stock).length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 font-body uppercase tracking-wider">Out of Stock</p>
            <p className="font-heading font-extrabold text-2xl text-red-500 mt-1">{products.filter(p => !p.in_stock).length}</p>
          </div>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="bg-white border border-gray-100 rounded-xl p-1 mb-6" data-testid="admin-tabs">
            <TabsTrigger value="products" className="rounded-lg font-heading font-bold data-[state=active]:bg-brand-green data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-1.5" /> Products
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg font-heading font-bold data-[state=active]:bg-brand-green data-[state=active]:text-white">
              <LayoutGrid className="w-4 h-4 mr-1.5" /> Categories
            </TabsTrigger>
          </TabsList>

          {/* PRODUCTS TAB */}
          <TabsContent value="products" data-testid="products-tab">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg text-gray-900">All Products</h2>
              <Button onClick={() => openProductDialog()} className="bg-brand-green hover:bg-brand-green-dark text-white rounded-xl font-heading font-bold" data-testid="add-product-btn">
                <Plus className="w-4 h-4 mr-1" /> Add Product
              </Button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="products-table">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left py-3 px-4 font-heading font-bold text-gray-500 text-xs uppercase tracking-wider">Product</th>
                      <th className="text-left py-3 px-4 font-heading font-bold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Category</th>
                      <th className="text-left py-3 px-4 font-heading font-bold text-gray-500 text-xs uppercase tracking-wider">Price</th>
                      <th className="text-left py-3 px-4 font-heading font-bold text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">Unit</th>
                      <th className="text-right py-3 px-4 font-heading font-bold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors" data-testid={`product-row-${product.id}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={product.image || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-heading font-bold text-gray-900 truncate max-w-[200px]">{product.name}</p>
                              <p className="text-xs text-gray-400 font-body md:hidden">{product.category_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <Badge variant="secondary" className="font-body text-xs">{product.category_name}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-heading font-bold">&#8377;{product.price}</span>
                          {product.mrp > product.price && <span className="text-xs text-gray-400 line-through ml-1">&#8377;{product.mrp}</span>}
                        </td>
                        <td className="py-3 px-4 text-gray-500 font-body hidden sm:table-cell">{product.unit}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openProductDialog(product)} className="text-gray-400 hover:text-brand-green h-8 w-8" data-testid={`edit-product-${product.id}`}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)} className="text-gray-400 hover:text-red-500 h-8 w-8" data-testid={`delete-product-${product.id}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {products.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="font-heading font-bold text-gray-400">No products yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories" data-testid="categories-tab">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg text-gray-900">All Categories</h2>
              <Button onClick={() => openCategoryDialog()} className="bg-brand-green hover:bg-brand-green-dark text-white rounded-xl font-heading font-bold" data-testid="add-category-btn">
                <Plus className="w-4 h-4 mr-1" /> Add Category
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 group hover:shadow-md transition-shadow" data-testid={`category-row-${cat.id}`}>
                  <img src={cat.image || 'https://via.placeholder.com/60'} alt="" className="w-14 h-14 rounded-xl object-cover bg-gray-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-gray-900">{cat.name}</h3>
                    <p className="text-xs text-gray-400 font-body">{cat.product_count} products</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openCategoryDialog(cat)} className="text-gray-400 hover:text-brand-green h-8 w-8" data-testid={`edit-category-${cat.id}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)} className="text-gray-400 hover:text-red-500 h-8 w-8" data-testid={`delete-category-${cat.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <LayoutGrid className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="font-heading font-bold text-gray-400">No categories yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* PRODUCT DIALOG */}
      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl" data-testid="product-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-lg">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400 font-body">
              {editingProduct ? 'Update product details' : 'Fill in product details and upload an image'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider">Name *</label>
              <Input data-testid="product-name-input" value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} placeholder="Product name" className="mt-1 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider">Price *</label>
                <Input data-testid="product-price-input" type="number" value={pForm.price} onChange={e => setPForm({ ...pForm, price: e.target.value })} placeholder="0" className="mt-1 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider">MRP</label>
                <Input data-testid="product-mrp-input" type="number" value={pForm.mrp} onChange={e => setPForm({ ...pForm, mrp: e.target.value })} placeholder="0" className="mt-1 rounded-xl" />
              </div>
            </div>
            <div>
              <label className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider">Category *</label>
              <Select value={pForm.category_id} onValueChange={val => setPForm({ ...pForm, category_id: val })}>
                <SelectTrigger className="mt-1 rounded-xl" data-testid="product-category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider">Unit</label>
              <Input data-testid="product-unit-input" value={pForm.unit} onChange={e => setPForm({ ...pForm, unit: e.target.value })} placeholder="e.g. 500 ml, 1 kg" className="mt-1 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider">Description</label>
              <Input data-testid="product-desc-input" value={pForm.description} onChange={e => setPForm({ ...pForm, description: e.target.value })} placeholder="Short description" className="mt-1 rounded-xl" />
            </div>
            {/* Image Upload */}
            <div>
              <label className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider">Image</label>
              <div className="mt-1 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-brand-green transition-colors">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl" />
                    <button onClick={() => { setImagePreview(''); setPForm({ ...pForm, image: '' }); }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center" data-testid="remove-image-btn">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                    <span className="text-sm text-gray-400 font-body">{uploading ? 'Uploading...' : 'Click to upload image'}</span>
                    <input
                      data-testid="product-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const url = await handleImageUpload(file);
                          if (url) setPForm(prev => ({ ...prev, image: url }));
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
            <Button
              data-testid="save-product-btn"
              onClick={saveProduct}
              disabled={uploading}
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white rounded-xl h-11 font-heading font-bold active:scale-[0.98] transition-transform"
            >
              {editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CATEGORY DIALOG */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent className="max-w-md rounded-2xl" data-testid="category-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-lg">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400 font-body">
              {editingCategory ? 'Update category details' : 'Create a new product category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider">Name *</label>
              <Input data-testid="category-name-input" value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} placeholder="Category name" className="mt-1 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider">Description</label>
              <Input data-testid="category-desc-input" value={cForm.description} onChange={e => setCForm({ ...cForm, description: e.target.value })} placeholder="Short description" className="mt-1 rounded-xl" />
            </div>
            {/* Image Upload */}
            <div>
              <label className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wider">Image</label>
              <div className="mt-1 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-brand-green transition-colors">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl" />
                    <button onClick={() => { setImagePreview(''); setCForm({ ...cForm, image: '' }); }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center" data-testid="remove-cat-image-btn">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                    <span className="text-sm text-gray-400 font-body">{uploading ? 'Uploading...' : 'Click to upload image'}</span>
                    <input
                      data-testid="category-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const url = await handleImageUpload(file);
                          if (url) setCForm(prev => ({ ...prev, image: url }));
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
            <Button
              data-testid="save-category-btn"
              onClick={saveCategory}
              disabled={uploading}
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white rounded-xl h-11 font-heading font-bold active:scale-[0.98] transition-transform"
            >
              {editingCategory ? 'Update Category' : 'Add Category'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
