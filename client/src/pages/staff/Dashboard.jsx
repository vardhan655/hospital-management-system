import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { MdEventNote, MdPeople, MdCheckCircle, MdCancel } from 'react-icons/md';

const statusColor = { Scheduled: 'badge-primary', 'In Progress': 'badge-warning', Completed: 'badge-success', Cancelled: 'badge-danger', 'No Show': 'badge-secondary' };

const StaffDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/staff').then(r => { setData(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!data) return <div className="alert alert-danger">Failed to load dashboard.</div>;
  const { stats, todayAppointments } = data;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22 }}>Welcome, {user?.name?.split(' ')[0]} 👋</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="stats-grid">
        {[
          { label: "Today's Appointments", value: stats.todayCount, icon: <MdEventNote />, color: 'blue' },
          { label: 'Total Patients', value: stats.totalPatients, icon: <MdPeople />, color: 'green' },
          { label: 'Scheduled Today', value: stats.scheduledToday, icon: <MdCheckCircle />, color: 'purple' },
          { label: 'Cancelled Today', value: stats.cancelledToday, icon: <MdCancel />, color: 'orange' },
        ].map((s, i) => (
          <div key={i} className={`stat-card ${s.color}`}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-info"><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Today's Appointment Queue</div><div className="card-subtitle">{todayAppointments.length} appointments</div></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {todayAppointments.length === 0
                ? <tr><td colSpan={5}><div className="empty-state"><MdEventNote /><h3>No appointments today</h3></div></td></tr>
                : todayAppointments.map(a => (
                  <tr key={a._id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{a.startTime}<div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>–{a.endTime}</div></td>
                    <td><div style={{ fontWeight: 600 }}>{a.patient?.name}</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.patient?.phone}</div></td>
                    <td style={{ fontSize: 13 }}>{a.doctor?.name}</td>
                    <td><span className="badge badge-info">{a.type}</span></td>
                    <td><span className={`badge ${statusColor[a.status]}`}>{a.status}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
