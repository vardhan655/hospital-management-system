import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdPeople, MdLocalHospital, MdMedicalServices,
  MdEventNote, MdBusiness, MdLogout
} from 'react-icons/md';

const navConfig = {
  admin: [
    { to: '/admin', icon: <MdDashboard />, label: 'Dashboard', end: true },
    { to: '/admin/patients', icon: <MdPeople />, label: 'Patients' },
    { to: '/admin/doctors', icon: <MdMedicalServices />, label: 'Doctors & Staff' },
    { to: '/admin/departments', icon: <MdBusiness />, label: 'Departments' },
    { to: '/admin/appointments', icon: <MdEventNote />, label: 'Appointments' },
  ],
  doctor: [
    { to: '/doctor', icon: <MdDashboard />, label: 'Dashboard', end: true },
    { to: '/doctor/appointments', icon: <MdEventNote />, label: 'My Appointments' },
    { to: '/doctor/patients', icon: <MdPeople />, label: 'My Patients' },
  ],
  staff: [
    { to: '/staff', icon: <MdDashboard />, label: 'Dashboard', end: true },
    { to: '/staff/appointments', icon: <MdEventNote />, label: 'Appointments' },
    { to: '/staff/patients', icon: <MdPeople />, label: 'Patients' },
  ]
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = navConfig[user?.role] || [];
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <MdLocalHospital style={{ color: 'white', fontSize: 22 }} />
        </div>
        <div className="sidebar-logo-text">
          MediCare HMS
          <br />
          <span>Hospital Management</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigation</div>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <p>{user?.name}</p>
          <span>{user?.role}</span>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Logout">
          <MdLogout size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
