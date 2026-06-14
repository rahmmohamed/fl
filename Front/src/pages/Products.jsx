import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProducts, addProduct, updateProduct, deleteProduct,
} from '../features/products/productsSlice';
import Modal from '../components/Modal';

const emptyForm = { name: '', description: '', price: '', stock: '', category: '', image_url: '', is_active: true };

export default function Products() {
  const dispatch = useDispatch();
  const { items: products, loading, error } = useSelector((s) => s.products);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price ?? '',
      stock: product.stock ?? '',
      category: product.category || '',
      image_url: product.image_url || '',
      is_active: product.is_active ?? true,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock || 0, 10) };
    if (editingId) {
      await dispatch(updateProduct({ id: editingId, ...payload }));
    } else {
      await dispatch(addProduct(payload));
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this product? This cannot be undone.')) {
      dispatch(deleteProduct(id));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        <p>Catalog of items you sell</p>
      </div>

      <div className="toolbar">
        <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>{products.length} products</span>
        <button className="btn-primary" onClick={openAddModal}>+ Add product</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : error ? (
          <div className="empty-state">Error: {error}</div>
        ) : products.length === 0 ? (
          <div className="empty-state">No products yet. Add your first one.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.category || '—'}</td>
                  <td>${Number(p.price).toFixed(2)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <span className={`badge ${p.is_active ? 'badge-active' : 'badge-churned'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-secondary btn-sm" onClick={() => openEditModal(p)}>Edit</button>{' '}
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editingId ? 'Edit product' : 'Add product'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="modal-field">
              <label>Name</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="modal-field">
              <label>Description</label>
              <textarea name="description" rows={2} value={form.description} onChange={handleChange} />
            </div>
            <div className="modal-field">
              <label>Price</label>
              <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} required />
            </div>
            <div className="modal-field">
              <label>Stock</label>
              <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} />
            </div>
            <div className="modal-field">
              <label>Category</label>
              <input name="category" value={form.category} onChange={handleChange} />
            </div>
            <div className="modal-field">
              <label>Image URL</label>
              <input name="image_url" value={form.image_url} onChange={handleChange} />
            </div>
            <div className="modal-field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} style={{ width: 'auto' }} />
              <label style={{ margin: 0 }}>Active</label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">{editingId ? 'Save changes' : 'Add product'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
