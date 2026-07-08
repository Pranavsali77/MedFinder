import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaStore,
  FaBriefcaseMedical,
  FaBoxes,
  FaClipboardList,
  FaChartLine,
  FaSignOutAlt,
  FaSun,
  FaMoon,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaClock,
  FaExclamationTriangle,
  FaCoins,
  FaCapsules,
  FaUserMd,
  FaBox,
  FaBell,
  FaUsers,
} from "react-icons/fa";
import axios from "axios";
import InventoryTab from "../inventory/InventoryTab";
import ReservationsTab from "../reservations/ReservationsTab";
import PharmacyOrders from "../PharmacyOrders/PharmacyOrders";
import PharmacyNotifications from "../PharmacyNotifications/PharmacyNotifications";
import PharmacyCustomers from "../PharmacyCustomers/PharmacyCustomers";
import { translations } from "../../../utils/translations";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Multi-language State
  const [language, setLanguage] = useState(
    localStorage.getItem("medfinder_lang") || "en",
  );
  const t = translations[language] || translations.en;

  useEffect(() => {
    const handleLangSync = () => {
      setLanguage(localStorage.getItem("medfinder_lang") || "en");
    };
    window.addEventListener("languageChange", handleLangSync);
    return () => window.removeEventListener("languageChange", handleLangSync);
  }, []);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    localStorage.setItem("medfinder_lang", newLang);
    setLanguage(newLang);
    window.dispatchEvent(new Event("languageChange"));
  };

  // Tab State
  const [activeTab, setActiveTab] = useState("overview");

  // Auth User
  const [currentUser, setCurrentUser] = useState(null);

  // Active Pharmacy entity
  const [activePharmacy, setActivePharmacy] = useState(null);

  // Local Theme State
  const [darkMode, setDarkMode] = useState(
    document.body.classList.contains("dark"),
  );

  // Inventory & Reservations State
  const [inventory, setInventory] = useState([]);
  const [reservations, setReservations] = useState([]);

  // --- NEW STATES FOR CATALOG AND STOCK CRUD ---
  const [globalCatalog, setGlobalCatalog] = useState([]);

  // Profile Details State
  const [profile, setProfile] = useState({
    name: "Apollo Pharmacy",
    address: "Nagpur Center, Wardha Road, Maharashtra",
    phone: "+91 94056 46523",
    hours: "09:00 AM - 10:00 PM",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const hasLoadedRef = React.useRef(false);

  const loadPharmacyAndData = async (user) => {
    try {
      // 1. Fetch all pharmacies
      const phRes = await axios.get("http://localhost:8080/api/pharmacies");
      let myPh = phRes.data.find((p) => p.email === user.email);

      // 2. If not found, register one automatically
      if (!myPh) {
        const cityLower = (user.city || "nagpur").toLowerCase().trim();
        let lat = 21.1458;
        let lng = 79.0882;
        const CITY_COORDS = {
          nagpur: { latitude: 21.1458, longitude: 79.0882 },
          mumbai: { latitude: 19.076, longitude: 72.8777 },
          pune: { latitude: 18.5204, longitude: 73.8567 },
          nashik: { latitude: 19.9975, longitude: 73.7898 },
          delhi: { latitude: 28.7041, longitude: 77.1025 },
          bangalore: { latitude: 12.9716, longitude: 77.5946 },
          bengaluru: { latitude: 12.9716, longitude: 77.5946 },
          hyderabad: { latitude: 17.385, longitude: 78.4867 },
          chennai: { latitude: 13.0827, longitude: 80.2707 },
          kolkata: { latitude: 22.5726, longitude: 88.3639 },
        };
        if (CITY_COORDS[cityLower]) {
          lat = CITY_COORDS[cityLower].latitude;
          lng = CITY_COORDS[cityLower].longitude;
        }

        const newPh = {
          name: user.name || "My Pharmacy",
          ownerName: user.name || "Owner",
          email: user.email,
          phone: user.phone || "+91 94056 46523",
          address: user.address || "Nagpur Center, Wardha Road, Maharashtra",
          city: user.city || "Nagpur",
          latitude: lat,
          longitude: lng,
          approved: true,
        };
        const registerRes = await axios.post(
          "http://localhost:8080/api/pharmacies/register",
          newPh,
        );
        myPh = registerRes.data;
      }

      setActivePharmacy(myPh);
      setProfile({
        name: myPh.name,
        address: myPh.address,
        phone: myPh.phone,
        hours: "09:00 AM - 10:00 PM",
      });

      // 3. Fetch inventory for this pharmacy
      const invRes = await axios.get("http://localhost:8080/api/inventory");
      const pharmacyInv = invRes.data.filter(
        (item) => item.pharmacy && item.pharmacy.id === myPh.id,
      );

      const formattedInv = pharmacyInv.map((item) => ({
        id: item.id,
        medicineId: item.medicine ? item.medicine.id : null,
        name: item.medicine ? item.medicine.name : "Unknown Medicine",
        price: item.price,
        quantity: item.stock,
      }));
      setInventory(formattedInv);

      // 4. Fetch orders/reservations and payments
      const [ordersRes, paymentsRes] = await Promise.all([
        axios.get("http://localhost:8080/api/admin/orders"),
        axios
          .get("http://localhost:8080/api/payments/all")
          .catch(() => ({ data: [] })),
      ]);

      const paymentsMap = {};
      if (paymentsRes && paymentsRes.data) {
        paymentsRes.data.forEach((p) => {
          if (p.order && p.order.id) {
            const existing = paymentsMap[p.order.id];
            if (!existing || p.status === "SUCCESS") {
              paymentsMap[p.order.id] = p;
            }
          }
        });
      }

      const pharmacyOrders = ordersRes.data.filter(
        (order) =>
          order.inventory &&
          order.inventory.pharmacy &&
          order.inventory.pharmacy.id === myPh.id,
      );

      const formattedRes = pharmacyOrders.map((order) => {
        const payment = paymentsMap[order.id];
        return {
          id: order.id.toString(),
          patientName: order.user ? order.user.name : "Unknown Patient",
          patientEmail: order.user ? order.user.email : "",
          items:
            order.inventory && order.inventory.medicine
              ? order.inventory.medicine.name
              : "Medicine",
          quantity: order.quantity,
          price: order.price || (order.inventory ? order.inventory.price : 0),
          date: order.orderDate
            ? new Date(order.orderDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Recent",
          status:
            order.status === "DELIVERED"
              ? "Completed"
              : order.status === "CANCELLED"
                ? "Cancelled"
                : order.status === "READY"
                  ? "Ready"
                  : "Pending",
          paymentId: payment ? payment.id : null,
          paymentMethod: payment ? payment.method : "COD",
          paymentStatus: payment ? payment.status : "PENDING",
        };
      });
      setReservations(formattedRes);

      // 5. Fetch global product catalog
      const catRes = await axios.get("http://localhost:8080/api/medicines");
      setGlobalCatalog(catRes.data);
    } catch (err) {
      console.error("Error loading dashboard data from API:", err);

      // Fallback pharmacy details if backend is offline/unreachable
      const cityLower = (user.city || "nagpur").toLowerCase().trim();
      let fallbackLat = 21.1458;
      let fallbackLng = 79.0882;
      const CITY_COORDS = {
        nagpur: { latitude: 21.1458, longitude: 79.0882 },
        mumbai: { latitude: 19.076, longitude: 72.8777 },
        pune: { latitude: 18.5204, longitude: 73.8567 },
        nashik: { latitude: 19.9975, longitude: 73.7898 },
        delhi: { latitude: 28.7041, longitude: 77.1025 },
        bangalore: { latitude: 12.9716, longitude: 77.5946 },
        bengaluru: { latitude: 12.9716, longitude: 77.5946 },
        hyderabad: { latitude: 17.385, longitude: 78.4867 },
        chennai: { latitude: 13.0827, longitude: 80.2707 },
        kolkata: { latitude: 22.5726, longitude: 88.3639 },
      };
      if (CITY_COORDS[cityLower]) {
        fallbackLat = CITY_COORDS[cityLower].latitude;
        fallbackLng = CITY_COORDS[cityLower].longitude;
      }

      const fallbackPh = {
        id: "MOCK-PH-001",
        name: user.name || "Apollo Pharmacy",
        ownerName: user.name || "Owner",
        email: user.email,
        phone: user.phone || "+91 94056 46523",
        address: user.address || "Nagpur Center, Wardha Road, Maharashtra",
        city: user.city || "Nagpur",
        latitude: fallbackLat,
        longitude: fallbackLng,
        approved: true,
      };
      setActivePharmacy(fallbackPh);
      setProfile({
        name: fallbackPh.name,
        address: fallbackPh.address,
        phone: fallbackPh.phone,
        hours: "09:00 AM - 10:00 PM",
      });

      // Fallback to local storage if backend is offline
      const storedInv = localStorage.getItem(`inventory_${user.email}`);
      if (storedInv) {
        setInventory(JSON.parse(storedInv));
      } else {
        const defaultInventory = [
          { id: "MED-101", name: "Paracetamol 650mg", price: 30, quantity: 45 },
          { id: "MED-102", name: "Amoxicillin 500mg", price: 65, quantity: 3 },
          {
            id: "MED-103",
            name: "Insulin Glargine 100 U/mL",
            price: 420,
            quantity: 12,
          },
          { id: "MED-104", name: "Metformin 500mg", price: 45, quantity: 85 },
          { id: "MED-105", name: "Ibuprofen 400mg", price: 20, quantity: 0 },
        ];
        setInventory(defaultInventory);
        localStorage.setItem(
          `inventory_${user.email}`,
          JSON.stringify(defaultInventory),
        );
      }

      const storedRes = localStorage.getItem("reservations_admin_db");
      if (storedRes) {
        setReservations(JSON.parse(storedRes));
      } else {
        setReservations([]);
      }

      const storedCatalog = localStorage.getItem("globalCatalog");
      if (storedCatalog) {
        setGlobalCatalog(JSON.parse(storedCatalog));
      } else {
        const defaultCatalog = [
          {
            id: 101,
            name: "Paracetamol 650mg",
            genericName: "Acetaminophen",
            category: "Analgesic",
            manufacturer: "GSK",
            prescriptionRequired: false,
            description: "Fever and pain relief",
          },
          {
            id: 102,
            name: "Amoxicillin 500mg",
            genericName: "Amoxicillin",
            category: "Antibiotic",
            manufacturer: "Cipla",
            prescriptionRequired: true,
            description: "Bacterial infections",
          },
          {
            id: 103,
            name: "Insulin Glargine 100 U/mL",
            genericName: "Insulin Glargine",
            category: "Antidiabetic",
            manufacturer: "Sanofi",
            prescriptionRequired: true,
            description: "Blood sugar control",
          },
          {
            id: 104,
            name: "Metformin 500mg",
            genericName: "Metformin",
            category: "Antidiabetic",
            manufacturer: "Abbott",
            prescriptionRequired: false,
            description: "Type 2 diabetes",
          },
          {
            id: 105,
            name: "Ibuprofen 400mg",
            genericName: "Ibuprofen",
            category: "NSAID",
            manufacturer: "Pfizer",
            prescriptionRequired: false,
            description: "Inflammation and pain relief",
          },
        ];
        setGlobalCatalog(defaultCatalog);
        localStorage.setItem("globalCatalog", JSON.stringify(defaultCatalog));
      }
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    try {
      const parsedUser = JSON.parse(storedUser);
      setTimeout(() => {
        setCurrentUser(parsedUser);
        loadPharmacyAndData(parsedUser);
      }, 0);
    } catch {
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.body.classList.toggle("dark", newMode);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // --- Profile Handlers ---
  const saveProfile = async (e) => {
    e.preventDefault();
    if (!activePharmacy) return;
    try {
      const updatedPh = {
        ...activePharmacy,
        name: profile.name,
        address: profile.address,
        phone: profile.phone,
      };
      await axios.post(
        "http://localhost:8080/api/pharmacies/register",
        updatedPh,
      );
      await loadPharmacyAndData(currentUser);
      setIsEditingProfile(false);
      alert("Pharmacy profile details updated! ✅");
    } catch (err) {
      console.error("Error saving profile to API:", err);

      // Offline fallback: update local activePharmacy state
      const updatedPh = {
        ...activePharmacy,
        name: profile.name,
        address: profile.address,
        phone: profile.phone,
      };
      setActivePharmacy(updatedPh);
      setIsEditingProfile(false);
      alert("Offline Mode: Pharmacy profile details updated locally! ⚠️✅");
    }
  };

  // --- Computed Stats ---
  const totalMedicines = inventory.length;
  const activeReservationsCount = reservations.filter(
    (r) => r.status === "Ready" || r.status === "Pending",
  ).length;
  const lowStockCount = inventory.filter(
    (med) => med.quantity > 0 && med.quantity < 5,
  ).length;
  const outOfStockCount = inventory.filter((med) => med.quantity === 0).length;
  const totalRevenue = reservations
    .filter((r) => r.status === "Completed")
    .reduce((sum, r) => sum + r.price * r.quantity, 0);

  if (!currentUser) return null;

  return (
    <div className="admin-wrapper">
      {/* Background blobs */}
      <div className="ambient-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* Sidebar Navigation */}
      <aside className="admin-sidebar glass-panel">
        <div className="sidebar-brand">
          <FaBriefcaseMedical className="brand-icon" />
          <span>
            Med<span className="logo-highlight">Finder</span>
          </span>
          <span className="admin-tag">Admin</span>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`menu-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <FaChartLine className="menu-icon" />
            <span>{t.overview}</span>
          </button>

          <button
            className={`menu-item ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            <FaBoxes className="menu-icon" />
            <span>{t.inventoryManager}</span>
          </button>

          <button
            className={`menu-item ${activeTab === "reservations" ? "active" : ""}`}
            onClick={() => setActiveTab("reservations")}
          >
            <FaClipboardList className="menu-icon" />
            <span>{t.reservations}</span>
            {activeReservationsCount > 0 && (
              <span className="active-badge">{activeReservationsCount}</span>
            )}
          </button>

          <button
            className={`menu-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <FaUserMd className="menu-icon" />
            <span>{t.pharmacyProfile}</span>
          </button>

          <button
            className={`menu-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <FaBox className="menu-icon" />
            <span>Orders</span>
          </button>

          <button
            className={`menu-item ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <FaBell className="menu-icon" />
            <span>Notifications</span>
          </button>

          <button
            className={`menu-item ${activeTab === "customers" ? "active" : ""}`}
            onClick={() => setActiveTab("customers")}
          >
            <FaUsers className="menu-icon" />
            <span>Customers</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn glass-panel"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <FaSun className="sun-icon" />
            ) : (
              <FaMoon className="moon-icon" />
            )}
            <span>{darkMode ? t.lightMode : t.darkMode}</span>
          </button>

          <button onClick={handleLogout} className="sidebar-logout-btn">
            <FaSignOutAlt className="logout-icon" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="admin-main">
        {/* Top Header */}
        <header className="admin-header glass-panel">
          <div className="header-text">
            <h1>{profile.name}</h1>
            <p>{t.adminDashboard}</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Language Switcher */}
            <div className="language-dropdown-wrapper glass-panel">
              <select
                value={language}
                onChange={handleLanguageChange}
                className="language-dropdown-select"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>

            <div className="header-user-profile">
              <div className="avatar">
                <FaStore />
              </div>
              <div className="user-details">
                <span className="user-name">{currentUser.name || "Admin"}</span>
                <span className="user-role">{t.storeManager}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Routing Body */}
        <div className="admin-body">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="tab-panel overview-panel">
              {/* Metrics Grid */}
              <div className="metrics-grid">
                <div className="metric-card glass-panel">
                  <div className="metric-header">
                    <FaCapsules className="metric-icon blue" />
                    <span className="metric-title">{t.listedDrugs}</span>
                  </div>
                  <div className="metric-body">
                    <h2>{totalMedicines}</h2>
                    <span className="metric-subtext">{t.totalCatalogSize}</span>
                  </div>
                </div>

                <div className="metric-card glass-panel">
                  <div className="metric-header">
                    <FaClipboardList className="metric-icon cyan" />
                    <span className="metric-title">
                      {t.activeReservationsCount}
                    </span>
                  </div>
                  <div className="metric-body">
                    <h2>{activeReservationsCount}</h2>
                    <span className="metric-subtext">{t.awaitingPickup}</span>
                  </div>
                </div>

                <div className="metric-card glass-panel">
                  <div className="metric-header">
                    <FaExclamationTriangle className="metric-icon orange" />
                    <span className="metric-title">{t.lowStockItems}</span>
                  </div>
                  <div className="metric-body">
                    <h2>{lowStockCount}</h2>
                    <span
                      className={`metric-subtext ${lowStockCount > 0 ? "warning-txt" : ""}`}
                    >
                      {lowStockCount} {t.itemsNeedRefill}
                    </span>
                  </div>
                </div>

                <div className="metric-card glass-panel">
                  <div className="metric-header">
                    <FaCoins className="metric-icon green" />
                    <span className="metric-title">{t.revenueCompleted}</span>
                  </div>
                  <div className="metric-body">
                    <h2>₹{totalRevenue}</h2>
                    <span className="metric-subtext">{t.salesFromPickups}</span>
                  </div>
                </div>
              </div>

              {/* Layout Rows */}
              <div className="overview-row">
                {/* Out of Stock Warning widget */}
                {outOfStockCount > 0 && (
                  <div className="dashboard-widget warning-widget glass-panel">
                    <div className="widget-header">
                      <FaExclamationTriangle className="widget-icon" />
                      <h3>{t.criticalOutOfStockWarning}</h3>
                    </div>
                    <div className="widget-content">
                      <p>{t.outOfStockMedicinesDesc}</p>
                      <ul className="critical-list">
                        {inventory
                          .filter((med) => med.quantity === 0)
                          .map((med, i) => (
                            <li key={i} className="critical-item">
                              <span>{med.name}</span>
                              <button
                                className="refill-btn-mini btn-secondary"
                                onClick={() => setActiveTab("inventory")}
                              >
                                {t.refillStock}
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Recent reservations overview */}
                <div className="dashboard-widget glass-panel">
                  <div className="widget-header">
                    <FaClipboardList className="widget-icon" />
                    <h3>{t.recentBookingsSummary}</h3>
                    <button
                      className="view-all-link"
                      onClick={() => setActiveTab("reservations")}
                    >
                      {t.manageBookings}
                    </button>
                  </div>
                  <div className="widget-content">
                    {reservations.length === 0 ? (
                      <p className="empty-text">{t.noReservationsRegistered}</p>
                    ) : (
                      <table className="overview-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Patient</th>
                            <th>Medicine</th>
                            <th>Qty</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reservations.slice(0, 3).map((res, index) => (
                            <tr key={index}>
                              <td className="bold">{res.id}</td>
                              <td>{res.patientName}</td>
                              <td>{res.items}</td>
                              <td>{res.quantity}</td>
                              <td>
                                <span
                                  className={`status-badge ${res.status.toLowerCase()}`}
                                >
                                  {res.status === "Completed"
                                    ? t.success
                                    : res.status === "Cancelled"
                                      ? t.cancelled
                                      : res.status === "Ready"
                                        ? t.pending
                                        : t.pending}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVENTORY MANAGER */}
          {activeTab === "inventory" && (
            <InventoryTab
              inventory={inventory}
              setInventory={setInventory}
              globalCatalog={globalCatalog}
              setGlobalCatalog={setGlobalCatalog}
              activePharmacy={activePharmacy}
              currentUser={currentUser}
              loadPharmacyAndData={loadPharmacyAndData}
            />
          )}

          {/* TAB 3: RESERVATIONS MANAGER */}
          {activeTab === "reservations" && (
            <ReservationsTab
              reservations={reservations}
              setReservations={setReservations}
              currentUser={currentUser}
              loadPharmacyAndData={loadPharmacyAndData}
            />
          )}

          {/* TAB 4: PHARMACY PROFILE */}
          {activeTab === "profile" && (
            <div className="tab-panel profile-panel">
              <div className="profile-widget-card glass-panel">
                {!isEditingProfile ? (
                  <div className="profile-display-view">
                    <div className="profile-big-avatar">
                      <FaStore />
                    </div>
                    <div className="profile-fields-list">
                      <div className="display-field">
                        <span className="lbl">{t.pharmacyName}</span>
                        <span className="val">{profile.name}</span>
                      </div>
                      <div className="display-field">
                        <span className="lbl">
                          <FaMapMarkerAlt /> {t.addressLocation}
                        </span>
                        <span className="val">{profile.address}</span>
                      </div>
                      <div className="display-field">
                        <span className="lbl">
                          <FaPhoneAlt /> {t.contactNumber}
                        </span>
                        <span className="val">{profile.phone}</span>
                      </div>
                      <div className="display-field">
                        <span className="lbl">
                          <FaClock /> {t.operatingHours}
                        </span>
                        <span className="val">{profile.hours}</span>
                      </div>

                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="edit-profile-btn btn-secondary"
                      >
                        {t.modifyDetails}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={saveProfile} className="profile-edit-form">
                    <div className="profile-input-field">
                      <label htmlFor="p-name">{t.pharmacyName}</label>
                      <input
                        type="text"
                        id="p-name"
                        value={profile.name}
                        onChange={(e) =>
                          setProfile({ ...profile, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="profile-input-field">
                      <label htmlFor="p-address">{t.addressLocation}</label>
                      <input
                        type="text"
                        id="p-address"
                        value={profile.address}
                        onChange={(e) =>
                          setProfile({ ...profile, address: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="profile-input-field">
                      <label htmlFor="p-phone">{t.contactNumber}</label>
                      <input
                        type="text"
                        id="p-phone"
                        value={profile.phone}
                        onChange={(e) =>
                          setProfile({ ...profile, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="profile-input-field">
                      <label htmlFor="p-hours">{t.operatingHours}</label>
                      <input
                        type="text"
                        id="p-hours"
                        value={profile.hours}
                        onChange={(e) =>
                          setProfile({ ...profile, hours: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-action-buttons">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="cancel-profile-btn btn-secondary"
                      >
                        {t.cancelBtn}
                      </button>
                      <button
                        type="submit"
                        className="save-profile-btn btn-primary"
                      >
                        {t.saveChangesBtn}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ORDERS */}
          {activeTab === "orders" && (
            <PharmacyOrders activePharmacy={activePharmacy} />
          )}

          {/* TAB 6: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <PharmacyNotifications currentUser={currentUser} />
          )}

          {/* TAB 7: CUSTOMERS */}
          {activeTab === "customers" && (
            <PharmacyCustomers activePharmacy={activePharmacy} />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
