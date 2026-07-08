import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaPhone,
  FaMapMarkerAlt,
  FaBriefcaseMedical,
  FaHospital,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";
import { translations } from "../../utils/translations";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();

  // Multi-language State
  const [language, setLanguage] = useState(localStorage.getItem("medfinder_lang") || "en");
  const t = translations[language] || translations.en;

  useEffect(() => {
    const handleLangSync = () => {
      setLanguage(localStorage.getItem("medfinder_lang") || "en");
    };
    window.addEventListener("languageChange", handleLangSync);
    return () => window.removeEventListener("languageChange", handleLangSync);
  }, []);

  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    city: "",
    role: "USER", // Default role
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    city: "",
  });

  const validateForm = () => {
    let isValid = true;
    const errors = { name: "", email: "", password: "", phone: "", address: "", city: "" };

    // Name validation
    if (!user.name.trim()) {
      errors.name = user.role === "ADMIN" ? t.registerErrPharmaNameReq : t.registerErrNameReq;
      isValid = false;
    } else if (user.name.trim().length < 2) {
      errors.name = t.registerErrNameLen;
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!user.email) {
      errors.email = t.loginErrEmailReq;
      isValid = false;
    } else if (!emailRegex.test(user.email)) {
      errors.email = t.loginErrEmailInvalid;
      isValid = false;
    }

    // Password validation
    if (!user.password) {
      errors.password = t.loginErrPassReq;
      isValid = false;
    } else if (user.password.length < 6) {
      errors.password = t.loginErrPassLen;
      isValid = false;
    }

    // Phone validation
    if (user.phone && !/^\+?[0-9\s-]{10,15}$/.test(user.phone.trim())) {
      errors.phone = t.registerErrPhoneInvalid;
      isValid = false;
    }

    // Address and City validation (Required for ADMIN/Pharmacy, Optional for User)
    if (user.role === "ADMIN") {
      if (!user.address.trim()) {
        errors.address = t.registerErrAddressReq;
        isValid = false;
      }
      if (!user.city.trim()) {
        errors.city = t.registerErrCityReq;
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
    setErrorMsg("");
    setValidationErrors({ ...validationErrors, [e.target.name]: "" });
  };

  const handleRoleSelect = (roleName) => {
    setUser({ ...user, role: roleName });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Registration failed ❌");
      }

      const sessionUser = {
        name: data.name || user.name,
        email: data.email || user.email,
        role: data.role || user.role,
        phone: data.phone || user.phone,
        address: data.address || user.address,
        id: data.id || data._id || null,
      };

      if (user.role === "USER") {
        localStorage.setItem("user", JSON.stringify(sessionUser));
        alert(
          "Registration Successful! Welcome to MedFinder. Redirecting to dashboard... 🚀",
        );
        navigate("/dashboard");
      } else {
        alert("Admin Account Created Successfully ✅. Please sign in.");
        navigate("/login");
      }
    } catch (err) {
      setErrorMsg(
        err.message || "Server error. Please check if backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      {/* Decorative Blur Blobs */}
      <div className="ambient-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="register-card glass-panel">
        {/* Left Side: Branding and Info */}
        <div className="register-brand-section">
          <div className="brand-logo" onClick={() => navigate("/")}>
            <FaBriefcaseMedical className="logo-icon" />
            <span>
              Med<span className="logo-highlight">Finder</span>
            </span>
          </div>

          <div className="brand-pitch">
            <h2>{t.registerPitchTitle}</h2>
            <p>
              {t.registerPitchDesc}
            </p>
          </div>

          <ul className="brand-features">
            <li>
              <FaCheckCircle className="feature-check" />
              <span>{t.registerPitchFeat1}</span>
            </li>
            <li>
              <FaCheckCircle className="feature-check" />
              <span>{t.registerPitchFeat2}</span>
            </li>
            <li>
              <FaCheckCircle className="feature-check" />
              <span>{t.registerPitchFeat3}</span>
            </li>
          </ul>

          {/* Mini Interactive Stats Card for Premium feel */}
          <div className="mini-stats-card glass-panel">
            <div className="stats-header">
              <span className="verified-badge">{t.registerVerifiedNetwork}</span>
            </div>
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-num">140+</span>
                <span className="stat-lbl">{t.registerPharmacies}</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">98.4%</span>
                <span className="stat-lbl">{t.registerAccuracy}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="register-form-section">
          <button className="back-btn" onClick={() => navigate("/")}>
            <FaArrowLeft className="back-icon" />
            <span>{t.loginBackHome}</span>
          </button>

          <div className="form-header">
            <h1>{t.registerCreateAccount}</h1>
            <p>{t.registerGetStarted}</p>
          </div>

          {errorMsg && (
            <div className="auth-alert alert-error">
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} noValidate>
            {/* Full Name Field */}
            <div className="input-group-container">
              <label htmlFor="name">{user.role === "ADMIN" ? t.registerLabelPharmaName : t.registerLabelFullName}</label>
              <div
                className={`input-field-wrapper ${validationErrors.name ? "input-error" : ""}`}
              >
                <FaUser className="input-icon" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder={user.role === "ADMIN" ? t.registerPlaceholderPharmaName : t.registerPlaceholderFullName}
                  value={user.name}
                  onChange={handleChange}
                  required
                />
              </div>
              {validationErrors.name && (
                <span className="error-text">{validationErrors.name}</span>
              )}
            </div>

            {/* Email Field */}
            <div className="input-group-container">
              <label htmlFor="email">{t.loginLabelEmail}</label>
              <div
                className={`input-field-wrapper ${validationErrors.email ? "input-error" : ""}`}
              >
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder={t.registerPlaceholderEmail}
                  value={user.email}
                  onChange={handleChange}
                  required
                />
              </div>
              {validationErrors.email && (
                <span className="error-text">{validationErrors.email}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="input-group-container">
              <label htmlFor="password">{t.loginLabelPassword}</label>
              <div
                className={`input-field-wrapper ${validationErrors.password ? "input-error" : ""}`}
              >
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={user.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {validationErrors.password && (
                <span className="error-text">{validationErrors.password}</span>
              )}
            </div>

            {/* Phone Field */}
            <div className="input-group-container">
              <label htmlFor="phone">{t.registerLabelPhone}</label>
              <div
                className={`input-field-wrapper ${validationErrors.phone ? "input-error" : ""}`}
              >
                <FaPhone className="input-icon" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="+1 555-0199"
                  value={user.phone}
                  onChange={handleChange}
                />
              </div>
              {validationErrors.phone && (
                <span className="error-text">{validationErrors.phone}</span>
              )}
            </div>

            {/* Address Field */}
            <div className="input-group-container">
              <label htmlFor="address">
                {user.role === "ADMIN" ? t.registerLabelAddressReq : t.registerLabelAddressOpt}
              </label>
              <div
                className={`input-field-wrapper ${validationErrors.address ? "input-error" : ""}`}
              >
                <FaMapMarkerAlt className="input-icon" />
                <input
                  type="text"
                  id="address"
                  name="address"
                  placeholder={user.role === "ADMIN" ? t.registerPlaceholderAddressReq : t.registerPlaceholderAddressOpt}
                  value={user.address}
                  onChange={handleChange}
                />
              </div>
              {validationErrors.address && (
                <span className="error-text">{validationErrors.address}</span>
              )}
            </div>

            {/* City Field */}
            <div className="input-group-container">
              <label htmlFor="city">
                {user.role === "ADMIN" ? t.registerLabelCityReq : t.registerLabelCityOpt}
              </label>
              <div
                className={`input-field-wrapper ${validationErrors.city ? "input-error" : ""}`}
              >
                <FaMapMarkerAlt className="input-icon" style={{ transform: "rotate(45deg)" }} />
                <input
                  type="text"
                  id="city"
                  name="city"
                  placeholder={t.registerPlaceholderCity}
                  value={user.city}
                  onChange={handleChange}
                />
              </div>
              {validationErrors.city && (
                <span className="error-text">{validationErrors.city}</span>
              )}
            </div>

            {/* Stylish Pill-based Role Selector */}
            <div className="role-selector-container">
              <label className="role-label">{t.registerChooseRole}</label>
              <div className="role-options">
                <div
                  className={`role-option-card ${user.role === "USER" ? "active" : ""}`}
                  onClick={() => handleRoleSelect("USER")}
                >
                  <FaUser className="role-option-icon" />
                  <div className="role-option-details">
                    <span className="role-option-title">{t.registerRoleUserTitle}</span>
                    <span className="role-option-desc">
                      {t.registerRoleUserDesc}
                    </span>
                  </div>
                </div>

                <div
                  className={`role-option-card ${user.role === "ADMIN" ? "active" : ""}`}
                  onClick={() => handleRoleSelect("ADMIN")}
                >
                  <FaHospital className="role-option-icon" />
                  <div className="role-option-details">
                    <span className="role-option-title">{t.registerRoleAdminTitle}</span>
                    <span className="role-option-desc">
                      {t.registerRoleAdminDesc}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner-icon" />
                  <span>{t.registerLabelRegistering}</span>
                </>
              ) : (
                <span>{t.registerLabelRegister}</span>
              )}
            </button>
          </form>

          <p className="auth-footer-text">
            {t.registerAlreadyHaveAcc}{" "}
            <span className="auth-link" onClick={() => navigate("/login")}>
              {t.loginLabelSignIn}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
