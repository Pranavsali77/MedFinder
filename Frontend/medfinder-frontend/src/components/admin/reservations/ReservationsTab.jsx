import React from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import axios from "axios";
import "./ReservationsTab.css";

const ReservationsTab = ({
  reservations,
  setReservations,
  currentUser,
  loadPharmacyAndData,
}) => {

  // --- Reservations Handlers ---
  const handleCompleteReservation = async (resId) => {
    try {
      await axios.put(
        `http://localhost:8080/api/orders/status/${resId}?status=DELIVERED`,
      );
      await loadPharmacyAndData(currentUser);
      alert("Reservation pickup completed! ✅");
    } catch (err) {
      console.error("Error completing reservation:", err);
      
      // Offline fallback: update in-memory state and localStorage
      const updatedRes = reservations.map((res) => {
        if (res.id === resId) {
          return { ...res, status: "Completed" };
        }
        return res;
      });
      setReservations(updatedRes);
      localStorage.setItem("reservations_admin_db", JSON.stringify(updatedRes));
      alert("Offline Mode: Reservation pickup completed locally! ⚠️✅");
    }
  };

  const handleCancelReservation = async (resId) => {
    if (
      window.confirm(
        "Cancel this reservation? Restocks will be returned to store inventory.",
      )
    ) {
      try {
        await axios.put(
          `http://localhost:8080/api/orders/status/${resId}?status=CANCELLED`,
        );
        await loadPharmacyAndData(currentUser);
        alert("Reservation cancelled and stock restored! ✅");
      } catch (err) {
        console.error("Error cancelling reservation:", err);
        
        // Offline fallback: update in-memory state and localStorage
        const updatedRes = reservations.map((res) => {
          if (res.id === resId) {
            return { ...res, status: "Cancelled" };
          }
          return res;
        });
        setReservations(updatedRes);
        localStorage.setItem("reservations_admin_db", JSON.stringify(updatedRes));
        alert("Offline Mode: Reservation cancelled locally! ⚠️✅");
      }
    }
  };

  const handleVerifyPayment = async (paymentId) => {
    try {
      await axios.post(`http://localhost:8080/api/payments/verify/${paymentId}`);
      await loadPharmacyAndData(currentUser);
      alert("Payment verified and accepted! ✅");
    } catch (err) {
      console.error("Error verifying payment:", err);
      alert("Failed to verify payment. Please try again.");
    }
  };

  return (
    <div className="tab-panel reservations-panel">
      <div className="dashboard-widget glass-panel full-widget">
        <div className="widget-header">
          <h3>Active Stock Booking Orders</h3>
        </div>
        <div className="widget-content">
          {reservations.length === 0 ? (
            <p className="empty-text">No active reservations.</p>
          ) : (
            <table className="reservations-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient Info</th>
                  <th>Medicine</th>
                  <th>Qty</th>
                  <th>Total Price</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Action controls</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res, index) => (
                  <tr key={index}>
                    <td className="bold">{res.id}</td>
                    <td>
                      <div className="patient-cell">
                        <span className="p-name">
                          {res.patientName}
                        </span>
                        <span className="p-email">
                          {res.patientEmail}
                        </span>
                      </div>
                    </td>
                    <td>{res.items}</td>
                    <td>{res.quantity}</td>
                    <td className="bold color-primary">
                      ₹{res.price * res.quantity}
                    </td>
                    <td>{res.date}</td>
                    <td>
                      <div className="payment-cell">
                        <span className={`payment-method-badge ${res.paymentMethod ? res.paymentMethod.toLowerCase() : "cod"}`}>
                          {res.paymentMethod || "COD"}
                        </span>
                        <span className={`payment-status-text ${res.paymentStatus ? res.paymentStatus.toLowerCase() : "pending"}`}>
                          {res.paymentStatus === "SUCCESS" ? "● Accepted" : res.paymentMethod === "COD" ? "○ Pay at Counter" : "○ Pending"}
                        </span>
                        {res.paymentStatus === "PENDING" && 
                         (res.paymentMethod === "UPI" || res.paymentMethod === "CARD") && 
                         res.paymentId && (
                          <button
                            onClick={() => handleVerifyPayment(res.paymentId)}
                            className="verify-payment-btn"
                          >
                            Verify & Accept
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${res.status.toLowerCase()}`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td>
                      {res.status === "Ready" ||
                      res.status === "Pending" ||
                      res.status === "Confirmed" ? (
                        <div className="action-buttons-group">
                          {(res.paymentStatus === "SUCCESS" || res.paymentMethod === "COD") ? (
                            <button
                              onClick={() =>
                                handleCompleteReservation(res.id)
                              }
                              className="complete-pickup-btn"
                              title="Complete Pick Up"
                            >
                              <FaCheck /> <span>Pick Up</span>
                            </button>
                          ) : (
                            <span className="awaiting-payment-text">💳 Awaiting Payment</span>
                          )}
                          <button
                            onClick={() =>
                              handleCancelReservation(res.id)
                            }
                            className="cancel-pickup-btn"
                            title="Cancel Reservation"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <span className="muted-text">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationsTab;
