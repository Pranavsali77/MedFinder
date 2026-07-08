import React, { useState } from "react";
import { FaSyncAlt, FaPills, FaSearch, FaSpinner } from "react-icons/fa";
import axios from "axios";
import "./AlternativeMedicines.css";

const AlternativeMedicines = () => {
  const [query, setQuery] = useState("");
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setAlternatives([]);

    try {
      // Step 1: Search by direct medicine name alternatives
      const res = await axios.get(`http://localhost:8080/api/medicines/alternatives?name=${encodeURIComponent(query)}`);
      
      if (res.data && res.data.length > 0) {
        // Found direct alternatives
        const processed = res.data.map(item => ({
          ...item,
          badgeClass: "badge-generic",
          badgeText: "Generic Alternative"
        }));
        setAlternatives(processed);
      } else {
        // Step 2: Fallback to disease search
        console.log("No direct alternatives found. Trying disease search...");
        const diseaseRes = await axios.get(`http://localhost:8080/api/medicines/disease-search?query=${encodeURIComponent(query)}`);
        
        if (diseaseRes.data && diseaseRes.data.length > 0) {
          const meds = [];
          const seenIds = new Set();
          diseaseRes.data.forEach((item) => {
            if (item.medicine && !seenIds.has(item.medicine.id)) {
              seenIds.add(item.medicine.id);
              meds.push({
                ...item.medicine,
                badgeClass: "badge-therapeutic",
                badgeText: `Therapeutic: ${item.medicine.category || "Treatment"}`
              });
            }
          });
          
          if (meds.length > 0) {
            setAlternatives(meds);
            return;
          }
        }
        
        // Step 3: Fallback to AI suggestions
        console.log("No disease matches found. Trying AI suggestion...");
        const lang = localStorage.getItem("medfinder_lang") || "en";
        const aiRes = await axios.get(`http://localhost:8080/api/medicines/ai-suggest?query=${encodeURIComponent(query)}&lang=${lang}`);
        
        if (aiRes.data) {
          let aiDataArray = [];
          let rawData = aiRes.data;
          if (typeof rawData === "string") {
            try {
              const jsonMatch = rawData.match(/\[[\s\S]*\]/);
              if (jsonMatch) {
                aiDataArray = JSON.parse(jsonMatch[0]);
              } else {
                aiDataArray = JSON.parse(rawData);
              }
            } catch {
              console.error("Failed to parse AI JSON array:", rawData);
            }
          } else if (Array.isArray(rawData)) {
            aiDataArray = rawData;
          }
          
          if (Array.isArray(aiDataArray) && aiDataArray.length > 0) {
            const aiMeds = aiDataArray.map((item, idx) => ({
              id: `ai-${idx}-${Date.now()}`,
              name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
              genericName: item.name,
              category: "AI Suggested Alternative",
              manufacturer: "Any Verified Brand",
              description: item.description,
              badgeClass: "badge-ai",
              badgeText: "AI Suggestion"
            }));
            setAlternatives(aiMeds);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch alternatives", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card glass-panel full-card alt-meds-layout">
      <div className="card-header">
        <FaSyncAlt className="card-icon" />
        <div>
          <h3>Alternative Medicines</h3>
          <p className="card-subtext">Discover cheaper or more available alternatives for your prescriptions.</p>
        </div>
      </div>
      
      <div className="alt-meds-search-container">
        <form onSubmit={handleSearch} className="alt-meds-search-form">
          <input 
            type="text" 
            placeholder="Enter medicine name..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="alt-meds-input"
          />
          <button type="submit" className="btn-primary" disabled={loading || !query.trim()}>
            {loading ? <FaSpinner className="spinner" /> : <FaSearch />} Search Alternatives
          </button>
        </form>
      </div>

      <div className="alt-meds-results">
        {!hasSearched ? (
          <div className="empty-state-container">
            <FaPills className="empty-state-icon" />
            <h4>Search for Alternatives</h4>
            <p>Enter a medicine name above to find AI-powered substitutes.</p>
          </div>
        ) : loading ? (
          <div className="loading-state">
            <FaSpinner className="spinner" size={40} />
            <p>Analyzing ingredients and finding alternatives...</p>
          </div>
        ) : alternatives.length === 0 ? (
          <div className="empty-state-container">
            <FaPills className="empty-state-icon" />
            <h4>No Alternatives Found</h4>
            <p>We couldn't find any direct alternatives for "{query}".</p>
          </div>
        ) : (
          <div className="alternatives-grid">
            {alternatives.map((alt) => (
              <div key={alt.id} className="alt-med-card glass-panel">
                <div className="alt-med-header">
                  <h4>{alt.name}</h4>
                  <span className={alt.badgeClass || "badge-generic"}>
                    {alt.badgeText || "Generic"}
                  </span>
                </div>
                <div className="alt-med-body">
                  <p><strong>Generic Name:</strong> {alt.genericName}</p>
                  <p><strong>Category:</strong> {alt.category}</p>
                  <p><strong>Manufacturer:</strong> {alt.manufacturer}</p>
                  <p className="alt-description">{alt.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlternativeMedicines;
