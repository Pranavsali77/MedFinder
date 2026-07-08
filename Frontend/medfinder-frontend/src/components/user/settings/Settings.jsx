import React, { useState } from "react";
import { FaCog, FaLock, FaGlobe, FaShieldAlt } from "react-icons/fa";
import axios from "axios";
import "./Settings.css";

const Settings = ({ user }) => {
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleUpdatePassword = async () => {
    if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setMessage({ type: "error", text: "Please fill in all password fields." });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await axios.put(`http://localhost:8080/api/users/${user?.id}/password`, {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });
      setMessage({ type: "success", text: "Password updated successfully!" });
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card glass-panel full-card settings-layout">
      <div className="card-header">
        <FaCog className="card-icon" />
        <div>
          <h3>Settings</h3>
          <p className="card-subtext">Manage your account preferences and security.</p>
        </div>
      </div>
      <div className="settings-content">
        <div className="settings-menu">
          <div className="settings-item active">
            <FaShieldAlt className="settings-item-icon" />
            <div className="settings-item-text">
              <h4>Security</h4>
              <p>Change password and security settings</p>
            </div>
          </div>
          <div className="settings-item">
            <FaGlobe className="settings-item-icon" />
            <div className="settings-item-text">
              <h4>Language & Region</h4>
              <p>Set your preferred language and location</p>
            </div>
          </div>
          <div className="settings-item">
            <FaLock className="settings-item-icon" />
            <div className="settings-item-text">
              <h4>Privacy</h4>
              <p>Manage data sharing and privacy</p>
            </div>
          </div>
        </div>
        <div className="settings-panel">
          <h4>Change Password</h4>
          {message && <div className={`message-banner ${message.type}`}>{message.text}</div>}
          <div className="form-group">
            <label>Current Password</label>
            <input 
              type="password" 
              name="oldPassword"
              value={passwords.oldPassword}
              onChange={handleChange}
              placeholder="Enter current password" 
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input 
              type="password" 
              name="newPassword"
              value={passwords.newPassword}
              onChange={handleChange}
              placeholder="Enter new password" 
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input 
              type="password" 
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password" 
            />
          </div>
          <button className="btn-primary" onClick={handleUpdatePassword} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
