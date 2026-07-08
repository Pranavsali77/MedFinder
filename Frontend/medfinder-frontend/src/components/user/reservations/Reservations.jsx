import React from "react";
import { FaClipboardList, FaClock } from "react-icons/fa";
import "./Reservations.css";

const Reservations = ({ reservations, onCancelReservation, onPayReservation }) => {
  const handleDownloadInvoice = (res) => {
    if (!res.invoicePath) return;
    const url = `http://localhost:8080/${res.invoicePath.replace(/\\/g, "/")}`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice_${res.dbOrderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateBarcode = (res) => {
    alert(`Pickup barcode generated for reservation: ${res.id}. Present to pharmacist.`);
  };

  return (
    <div className="dashboard-card glass-panel full-card">
      <div className="card-header">
        <FaClipboardList className="card-icon" />
        <div>
          <h3>My Reserved Inventory</h3>
          <p className="card-subtext">
            Present the reservation ID at the counter to complete your
            medicine pickup.
          </p>
        </div>
      </div>

      <div className="reservations-detailed-list">
        {reservations.length === 0 ? (
          <div className="no-reservations-state">
            <FaClipboardList className="empty-icon" />
            <h4>No Active Reservations</h4>
            <p>
              Your reservations list is currently empty. Use the
              Search tab to find and reserve stocks.
            </p>
          </div>
        ) : (
          reservations.map((res, i) => (
            <div key={i} className="detailed-reservation-card glass-panel">
              <div className="res-card-top">
                <div className="res-meta-left">
                  <span className="res-id">{res.id}</span>
                  <span className="res-date">
                    <FaClock /> Created on {res.date}
                  </span>
                </div>

                {/* Pick Up Timeline/Progress visual state */}
                {res.status === "Cancelled" ? (
                  <div className="cancelled-timeline-indicator">
                    <span className="status-dot cancelled"></span>
                    <span className="label cancelled-text">Reservation Cancelled</span>
                  </div>
                ) : (
                  <div className="timeline-progress-flow">
                    <div className="flow-step active">
                      <span className="dot"></span>
                      <span className="label">Reserved</span>
                    </div>
                    <div className={`flow-step ${res.status !== "Pending" ? "active" : ""}`}>
                      <span className="dot"></span>
                      <span className="label">Confirmed</span>
                    </div>
                    <div className={`flow-step ${res.status === "Ready" || res.status === "Picked Up" ? "active animate-pulse" : ""}`}>
                      <span className="dot"></span>
                      <span className="label">Ready for Pickup</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="res-card-middle">
                <div className="med-info-box">
                  <h4>{res.name}</h4>
                  <p>
                    Store: <strong>{res.pharmacy}</strong>
                  </p>
                </div>

                {/* Payment details badges */}
                <div className="res-payment-badge-box">
                  <span className="badge-item">
                    Payment: <strong>{res.paymentMethod}</strong>
                  </span>
                  <span className={`badge-item status-badge ${res.paymentStatus?.toLowerCase()}`}>
                    Status: <strong>{res.paymentStatus === "SUCCESS" ? "SUCCESS" : res.paymentMethod === "COD" ? "PAY AT COUNTER" : (res.paymentStatus || "PENDING")}</strong>
                  </span>
                </div>

                <div className="qty-price-box">
                  <span className="price-item">
                    Quantity: <strong>{res.quantity}</strong>
                  </span>
                  <span className="price-item">
                    Total Cost: <strong>₹{res.price * res.quantity}</strong>
                  </span>
                </div>
              </div>

              <div className="res-card-footer">
                <div className="pickup-notice">
                  <span>
                    {res.status === "Cancelled" ? (
                      <strong style={{ color: "#ff5252" }}>This reservation has been cancelled. Stock is returned to inventory.</strong>
                    ) : res.status === "Picked Up" ? (
                      <strong style={{ color: "#00e676" }}>This medication has been successfully picked up. Thank you!</strong>
                    ) : (
                      "Show this reservation card at the pharmacy counter to verify stock and purchase."
                    )}
                  </span>
                </div>
                <div className="footer-actions">
                  {res.status !== "Cancelled" && res.status !== "Picked Up" && (
                    <>
                      <button
                        className="btn-secondary cancel-btn"
                        onClick={() => onCancelReservation(res)}
                      >
                        Cancel Reservation
                      </button>

                      {res.paymentStatus !== "SUCCESS" && (
                        <button
                          className="invoice-btn"
                          style={{ background: "rgba(0, 242, 254, 0.1)", borderColor: "#00f2fe", color: "#00f2fe" }}
                          onClick={() => onPayReservation(res)}
                        >
                          Pay Online / Change Method
                        </button>
                      )}

                      <button
                        className="btn-primary ticket-btn"
                        onClick={() => handleGenerateBarcode(res)}
                      >
                        Generate Barcode
                      </button>
                    </>
                  )}

                  {res.invoicePath && (
                    <button
                      className="invoice-btn"
                      onClick={() => handleDownloadInvoice(res)}
                    >
                      Download Invoice
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reservations;
