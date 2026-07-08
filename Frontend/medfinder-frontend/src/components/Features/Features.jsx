import { useState, useEffect } from "react";
import { FaSearchLocation, FaMapMarkedAlt, FaClock, FaPrescriptionBottleAlt } from "react-icons/fa";
import { translations } from "../../utils/translations";
import "./Features.css";

const Features = () => {
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

  const featuresList = [
    {
      icon: <FaSearchLocation className="feature-icon" />,
      title: t.featRealtimeTitle,
      description: t.featRealtimeDesc
    },
    {
      icon: <FaMapMarkedAlt className="feature-icon" />,
      title: t.featDistanceTitle,
      description: t.featDistanceDesc
    },
    {
      icon: <FaClock className="feature-icon" />,
      title: t.featServiceTitle,
      description: t.featServiceDesc
    },
    {
      icon: <FaPrescriptionBottleAlt className="feature-icon" />,
      title: t.featDigitalTitle,
      description: t.featDigitalDesc
    }
  ];

  return (
    <section className="features" id="features">
      <div className="features-header">
        <h2 className="features-section-title">{t.featHeaderTitle}</h2>
        <p className="features-section-subtitle">
          {t.featHeaderSubtitle}
        </p>
      </div>

      <div className="features-grid">
        {featuresList.map((item, index) => (
          <div key={index} className="feature-card glass-panel">
            <div className="icon-wrapper">
              {item.icon}
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
