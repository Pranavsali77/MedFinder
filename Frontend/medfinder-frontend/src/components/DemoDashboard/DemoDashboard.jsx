import { useState, useEffect } from "react";
import { FaSearch, FaMapMarkerAlt, FaPhoneAlt, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaLock, FaWindowClose, FaSpinner, FaQrcode } from "react-icons/fa";
import { translations } from "../../utils/translations";
import "./DemoDashboard.css";

// Mock medicine stocks database
const MOCK_DATA = {
  paracetamol: [
    { name: "Wellness Pharmacy", distance: "0.8 km", status: "In Stock", price: "₹40.00", phone: "+91 94056 46523", address: "Sector 15, Near Central Mall" },
    { name: "Apollo Meds", distance: "1.4 km", status: "Low Stock", price: "₹45.00", phone: "+91 88888 12345", address: "Main Road Cross, opposite Metro Stn" },
    { name: "City Chemist", distance: "2.1 km", status: "In Stock", price: "₹38.00", phone: "+91 90112 34567", address: "High Street Market, Block B" },
    { name: "Care Rx Pharmacy", distance: "3.5 km", status: "Out of Stock", price: "₹42.00", phone: "+91 77766 55443", address: "Sunrise Residency, Ground Floor" }
  ],
  amoxicillin: [
    { name: "Apollo Meds", distance: "1.4 km", status: "In Stock", price: "₹120.00", phone: "+91 88888 12345", address: "Main Road Cross, opposite Metro Stn" },
    { name: "City Chemist", distance: "2.1 km", status: "Low Stock", price: "₹115.00", phone: "+91 90112 34567", address: "High Street Market, Block B" },
    { name: "Metro Chemist", distance: "1.2 km", status: "Out of Stock", price: "₹130.00", phone: "+91 95555 44444", address: "Link Road, Near Apex Hospital" }
  ],
  metformin: [
    { name: "Wellness Pharmacy", distance: "0.8 km", status: "In Stock", price: "₹90.00", phone: "+91 94056 46523", address: "Sector 15, Near Central Mall" },
    { name: "Metro Chemist", distance: "1.2 km", status: "In Stock", price: "₹85.00", phone: "+91 95555 44444", address: "Link Road, Near Apex Hospital" },
    { name: "Care Rx Pharmacy", distance: "3.5 km", status: "In Stock", price: "₹95.00", phone: "+91 77766 55443", address: "Sunrise Residency, Ground Floor" }
  ],
  ibuprofen: [
    { name: "Wellness Pharmacy", distance: "0.8 km", status: "Low Stock", price: "₹50.00", phone: "+91 94056 46523", address: "Sector 15, Near Central Mall" },
    { name: "Apollo Meds", distance: "1.4 km", status: "In Stock", price: "₹55.00", phone: "+91 88888 12345", address: "Main Road Cross, opposite Metro Stn" },
    { name: "Metro Chemist", distance: "1.2 km", status: "In Stock", price: "₹48.00", phone: "+91 95555 44444", address: "Link Road, Near Apex Hospital" },
    { name: "City Chemist", distance: "2.1 km", status: "Out of Stock", price: "₹52.00", phone: "+91 90112 34567", address: "High Street Market, Block B" }
  ],
  insulin: [
    { name: "Metro Chemist", distance: "1.2 km", status: "In Stock", price: "₹450.00", phone: "+91 95555 44444", address: "Link Road, Near Apex Hospital" },
    { name: "Apollo Meds", distance: "1.4 km", status: "Low Stock", price: "₹480.00", phone: "+91 88888 12345", address: "Main Road Cross, opposite Metro Stn" }
  ]
};

// Generic fallback data for unknown medicines
const getFallbackData = () => [
  { name: "Wellness Pharmacy", distance: "0.8 km", status: "In Stock", price: "₹150.00 (Est.)", phone: "+91 94056 46523", address: "Sector 15, Near Central Mall" },
  { name: "Apollo Meds", distance: "1.4 km", status: "Low Stock", price: "₹165.00 (Est.)", phone: "+91 88888 12345", address: "Main Road Cross, opposite Metro Stn" },
  { name: "City Chemist", distance: "2.1 km", status: "Out of Stock", price: "₹140.00 (Est.)", phone: "+91 90112 34567", address: "High Street Market, Block B" }
];

