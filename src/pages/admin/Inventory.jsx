import React, { useState, useEffect, useContext } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { supabase } from '../../utils/Supabase';
import { SessionContext } from '../../Contexts/SessionContexts';
import Input from '../../components/Forms/Input';
import { MdAdd, MdEdit, MdDelete, MdWarning } from 'react-icons/md';

const Inventory = () => {
  const { profile } = useContext(SessionContext);
  // Same useState pattern as event-gate
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Food', 'Beverages', 'Supplies'];

  useEffect(() => { fetchProducts(); }, []);

  // Same fetch pattern as event-gate fetchEvents()
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, stock_monitoring(quantity, last_updated)')
      .order('product_name');
    if (error) console.error(error);
    if (data) setProducts(data);
  };

  // Same insert/update pattern as event-gate EventForm
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const form = {
      product_name: formData.get('product_name'),
      category: formData.get('category'),
      price: parseFloat(formData.get('price')),
      is_available: formData.get('is_available') === 'on',
    };
    const initStock = parseInt(formData.get('stock_quantity') || '0');

    if (editingProduct) {
      const { error } = await supabase.from('products').update(form).eq('id', editingProduct.id);
      if (error) { alert(error.message); return; }
      // Update stock
      await supabase.from('stock_monitoring')
        .update({ quantity: initStock, last_updated: new Date().toISOString() })
        .eq('product_id', editingProduct.id);
    } else {
      const { data: newProduct, error } = await supabase.from('products').insert(form).select().single();
      if (error) { alert(error.message); return; }
      // Create stock record - supply chain link
      await supabase.from('stock_monitoring').insert({
        product_id: newProduct.id,
        quantity: initStock,
        reorder_level: 10,
      });
    }

    await supabase.from('audit_logs').insert({
      user_id: profile.id,
      action: editingProduct ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT',
      table_name: 'products',
      details: `Product "${form.product_name}" ${editingProduct ? 'updated' : 'created'}`,
    });

    setShowForm(false);
    setEditingProduct(null);
    fetchProducts();
  };

  // Same delete pattern as event-gate
  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.product_name}"?`)) return;
    await supabase.from('stock_monitoring').delete().eq('product_id', product.id);
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) { alert(error.message); return; }
    await supabase.from('audit_logs').insert({
      user_id: profile.id, action: 'DELETE_PRODUCT', table_name: 'products',
      details: `Product "${product.product_name}" deleted`,
    });
    setProducts(prev => prev.filter(p => p.id !== product.id));
  };

  const getStock = (product) => product.stock_monitoring?.[0]?.quantity ?? 0;
  const isLowStock = (product) => getStock(product) < 10;

  const filtered = activeTab === 'All' ? products : products.filter(p => p.category === activeTab);
  const lowStockItems = products.filter(isLowStock);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-gray-500 text-sm">Product stock monitoring and management</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingProduct(null); }} className="btn btn-neutral rounded-full gap-2">
          <MdAdd /> Add Product
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="alert bg-red-50 border border-red-200 text-red-700 rounded-xl mb-5 flex gap-2">
          <MdWarning className="text-xl flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Low Stock Alert!</p>
            <p className="text-xs">{lowStockItems.map(p => p.product_name).join(', ')} — need restocking.</p>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-lg mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit}>
              <Input name="product_name" label="Product Name" type="text" placeholder="French Fries" defaultValue={editingProduct?.product_name} required />
              <Input name="price" label="Price (₱)" type="number" placeholder="120" defaultValue={editingProduct?.price} required />
              <Input name="stock_quantity" label="Stock Quantity" type="number" placeholder="50"
                defaultValue={editingProduct ? getStock(editingProduct) : ''} required />
              <fieldset className="fieldset w-full">
                <legend className="fieldset-legend">Category</legend>
                <select name="category" className="select select-bordered w-full" defaultValue={editingProduct?.category || 'Food'}>
                  <option value="Food">Food</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Supplies">Supplies</option>
                </select>
              </fieldset>
              <div className="flex items-center gap-2 mt-3 mb-4">
                <input type="checkbox" name="is_available" id="is_available" className="checkbox"
                  defaultChecked={editingProduct ? editingProduct.is_available : true} />
                <label htmlFor="is_available" className="text-sm">Available for ordering</label>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowForm(false); setEditingProduct(null); }} className="btn btn-ghost flex-1 rounded-full">Cancel</button>
                <button type="submit" className="btn btn-neutral flex-1 rounded-full">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className={`btn btn-sm rounded-full ${activeTab === tab ? 'btn-neutral' : 'btn-ghost border border-gray-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="text-xs text-gray-500">
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => {
                const stock = getStock(product);
                return (
                  <tr key={product.id} className={`text-sm ${isLowStock(product) ? 'bg-red-50' : ''}`}>
                    <td className="font-medium">{product.product_name}</td>
                    <td>
                      <span className="badge badge-xs badge-ghost">{product.category}</span>
                    </td>
                    <td>₱{product.price}</td>
                    <td>
                      <span className={`font-semibold ${stock < 10 ? 'text-red-500' : stock < 20 ? 'text-yellow-500' : 'text-green-600'}`}>
                        {stock}
                        {stock < 10 && <MdWarning className="inline ml-1 text-red-400" />}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-xs ${product.is_available ? 'badge-success' : 'badge-error'}`}>
                        {product.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingProduct(product); setShowForm(true); }}
                          className="btn btn-xs btn-ghost border border-gray-300 rounded-full">
                          <MdEdit />
                        </button>
                        {profile?.role === 'owner' && (
                          <button onClick={() => handleDelete(product)} className="btn btn-xs btn-ghost text-red-500 border border-red-200 rounded-full">
                            <MdDelete />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Inventory;
