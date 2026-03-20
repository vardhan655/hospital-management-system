import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MdPeople } from 'react-icons/md';

const statusColor = { Active: 'badge-success', Discharged: 'badge-secondary', Critical: 'badge-danger', Stable: 'badge-info' };

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/patients').then(r => { setPatients(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const calcAge = (dob) => dob ? `${Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000))} yrs` : '—';

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>My Patients</h1><p>{patients.length} assigned patients</p></div>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Patient ID</th><th>Name</th><th>Age/Gender</th><th>Blood Group</th><th>Phone</th><th>Status</th></tr></thead>
            <tbody>
              {patients.length === 0
                ? <tr><td colSpan={6}><div className="empty-state"><MdPeople /><h3>No patients assigned</h3></div></td></tr>
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

export default DoctorPatients;
