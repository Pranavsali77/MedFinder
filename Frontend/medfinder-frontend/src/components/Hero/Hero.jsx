import { useState, useEffect } from "react";
import { FaSearch, FaArrowRight, FaShieldAlt, FaClock, FaCheckDouble } from "react-icons/fa";
import { translations } from "../../utils/translations";
import "./Hero.css";
import heroMockup from "../../assets/hero_app_mockup.png";

const Hero = ({ setSearchQuery }) => {
  const [localQuery, setLocalQuery] = useState("");

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setSearchQuery(localQuery);
      scrollToDemo();
    }
  };

  const handleSuggestionClick = (medName) => {
    setLocalQuery(medName);
    setSearchQuery(medName);
    scrollToDemo();
  };

  const scrollToDemo = () => {
    const demoSection = document.getElementById("demo");
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const suggestions = ["Paracetamol", "Amoxicillin", "Metformin", "Ibuprofen"];

  return (
    <section className="hero">
      <div className="hero-container">
        {/* Left Side: Copywriting & Search */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-pulse"></span>
            <span>{t.heroActiveBadge}</span>
          </div>

          <h1 className="hero-title">
            {t.heroTitlePart1}<span className="text-gradient">{t.heroTitlePart2}</span>{t.heroTitlePart3}
          </h1>
          
          <p className="hero-description">
            {t.heroDesc}
          </p>

          <form onSubmit={handleSearchSubmit} className="hero-search-bar glass-panel">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder={t.heroSearchPlaceholder}
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              <span>{t.heroFindMedsBtn}</span>
              <FaArrowRight className="btn-icon" />
            </button>
          </form>

          {/* Quick Suggestions */}
          <div className="hero-suggestions">
            <span className="suggestion-label">{t.heroPopularSearch}</span>
            <div className="suggestion-tags">
              {suggestions.map((med) => (
                <button
                   key={med}
                   onClick={() => handleSuggestionClick(med)}
                   className="suggestion-tag"
                >
                  {med}
                </button>
              ))}
            </div>
          </div>

          {/* Trust points */}
          <div className="hero-trust">
            <div className="hero-trust-flex" style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginTop: "32px" }}>
              <div className="trust-item" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                <FaShieldAlt className="trust-icon" style={{ color: "var(--color-success)" }} />
                <span>{t.heroVerifiedStores}</span>
              </div>
              <div className="trust-item" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                <FaClock className="trust-icon" style={{ color: "var(--accent-secondary)" }} />
                <span>{t.heroLiveStocks}</span>
              </div>
              <div className="trust-item" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                <FaCheckDouble className="trust-icon" style={{ color: "var(--accent-primary)" }} />
                <span>{t.heroInstantReservation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Generated App Screenshot Mockup */}
        <div className="hero-image-container">
          <div className="hero-glow-back"></div>
          <div className="hero-card-image glass-panel">
            <img 
              src={heroMockup} 
              alt="MedFinder Live Dashboard Mockup" 
              className="mockup-img"
              onError={(e) => {
                // Fallback image in case the generated mockup didn't copy successfully yet
                e.target.src = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop";
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
