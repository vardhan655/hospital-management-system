import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdClose, MdMedicalServices } from 'react-icons/md';

const shifts = ['Morning', 'Afternoon', 'Night', 'Rotating'];

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('doctors');

  const fetch = useCallback(async () => {
    try {
      const [dr, st, de] = await Promise.all([
        api.get('/doctors'), api.get('/doctors/staff'), api.get('/departments')
      ]);
      setDoctors(dr.data.data);
      setStaff(st.data.data);
      setDepartments(de.data.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => {
    setForm({ name: '', email: '', password: '', role: tab === 'doctors' ? 'doctor' : 'staff', phone: '', specialty: '', qualification: '', department: '', shift: 'Morning', consultationFee: '', experience: '' });
    setSelected(null); setModal('add');
  };
  const openEdit = (u) => {
    setSelected(u);
    setForm({ name: u.name, email: u.email, phone: u.phone || '', specialty: u.profile?.specialty || '', qualification: u.profile?.qualification || '', department: u.profile?.department?._id || '', shift: u.profile?.shift || 'Morning', consultationFee: u.profile?.consultationFee || '', experience: u.profile?.experience || '' });
    setModal('edit');
  };
  const close = () => { setModal(null); setSelected(null); };
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email are required');
    setSaving(true);
    try {
      if (modal === 'add') {
        if (!form.password) return toast.error('Password is required');
        await api.post('/auth/register', form);
        toast.success('User created successfully');
      } else {
        await api.put(`/doctors/${selected._id}`, form);
        toast.success('User updated successfully');
      }
      close(); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try { await api.delete(`/doctors/${id}`); toast.success('User deactivated'); fetch(); }
    catch { toast.error('Failed to deactivate'); }
  };

  const list = tab === 'doctors' ? doctors : staff;
  if (loading) return <div className="loading-spinner"><div className="spinner" /><p>Loading...</p></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Doctors & Staff</h1>
          <p>Manage your medical team</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><MdAdd />Add {tab === 'doctors' ? 'Doctor' : 'Staff'}</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'white', width: 'fit-content', borderRadius: 'var(--radius-sm)', padding: 4, border: '1px solid var(--border)' }}>
        {['doctors', 'staff'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: 'calc(var(--radius-sm) - 2px)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: tab === t ? 'var(--primary)' : 'transparent', color: tab === t ? 'white' : 'var(--text-secondary)', transition: 'all 0.2s', textTransform: 'capitalize' }}>
            {t === 'doctors' ? `Doctors (${doctors.length})` : `Staff (${staff.length})`}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                {tab === 'doctors' && <th>Specialty</th>}
                <th>Department</th>
                <th>Shift</th>
                {tab === 'doctors' && <th>Fee</th>}
                <th>Experience</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0
                ? <tr><td colSpan={7}><div className="empty-state"><MdMedicalServices /><h3>No {tab} found</h3></div></td></tr>
                : list.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">{u.name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    {tab === 'doctors' && <td>{u.profile?.specialty || '—'}</td>}
                    <td>{u.profile?.department?.name || '—'}</td>
                    <td><span className="badge badge-info">{u.profile?.shift || '—'}</span></td>
                    {tab === 'doctors' && <td>{u.profile?.consultationFee ? `$${u.profile.consultationFee}` : '—'}</td>}
                    <td>{u.profile?.experience ? `${u.profile.experience} yrs` : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-primary" onClick={() => openEdit(u)}><MdEdit /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeactivate(u._id)}>Deactivate</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{modal === 'add' ? `Add ${tab === 'doctors' ? 'Doctor' : 'Staff'}` : 'Edit User'}</h2>
              <button className="modal-close" onClick={close}><MdClose /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Name <span>*</span></label><input className="form-control" name="name" value={form.name} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Email <span>*</span></label><input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} /></div>
                {modal === 'add' && <div className="form-group"><label className="form-label">Password <span>*</span></label><input className="form-control" type="password" name="password" value={form.password || ''} onChange={handleChange} /></div>}
                <div className="form-group"><label className="form-label">Phone</label><input className="form-control" name="phone" value={form.phone} onChange={handleChange} /></div>
                {tab === 'doctors' && <>
                  <div className="form-group"><label className="form-label">Specialty</label><input className="form-control" name="specialty" value={form.specialty} onChange={handleChange} /></div>
                  <div className="form-group"><label className="form-label">Consultation Fee ($)</label><input className="form-control" type="number" name="consultationFee" value={form.consultationFee} onChange={handleChange} /></div>
                </>}
                <div className="form-group"><label className="form-label">Qualification</label><input className="form-control" name="qualification" value={form.qualification} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Department</label>
                  <select className="form-control" name="department" value={form.department} onChange={handleChange}>
                    <option value="">-- Select department --</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Shift</label>
                  <select className="form-control" name="shift" value={form.shift} onChange={handleChange}>
                    {shifts.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Experience (years)</label><input className="form-control" type="number" name="experience" value={form.experience} onChange={handleChange} /></div>
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

export default AdminDoctors;
