import React, { useState, useEffect } from "react";
import { FaBell, FaCheck, FaCheckDouble, FaCircle } from "react-icons/fa";
import axios from "axios";
import "./Notifications.css";

const Notifications = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/notifications/user/${user.id}`);
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:8080/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`http://localhost:8080/api/notifications/user/${user.id}/read-all`);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="dashboard-card glass-panel full-card notifications-layout">
      <div className="card-header">
        <div className="header-title">
          <FaBell className="card-icon" />
          <div>
            <h3>Notifications {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}</h3>
            <p className="card-subtext">Stay updated with your orders and health alerts.</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button className="btn-secondary mark-all-btn" onClick={markAllAsRead}>
            <FaCheckDouble /> Mark all as read
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="loading-state">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state-container">
          <FaBell className="empty-state-icon" />
          <h4>No Notifications Yet</h4>
          <p>You're all caught up! New alerts will appear here.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notif) => (
            <div key={notif.id} className={`notification-item ${!notif.read ? "unread" : ""}`}>
              <div className="notification-content">
                <div className="notification-title">
                  {!notif.read && <FaCircle className="unread-dot" />}
                  <h4>{notif.title}</h4>
                </div>
                <p>{notif.message}</p>
                <span className="notification-time">
                  {new Date(notif.createdAt).toLocaleString()}
                </span>
              </div>
              {!notif.read && (
                <button className="btn-icon check-btn" onClick={() => markAsRead(notif.id)} title="Mark as read">
                  <FaCheck />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
