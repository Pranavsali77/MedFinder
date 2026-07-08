import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaSun, FaMoon, FaBars, FaTimes, FaBriefcaseMedical } from "react-icons/fa";
import { translations } from "../../utils/translations";
import "./Navbar.css";

const Navbar = ({ toggleTheme, darkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Multi-language State
  const [language, setLanguage] = useState(localStorage.getItem("medfinder_lang") || "en");
  const t = translations[language] || translations.en;

  // Language Change Listener for Sync
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

  // Add shadow on scroll
  useEffect(() => {
    const handleScrollEvent = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScrollEvent);
    return () => window.removeEventListener("scroll", handleScrollEvent);
  }, []);

  const handleScroll = (elementId) => {
    if (location.pathname !== "/") {
      navigate("/");
      // Wait for navigation to complete before scrolling
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    } else {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    setMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
    setMenuOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""} glass-panel`}>
      <div className="nav-container">
        <div className="logo" onClick={handleLogoClick}>
          <FaBriefcaseMedical className="logo-icon" />
          <span>Med<span className="logo-highlight">Finder</span></span>
        </div>

        {/* Mobile Menu Icon */}
        <div className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </div>

        {/* Links & Buttons */}
        <div className={`nav-right ${menuOpen ? "active" : ""}`}>
          <ul className="nav-links">
            <li>
              <a onClick={handleLogoClick}>{t.navHome}</a>
            </li>
            <li>
              <a onClick={() => handleScroll("features")}>{t.navFeatures}</a>
            </li>
            <li>
              <a onClick={() => handleScroll("demo")}>{t.navFindMedicine}</a>
            </li>
            <li>
              <a onClick={() => handleScroll("about")}>{t.navAbout}</a>
            </li>
            <li>
              <a onClick={() => handleScroll("contact")}>{t.navContact}</a>
            </li>
          </ul>

          <div className="nav-actions">
            {/* Language Switcher */}
            <div className="language-dropdown-wrapper">
              <select value={language} onChange={handleLanguageChange} className="language-dropdown-select">
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>

            {/* Theme Switcher */}
            <button 
              className="theme-btn" 
              onClick={toggleTheme} 
              aria-label="Toggle theme"
            >
              {darkMode ? <FaSun className="theme-icon sun" /> : <FaMoon className="theme-icon moon" />}
            </button>

            {/* Login Button */}
            <button className="login-btn" onClick={() => { navigate("/login"); setMenuOpen(false); }}>
              {t.navSignIn}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
