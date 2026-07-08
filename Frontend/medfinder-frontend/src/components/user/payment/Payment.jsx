import React, { useState } from "react";
import {
  FaQrcode,
  FaCreditCard,
  FaMoneyBillWave,
  FaLock,
  FaSpinner,
  FaCheckCircle,
  FaTimes,
  FaDownload,
  FaChevronRight,
  FaMobileAlt,
} from "react-icons/fa";
import axios from "axios";
import "./Payment.css";

const Payment = ({ paymentData, orderData, onPaymentSuccess, onCancel }) => {
  const [upiId, setUpiId] = useState("");
  const [upiError, setUpiError] = useState("");

  // Card States
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardError, setCardError] = useState("");

  // Payment Processing states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verifiedPayment, setVerifiedPayment] = useState(null);

  // Auto-format card number
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    // Add spaces every 4 digits
    const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
    setCardNumber(formatted);
  };

  // Auto-format expiry date
  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setExpiry(value);
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 3) value = value.slice(0, 3);
    setCvv(value);
  };

  // Execute verification on backend
  const verifyPaymentOnBackend = async () => {
    setLoading(true);
    try {
      // Simulate bank network delay for premium feel
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const res = await axios.post(
        `http://localhost:8080/api/payments/verify/${paymentData.id}`,
      );
      setVerifiedPayment(res.data);
      setSuccess(true);

      // Delay parent callback to allow success animation to complete
      setTimeout(() => {
        if (onPaymentSuccess) {
          onPaymentSuccess(res.data);
        }
      }, 3000);
    } catch (err) {
      console.error("Payment verification failed:", err);
      alert("Payment verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // For COD, complete reservation without immediate payment success
  const handleCodReservationComplete = async () => {
    setLoading(true);
    try {
      // Simulate securing/locking reservation for premium feel
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // We don't call verifyPayment endpoint because the payment status stays PENDING.
      // We directly transition the UI success state to true
      setVerifiedPayment({
        id: paymentData.id,
        amount: paymentData.amount,
        method: "COD",
        transactionId: "N/A (Pay at Counter)",
        invoicePath: null
      });
      setSuccess(true);

      // Delay parent callback to switch tabs after success animation
      setTimeout(() => {
        if (onPaymentSuccess) {
          onPaymentSuccess(paymentData);
        }
      }, 3000);
    } catch (err) {
      console.error("COD Reservation securing failed:", err);
      alert("Failed to secure reservation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpiSubmit = (e) => {
    e.preventDefault();
    if (!upiId.trim() || !upiId.includes("@")) {
      setUpiError("Please enter a valid UPI ID (e.g. name@bank)");
      return;
    }
    setUpiError("");
    verifyPaymentOnBackend();
  };

  const handleCardSubmit = (e) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, "").length !== 16) {
      setCardError("Card number must be 16 digits");
      return;
    }
    if (!cardHolder.trim()) {
      setCardError("Card holder name is required");
      return;
    }
    if (expiry.length !== 5) {
      setCardError("Expiry date must be MM/YY");
      return;
    }
    if (cvv.length !== 3) {
      setCardError("CVV must be 3 digits");
      return;
    }
    setCardError("");
    verifyPaymentOnBackend();
  };

  const downloadInvoice = () => {
    if (!verifiedPayment || !verifiedPayment.invoicePath) return;
    // Serve invoice from backend mapped static folder
    const url = `http://localhost:8080/${verifiedPayment.invoicePath.replace(/\\/g, "/")}`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice_${verifiedPayment.id}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert raw path backslashes for image loading
  const getQrUrl = () => {
    if (!paymentData || !paymentData.qrCodePath) return "";
    return `http://localhost:8080/${paymentData.qrCodePath.replace(/\\/g, "/")}`;
  };

  return (
    <div className="payment-screen-container">
      {!success ? (
        <div className="payment-layout">
          {/* Left Column: Order details & Summary */}
          <div className="payment-summary-column glass-panel">
            <h3 className="section-title">Order Summary</h3>
            <div className="summary-card">
              <div className="summary-item">
                <span className="label">Medication</span>
                <span className="value">{orderData.name}</span>
              </div>
              <div className="summary-item">
                <span className="label">Quantity</span>
                <span className="value">{orderData.quantity} units</span>
              </div>
              <div className="summary-item">
                <span className="label">Pharmacy</span>
                <span className="value">{orderData.pharmacy}</span>
              </div>
              <div className="summary-item">
                <span className="label">Pickup Address</span>
                <span className="value text-right">{orderData.address}</span>
              </div>
              <hr className="divider" />
              <div className="summary-item total-item">
                <span className="label">Total Amount</span>
                <span className="value highlight">₹{paymentData.amount}</span>
              </div>
            </div>

            <div className="secure-badge">
              <FaLock className="lock-icon" />
              <span>SSL 256-bit Secure Reservation Pipeline</span>
            </div>

            <button
              className="payment-cancel-btn"
              onClick={onCancel}
              disabled={loading}
            >
              Back to Selection
            </button>
          </div>

          {/* Right Column: Interactive payment method process */}
          <div className="payment-methods-column glass-panel">
            <div className="method-header-badge">
              {paymentData.method === "UPI" && (
                <>
                  <FaQrcode className="header-badge-icon" />
                  <h4>UPI Instant Transfer</h4>
                </>
              )}
              {paymentData.method === "CARD" && (
                <>
                  <FaCreditCard className="header-badge-icon" />
                  <h4>Debit / Credit Card Payment</h4>
                </>
              )}
              {paymentData.method === "COD" && (
                <>
                  <FaMoneyBillWave className="header-badge-icon" />
                  <h4>Cash on Counter (COD)</h4>
                </>
              )}
            </div>

            <div className="payment-method-body">
              {/* ===================================== */}
              {/* 📲 UPI PAYMENT SUB-TAB */}
              {/* ===================================== */}
              {paymentData.method === "UPI" && (
                <div className="upi-payment-panel">
                  <div className="upi-qr-section">
                    <p className="panel-desc">
                      Scan the dynamic QR code with any UPI app (GPay, PhonePe,
                      Paytm, BHIM) to complete the transfer instantly.
                    </p>
                    <div className="qr-box-wrapper">
                      <div className="qr-glow-layer"></div>
                      <div className="qr-container-inner">
                        {paymentData.qrCodePath ? (
                          <img
                            src={getQrUrl()}
                            alt="Payment QR Code"
                            className="payment-qr-image"
                          />
                        ) : (
                          <div className="qr-placeholder">
                            <FaSpinner className="animate-spin" />
                            <span>Generating QR...</span>
                          </div>
                        )}
                        <div className="scan-line"></div>
                      </div>
                    </div>
                    <button
                      className="btn-primary qr-confirm-btn"
                      onClick={verifyPaymentOnBackend}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="icon-loading animate-spin" />
                          Verifying Scan...
                        </>
                      ) : (
                        "I Have Scanned and Paid"
                      )}
                    </button>
                  </div>

                  <div className="upi-divider">
                    <span>OR PAY WITH UPI ID</span>
                  </div>

                  <form className="upi-id-form" onSubmit={handleUpiSubmit}>
                    <div className="input-group-field">
                      <label htmlFor="upiId">Enter UPI ID</label>
                      <input
                        id="upiId"
                        type="text"
                        placeholder="username@bank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        disabled={loading}
                      />
                      {upiError && (
                        <span className="error-message-text">{upiError}</span>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="btn-secondary upi-pay-btn"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="icon-loading animate-spin" />
                          Processing UPI Payment...
                        </>
                      ) : (
                        "Verify & Pay"
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ===================================== */}
              {/* 💳 CREDIT/DEBIT CARD SUB-TAB */}
              {/* ===================================== */}
              {paymentData.method === "CARD" && (
                <div className="card-payment-panel">
                  {/* Live Credit Card Visual Mock */}
                  <div
                    className={`visual-credit-card ${isFlipped ? "flipped" : ""}`}
                  >
                    <div className="card-front">
                      <div className="card-logo-row">
                        <div className="card-chip"></div>
                        <span className="card-brand">SecurePay</span>
                      </div>
                      <div className="visual-card-number">
                        {cardNumber || "•••• •••• •••• ••••"}
                      </div>
                      <div className="card-footer-row">
                        <div className="footer-item">
                          <span className="lbl">CARD HOLDER</span>
                          <span className="val">
                            {cardHolder.toUpperCase() || "NAME SURNAME"}
                          </span>
                        </div>
                        <div className="footer-item">
                          <span className="lbl">EXPIRES</span>
                          <span className="val">{expiry || "MM/YY"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="card-back">
                      <div className="black-magnetic-strip"></div>
                      <div className="cvv-strip-row">
                        <span className="label">CVV</span>
                        <div className="cvv-value-box">{cvv || "•••"}</div>
                      </div>
                      <div className="back-disclaimer">
                        Authorized Signature. Not transferable. Secured by
                        MedFinder.
                      </div>
                    </div>
                  </div>

                  <form
                    className="card-details-form"
                    onSubmit={handleCardSubmit}
                  >
                    <div className="input-group-field">
                      <label htmlFor="cardNum">Card Number</label>
                      <input
                        id="cardNum"
                        type="text"
                        placeholder="4532 8904 1123 5678"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        disabled={loading}
                        onFocus={() => setIsFlipped(false)}
                      />
                    </div>

                    <div className="input-group-field">
                      <label htmlFor="cardName">Cardholder Name</label>
                      <input
                        id="cardName"
                        type="text"
                        placeholder="John Doe"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        disabled={loading}
                        onFocus={() => setIsFlipped(false)}
                      />
                    </div>

                    <div className="form-double-row">
                      <div className="input-group-field">
                        <label htmlFor="cardExp">Expiry Date</label>
                        <input
                          id="cardExp"
                          type="text"
                          placeholder="MM/YY"
                          value={expiry}
                          onChange={handleExpiryChange}
                          disabled={loading}
                          onFocus={() => setIsFlipped(false)}
                        />
                      </div>

                      <div className="input-group-field">
                        <label htmlFor="cardCvv">CVV</label>
                        <input
                          id="cardCvv"
                          type="password"
                          placeholder="•••"
                          value={cvv}
                          onChange={handleCvvChange}
                          disabled={loading}
                          onFocus={() => setIsFlipped(true)}
                          onBlur={() => setIsFlipped(false)}
                        />
                      </div>
                    </div>

                    {cardError && (
                      <span className="error-message-text">{cardError}</span>
                    )}

                    <button
                      type="submit"
                      className="btn-primary card-pay-btn"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="icon-loading animate-spin" />
                          Processing Transaction...
                        </>
                      ) : (
                        `Pay ₹${paymentData.amount} Securely`
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ===================================== */}
              {/* 💵 CASH ON COUNTER (COD) SUB-TAB */}
              {/* ===================================== */}
              {paymentData.method === "COD" && (
                <div className="cod-payment-panel">
                  <div className="cod-info-box glass-panel">
                    <FaMoneyBillWave className="cod-info-icon" />
                    <h4>Reservation Confirmed for Store Pickup</h4>
                    <p>
                      You have selected Cash on Counter/Delivery. No online
                      payment is required right now.
                    </p>
                    <ul className="cod-instructions">
                      <li>
                        <FaChevronRight className="bullet-arrow" />
                        Go to <strong>{orderData.pharmacy}</strong>.
                      </li>
                      <li>
                        <FaChevronRight className="bullet-arrow" />
                        Present your digital reservation ticket at the checkout
                        counter.
                      </li>
                      <li>
                        <FaChevronRight className="bullet-arrow" />
                        Pay <strong>₹{paymentData.amount}</strong> in cash or
                        UPI directly to the pharmacist.
                      </li>
                      <li>
                        <FaChevronRight className="bullet-arrow" />
                        Collect your medications immediately.
                      </li>
                    </ul>
                    <div className="cod-expiry-warning">
                      ⚠️ Reservation guarantee expires in 24 hours if stock is
                      unclaimed.
                    </div>
                  </div>

                  <button
                    className="btn-primary cod-confirm-btn"
                    onClick={handleCodReservationComplete}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="icon-loading animate-spin" />
                        Locking Reservation...
                      </>
                    ) : (
                      "Complete & Secure Reservation"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ===================================== */
        /* 🎉 PAYMENT SUCCESS PANEL SCREEN */
        /* ===================================== */
        <div className="payment-success-panel glass-panel">
          <div className="success-lottie-container">
            <FaCheckCircle className="check-success-neon animate-bounce" />
          </div>
          {paymentData.method === "COD" ? (
            <>
              <h2>Reservation Confirmed!</h2>
              <p className="trans-message">
                Your medicine reservation has been secured at{" "}
                <strong>{orderData.pharmacy}</strong>. Please pay at the counter upon pickup.
              </p>
            </>
          ) : (
            <>
              <h2>Payment Successfully Processed!</h2>
              <p className="trans-message">
                Your reservation has been fully secured at{" "}
                <strong>{orderData.pharmacy}</strong>.
              </p>
            </>
          )}

          <div className="receipt-details-box glass-panel">
            <div className="receipt-row">
              <span className="lbl">Transaction ID</span>
              <span className="val val-mono">
                {paymentData.method === "COD" ? "N/A (Pay at Counter)" : (verifiedPayment?.transactionId || "N/A")}
              </span>
            </div>
            <div className="receipt-row">
              <span className="lbl">Status</span>
              <span className={`val ${paymentData.method === "COD" ? "warning-tag" : "success-tag"}`}>
                {paymentData.method === "COD" ? "PAY AT COUNTER" : "SECURED"}
              </span>
            </div>
            <div className="receipt-row">
              <span className="lbl">{paymentData.method === "COD" ? "Amount to Pay" : "Amount Paid"}</span>
              <span className="val">₹{verifiedPayment?.amount || paymentData.amount}</span>
            </div>
            <div className="receipt-row">
              <span className="lbl">Payment Method</span>
              <span className="val val-bold">{paymentData.method === "COD" ? "Cash on Counter (COD)" : verifiedPayment?.method}</span>
            </div>
          </div>

          {paymentData.method !== "COD" && (
            <div className="success-actions-row">
              <button
                className="invoice-download-btn glass-panel"
                onClick={downloadInvoice}
              >
                <FaDownload className="btn-icon" />
                Download PDF Invoice
              </button>
            </div>
          )}

          <div className="success-footer-redirect">
            <FaSpinner className="animate-spin text-primary" />
            <span>Redirecting to your active reservations...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
