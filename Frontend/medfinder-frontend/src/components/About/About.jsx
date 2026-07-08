import { useState, useEffect } from "react";
import { FaCheckCircle, FaHospitalSymbol, FaHandsHelping, FaUserShield } from "react-icons/fa";
import { translations } from "../../utils/translations";
import "./About.css";

const About = () => {
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

  const stats = [
    { value: t.aboutStat1Val, label: t.aboutStat1Lbl, desc: t.aboutStat1Desc },
    { value: t.aboutStat2Val, label: t.aboutStat2Lbl, desc: t.aboutStat2Desc },
    { value: t.aboutStat3Val, label: t.aboutStat3Lbl, desc: t.aboutStat3Desc },
    { value: t.aboutStat4Val, label: t.aboutStat4Lbl, desc: t.aboutStat4Desc }
  ];

  return (
    <section className="about-section" id="about">
      <div className="about-container">
        {/* Left Side: Mission narrative */}
        <div className="about-narrative">
          <div className="section-label">{t.aboutSectionLabel}</div>
          <h2 className="about-title">{t.aboutTitle}</h2>
          <p className="about-description">
            {t.aboutDesc}
          </p>

          <div className="about-bullets">
            <div className="bullet-item">
              <FaCheckCircle className="bullet-icon" />
              <div>
                <h4>{t.aboutBullet1Title}</h4>
                <p>{t.aboutBullet1Desc}</p>
              </div>
            </div>
            <div className="bullet-item">
              <FaUserShield className="bullet-icon" />
              <div>
                <h4>{t.aboutBullet2Title}</h4>
                <p>{t.aboutBullet2Desc}</p>
              </div>
            </div>
            <div className="bullet-item">
              <FaHandsHelping className="bullet-icon" />
              <div>
                <h4>{t.aboutBullet3Title}</h4>
                <p>{t.aboutBullet3Desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Metrics Grid */}
        <div className="about-stats">
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="stat-card glass-panel">
                <span className="stat-value text-gradient">{stat.value}</span>
                <h4 className="stat-label">{stat.label}</h4>
                <p className="stat-desc">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
