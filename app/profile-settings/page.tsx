'use client';

import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';

export default function ProfileSettingsPage() {
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'user@bizreputation.ai',
    phone: '+1 (555) 123-4567',
    company: 'Acme Corp',
    location: 'San Francisco, CA',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    auditComplete: true,
    weeklyReport: true,
    monthlyReport: false,
    recommendations: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({ ...prev, [name]: checked }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Profile updated successfully!');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Notification preferences saved!');
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
                <li className="list-group-item active">
                  <i className="ri-user-line me-2"></i>Profile
                </li>
                <li className="list-group-item">
                  <i className="ri-lock-line me-2"></i>Security
                </li>
                <li className="list-group-item">
                  <i className="ri-notification-line me-2"></i>Notifications
                </li>
                <li className="list-group-item">
                  <i className="ri-bank-card-line me-2"></i>Billing
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          {/* Profile Settings */}
          <div className="card custom-card">
            <div className="card-header">
              <h5 className="card-title mb-0">Profile Information</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSaveProfile}>
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
                </div>
                <div className="mt-4">
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>

          {/* Password */}
          <div className="card custom-card">
            <div className="card-header">
              <h5 className="card-title mb-0">Change Password</h5>
            </div>
            <div className="card-body">
              <form>
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label">Current Password</label>
                    <input type="password" className="form-control" placeholder="Enter current password" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">New Password</label>
                    <input type="password" className="form-control" placeholder="Enter new password" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Confirm New Password</label>
                    <input type="password" className="form-control" placeholder="Confirm new password" />
                  </div>
                </div>
                <div className="mt-4">
                  <button type="submit" className="btn btn-primary">Update Password</button>
                </div>
              </form>
            </div>
          </div>

          {/* Notifications */}
          <div className="card custom-card">
            <div className="card-header">
              <h5 className="card-title mb-0">Notification Preferences</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSaveNotifications}>
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
                <button type="submit" className="btn btn-primary">Save Preferences</button>
              </form>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card custom-card border-danger">
            <div className="card-header bg-danger-transparent">
              <h5 className="card-title mb-0 text-danger">Danger Zone</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <strong>Deactivate Account</strong>
                  <br />
                  <small className="text-muted">Temporarily disable your account</small>
                </div>
                <button className="btn btn-outline-warning">Deactivate</button>
              </div>
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Delete Account</strong>
                  <br />
                  <small className="text-muted">Permanently delete your account and all data</small>
                </div>
                <button className="btn btn-danger">Delete Account</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
