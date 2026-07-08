import React, { useState } from "react";
import { FaUser, FaUserCircle } from "react-icons/fa";
import axios from "axios";
import "./MyProfile.css";

const MyProfile = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.put(`http://localhost:8080/api/users/${user.id}`, {
        ...user,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      });
      // Call the parent to update local storage and context
      if (onUpdateUser) onUpdateUser(res.data);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card glass-panel full-card profile-layout">
      <div className="card-header">
        <FaUser className="card-icon" />
        <div>
          <h3>My Profile</h3>
          <p className="card-subtext">Manage your personal details and preferences.</p>
        </div>
      </div>
      <div className="profile-content">
        <div className="profile-avatar-section">
          <FaUserCircle className="avatar-icon" />
          <h4>{user?.name || "User Name"}</h4>
          <p>{user?.email || "user@example.com"}</p>
        </div>
        <div className="profile-details-form">
          {message && <div className={`message-banner ${message.type}`}>{message.text}</div>}
          
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              name="name"
              value={formData.name} 
              onChange={handleChange}
              readOnly={!isEditing} 
              className={`profile-input ${!isEditing ? "readonly" : ""}`} 
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={formData.email} 
              readOnly 
              className="profile-input readonly disabled" 
              title="Email cannot be changed"
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input 
              type="text" 
              name="phone"
              value={formData.phone} 
              onChange={handleChange}
              placeholder="Add phone number" 
              readOnly={!isEditing} 
              className={`profile-input ${!isEditing ? "readonly" : ""}`} 
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea 
              name="address"
              value={formData.address} 
              onChange={handleChange}
              placeholder="Add your address" 
              readOnly={!isEditing} 
              className={`profile-input ${!isEditing ? "readonly" : ""}`}
            ></textarea>
          </div>
          
          {isEditing ? (
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setIsEditing(false)} disabled={loading}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => setIsEditing(true)}>Edit Profile</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
