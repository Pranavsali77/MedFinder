import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaBriefcaseMedical,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";
import axios from "axios";
import { translations } from "../../utils/translations";
import "./Login.css";

const Login = () => {
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
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
  });

  const validateForm = () => {
    let isValid = true;
    const errors = { email: "", password: "" };

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

    setValidationErrors(errors);
    return isValid;
  };

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
    setErrorMsg("");
    setValidationErrors({ ...validationErrors, [e.target.name]: "" });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:8080/api/users/login",
        user,
      );

      localStorage.setItem("user", JSON.stringify(res.data));
      navigate("/dashboard");
    } catch (err) {
      if (err.response) {
        setErrorMsg(
          err.response.data.message || "Invalid credentials. Please try again.",
        );
      } else {
        setErrorMsg(
          "Network error. Please check if backend server is running.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Decorative Blur Blobs */}
      <div className="ambient-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="login-card glass-panel">
        {/* Left Side: Branding and Info */}
        <div className="login-brand-section">
          <div className="brand-logo" onClick={() => navigate("/")}>
            <FaBriefcaseMedical className="logo-icon" />
            <span>
              Med<span className="logo-highlight">Finder</span>
            </span>
          </div>

          <div className="brand-pitch">
            <h2>{t.loginPitchTitle}</h2>
            <p>
              {t.loginPitchDesc}
            </p>
          </div>

          <ul className="brand-features">
            <li>
              <FaCheckCircle className="feature-check" />
              <span>{t.loginPitchFeat1}</span>
            </li>
            <li>
              <FaCheckCircle className="feature-check" />
              <span>{t.loginPitchFeat2}</span>
            </li>
            <li>
              <FaCheckCircle className="feature-check" />
              <span>{t.loginPitchFeat3}</span>
            </li>
          </ul>

          {/* Mini Interactive-looking Dashboard Card for Premium feel */}
          <div className="mini-dashboard-card glass-panel">
            <div className="mini-card-header">
              <span className="pulse-indicator"></span>
              <span className="mini-card-title">{t.loginStreamTitle}</span>
            </div>
            <div className="mini-card-content">
              <div className="mini-row">
                <span className="med-name">Insulin Glargine</span>
                <span className="stock-badge status-instock">12 {t.loginStreamInStock}</span>
              </div>
              <div className="mini-row">
                <span className="med-name">Amoxicillin 500mg</span>
                <span className="stock-badge status-lowstock">2 {t.loginStreamLeft}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="login-form-section">
          <button className="back-btn" onClick={() => navigate("/")}>
            <FaArrowLeft className="back-icon" />
            <span>{t.loginBackHome}</span>
          </button>

          <div className="form-header">
            <h1>{t.loginWelcomeBack}</h1>
            <p>{t.loginWelcomeSub}</p>
          </div>

          {errorMsg && (
            <div className="auth-alert alert-error">
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>
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
                  placeholder="name@example.com"
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
              <div className="label-row">
                <label htmlFor="password">{t.loginLabelPassword}</label>
                <a
                  href="#forgot"
                  className="forgot-password"
                  onClick={(e) => e.preventDefault()}
                >
                  {t.loginForgotPass}
                </a>
              </div>
              <div
                className={`input-field-wrapper ${validationErrors.password ? "input-error" : ""}`}
              >
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder={t.loginPlaceholderPassword}
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

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner-icon" />
                  <span>{t.loginLabelSigningIn}</span>
                </>
              ) : (
                <span>{t.loginLabelSignIn}</span>
              )}
            </button>
          </form>

          <p className="auth-footer-text">
            {t.loginLabelNewUser}{" "}
            <span className="auth-link" onClick={() => navigate("/register")}>
              {t.loginLabelCreateAccount}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
