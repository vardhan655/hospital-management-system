import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Profile = () => {
  const { user, login } = useAuth();
  
  const [detailsForm, setDetailsForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleDetailsChange = (e) => setDetailsForm({ ...detailsForm, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  const updateDetails = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/auth/updatedetails', detailsForm);
      // Update local storage via context if needed, but simple re-login or manual replace is better.
      const updatedUser = { ...user, ...res.data.data };
      localStorage.setItem('hms_user', JSON.stringify(updatedUser));
      // Hacky way to update context without a full refresh func, but it works for now
      window.location.reload(); 
      toast.success('Profile details updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update details');
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    try {
      const res = await api.put('/auth/updatepassword', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      // Update the token in context/localStorage
      localStorage.setItem('hms_token', res.data.token);
      toast.success('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    }
  };

  return (
    <div className="fade-in">
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          My Profile Settings
        </h2>

        <form onSubmit={updateDetails} style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Update Details</h3>
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" className="input" value={detailsForm.name} onChange={handleDetailsChange} required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" className="input" value={detailsForm.email} onChange={handleDetailsChange} required />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="text" name="phone" className="input" value={detailsForm.phone} onChange={handleDetailsChange} />
          </div>
          <button type="submit" className="btn btn-primary">Save Details</button>
        </form>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '2rem 0' }} />

        <form onSubmit={updatePassword}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Change Password</h3>
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" name="currentPassword" className="input" value={passwordForm.currentPassword} onChange={handlePasswordChange} required />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" name="newPassword" className="input" value={passwordForm.newPassword} onChange={handlePasswordChange} required minLength="6" />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" name="confirmPassword" className="input" value={passwordForm.confirmPassword} onChange={handlePasswordChange} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ background: '#10b981' }}>Update Password</button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
