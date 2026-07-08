import React, { useState, useEffect } from "react";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaPaperPlane, FaSpinner, FaCheckCircle } from "react-icons/fa";
import { translations } from "../../utils/translations";
import "./Contact.css";

const Contact = () => {
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

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({
        name: "",
        email: "",
        message: "",
      });

      // Clear success message after 4 seconds
      setTimeout(() => setIsSuccess(false), 4000);
    }, 1500);
  };

  return (
    <section className="contact" id="contact">
      <div className="contact-container">
        {/* Left Side: Contact Methods Info */}
        <div className="contact-info-panel">
          <div className="section-label">{t.contactSectionLabel}</div>
          <h2>{t.contactTitle}</h2>
          <p className="contact-desc">
            {t.contactDesc}
          </p>

          <div className="contact-cards">
            <div className="contact-card glass-panel">
              <FaEnvelope className="contact-card-icon" />
              <div>
                <h4>{t.contactEmailUs}</h4>
                <p>support@medfinder.com</p>
              </div>
            </div>

            <div className="contact-card glass-panel">
              <FaPhoneAlt className="contact-card-icon" />
              <div>
                <h4>{t.contactCallSupport}</h4>
                <p>+91 94056 46523</p>
              </div>
            </div>

            <div className="contact-card glass-panel">
              <FaMapMarkerAlt className="contact-card-icon" />
              <div>
                <h4>{t.contactLocation}</h4>
                <p>Pune, Maharashtra, India</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="contact-form-panel glass-panel">
          <h3>{t.contactSendMsgTitle}</h3>
          
          {isSuccess && (
            <div className="success-banner">
              <FaCheckCircle className="banner-icon" />
              <span>{t.contactSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-field">
              <label htmlFor="contact-name">{t.contactLabelName}</label>
              <input
                id="contact-name"
                type="text"
                name="name"
                placeholder={t.contactPlaceholderName}
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="contact-email">{t.contactLabelEmail}</label>
              <input
                id="contact-email"
                type="email"
                name="email"
                placeholder={t.contactPlaceholderEmail}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="contact-message">{t.contactLabelMessage}</label>
              <textarea
                id="contact-message"
                name="message"
                placeholder={t.contactPlaceholderMessage}
                rows="4"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <button type="submit" className="btn-primary submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <FaSpinner className="spinner-icon" /> {t.contactSendingBtn}
                </>
              ) : (
                <>
                  <span>{t.contactSendBtn}</span>
                  <FaPaperPlane className="submit-icon" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
