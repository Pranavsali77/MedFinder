import React, { useState, useEffect, useRef } from "react";
import { FaHeart, FaPrescriptionBottleAlt, FaUpload, FaSpinner, FaMagic } from "react-icons/fa";
import axios from "axios";
import "./MyPrescriptions.css";

const MyPrescriptions = ({ user, onSearchMedicine }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [scanningId, setScanningId] = useState(null);
  const [inventory, setInventory] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      fetchPrescriptions();
      fetchInventory();
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/prescriptions/user/${user.id}`);
      setPrescriptions(res.data);
    } catch (err) {
      console.error("Failed to load prescriptions", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/inventory");
      setInventory(res.data || []);
    } catch (err) {
      console.error("Failed to load inventory for checks", err);
    }
  };

  const isMedicineAvailable = (medName) => {
    if (!medName || !inventory.length) return false;
    const nameLower = medName.toLowerCase().trim();
    return inventory.some(item => 
      item.medicine && 
      item.medicine.name && 
      (item.medicine.name.toLowerCase().includes(nameLower) || nameLower.includes(item.medicine.name.toLowerCase())) &&
      item.stock > 0
    );
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", user.id);

    try {
      await axios.post("http://localhost:8080/api/prescriptions/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      fetchPrescriptions(); // Refresh list after upload
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload prescription. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const handleScanExisting = async (id) => {
    setScanningId(id);
    try {
      const res = await axios.post(`http://localhost:8080/api/prescriptions/${id}/scan`);
      setPrescriptions(prev => prev.map(p => p.id === id ? res.data : p));
    } catch (err) {
      console.error("AI Scan failed", err);
      alert("Failed to scan prescription. Please make sure AI API key is configured.");
    } finally {
      setScanningId(null);
    }
  };

  return (
    <div className="dashboard-card glass-panel full-card my-prescriptions-layout">
      <div className="card-header">
        <FaHeart className="card-icon" />
        <div>
          <h3>My Prescriptions</h3>
          <p className="card-subtext">Manage and view your uploaded prescriptions.</p>
        </div>
        <div className="header-actions">
           <input 
             type="file" 
             accept="image/*,.pdf" 
             ref={fileInputRef} 
             style={{ display: "none" }} 
             onChange={handleUpload} 
           />
           <button 
             className="btn-primary" 
             onClick={() => fileInputRef.current?.click()}
             disabled={uploading}
           >
             {uploading ? <FaSpinner className="spinner" /> : <FaUpload />} 
             {uploading ? " Uploading..." : " Upload New"}
           </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : prescriptions.length === 0 ? (
        <div className="empty-state-container">
          <FaPrescriptionBottleAlt className="empty-state-icon" />
          <h4>No Prescriptions Yet</h4>
          <p>You haven't uploaded any prescriptions. They will appear here once added.</p>
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            Upload Prescription
          </button>
        </div>
      ) : (
        <div className="prescriptions-grid">
          {prescriptions.map((pres) => (
            <div key={pres.id} className="prescription-card glass-panel">
               <div className="prescription-img-container">
                  <img 
                    src={`http://localhost:8080/${pres.filePath.replace(/\\/g, "/")}`} 
                    alt="Prescription" 
                    onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder-image.png" }}
                  />
               </div>
               <div className="prescription-details">
                 <p className="upload-date">
                   Uploaded: {new Date(pres.uploadDate).toLocaleDateString()}
                 </p>
                 
                 {pres.extractedMedicines ? (
                    <div className="extracted-meds-section">
                      <p className="extracted-title">💊 Extracted Medicines:</p>
                      <div className="extracted-chips">
                        {pres.extractedMedicines.split(",").map((med, idx) => {
                          const trimmedMed = med.trim();
                          if (!trimmedMed) return null;
                          const available = isMedicineAvailable(trimmedMed);
                          return (
                            <button
                              key={idx}
                              className={`extracted-chip-btn ${available ? "available" : "unavailable"}`}
                              onClick={() => onSearchMedicine && onSearchMedicine(trimmedMed)}
                              title={available ? `In Stock - Click to view pharmacies for ${trimmedMed}` : `Out of Stock - Click to find alternatives for ${trimmedMed}`}
                            >
                              <span className={`status-dot ${available ? "available" : "unavailable"}`}></span>
                              {trimmedMed}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                 ) : (
                   <button
                     className="scan-prescription-btn"
                     onClick={() => handleScanExisting(pres.id)}
                     disabled={scanningId === pres.id}
                   >
                     {scanningId === pres.id ? (
                       <>
                         <FaSpinner className="spinner" /> Scanning...
                       </>
                     ) : (
                       <>
                         <FaMagic /> Scan with AI
                       </>
                     )}
                   </button>
                 )}

                 <a 
                   href={`http://localhost:8080/${pres.filePath.replace(/\\/g, "/")}`} 
                   target="_blank" 
                   rel="noreferrer" 
                   className="view-full-btn"
                 >
                   View Full Size
                 </a>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPrescriptions;
