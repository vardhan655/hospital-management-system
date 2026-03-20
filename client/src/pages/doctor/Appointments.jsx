import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MdEventNote } from 'react-icons/md';

const statusColor = { Scheduled: 'badge-primary', 'In Progress': 'badge-warning', Completed: 'badge-success', Cancelled: 'badge-danger', 'No Show': 'badge-secondary' };

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', date: '' });

  useEffect(() => {
    setLoading(true);
    api.get('/appointments', { params: { status: filter.status, date: filter.date } })
      .then(r => { setAppointments(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>My Appointments</h1><p>{appointments.length} total</p></div>
        <div className="filters">
          <select className="form-control" value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))} style={{ width: 150 }}>
            <option value="">All Statuses</option>
            {['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show'].map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="date" className="form-control" value={filter.date} onChange={e => setFilter(p => ({ ...p, date: e.target.value }))} style={{ width: 160 }} />
        </div>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>ID</th><th>Patient</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th><th>Notes</th></tr></thead>
            <tbody>
              {appointments.length === 0
                ? <tr><td colSpan={7}><div className="empty-state"><MdEventNote /><h3>No appointments found</h3></div></td></tr>
                : appointments.map(a => (
                  <tr key={a._id}>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{a.appointmentId}</span></td>
                    <td><div style={{ fontWeight: 600 }}>{a.patient?.name}</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.patient?.phone}</div></td>
                    <td>{new Date(a.date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{a.startTime}–{a.endTime}</td>
                    <td><span className="badge badge-info">{a.type}</span></td>
                    <td><span className={`badge ${statusColor[a.status]}`}>{a.status}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 150 }}>{a.notes || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointments;
