import React, { useState, useEffect, useContext } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { supabase } from '../../utils/Supabase';
import { SessionContext } from '../../Contexts/SessionContexts';
import Input from '../../components/Forms/Input';
import { MdTableBar, MdAdd, MdEdit, MdDelete } from 'react-icons/md';

const Tables = () => {
  const { profile } = useContext(SessionContext);
  // Same useState pattern as event-gate ManageEvents.jsx
  const [tables, setTables] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);

  useEffect(() => {
    fetchTables();
  }, []);

  // Same fetch pattern as event-gate fetchEvents()
  const fetchTables = async () => {
    const { data, error } = await supabase.from('tables').select().order('table_number');
    if (error) console.error(error);
    if (data) setTables(data);
  };

  // Same insert/update pattern as event-gate EventForm
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const tableForm = Object.fromEntries(formData.entries());
    tableForm.price_per_hour = parseFloat(tableForm.price_per_hour);
    tableForm.is_active = true;

    if (editingTable) {
      const { error } = await supabase.from('tables').update(tableForm).eq('id', editingTable.id);
      if (error) { alert(error.message); return; }
    } else {
      const { error } = await supabase.from('tables').insert({ ...tableForm, status: 'available' });
      if (error) { alert(error.message); return; }
    }

    await supabase.from('audit_logs').insert({
      user_id: profile.id,
      action: editingTable ? 'UPDATE_TABLE' : 'CREATE_TABLE',
      table_name: 'tables',
      details: `Table ${tableForm.table_number} ${editingTable ? 'updated' : 'created'}`,
    });

    setShowForm(false);
    setEditingTable(null);
    fetchTables();
  };


  const handleDelete = async (table) => {
    if (!confirm(`Delete Table ${table.table_number}?`)) return;
    const { error } = await supabase.from('tables').delete().eq('id', table.id);
    if (error) { alert(error.message); return; }
    await supabase.from('audit_logs').insert({
      user_id: profile.id, action: 'DELETE_TABLE', table_name: 'tables',
      details: `Table ${table.table_number} deleted`,
    });
    setTables(prev => prev.filter(t => t.id !== table.id));
  };

  const statusColor = (status) => ({
    available: 'badge-success', occupied: 'badge-warning', reserved: 'badge-info', maintenance: 'badge-error',
  }[status] || 'badge-ghost');

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tables</h1>
          <p className="text-gray-500 text-sm">Manage billiard tables</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingTable(null); }} className="btn btn-neutral rounded-full gap-2">
          <MdAdd /> Add Table
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-lg mb-4">{editingTable ? 'Edit Table' : 'Add Table'}</h2>
            <form onSubmit={handleSubmit}>
              <Input name="table_number" label="Table Number" type="number" placeholder="1" defaultValue={editingTable?.table_number} required />
              <Input name="price_per_hour" label="Price per Hour (₱)" type="number" placeholder="50" defaultValue={editingTable?.price_per_hour} required />
              <fieldset className="fieldset w-full mb-3">
                <legend className="fieldset-legend">Description</legend>
                <textarea name="description" className="textarea textarea-bordered w-full" placeholder="Optional notes" defaultValue={editingTable?.description} />
              </fieldset>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost flex-1 rounded-full">Cancel</button>
                <button type="submit" className="btn btn-neutral flex-1 rounded-full">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-3 gap-4">
        {tables.map(table => (
          <div key={table.id} className="border border-gray-200 rounded-xl p-5 bg-white">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <MdTableBar className="text-2xl text-gray-600" />
                <span className="font-bold">Table {table.table_number}</span>
              </div>
              <span className={`badge badge-sm capitalize ${statusColor(table.status)}`}>{table.status}</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">₱{table.price_per_hour}/hour</p>
            {table.description && <p className="text-xs text-gray-400 mb-3">{table.description}</p>}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setEditingTable(table); setShowForm(true); }}
                className="btn btn-xs btn-ghost border border-gray-300 rounded-full gap-1"
              >
                <MdEdit /> Edit
              </button>
              {profile?.role === 'owner' && (
                <button onClick={() => handleDelete(table)} className="btn btn-xs btn-ghost text-red-500 border border-red-200 rounded-full gap-1">
                  <MdDelete /> Delete
                </button>
              )}
            </div>
          </div>
        ))}
        {tables.length === 0 && (
          <p className="col-span-3 text-center text-gray-400 py-10">No tables added yet.</p>
        )}
      </div>
    </AdminLayout>
  );
};

export default Tables;
