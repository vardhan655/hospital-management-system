import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MdPeople, MdMedicalServices, MdEventNote, MdBusiness, MdTrendingUp, MdCheckCircle, MdAccessTime, MdWarning } from 'react-icons/md';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const statusColors = { Active: 'badge-success', Discharged: 'badge-secondary', Critical: 'badge-danger', Stable: 'badge-info' };
const apptStatusColor = { Scheduled: 'badge-primary', 'In Progress': 'badge-warning', Completed: 'badge-success', Cancelled: 'badge-danger', 'No Show': 'badge-secondary' };

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/admin').then(res => { setData(res.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /><p>Loading dashboard...</p></div>;
  if (!data) return <div className="alert alert-danger">Failed to load dashboard data.</div>;

  const { stats, recentPatients, recentAppointments, monthlyTrend } = data;
  const pieData = [
    { name: 'Completed', value: stats.completedAppointments, color: '#10b981' },
    { name: 'Pending', value: stats.pendingAppointments, color: '#2563eb' },
  ];

  return (
    <div className="fade-in">
      {/* Stat Cards */}
      <div className="stats-grid">
        {[
          { label: 'Total Patients', value: stats.totalPatients, icon: <MdPeople />, color: 'blue' },
          { label: 'Doctors', value: stats.totalDoctors, icon: <MdMedicalServices />, color: 'green' },
          { label: 'Staff Members', value: stats.totalStaff, icon: <MdPeople />, color: 'purple' },
          { label: 'Departments', value: stats.totalDepts, icon: <MdBusiness />, color: 'orange' },
          { label: "Today's Appts", value: stats.todayAppointments, icon: <MdEventNote />, color: 'cyan' },
          { label: 'Completed', value: stats.completedAppointments, icon: <MdCheckCircle />, color: 'green' },
        ].map((s, i) => (
          <div key={i} className={`stat-card ${s.color}`}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">Monthly Appointments</div><div className="card-subtitle">Last 6 months trend</div></div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Appointment Status</div></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
              {pieData.map(e => (
                <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: e.color }} />
                  {e.name}: <strong>{e.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Patients */}
        <div className="card">
          <div className="card-header"><div className="card-title">Recent Patients</div></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>ID</th><th>Status</th></tr></thead>
              <tbody>
                {recentPatients.map(p => (
                  <tr key={p._id}>
                    <td><strong>{p.name}</strong></td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.patientId}</span></td>
                    <td><span className={`badge ${statusColors[p.status] || 'badge-secondary'}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="card">
          <div className="card-header"><div className="card-title">Today's Appointments</div></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th></tr></thead>
              <tbody>
                {recentAppointments.length === 0
                  ? <tr><td colSpan={4}><div className="empty-state" style={{ padding: '20px' }}><p>No appointments today</p></div></td></tr>
                  : recentAppointments.map(a => (
                    <tr key={a._id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{a.startTime}</td>
                      <td>{a.patient?.name}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{a.doctor?.name}</td>
                      <td><span className={`badge ${apptStatusColor[a.status] || 'badge-secondary'}`}>{a.status}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
