import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const pageTitles = {
  '/admin': ['Dashboard', 'Overview & stats'],
  '/admin/patients': ['Patients', 'Manage patient records'],
  '/admin/doctors': ['Doctors & Staff', 'Manage medical team'],
  '/admin/departments': ['Departments', 'Hospital departments'],
  '/admin/appointments': ['Appointments', 'Schedule & manage appointments'],
  '/doctor': ['My Dashboard', "Today's overview"],
  '/doctor/appointments': ['My Appointments', 'Your schedule'],
  '/doctor/patients': ['My Patients', 'Assigned patients'],
  '/staff': ['Dashboard', "Today's queue"],
  '/staff/appointments': ['Appointments', 'Manage appointment bookings'],
  '/staff/patients': ['Patients', 'Patient management'],
};

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [title, subtitle] = pageTitles[location.pathname] || ['Dashboard', ''];

  return (
    <header className="navbar">
      <div style={{ flex: 1 }}>
        <div className="navbar-title">{title}</div>
        {subtitle && <div className="navbar-subtitle">{subtitle}</div>}
      </div>
      <div className="navbar-right">
        <span className="navbar-badge">{user?.role}</span>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{user?.name}</div>
      </div>
    </header>
  );
};

export default Navbar;