const DemoDashboard = ({ searchQuery, setSearchQuery }) => {
  const [inputVal, setInputVal] = useState("");
  const [results, setResults] = useState([]);
  const [filter, setFilter] = useState("all"); // "all", "instock", "nearby"
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationCode, setReservationCode] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Multi-language State
  const [language, setLanguage] = useState(localStorage.getItem("medfinder_lang") || "en");
  const t = translations[language] || translations.en;

  const handleSearch = (query) => {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return;

    if (MOCK_DATA[cleanQuery]) {
      setResults(MOCK_DATA[cleanQuery]);
    } else {
      // Generate dynamically based on search query
      setResults(getFallbackData());
    }
  };

  useEffect(() => {
    const handleLangSync = () => {
      setLanguage(localStorage.getItem("medfinder_lang") || "en");
    };
    window.addEventListener("languageChange", handleLangSync);
    return () => window.removeEventListener("languageChange", handleLangSync);
  }, []);

  // Sync with global searchQuery (e.g. from Hero)
  useEffect(() => {
    if (searchQuery) {
      setTimeout(() => {
        setInputVal(searchQuery);
        handleSearch(searchQuery);
      }, 0);
    } else {
      // Default initial search
      setTimeout(() => {
        setInputVal("Paracetamol");
        handleSearch("Paracetamol");
      }, 0);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearchQuery(inputVal);
      handleSearch(inputVal);
    }
  };

  // Filter Results
  const getFilteredResults = () => {
    return results.filter((store) => {
      if (filter === "instock") {
        return store.status !== "Out of Stock";
      }
      if (filter === "nearby") {
        const distanceNum = parseFloat(store.distance.split(" ")[0]);
        return distanceNum <= 1.5;
      }
      return true;
    });
  };

  // Status Pill component helper
  const renderStatusPill = (status) => {
    if (status === "In Stock") {
      return (
        <span className="status-badge success">
          <FaCheckCircle className="badge-icon" /> {t.inStock}
        </span>
      );
    } else if (status === "Low Stock") {
      return (
        <span className="status-badge warning">
          <FaExclamationTriangle className="badge-icon" /> {t.limitedQty}
        </span>
      );
    } else {
      return (
        <span className="status-badge danger">
          <FaTimesCircle className="badge-icon" /> {t.cancelled}
        </span>
      );
    }
  };

  // Handle reserve submission
  const handleReserveSubmit = (e) => {
    e.preventDefault();
    if (!userName.trim() || !userPhone.trim()) {
      setErrorMessage(t.demoModalErrorFields);
      return;
    }
    if (userPhone.replace(/\D/g, "").length < 10) {
      setErrorMessage(t.demoModalErrorPhone);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    // Simulate Server Request
    setTimeout(() => {
      setIsSubmitting(false);
      const randomCode = "MF-" + Math.floor(100000 + Math.random() * 900000);
      setReservationCode(randomCode);
    }, 1500);
  };

  const closeReservationModal = () => {
    setSelectedPharmacy(null);
    setReservationCode(null);
    setUserName("");
    setUserPhone("");
    setErrorMessage("");
  };

  const filteredData = getFilteredResults();

  return (
    <section className="demo-section" id="demo">
      <div className="demo-container">
        <div className="demo-header">
          <h2 className="demo-title">{t.demoTitle}</h2>
          <p className="demo-subtitle">
            {t.demoSubtitle}
          </p>
        </div>

        {/* Search Widget */}
        <div className="demo-search-card glass-panel">
          <form onSubmit={handleSearchSubmit} className="demo-search-form">
            <div className="input-group">
              <FaSearch className="input-icon" />
              <input
                type="text"
                placeholder={t.demoPlaceholder}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary">
              {t.searchStocks}
            </button>
          </form>

          {/* Filter options */}
          <div className="demo-filters">
            <span className="filters-label">{t.demoFilterLabel}</span>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                {t.demoFilterAll}
              </button>
              <button
                className={`filter-btn ${filter === "instock" ? "active" : ""}`}
                onClick={() => setFilter("instock")}
              >
                {t.demoFilterInStock}
              </button>
              <button
                className={`filter-btn ${filter === "nearby" ? "active" : ""}`}
                onClick={() => setFilter("nearby")}
              >
                {t.demoFilterNearby}
              </button>
            </div>
          </div>

          {/* Results Grid */}
          <div className="demo-results">
            {filteredData.length > 0 ? (
              <div className="results-grid">
                {filteredData.map((store, i) => (
                  <div key={i} className="store-card glass-panel">
                    <div className="store-card-header">
                      <h3>{store.name}</h3>
                      {renderStatusPill(store.status)}
                    </div>
                    
                    <p className="store-address">{store.address}</p>
 
                    <div className="store-details">
                      <div className="detail-item">
                        <FaMapMarkerAlt className="detail-icon" />
                        <span>{t.demoDistance} <strong>{store.distance}</strong></span>
                      </div>
                      <div className="detail-item">
                        <FaPhoneAlt className="detail-icon" />
                        <span>{store.phone}</span>
                      </div>
                    </div>

                    <div className="store-footer">
                      <div className="price-tag">
                        <span className="price-label">{t.totalAmount}:</span>
                        <span className="price-val">{store.price}</span>
                      </div>
                      <button
                        className={`reserve-btn ${store.status === "Out of Stock" ? "disabled" : ""}`}
                        disabled={store.status === "Out of Stock"}
                        onClick={() => setSelectedPharmacy(store)}
                      >
                        {store.status === "Out of Stock" ? <><FaLock /> {t.demoReserved}</> : t.demoReserveNow}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results-panel">
                <FaExclamationTriangle className="no-results-icon" />
                <h3>{t.demoNoStores}</h3>
                <p>{t.demoNoStoresDesc}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reservation Modal Overlay */}
      {selectedPharmacy && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel animate-modal">
            <button className="modal-close" onClick={closeReservationModal} aria-label="Close modal">
              <FaWindowClose />
            </button>

            {!reservationCode ? (
              <>
                <div className="modal-header">
                  <h2>{t.demoModalTitle}</h2>
                  <p>{t.demoModalSub.replace("{med}", inputVal).replace("{pharmacy}", selectedPharmacy.name)}</p>
                </div>

                <form onSubmit={handleReserveSubmit} className="modal-form">
                  <div className="modal-summary">
                    <div className="summary-row">
                      <span>{t.demoModalMed}</span>
                      <strong>{inputVal}</strong>
                    </div>
                    <div className="summary-row">
                      <span>{t.demoModalPharmacy}</span>
                      <strong>{selectedPharmacy.name}</strong>
                    </div>
                    <div className="summary-row">
                      <span>{t.demoModalEstPrice}</span>
                      <strong className="text-gradient">{selectedPharmacy.price}</strong>
                    </div>
                  </div>

                  {errorMessage && <div className="modal-error">{errorMessage}</div>}

                  <div className="form-group">
                    <label htmlFor="name-input">{t.demoModalLabelName}</label>
                    <input
                      id="name-input"
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone-input">{t.demoModalLabelPhone}</label>
                    <input
                      id="phone-input"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-primary modal-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="spinner-icon" /> {t.demoModalConfirming}
                      </>
                    ) : (
                      t.demoModalLabelConfirm
                    )}
                  </button>
                  <p className="modal-disclaimer">{t.demoModalDisclaimer}</p>
                </form>
              </>
            ) : (
              <div className="modal-success-screen">
                <div className="success-icon-wrapper">
                  <FaCheckCircle className="success-icon" />
                </div>
                <h2>{t.demoSuccessTitle}</h2>
                <p>{t.demoSuccessSub}</p>
                
                <div className="ticket-card glass-panel">
                  <div className="ticket-header">
                    <FaQrcode className="ticket-qr" />
                    <div>
                      <span className="ticket-label">{t.demoSuccessLabelCode}</span>
                      <span className="ticket-code">{reservationCode}</span>
                    </div>
                  </div>
                  <div className="ticket-details">
                    <p>👨‍💼 {t.demoSuccessPatient} <strong>{userName}</strong></p>
                    <p>💊 {t.demoModalMed} <strong>{inputVal}</strong></p>
                    <p>🏪 {t.demoSuccessStore} <strong>{selectedPharmacy.name}</strong></p>
                    <p>📍 {t.demoSuccessAddress} <small>{selectedPharmacy.address}</small></p>
                  </div>
                </div>

                <p className="success-instructions">
                  {t.demoSuccessInstructions}
                </p>

                <button className="btn-secondary close-success-btn" onClick={closeReservationModal}>
                  {t.demoSuccessClose}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default DemoDashboard;
