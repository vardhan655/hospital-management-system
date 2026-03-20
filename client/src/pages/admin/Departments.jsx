import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdClose, MdBusiness } from 'react-icons/md';

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', location: '', phone: '', headDoctor: '' });
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const [de, dr] = await Promise.all([api.get('/departments'), api.get('/doctors')]);
      setDepartments(de.data.data);
      setDoctors(dr.data.data);
    } catch { toast.error('Failed to load departments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => { setForm({ name: '', description: '', location: '', phone: '', headDoctor: '' }); setSelected(null); setModal('form'); };
  const openEdit = (d) => { setSelected(d); setForm({ name: d.name, description: d.description || '', location: d.location || '', phone: d.phone || '', headDoctor: d.headDoctor?._id || '' }); setModal('form'); };
  const close = () => { setModal(null); setSelected(null); };
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.name) return toast.error('Department name is required');
    setSaving(true);
    try {
      if (!selected) { await api.post('/departments', form); toast.success('Department created'); }
      else { await api.put(`/departments/${selected._id}`, form); toast.success('Department updated'); }
      close(); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this department?')) return;
    try { await api.delete(`/departments/${id}`); toast.success('Department deactivated'); fetch(); }
    catch { toast.error('Failed to deactivate'); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><p>Loading departments...</p></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Departments</h1><p>{departments.length} active departments</p></div>
        <button className="btn btn-primary" onClick={openAdd}><MdAdd />Add Department</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {departments.length === 0
          ? <div className="empty-state"><MdBusiness /><h3>No departments</h3></div>
          : departments.map(d => (
            <div key={d._id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MdBusiness style={{ color: 'var(--primary)', fontSize: 22 }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{d.name}</div>
                    {d.location && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.location}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-primary btn-icon" onClick={() => openEdit(d)}><MdEdit /></button>
                </div>
              </div>
              {d.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{d.description}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
                <div className="avatar avatar-sm">{d.headDoctor?.name?.[0] || 'H'}</div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Head Doctor</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{d.headDoctor?.name || 'Not assigned'}</div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {modal === 'form' && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selected ? 'Edit Department' : 'Add Department'}</h2>
              <button className="modal-close" onClick={close}><MdClose /></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Name <span>*</span></label><input className="form-control" name="name" value={form.name} onChange={handleChange} /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" name="description" value={form.description} onChange={handleChange} /></div>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Location</label><input className="form-control" name="location" value={form.location} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-control" name="phone" value={form.phone} onChange={handleChange} /></div>
              </div>
              <div className="form-group"><label className="form-label">Head Doctor</label>
                <select className="form-control" name="headDoctor" value={form.headDoctor} onChange={handleChange}>
                  <option value="">-- No head doctor --</option>
                  {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDepartments;
