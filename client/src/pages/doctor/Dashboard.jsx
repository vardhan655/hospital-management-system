import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { MdEventNote, MdPeople, MdCheckCircle, MdAccessTime } from 'react-icons/md';

const statusColor = { Scheduled: 'badge-primary', 'In Progress': 'badge-warning', Completed: 'badge-success', Cancelled: 'badge-danger', 'No Show': 'badge-secondary' };

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/doctor').then(r => { setData(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /><p>Loading...</p></div>;
  if (!data) return <div className="alert alert-danger">Failed to load dashboard.</div>;

  const { stats, todayAppointments } = data;

  const calcAge = (dob) => dob ? Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000)) : '—';

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22 }}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="stats-grid">
        {[
          { label: "Today's Appointments", value: stats.todayCount, icon: <MdEventNote />, color: 'blue' },
          { label: 'My Patients', value: stats.totalPatients, icon: <MdPeople />, color: 'green' },
          { label: 'Pending', value: stats.pendingCount, icon: <MdAccessTime />, color: 'orange' },
          { label: 'Completed', value: stats.completedCount, icon: <MdCheckCircle />, color: 'purple' },
        ].map((s, i) => (
          <div key={i} className={`stat-card ${s.color}`}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-info"><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div><div className="card-title">Today's Schedule</div><div className="card-subtitle">{todayAppointments.length} appointment{todayAppointments.length !== 1 ? 's' : ''} scheduled</div></div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Time</th><th>Patient</th><th>Age/Gender</th><th>Contact</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {todayAppointments.length === 0
                ? <tr><td colSpan={6}><div className="empty-state"><MdEventNote /><h3>No appointments today</h3><p>Enjoy your free day!</p></div></td></tr>
                : todayAppointments.map(a => (
                  <tr key={a._id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>{a.startTime}<div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>to {a.endTime}</div></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">{a.patient?.name?.[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{a.patient?.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.patient?.patientId}</div>
                        </div>
                      </div>
                    </td>
                    <td>{calcAge(a.patient?.dateOfBirth)} yrs / {a.patient?.gender}</td>
                    <td style={{ fontSize: 13 }}>{a.patient?.phone}</td>
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

export default DoctorDashboard;
