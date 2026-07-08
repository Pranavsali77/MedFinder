import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaBell, FaCheckDouble, FaCircle, FaCheck } from "react-icons/fa";
import "./PharmacyNotifications.css";

const PharmacyNotifications = ({ currentUser }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // We use the admin's user ID to fetch pharmacy notifications
      const res = await axios.get(`http://localhost:8080/api/notifications/user/${currentUser.id}`);
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
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
      await axios.put(`http://localhost:8080/api/notifications/user/${currentUser.id}/read-all`);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="tab-layout fade-in">
      <div className="card-header">
        <div className="header-title">
          <FaBell className="card-icon" />
          <div>
            <h3>Pharmacy Alerts {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}</h3>
            <p className="card-subtext">New reservations, low stock alerts, and customer requests.</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button className="btn-secondary mark-all-btn" onClick={markAllAsRead}>
            <FaCheckDouble /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-state">Loading alerts...</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <FaBell className="empty-icon" />
          <p>No new alerts for your pharmacy.</p>
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

export default PharmacyNotifications;
