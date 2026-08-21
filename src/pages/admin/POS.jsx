import React, { useState, useEffect, useContext } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { supabase } from '../../utils/Supabase';
import { SessionContext } from '../../Contexts/SessionContexts';
import {
  MdPointOfSale, MdDelete, MdReceipt, MdClose
} from 'react-icons/md';
import { FaMoneyBillWave, FaMobileAlt, FaShoppingCart } from 'react-icons/fa';

const POS = () => {
  const { profile } = useContext(SessionContext);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('Food');
  const [cart, setCart] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const tabs = ['Food', 'Beverages'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, stock_monitoring(quantity)')
      .eq('is_available', true);
    if (error) console.error(error);
    if (data) {
      // Flatten stock quantity
      const withStock = data.map(p => ({
        ...p,
        stock_quantity: p.stock_monitoring?.[0]?.quantity ?? 0
      }));
      setProducts(withStock);
    }
    setLoading(false);
  };

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) {
      alert(`${product.product_name} is out of stock.`);
      return;
    }
    const inCart = cart.find(c => c.id === product.id);
    if (inCart && inCart.qty >= product.stock_quantity) {
      alert(`Only ${product.stock_quantity} in stock.`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) {
        return prev.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev =>
      prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c)
        .filter(c => c.qty > 0)
    );
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Clear all items from cart?')) setCart([]);
  };

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const filtered = products.filter(p => p.category === activeTab);

  const handlePayment = async (method) => {
    if (cart.length === 0) { alert('Cart is empty.'); return; }
    if (!profile?.id) { alert('Session expired. Please log in again.'); return; }
    setProcessing(true);

    // Insert sales transaction
    const { data: txData, error: txError } = await supabase
      .from('sales_transactions')
      .insert({
        staff_id: profile.id,
        total_amount: total,
        payment_method: method,
        items: cart.map(item => ({
          id: item.id,
          product_name: item.product_name,
          price: item.price,
          qty: item.qty,
          category: item.category,
        })),
      })
      .select()
      .single();

    if (txError) {
      console.error('Transaction error:', txError);
      alert(`Transaction failed: ${txError.message}`);
      setProcessing(false);
      return;
    }

    // Update stock for each item
    for (const item of cart) {
      const newQty = Math.max(0, item.stock_quantity - item.qty);
      await supabase
        .from('stock_monitoring')
        .update({ quantity: newQty, last_updated: new Date().toISOString() })
        .eq('product_id', item.id);
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: profile.id,
      action: 'POS_TRANSACTION',
      table_name: 'sales_transactions',
      record_id: txData.id,
      details: `${method} payment of ₱${total.toFixed(2)} — ${cart.length} item(s) processed by ${profile.name || profile.email}`,
    });

    setReceipt({ ...txData, cartItems: cart, method });
    setCart([]);
    fetchProducts(); // Refresh stock
    setProcessing(false);
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <MdPointOfSale className="text-gray-400" />
        Point-of-Sale
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Process walk-in transactions for food, beverages, and billiard time
      </p>

      {/* Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">

            {/* Success Header */}
            <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <MdReceipt className="text-green-600 text-2xl" />
              </div>
              <h2 className="font-black text-lg text-green-700">Payment Successful!</h2>
              <p className="text-xs text-gray-400 font-mono mt-1">
                TXN: {receipt.id?.slice(0, 12).toUpperCase()}
              </p>
            </div>

            {/* Items */}
            <div className="px-6 py-4 space-y-2 max-h-48 overflow-y-auto">
              {receipt.cartItems?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.product_name}
                    <span className="text-gray-400 ml-1">×{item.qty}</span>
                  </span>
                  <span className="font-semibold">
                    ₱{(item.price * item.qty).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total + Payment */}
            <div className="px-6 py-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between font-black text-xl">
                <span>Total</span>
                <span>₱{receipt.total_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Payment Method</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-xs
                  ${receipt.payment_method === 'Cash'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'}`}>
                  {receipt.payment_method}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Processed by</span>
                <span className="font-semibold">{profile?.name || profile?.email}</span>
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setReceipt(null)}
                className="btn btn-neutral w-full rounded-full">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Products Panel */}
        <div className="lg:col-span-2 border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm">

          {/* Tab Switcher */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex rounded-full bg-gray-100 p-1">
              {tabs.map(tab => (
                <button key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-bold rounded-full transition-all
                    ${activeTab === tab
                      ? 'bg-white shadow text-black'
                      : 'text-gray-500 hover:text-gray-700'}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <span className="loading loading-spinner loading-md text-gray-300" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map(product => {
                  const inCart = cart.find(c => c.id === product.id);
                  const isOutOfStock = product.stock_quantity <= 0;
                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOutOfStock && addToCart(product)}
                      className={`relative border-2 rounded-2xl p-4 transition-all
                        ${isOutOfStock
                          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          : inCart
                            ? 'border-black bg-black/5 cursor-pointer'
                            : 'border-gray-200 hover:border-gray-400 cursor-pointer hover:shadow-sm'}`}>

                      {/* Cart badge */}
                      {inCart && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black text-white text-xs font-black flex items-center justify-center">
                          {inCart.qty}
                        </div>
                      )}

                      {/* Product Image */}
                      <div className="w-full h-20 bg-gray-100 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
                        {product.image_url
                          ? <img src={product.image_url} alt={product.product_name}
                            className="w-full h-full object-cover" />
                          : <span className="text-gray-300 text-3xl">🍽️</span>}
                      </div>

                      <p className="font-bold text-sm truncate">{product.product_name}</p>
                      <p className="text-gray-600 font-semibold text-sm mt-0.5">₱{product.price}</p>

                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                          ${product.stock_quantity > 10
                            ? 'bg-green-100 text-green-700'
                            : product.stock_quantity > 0
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-red-100 text-red-600'}`}>
                          {isOutOfStock ? 'Out of Stock' : `Stock: ${product.stock_quantity}`}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-gray-400">
                    <p className="text-3xl mb-2">🍽️</p>
                    <p className="text-sm">No products in this category.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm flex flex-col">

          {/* Cart Header */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="font-bold text-sm flex items-center gap-2">
              <FaShoppingCart className="text-gray-400" />
              Order ({cart.length})
            </p>
            {cart.length > 0 && (
              <button onClick={clearCart}
                className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors flex items-center gap-1">
                <MdDelete className="text-sm" /> Clear
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-48">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-gray-300">
                <FaShoppingCart className="text-4xl mx-auto mb-2" />
                <p className="text-sm text-gray-400">No items added yet</p>
                <p className="text-xs text-gray-300 mt-1">Click a product to add</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{item.product_name}</p>
                  <p className="text-xs text-gray-400">₱{item.price} each</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm font-bold hover:bg-gray-200 transition-colors">
                    −
                  </button>
                  <span className="text-sm font-black w-5 text-center">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    disabled={item.qty >= item.stock_quantity}
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-40">
                    +
                  </button>
                </div>
                <p className="text-sm font-black w-16 text-right">
                  ₱{(item.price * item.qty).toFixed(2)}
                </p>
                <button
                  onClick={() => updateQty(item.id, -item.qty)}
                  className="text-red-400 hover:text-red-600 transition-colors">
                  <MdDelete className="text-base" />
                </button>
              </div>
            ))}
          </div>

          {/* Total + Payment */}
          <div className="p-4 border-t border-gray-100 space-y-3">
            {/* Itemized subtotals */}
            {cart.length > 0 && (
              <div className="space-y-1">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-xs text-gray-400">
                    <span>{item.product_name} ×{item.qty}</span>
                    <span>₱{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between font-black text-lg border-t border-gray-100 pt-3">
              <span>Total</span>
              <span>₱{total.toFixed(2)}</span>
            </div>

            {/* Payment Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handlePayment('Cash')}
                disabled={processing || cart.length === 0}
                className="btn w-full rounded-full gap-2 bg-gray-900 text-white hover:bg-black border-none disabled:opacity-40">
                {processing
                  ? <span className="loading loading-spinner loading-sm" />
                  : <FaMoneyBillWave className="text-green-400" />}
                Pay with Cash
              </button>
              <button
                onClick={() => handlePayment('GCash')}
                disabled={processing || cart.length === 0}
                className="btn w-full rounded-full gap-2 bg-blue-600 text-white hover:bg-blue-700 border-none disabled:opacity-40">
                {processing
                  ? <span className="loading loading-spinner loading-sm" />
                  : <FaMobileAlt />}
                Pay with GCash
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default POS;