import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaBox, FaTruck, FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";
import "./PharmacyOrders.css"; // Reuse existing admin dashboard styles or create new

const PharmacyOrders = ({ activePharmacy }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL, HOME_DELIVERY, COMPLETED, CANCELLED

  useEffect(() => {
    if (activePharmacy?.id) {
      fetchOrders();
    }
  }, [activePharmacy]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8080/api/orders/pharmacy/${activePharmacy.id}`);
      setOrders(res.data || []);
    } catch (err) {
      console.error("Failed to fetch pharmacy orders", err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:8080/api/orders/status/${orderId}?status=${newStatus}`);
      fetchOrders(); // Refresh after update
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "ALL") return true;
    if (filter === "HOME_DELIVERY") return order.orderType === "HOME_DELIVERY";
    if (filter === "COMPLETED") return order.status === "DELIVERED";
    if (filter === "CANCELLED") return order.status === "CANCELLED";
    return true;
  });

  return (
    <div className="tab-layout fade-in">
      <div className="card-header">
        <div className="header-title">
          <FaTruck className="card-icon" />
          <div>
            <h3>Orders Management</h3>
            <p className="card-subtext">Manage home delivery orders, track status, and view history.</p>
          </div>
        </div>
        <div className="header-actions">
          <select 
            className="filter-select" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Orders</option>
            <option value="HOME_DELIVERY">Home Delivery Only</option>
            <option value="COMPLETED">Completed Orders</option>
            <option value="CANCELLED">Cancelled Orders</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <FaBox className="empty-icon" />
          <p>No orders found for the selected filter.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Medicine</th>
                <th>Qty</th>
                <th>Type</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.orderId}>
                  <td>#{order.orderId}</td>
                  <td>{order.medicineName || "N/A"}</td>
                  <td>{order.quantity}</td>
                  <td>
                    <span className={`status-badge ${order.orderType === "HOME_DELIVERY" ? "delivery" : "pickup"}`}>
                      {order.orderType === "HOME_DELIVERY" ? "Home Delivery" : "Store Pickup"}
                    </span>
                  </td>
                  <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                      <select 
                        className="status-select"
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.orderId, e.target.value)}
                      >
                        <option value="PLACED">Placed</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                        <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PharmacyOrders;
