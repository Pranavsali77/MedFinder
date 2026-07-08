import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaUsers, FaMedal, FaHistory } from "react-icons/fa";
import "./PharmacyCustomers.css";

const PharmacyCustomers = ({ activePharmacy }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activePharmacy?.id) {
      fetchCustomers();
    }
  }, [activePharmacy]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      // 1. Fetch unique customers
      const custRes = await axios.get(
        `http://localhost:8080/api/orders/pharmacy/${activePharmacy.id}/customers`,
      );
      const uniqueCustomers = custRes.data || [];

      // 2. Fetch all orders for this pharmacy to calculate stats per customer
      const ordersRes = await axios.get(
        `http://localhost:8080/api/orders/pharmacy/${activePharmacy.id}`,
      );
      const allOrders = ordersRes.data || [];

      // 3. Aggregate data
      const enrichedCustomers = uniqueCustomers.map((cust) => {
        const userOrders = allOrders.filter(
          (o) =>
            o.userId === cust.id ||
            (o.deliveryAddress && o.deliveryAddress.includes(cust.address)),
        );

        const totalPurchases = userOrders.length;
        const totalSpent = userOrders.reduce(
          (sum, o) => sum + o.price * o.quantity,
          0,
        );

        let lastPurchaseDate = null;
        if (userOrders.length > 0) {
          const dates = userOrders.map((o) => new Date(o.orderDate).getTime());
          lastPurchaseDate = new Date(Math.max(...dates));
        }

        return {
          ...cust,
          totalPurchases,
          totalSpent,
          lastPurchaseDate,
          isFrequent: totalPurchases >= 3,
        };
      });

      // Sort by frequent first, then by total spent
      enrichedCustomers.sort((a, b) => {
        if (a.isFrequent && !b.isFrequent) return -1;
        if (!a.isFrequent && b.isFrequent) return 1;
        return b.totalSpent - a.totalSpent;
      });

      setCustomers(enrichedCustomers);
    } catch (err) {
      console.error("Failed to fetch pharmacy customers", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-layout fade-in">
      <div className="card-header">
        <div className="header-title">
          <FaUsers className="card-icon" />
          <div>
            <h3>Customer Management</h3>
            <p className="card-subtext">
              View customer history, top buyers, and reservation patterns.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading customer data...</div>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <FaUsers className="empty-icon" />
          <p>
            No customers found yet. Start processing orders to see them here.
          </p>
        </div>
      ) : (
        <div className="customers-grid">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className={`customer-card ${customer.isFrequent ? "frequent" : ""}`}
            >
              <div className="customer-header">
                <div className="customer-avatar">
                  {customer.name ? customer.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <h4>{customer.name || "Unknown User"}</h4>
                  <p>{customer.email}</p>
                </div>
                {customer.isFrequent && (
                  <div className="frequent-badge" title="Frequent Customer">
                    <FaMedal /> Top Buyer
                  </div>
                )}
              </div>

              <div className="customer-stats">
                <div className="stat-box">
                  <span className="stat-label">Total Orders</span>
                  <span className="stat-value">{customer.totalPurchases}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Total Spent</span>
                  <span className="stat-value">
                    ₹{customer.totalSpent.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="customer-footer">
                <FaHistory className="footer-icon" />
                <span>
                  Last order:{" "}
                  {customer.lastPurchaseDate
                    ? customer.lastPurchaseDate.toLocaleDateString()
                    : "Never"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PharmacyCustomers;
