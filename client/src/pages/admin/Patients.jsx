import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdClose, MdPeople } from 'react-icons/md';

const genders = ['Male', 'Female', 'Other'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const statuses = ['Active', 'Discharged', 'Critical', 'Stable'];
const statusColor = { Active: 'badge-success', Discharged: 'badge-secondary', Critical: 'badge-danger', Stable: 'badge-info' };

const emptyForm = { name: '', dateOfBirth: '', gender: 'Male', phone: '', email: '', address: '', bloodGroup: '', status: 'Active', allergies: '' };

const AdminPatients = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'delete' | 'view'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get('/patients', { params: { search } });
      setPatients(res.data.data);
    } catch { toast.error('Failed to load patients'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);
  useEffect(() => {
    api.get('/doctors').then(r => setDoctors(r.data.data)).catch(() => {});
  }, []);

  const openAdd = () => { setForm(emptyForm); setSelected(null); setModal('add'); };
  const openEdit = (p) => {
    setSelected(p);
    setForm({ ...p, dateOfBirth: p.dateOfBirth?.split('T')[0], allergies: p.allergies?.join(', ') || '', assignedDoctor: p.assignedDoctor?._id || '' });
    setModal('edit');
  };
  const openDelete = (p) => { setSelected(p); setModal('delete'); };
  const openView = (p) => { setSelected(p); setModal('view'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleChange = e => setForm(pr => ({ ...pr, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.name || !form.dateOfBirth || !form.phone) return toast.error('Name, DOB, and phone are required');
    setSaving(true);
    try {
      const payload = { ...form, allergies: form.allergies ? form.allergies.split(',').map(a => a.trim()).filter(Boolean) : [] };
      if (modal === 'add') {
        await api.post('/patients', payload);
        toast.success('Patient added successfully');
      } else {
        await api.put(`/patients/${selected._id}`, payload);
        toast.success('Patient updated successfully');
      }
      closeModal();
      fetchPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save patient');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/patients/${selected._id}`);
      toast.success('Patient deleted');
      closeModal();
      fetchPatients();
    } catch { toast.error('Failed to delete patient'); }
  };

  const calcAge = (dob) => {
    if (!dob) return '-';
    const diff = Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000));
    return `${diff} yrs`;
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><p>Loading patients...</p></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Patients</h1>
          <p>{patients.length} total patients</p>
        </div>
        <div className="filters">
          <div className="search-bar">
            <MdSearch />
            <input placeholder="Search name, ID, phone..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><MdClose size={16} /></button>}
          </div>
          <button className="btn btn-primary" onClick={openAdd}><MdAdd />Add Patient</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Patient ID</th><th>Name</th><th>Age/Gender</th><th>Phone</th><th>Blood Group</th><th>Assigned Doctor</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {patients.length === 0
                ? <tr><td colSpan={8}><div className="empty-state"><MdPeople /><h3>No patients found</h3><p>Add your first patient to get started</p></div></td></tr>
                : patients.map(p => (
                  <tr key={p._id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)', fontSize: 13 }}>{p.patientId}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">{p.name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{calcAge(p.dateOfBirth)} / {p.gender}</td>
                    <td>{p.phone}</td>
                    <td>{p.bloodGroup ? <span className="badge badge-info">{p.bloodGroup}</span> : '-'}</td>
                    <td>{p.assignedDoctor?.name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                    <td><span className={`badge ${statusColor[p.status] || 'badge-secondary'}`}>{p.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openView(p)}>View</button>
                        <button className="btn btn-sm btn-primary" onClick={() => openEdit(p)}><MdEdit /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => openDelete(p)}><MdDelete /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{modal === 'add' ? 'Add New Patient' : 'Edit Patient'}</h2>
              <button className="modal-close" onClick={closeModal}><MdClose /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group form-full">
                  <label className="form-label">Full Name <span>*</span></label>
                  <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Patient full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth <span>*</span></label>
                  <input className="form-control" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender <span>*</span></label>
                  <select className="form-control" name="gender" value={form.gender} onChange={handleChange}>
                    {genders.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone <span>*</span></label>
                  <input className="form-control" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email address" />
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-control" name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                    <option value="">Select blood group</option>
                    {bloodGroups.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Doctor</label>
                  <select className="form-control" name="assignedDoctor" value={form.assignedDoctor || ''} onChange={handleChange}>
                    <option value="">-- Not assigned --</option>
                    {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                    {statuses.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Address</label>
                  <textarea className="form-control" name="address" value={form.address} onChange={handleChange} placeholder="Patient address" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Allergies (comma-separated)</label>
                  <input className="form-control" name="allergies" value={form.allergies} onChange={handleChange} placeholder="e.g. Penicillin, Peanuts" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : (modal === 'add' ? 'Add Patient' : 'Save Changes')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Patient</h2>
              <button className="modal-close" onClick={closeModal}><MdClose /></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger">
                <MdDelete size={20} />
                <div>Are you sure you want to delete <strong>{selected?.name}</strong>? This action cannot be undone.</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modal === 'view' && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Patient Details</h2>
              <button className="modal-close" onClick={closeModal}><MdClose /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                <div className="avatar avatar-lg">{selected.name[0]}</div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>{selected.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{selected.patientId}</p>
                  <span className={`badge ${statusColor[selected.status]}`}>{selected.status}</span>
                </div>
              </div>
              <div className="form-grid">
                {[
                  ['Date of Birth', selected.dateOfBirth?.split('T')[0]],
                  ['Age', calcAge(selected.dateOfBirth)],
                  ['Gender', selected.gender],
                  ['Blood Group', selected.bloodGroup || 'N/A'],
                  ['Phone', selected.phone],
                  ['Email', selected.email || 'N/A'],
                  ['Assigned Doctor', selected.assignedDoctor?.name || 'Unassigned'],
                  ['Allergies', selected.allergies?.join(', ') || 'None'],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>{value}</div>
                  </div>
                ))}
                {selected.address && (
                  <div style={{ gridColumn: '1/-1', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Address</div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>{selected.address}</div>
                  </div>
                )}
              </div>
              {selected.medicalHistory?.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 12 }}>Medical History</h4>
                  {selected.medicalHistory.map((mh, i) => (
                    <div key={i} style={{ padding: 12, background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                      <strong>{mh.condition}</strong> — {new Date(mh.date).toLocaleDateString()}
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{mh.treatment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Close</button>
              <button className="btn btn-primary" onClick={() => { closeModal(); openEdit(selected); }}>Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPatients;
