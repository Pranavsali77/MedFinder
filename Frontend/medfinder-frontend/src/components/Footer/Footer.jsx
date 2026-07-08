import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaGlobe, FaTwitter, FaInstagram, FaLinkedinIn, FaBriefcaseMedical, FaArrowRight, FaSpinner, FaCheck } from "react-icons/fa";
import { translations } from "../../utils/translations";
import "./Footer.css";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleScrollTo = (id) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribing(true);

    // Simulate Server Request
    setTimeout(() => {
      setIsSubscribing(false);
      setIsSuccess(true);
      setEmail("");
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1200);
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Logo + About Column */}
        <div className="footer-section brand-col">
          <div className="logo" onClick={() => handleScrollTo("root")}>
            <FaBriefcaseMedical className="logo-icon" />
            <span>Med<span className="logo-highlight">Finder</span></span>
          </div>
          <p className="brand-description">
            {t.footerBrandDesc}
          </p>
          <div className="social-icons">
            <a href="#" className="social-link" aria-label="Website"><FaGlobe /></a>
            <a href="#" className="social-link" aria-label="Twitter"><FaTwitter /></a>
            <a href="#" className="social-link" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" className="social-link" aria-label="LinkedIn"><FaLinkedinIn /></a>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="footer-section links-col">
          <h3>{t.footerColQuickLinks}</h3>
          <ul>
            <li>
              <a onClick={() => handleScrollTo("root")}>{t.navHome}</a>
            </li>
            <li>
              <a onClick={() => handleScrollTo("features")}>{t.navFeatures}</a>
            </li>
            <li>
              <a onClick={() => handleScrollTo("demo")}>{t.navFindMedicine}</a>
            </li>
            <li>
              <a onClick={() => handleScrollTo("about")}>{t.footerLinkAbout}</a>
            </li>
            <li>
              <a onClick={() => handleScrollTo("contact")}>{t.navContact}</a>
            </li>
          </ul>
        </div>

        {/* Contact Info Column */}
        <div className="footer-section contact-col">
          <h3>{t.footerColContact}</h3>
          <p>📧 support@medfinder.com</p>
          <p>📞 +91 94056 46523</p>
          <p>📍 Pune, India</p>
        </div>

        {/* Newsletter Column */}
        <div className="footer-section newsletter-col">
          <h3>{t.footerColNewsletter}</h3>
          <p className="newsletter-text">{t.footerNewsletterDesc}</p>
          
          <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
            <input
              type="email"
              placeholder={t.footerNewsletterPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubscribing || isSuccess}
            />
            <button type="submit" className="newsletter-btn" disabled={isSubscribing || isSuccess}>
              {isSubscribing ? (
                <FaSpinner className="spinner-icon" />
              ) : isSuccess ? (
                <FaCheck />
              ) : (
                <FaArrowRight />
              )}
            </button>
          </form>
          {isSuccess && <span className="newsletter-success">{t.footerNewsletterSuccess}</span>}
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} MedFinder. {t.footerRightsReserved}</p>
      </div>
    </footer>
  );
};

export default Footer;
