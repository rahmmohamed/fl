import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCustomers, addCustomer, updateCustomer, deleteCustomer,
} from '../features/customers/customersSlice';
import Modal from '../components/Modal';

const emptyForm = { name: '', email: '', phone: '', company: '', status: 'lead', notes: '' };

export default function Customers() {
  const dispatch = useDispatch();
  const { items: customers, loading, error } = useSelector((s) => s.customers);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditingId(customer.id);
    setForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      company: customer.company || '',
      status: customer.status || 'lead',
      notes: customer.notes || '',
    });
    setShowModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await dispatch(updateCustomer({ id: editingId, ...form }));
    } else {
      await dispatch(addCustomer(form));
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this customer? This cannot be undone.')) {
      dispatch(deleteCustomer(id));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <p>Manage your contacts and accounts</p>
      </div>

      <div className="toolbar">
        <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>{customers.length} customers</span>
        <button className="btn-primary" onClick={openAddModal}>+ Add customer</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : error ? (
          <div className="empty-state">Error: {error}</div>
        ) : customers.length === 0 ? (
          <div className="empty-state">No customers yet. Add your first one.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.company}</td>
                  <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-secondary btn-sm" onClick={() => openEditModal(c)}>Edit</button>{' '}
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editingId ? 'Edit customer' : 'Add customer'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="modal-field">
              <label>Name</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="modal-field">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="modal-field">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="modal-field">
              <label>Company</label>
              <input name="company" value={form.company} onChange={handleChange} />
            </div>
            <div className="modal-field">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="lead">Lead</option>
                <option value="active">Active</option>
                <option value="churned">Churned</option>
              </select>
            </div>
            <div className="modal-field">
              <label>Notes</label>
              <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">{editingId ? 'Save changes' : 'Add customer'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
