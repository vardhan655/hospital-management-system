import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminPatients from './pages/admin/Patients';
import AdminDoctors from './pages/admin/Doctors';
import AdminDepartments from './pages/admin/Departments';
import AdminAppointments from './pages/admin/Appointments';
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorPatients from './pages/doctor/Patients';
import StaffDashboard from './pages/staff/Dashboard';
import StaffAppointments from './pages/staff/Appointments';
import StaffPatients from './pages/staff/Patients';
import Profile from './pages/Profile';
import './index.css';

const PrivateRoute = ({ element, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;
  return element;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' } }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* Admin routes */}
          <Route path="/admin" element={<PrivateRoute roles={['admin']} element={<Layout />} />}>
            <Route index element={<AdminDashboard />} />
            <Route path="patients" element={<AdminPatients />} />
            <Route path="doctors" element={<AdminDoctors />} />
            <Route path="departments" element={<AdminDepartments />} />
            <Route path="appointments" element={<AdminAppointments />} />
          </Route>

          {/* Doctor routes */}
          <Route path="/doctor" element={<PrivateRoute roles={['doctor']} element={<Layout />} />}>
            <Route index element={<DoctorDashboard />} />
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route path="patients" element={<DoctorPatients />} />
          </Route>

          {/* Staff routes */}
          <Route path="/staff" element={<PrivateRoute roles={['staff']} element={<Layout />} />}>
            <Route index element={<StaffDashboard />} />
            <Route path="appointments" element={<StaffAppointments />} />
            <Route path="patients" element={<StaffPatients />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
          
          {/* Global Private routes */}
          <Route path="/profile" element={<PrivateRoute element={<Layout />} />}>
            <Route index element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
