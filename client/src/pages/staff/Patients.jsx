import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MdPeople } from 'react-icons/md';

const statusColor = { Active: 'badge-success', Discharged: 'badge-secondary', Critical: 'badge-danger', Stable: 'badge-info' };

const StaffPatients = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/patients', { params: { search } }).then(r => { setPatients(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, [search]);

  const calcAge = (dob) => dob ? `${Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000))} yrs` : '—';

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Patients</h1><p>{patients.length} total patients</p></div>
        <div className="search-bar">
          <MdPeople />
          <input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Patient ID</th><th>Name</th><th>Age/Gender</th><th>Blood Group</th><th>Phone</th><th>Assigned Doctor</th><th>Status</th></tr></thead>
            <tbody>
              {patients.length === 0
                ? <tr><td colSpan={7}><div className="empty-state"><MdPeople /><h3>No patients found</h3></div></td></tr>
                : patients.map(p => (
                  <tr key={p._id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)', fontSize: 13 }}>{p.patientId}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">{p.name[0]}</div>
                        <div><div style={{ fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.email}</div></div>
                      </div>
                    </td>
                    <td>{calcAge(p.dateOfBirth)} / {p.gender}</td>
                    <td>{p.bloodGroup ? <span className="badge badge-info">{p.bloodGroup}</span> : '—'}</td>
                    <td>{p.phone}</td>
                    <td>{p.assignedDoctor?.name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                    <td><span className={`badge ${statusColor[p.status] || 'badge-secondary'}`}>{p.status}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffPatients;
