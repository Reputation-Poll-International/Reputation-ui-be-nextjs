'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { changePassword, fetchProfile, getAuthUser, updateProfile } from '@/lib/auth';

type NotificationSettings = {
  email: boolean;
  auditComplete: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
  recommendations: boolean;
};

const defaultNotifications: NotificationSettings = {
  email: true,
  auditComplete: true,
  weeklyReport: true,
  monthlyReport: false,
  recommendations: true,
};

type SettingsSection = 'profile' | 'security' | 'notifications' | 'billing';

export default function ProfileSettingsPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    company_size: '',
    website: '',
    location: '',
  });
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  const hydrateUser = (
    user: {
      id: number;
      name: string;
      email: string;
      phone?: string | null;
      company?: string | null;
      industry?: string | null;
      company_size?: string | null;
      website?: string | null;
      location?: string | null;
      notification_preferences?: Record<string, boolean> | null;
    }
  ) => {
    setUserId(user.id);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      company: user.company || '',
      industry: user.industry || '',
      company_size: user.company_size || '',
      website: user.website || '',
      location: user.location || '',
    });

    setNotifications({
      ...defaultNotifications,
      ...(user.notification_preferences || {}),
    });
  };

  useEffect(() => {
    const currentUser = getAuthUser();
    if (!currentUser) {
      return;
    }

    hydrateUser({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      company: currentUser.company,
      industry: currentUser.industry,
      company_size: currentUser.company_size,
      website: currentUser.website,
      location: currentUser.location,
      notification_preferences: currentUser.notification_preferences,
    });

    const loadLatestProfile = async () => {
      try {
        const latest = await fetchProfile(currentUser.id);
        hydrateUser({
          id: latest.id,
          name: latest.name,
          email: latest.email,
          phone: latest.phone,
          company: latest.company,
          industry: latest.industry,
          company_size: latest.company_size,
          website: latest.website,
          location: latest.location,
          notification_preferences: latest.notification_preferences,
        });
      } catch (err) {
        if (err instanceof Error) {
          setProfileError(err.message);
        }
      }
    };

    loadLatestProfile();
  }, []);

  useEffect(() => {
    const applyHashSelection = () => {
      const hash = window.location.hash.replace('#', '');
      const sections: SettingsSection[] = ['profile', 'security', 'notifications', 'billing'];
      if (sections.includes(hash as SettingsSection)) {
        setActiveSection(hash as SettingsSection);
      }
    };

    applyHashSelection();
    window.addEventListener('hashchange', applyHashSelection);
    return () => window.removeEventListener('hashchange', applyHashSelection);
  }, []);

  const navItemClassName = (section: SettingsSection) =>
    `list-group-item list-group-item-action${activeSection === section ? ' active' : ''}`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({ ...prev, [name]: checked }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileMessage(null);

    if (!userId) {
      setProfileError('No authenticated user found.');
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateProfile({
        user_id: userId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company: formData.company || null,
        industry: formData.industry || null,
        company_size: formData.company_size || null,
        website: formData.website || null,
        location: formData.location || null,
      });
      setProfileMessage('Profile updated successfully.');
    } catch (err) {
      if (err instanceof Error) {
        setProfileError(err.message);
      } else {
        setProfileError('Unable to update profile right now.');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotificationError(null);
    setNotificationMessage(null);

    if (!userId) {
      setNotificationError('No authenticated user found.');
      return;
    }

    try {
      setIsSavingNotifications(true);
      await updateProfile({
        user_id: userId,
        notification_preferences: notifications,
      });
      setNotificationMessage('Notification preferences saved.');
    } catch (err) {
      if (err instanceof Error) {
        setNotificationError(err.message);
      } else {
        setNotificationError('Unable to save notification preferences right now.');
      }
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (!userId) {
      setPasswordError('No authenticated user found.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setIsSavingPassword(true);
      await changePassword({
        user_id: userId,
        current_password: passwordData.currentPassword,
        password: passwordData.newPassword,
        password_confirmation: passwordData.confirmPassword,
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordMessage('Password updated successfully.');
    } catch (err) {
      if (err instanceof Error) {
        setPasswordError(err.message);
      } else {
        setPasswordError('Unable to update password right now.');
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h1 className="page-title fw-bold mb-1">Account Settings</h1>
        <p className="text-muted mb-0">Manage your account preferences and settings</p>
      </div>

      <div className="row">
        <div className="col-lg-3">
          {/* Settings Navigation */}
          <div className="card custom-card">
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                <a
                  href="#profile"
                  className={navItemClassName('profile')}
                  onClick={() => setActiveSection('profile')}
                >
                  <i className="ri-user-line me-2"></i>Profile
                </a>
                <a
                  href="#security"
                  className={navItemClassName('security')}
                  onClick={() => setActiveSection('security')}
                >
                  <i className="ri-lock-line me-2"></i>Security
                </a>
                <a
                  href="#notifications"
                  className={navItemClassName('notifications')}
                  onClick={() => setActiveSection('notifications')}
                >
                  <i className="ri-notification-line me-2"></i>Notifications
                </a>
                <a
                  href="#billing"
                  className={navItemClassName('billing')}
                  onClick={() => setActiveSection('billing')}
                >
                  <i className="ri-bank-card-line me-2"></i>Billing
                </a>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          {/* Profile Settings */}
          <div id="profile" className="card custom-card" style={{ scrollMarginTop: '90px' }}>
            <div className="card-header">
              <h5 className="card-title mb-0">Profile Information</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSaveProfile}>
                {profileError && (
                  <div className="alert alert-danger py-2" role="alert">
                    {profileError}
                  </div>
                )}
                {profileMessage && (
                  <div className="alert alert-success py-2" role="alert">
                    {profileMessage}
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Company</label>
                    <input
                      type="text"
                      className="form-control"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Industry</label>
                    <input
                      type="text"
                      className="form-control"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Company Size</label>
                    <input
                      type="text"
                      className="form-control"
                      name="company_size"
                      value={formData.company_size}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Website</label>
                    <input
                      type="text"
                      className="form-control"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>
                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Password */}
          <div id="security" className="card custom-card" style={{ scrollMarginTop: '90px' }}>
            <div className="card-header">
              <h5 className="card-title mb-0">Change Password</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleUpdatePassword}>
                {passwordError && (
                  <div className="alert alert-danger py-2" role="alert">
                    {passwordError}
                  </div>
                )}
                {passwordMessage && (
                  <div className="alert alert-success py-2" role="alert">
                    {passwordMessage}
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label">Current Password</label>
                    <input
                      type="password"
                      className="form-control"
                      name="currentPassword"
                      placeholder="Enter current password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      name="newPassword"
                      placeholder="Enter new password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button type="submit" className="btn btn-primary" disabled={isSavingPassword}>
                    {isSavingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Notifications */}
          <div id="notifications" className="card custom-card" style={{ scrollMarginTop: '90px' }}>
            <div className="card-header">
              <h5 className="card-title mb-0">Notification Preferences</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSaveNotifications}>
                {notificationError && (
                  <div className="alert alert-danger py-2" role="alert">
                    {notificationError}
                  </div>
                )}
                {notificationMessage && (
                  <div className="alert alert-success py-2" role="alert">
                    {notificationMessage}
                  </div>
                )}

                <div className="mb-3">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="emailNotifications"
                      name="email"
                      checked={notifications.email}
                      onChange={handleNotificationChange}
                    />
                    <label className="form-check-label" htmlFor="emailNotifications">
                      <strong>Email Notifications</strong>
                      <br />
                      <small className="text-muted">Receive all notifications via email</small>
                    </label>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="auditComplete"
                      name="auditComplete"
                      checked={notifications.auditComplete}
                      onChange={handleNotificationChange}
                    />
                    <label className="form-check-label" htmlFor="auditComplete">
                      <strong>Audit Completion Alerts</strong>
                      <br />
                      <small className="text-muted">Get notified when an audit is complete</small>
                    </label>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="weeklyReport"
                      name="weeklyReport"
                      checked={notifications.weeklyReport}
                      onChange={handleNotificationChange}
                    />
                    <label className="form-check-label" htmlFor="weeklyReport">
                      <strong>Weekly Summary</strong>
                      <br />
                      <small className="text-muted">Receive a weekly summary of your reputation</small>
                    </label>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="monthlyReport"
                      name="monthlyReport"
                      checked={notifications.monthlyReport}
                      onChange={handleNotificationChange}
                    />
                    <label className="form-check-label" htmlFor="monthlyReport">
                      <strong>Monthly Report</strong>
                      <br />
                      <small className="text-muted">Get a detailed monthly report</small>
                    </label>
                  </div>

                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="recommendations"
                      name="recommendations"
                      checked={notifications.recommendations}
                      onChange={handleNotificationChange}
                    />
                    <label className="form-check-label" htmlFor="recommendations">
                      <strong>Recommendation Alerts</strong>
                      <br />
                      <small className="text-muted">Get notified about new recommendations</small>
                    </label>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={isSavingNotifications}>
                  {isSavingNotifications ? 'Saving...' : 'Save Preferences'}
                </button>
              </form>
            </div>
          </div>

          {/* Billing */}
          <div id="billing" className="card custom-card" style={{ scrollMarginTop: '90px' }}>
            <div className="card-header">
              <h5 className="card-title mb-0">Billing</h5>
            </div>
            <div className="card-body">
              <p className="text-muted mb-0">
                Billing management is not configured yet. This section is ready for plan, invoices,
                and payment methods.
              </p>
            </div>
          </div>

          {/* Danger Zone temporarily disabled */}
        </div>
      </div>
    </DashboardLayout>
  );
}
