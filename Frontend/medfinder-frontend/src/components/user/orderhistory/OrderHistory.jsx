import React from "react";
import { FaHistory, FaCheckCircle, FaTimesCircle, FaFileInvoice } from "react-icons/fa";
import "./OrderHistory.css";

const OrderHistory = ({ orders, onDownloadInvoice }) => {
  // Filter for past orders (Delivered, Cancelled, or Picked Up)
  const historyOrders = orders.filter(
    (o) =>
      o.status === "DELIVERED" ||
      o.status === "Picked Up" ||
      o.status === "CANCELLED" ||
      o.status === "Cancelled"
  );

  return (
    <div className="dashboard-card glass-panel full-card">
      <div className="card-header">
        <FaHistory className="card-icon" />
        <div>
          <h3>Order History</h3>
          <p className="card-subtext">View your past orders and download invoices.</p>
        </div>
      </div>

      <div className="order-history-list">
        {historyOrders.length === 0 ? (
          <div className="no-history-state">
            <FaHistory className="empty-icon" />
            <h4>No Past Orders</h4>
            <p>Your order history is currently empty.</p>
          </div>
        ) : (
          historyOrders.map((order, index) => (
            <div key={index} className="history-card glass-panel">
              <div className="history-card-header">
                <div>
                  <span className="history-id">Order #{order.id}</span>
                  <span className="history-date">{order.date}</span>
                </div>
                <div className="history-status-badge">
                  {order.status === "CANCELLED" || order.status === "Cancelled" ? (
                    <span className="status-badge cancelled"><FaTimesCircle /> Cancelled</span>
                  ) : (
                    <span className="status-badge delivered"><FaCheckCircle /> Completed</span>
                  )}
                </div>
              </div>

              <div className="history-card-body">
                <div className="history-med-info">
                  <h4>{order.name}</h4>
                  <p>Pharmacy: <strong>{order.pharmacy}</strong></p>
                  <p>Quantity: <strong>{order.quantity}</strong></p>
                </div>
                <div className="history-payment-info">
                  <p>Total Paid: <strong>₹{order.price * order.quantity}</strong></p>
                  <p>Method: <strong>{order.paymentMethod}</strong></p>
                </div>
              </div>

              <div className="history-card-footer">
                {(order.status === "DELIVERED" || order.status === "Picked Up") && order.invoicePath && (
                  <button 
                    className="btn-invoice" 
                    onClick={() => onDownloadInvoice(order)}
                  >
                    <FaFileInvoice /> Download Invoice
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
