import React, { useState, useEffect, useContext } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { supabase } from '../../utils/Supabase';
import { SessionContext } from '../../Contexts/SessionContexts';

const POS = () => {
  const { profile } = useContext(SessionContext);
  // Same useState pattern as event-gate
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('Food');
  const [cart, setCart] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [processing, setProcessing] = useState(false);
  const tabs = ['Food', 'Beverages'];

  useEffect(() => {
    // Same fetch pattern as event-gate fetchEvents()
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select().eq('is_available', true);
      if (error) console.error(error);
      if (data) setProducts(data);
    };
    fetchProducts();
  }, []);

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) { alert('Out of stock'); return; }
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) return prev.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0));
  };

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const filtered = products.filter(p => p.category === activeTab);

  // Same insert pattern as event-gate insertEvent()
  const handlePayment = async (method) => {
    if (cart.length === 0) { alert('Cart is empty'); return; }
    setProcessing(true);

    const { data: txData, error: txError } = await supabase
      .from('sales_transactions')
      .insert({
        staff_id: profile.id,
        total_amount: total,
        payment_method: method,
        items: JSON.stringify(cart),
      })
      .select()
      .single();

    if (txError) { alert(txError.message); setProcessing(false); return; }

    // Update stock for each item in cart - same update pattern
    for (const item of cart) {
      await supabase
        .from('stock_monitoring')
        .update({ quantity: item.stock_quantity - item.qty })
        .eq('product_id', item.id);
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: profile.id,
      action: 'POS_TRANSACTION',
      table_name: 'sales_transactions',
      record_id: txData.id,
      details: `${method} payment of ₱${total.toFixed(2)} processed by ${profile.name || profile.email}`,
    });

    setReceipt({ ...txData, items: cart, method });
    setCart([]);
    setProcessing(false);
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-1">Point-of-Sale</h1>
      <p className="text-gray-500 text-sm mb-6">Overview of Zai's Billiard Hall and Bar Operations</p>

      {/* Receipt modal */}
      {receipt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-lg mb-1 text-center">Receipt</h2>
            <p className="text-xs text-gray-400 text-center mb-4">Transaction ID: {receipt.id?.slice(0, 12).toUpperCase()}</p>
            <div className="space-y-2 mb-4">
              {receipt.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product_name} x{item.qty}</span>
                  <span>₱{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span>₱{receipt.total_amount?.toFixed(2)}</span>
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">Payment: {receipt.method}</p>
            <button onClick={() => setReceipt(null)} className="btn btn-neutral w-full rounded-full mt-4">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="border border-gray-200 rounded-xl p-6 bg-white mb-4">
        {/* Tab switcher - from wireframe */}
        <div className="flex rounded-full bg-gray-100 p-1 mb-5">
          {tabs.map(tab => (
            <button key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors
                ${activeTab === tab ? 'bg-white shadow text-black' : 'text-gray-500'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Product Grid - from wireframe, same map pattern as event-gate */}
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(product => (
            <div key={product.id}
              className="border border-gray-200 rounded-xl p-3 flex gap-3 items-center cursor-pointer hover:border-gray-400 transition-all"
              onClick={() => addToCart(product)}
            >
              <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                {product.image_url
                  ? <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover rounded-lg" />
                  : <span className="text-gray-400 text-xs">IMG</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{product.product_name}</p>
                <p className="text-gray-600 text-xs">₱{product.price}</p>
                <span className={`badge badge-xs mt-1 ${product.stock_quantity > 10 ? 'badge-success' : product.stock_quantity > 0 ? 'badge-warning' : 'badge-error'}`}>
                  Stocks: {product.stock_quantity ?? 0}
                </span>
              </div>
              <span className="text-gray-400 text-lg">🛒</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-2 text-center text-gray-400 text-sm py-6">No products in this category.</p>
          )}
        </div>
      </div>

      {/* My Order Cart - from wireframe */}
      <div className="border border-gray-200 rounded-xl p-5 bg-white">
        <p className="font-semibold mb-4 flex items-center gap-2">🛒 My Order</p>

        {cart.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-3">No items added yet.</p>
        )}

        {cart.map(item => (
          <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div>
              <p className="text-sm font-medium">{item.product_name}</p>
              <p className="text-xs text-gray-400">₱{item.price}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQty(item.id, -1)} className="btn btn-xs border border-gray-300 rounded">-</button>
              <span className="text-sm w-5 text-center">{item.qty}</span>
              <button onClick={() => updateQty(item.id, 1)} className="btn btn-xs border border-gray-300 rounded">+</button>
              <button onClick={() => updateQty(item.id, -item.qty)} className="btn btn-xs text-red-500">🗑</button>
            </div>
          </div>
        ))}

        <div className="flex justify-between font-bold text-sm mt-4 mb-4">
          <span>Total:</span>
          <span>₱{total.toFixed(2)}</span>
        </div>

        {/* Payment buttons - from wireframe */}
        <div className="flex gap-3">
          <button
            onClick={() => handlePayment('Cash')}
            disabled={processing || cart.length === 0}
            className="btn btn-neutral flex-1 rounded-full"
          >
            Cash
          </button>
          <button
            onClick={() => handlePayment('GCash')}
            disabled={processing || cart.length === 0}
            className="btn btn-neutral flex-1 rounded-full"
          >
            GCash
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default POS;
