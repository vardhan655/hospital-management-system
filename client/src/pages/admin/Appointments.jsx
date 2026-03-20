import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdClose, MdEventNote, MdWarning, MdSearch } from 'react-icons/md';

const types = ['Consultation', 'Follow-up', 'Emergency', 'Surgery', 'Check-up'];
const statuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show'];
const statusColor = { Scheduled: 'badge-primary', 'In Progress': 'badge-warning', Completed: 'badge-success', Cancelled: 'badge-danger', 'No Show': 'badge-secondary' };
const emptyForm = { patient: '', doctor: '', department: '', date: '', startTime: '09:00', endTime: '09:30', type: 'Consultation', status: 'Scheduled', notes: '' };

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [filter, setFilter] = useState({ status: '', date: '' });

  const fetch = useCallback(async () => {
    try {
      const res = await api.get('/appointments', { params: { status: filter.status, date: filter.date } });
      setAppointments(res.data.data);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => {
    Promise.all([api.get('/patients'), api.get('/doctors'), api.get('/departments')])
      .then(([p, d, de]) => { setPatients(p.data.data); setDoctors(d.data.data); setDepartments(de.data.data); })
      .catch(() => {});
  }, []);

  // Real-time conflict check
  useEffect(() => {
    if (!form.doctor || !form.date || !form.startTime || !form.endTime) { setConflict(null); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/appointments/check-conflict', { doctor: form.doctor, date: form.date, startTime: form.startTime, endTime: form.endTime, excludeId: selected?._id });
        setConflict(res.data.hasConflict ? res.data.conflict : null);
      } catch { setConflict(null); }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.doctor, form.date, form.startTime, form.endTime]);

  const openAdd = () => { setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] }); setSelected(null); setConflict(null); setModal('form'); };
  const openEdit = (a) => {
    setSelected(a);
    setForm({ patient: a.patient?._id || '', doctor: a.doctor?._id || '', department: a.department?._id || '', date: a.date?.split('T')[0] || '', startTime: a.startTime, endTime: a.endTime, type: a.type, status: a.status, notes: a.notes || '' });
    setConflict(null); setModal('form');
  };
  const openDelete = (a) => { setSelected(a); setModal('delete'); };
  const close = () => { setModal(null); setSelected(null); setConflict(null); };
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.patient || !form.doctor || !form.date) return toast.error('Patient, doctor, and date are required');
    if (conflict) return toast.error('Please resolve the scheduling conflict before saving');
    setSaving(true);
    try {
      if (!selected) { await api.post('/appointments', form); toast.success('Appointment scheduled'); }
      else { await api.put(`/appointments/${selected._id}`, form); toast.success('Appointment updated'); }
      close(); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save appointment'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/appointments/${selected._id}`); toast.success('Appointment deleted'); close(); fetch(); }
    catch { toast.error('Failed to delete appointment'); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /><p>Loading appointments...</p></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Appointments</h1><p>{appointments.length} total appointments</p></div>
        <div className="filters">
          <select className="form-control" value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))} style={{ width: 150 }}>
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="date" className="form-control" value={filter.date} onChange={e => setFilter(p => ({ ...p, date: e.target.value }))} style={{ width: 160 }} />
          <button className="btn btn-primary" onClick={openAdd}><MdAdd />Add Appointment</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {appointments.length === 0
                ? <tr><td colSpan={8}><div className="empty-state"><MdEventNote /><h3>No appointments found</h3></div></td></tr>
                : appointments.map(a => (
                  <tr key={a._id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)', fontSize: 12 }}>{a.appointmentId}</span></td>
                    <td style={{ fontWeight: 600 }}>{a.patient?.name}<div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.patient?.patientId}</div></td>
                    <td><div style={{ fontSize: 13 }}>{a.doctor?.name}</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.department?.name}</div></td>
                    <td>{new Date(a.date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{a.startTime} — {a.endTime}</td>
                    <td><span className="badge badge-info">{a.type}</span></td>
                    <td><span className={`badge ${statusColor[a.status]}`}>{a.status}</span></td>
                    <td><div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-primary" onClick={() => openEdit(a)}><MdEdit /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => openDelete(a)}><MdDelete /></button>
                    </div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {modal === 'form' && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selected ? 'Edit Appointment' : 'Schedule Appointment'}</h2>
              <button className="modal-close" onClick={close}><MdClose /></button>
            </div>
            <div className="modal-body">
              {conflict && (
                <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                  <MdWarning size={20} />
                  <div><strong>Scheduling Conflict!</strong> This doctor has an appointment at {conflict.startTime}–{conflict.endTime}. Please choose a different time slot.</div>
                </div>
              )}
              <div className="form-grid">
                <div className="form-group form-full">
                  <label className="form-label">Patient <span>*</span></label>
                  <select className="form-control" name="patient" value={form.patient} onChange={handleChange}>
                    <option value="">-- Select Patient --</option>
                    {patients.map(p => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Doctor <span>*</span></label>
                  <select className="form-control" name="doctor" value={form.doctor} onChange={handleChange}>
                    <option value="">-- Select Doctor --</option>
                    {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-control" name="department" value={form.department} onChange={handleChange}>
                    <option value="">-- Select Department --</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date <span>*</span></label>
                  <input className="form-control" type="date" name="date" value={form.date} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-control" name="type" value={form.type} onChange={handleChange}>
                    {types.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time <span>*</span></label>
                  <input className="form-control" type="time" name="startTime" value={form.startTime} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time <span>*</span></label>
                  <input className="form-control" type="time" name="endTime" value={form.endTime} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                    {statuses.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} placeholder="Optional notes..." />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !!conflict}>{saving ? 'Saving...' : (selected ? 'Update' : 'Schedule')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">Delete Appointment</h2><button className="modal-close" onClick={close}><MdClose /></button></div>
            <div className="modal-body"><div className="alert alert-danger"><MdDelete size={20} /><div>Delete appointment <strong>{selected?.appointmentId}</strong>? This cannot be undone.</div></div></div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={close}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;
