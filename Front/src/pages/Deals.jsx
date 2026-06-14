import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDeals, addDeal, updateDeal, deleteDeal } from '../features/deals/dealsSlice';
import { fetchCustomers } from '../features/customers/customersSlice';
import { fetchProducts } from '../features/products/productsSlice';
import Modal from '../components/Modal';

const STAGES = ['new', 'negotiation', 'won', 'lost'];

const emptyForm = {
  customer_id: '',
  employee_id: '',
  stage: 'new',
  items: [{ product_id: '', quantity: 1, unit_price: 0 }],
};

export default function Deals() {
  const dispatch = useDispatch();
  const { items: deals, loading, error } = useSelector((s) => s.deals);
  const { items: customers } = useSelector((s) => s.customers);
  const { items: products } = useSelector((s) => s.products);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    dispatch(fetchDeals());
    dispatch(fetchCustomers());
    dispatch(fetchProducts());
  }, [dispatch]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  // Editing only changes stage/customer for an existing deal (items are fixed once created)
  const openEditModal = (deal) => {
    setEditingId(deal.id);
    setForm({
      customer_id: deal.customer_id,
      employee_id: deal.employee_id || '',
      stage: deal.stage,
      items: [],
    });
    setShowModal(true);
  };

  const handleFieldChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleItemChange = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    if (field === 'product_id') {
      const product = products.find((p) => p.id === Number(value));
      if (product) items[index].unit_price = product.price;
    }
    setForm({ ...form, items });
  };

  const addItemRow = () => {
    setForm({ ...form, items: [...form.items, { product_id: '', quantity: 1, unit_price: 0 }] });
  };

  const removeItemRow = (index) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await dispatch(updateDeal({
        id: editingId,
        customer_id: form.customer_id,
        employee_id: form.employee_id || null,
        stage: form.stage,
        closed_at: form.stage === 'won' || form.stage === 'lost' ? new Date().toISOString() : null,
      }));
    } else {
      const items = form.items
        .filter((i) => i.product_id)
        .map((i) => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
        }));
      if (items.length === 0) {
        alert('Add at least one product to the deal.');
        return;
      }
      await dispatch(addDeal({
        customer_id: Number(form.customer_id),
        employee_id: form.employee_id ? Number(form.employee_id) : null,
        stage: form.stage,
        items,
      }));
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this deal? This cannot be undone.')) {
      dispatch(deleteDeal(id));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Deals</h1>
        <p>Track opportunities through your pipeline</p>
      </div>

      <div className="toolbar">
        <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>{deals.length} deals</span>
        <button className="btn-primary" onClick={openAddModal}>+ New deal</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : error ? (
          <div className="empty-state">Error: {error}</div>
        ) : deals.length === 0 ? (
          <div className="empty-state">No deals yet. Create your first one.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th><th>Owner</th><th>Stage</th><th>Amount</th><th>Created</th><th></th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id}>
                  <td>{d.customer_name}</td>
                  <td>{d.employee_name || '—'}</td>
                  <td><span className={`badge badge-${d.stage}`}>{d.stage}</span></td>
                  <td>${Number(d.total_amount).toLocaleString()}</td>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-secondary btn-sm" onClick={() => openEditModal(d)}>Edit</button>{' '}
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(d.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editingId ? 'Edit deal' : 'New deal'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="modal-field">
              <label>Customer</label>
              <select name="customer_id" value={form.customer_id} onChange={handleFieldChange} required>
                <option value="">Select customer…</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="modal-field">
              <label>Stage</label>
              <select name="stage" value={form.stage} onChange={handleFieldChange}>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {!editingId && (
              <div className="modal-field">
                <label>Products</label>
                {form.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(i, 'product_id', e.target.value)}
                      style={{ flex: 2 }}
                      required
                    >
                      <option value="">Select product…</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} (${Number(p.price).toFixed(2)})</option>)}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(i, 'quantity', e.target.value)}
                      style={{ width: 70 }}
                      placeholder="Qty"
                    />
                    {form.items.length > 1 && (
                      <button type="button" className="btn-danger btn-sm" onClick={() => removeItemRow(i)}>×</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-secondary btn-sm" onClick={addItemRow}>+ Add product</button>
              </div>
            )}

            {editingId && (
              <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>
                Products are fixed once a deal is created. Only stage and customer can be edited here.
              </p>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">{editingId ? 'Save changes' : 'Create deal'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
