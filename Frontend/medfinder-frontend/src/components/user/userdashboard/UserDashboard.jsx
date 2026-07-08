import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaSignOutAlt,
  FaHospital,
  FaUserCircle,
  FaClipboardList,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaCapsules,
  FaArrowRight,
  FaCheckCircle,
  FaTimes,
  FaChevronRight,
  FaClock,
  FaStore,
  FaThLarge,
  FaSun,
  FaMoon,
  FaQrcode,
  FaCreditCard,
  FaMoneyBillWave,
  FaCamera,
  FaHistory,
  FaHeart,
  FaSyncAlt,
  FaBell,
  FaUser,
  FaCog,
} from "react-icons/fa";
import axios from "axios";
import L from "leaflet";
import Payment from "../payment/Payment";
import Reservations from "../reservations/Reservations";
import OrderHistory from "../orderhistory/OrderHistory";
import MyPrescriptions from "../myprescriptions/MyPrescriptions";
import AlternativeMedicines from "../alternativemedicines/AlternativeMedicines";
import Notifications from "../notifications/Notifications";
import MyProfile from "../myprofile/MyProfile";
import Settings from "../settings/Settings";
import "./UserDashboard.css";
import { translations } from "../../../utils/translations";

const LOCATION_PRESETS = [
  { name: "Nagpur Center (Zero Mile)", latitude: 21.1458, longitude: 79.0882 },
  { name: "Wardha Road", latitude: 21.0872, longitude: 79.0688 },
  { name: "Dharampeth", latitude: 21.1432, longitude: 79.0631 },
  { name: "Pratap Nagar", latitude: 21.1189, longitude: 79.0558 },
  { name: "Sadar Bazaar", latitude: 21.1718, longitude: 79.1114 },
];

const CITY_FALLBACKS = {
  nagpur: {
    latitude: 21.1458,
    longitude: 79.0882,
    name: "Nagpur, Maharashtra",
  },
  mumbai: { latitude: 19.076, longitude: 72.8777, name: "Mumbai, Maharashtra" },
  pune: { latitude: 18.5204, longitude: 73.8567, name: "Pune, Maharashtra" },
  nashik: {
    latitude: 19.9975,
    longitude: 73.7898,
    name: "Nashik, Maharashtra",
  },
  indore: {
    latitude: 22.7196,
    longitude: 75.8577,
    name: "Indore, Madhya Pradesh",
  },
  delhi: { latitude: 28.7041, longitude: 77.1025, name: "Delhi, NCR" },
  bangalore: {
    latitude: 12.9716,
    longitude: 77.5946,
    name: "Bangalore, Karnataka",
  },
  bengaluru: {
    latitude: 12.9716,
    longitude: 77.5946,
    name: "Bangalore, Karnataka",
  },
  hyderabad: {
    latitude: 17.385,
    longitude: 78.4867,
    name: "Hyderabad, Telangana",
  },
  chennai: {
    latitude: 13.0827,
    longitude: 80.2707,
    name: "Chennai, Tamil Nadu",
  },
  kolkata: {
    latitude: 22.5726,
    longitude: 88.3639,
    name: "Kolkata, West Bengal",
  },
};

// Cache for geocoded coordinates to prevent redundant Nominatim API calls
const geocodeCache = {};

const UserDashboard = () => {
  const navigate = useNavigate();

  // Tab/Navigation State
  const [activeTab, setActiveTab] = useState("dashboard");

  // Multi-language State
  const [language, setLanguage] = useState(
    localStorage.getItem("medfinder_lang") || "en",
  );
  const t = translations[language] || translations.en;

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    localStorage.setItem("medfinder_lang", newLang);
    window.dispatchEvent(new Event("languageChange"));
  };

  const cleanDescription = (desc) => {
    if (!desc) return "";
    return desc.replace(/['"[\]{}]/g, "");
  };

  // User Session State
  const [currentUser, setCurrentUser] = useState(null);

  // Search & Filter State
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [alternativesLoading, setAlternativesLoading] = useState(false);
  const [diseaseSearchCategory, setDiseaseSearchCategory] = useState("");

  // Reservations State (Persisted locally)
  const [reservations, setReservations] = useState([]);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [reserveQty, setReserveQty] = useState(1);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Payment execution states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("UPI");
  const [paymentStep, setPaymentStep] = useState(false);
  const [activePaymentData, setActivePaymentData] = useState(null);
  const [payingReservationOrder, setPayingReservationOrder] = useState(null);

  // Local Theme State
  const [darkMode, setDarkMode] = useState(
    document.body.classList.contains("dark"),
  );

  // Pharmacies & Location States
  const [pharmacies, setPharmacies] = useState([]);
  const [userCoords, setUserCoords] = useState({
    latitude: 21.1458,
    longitude: 79.0882,
    name: "Nagpur Center (Zero Mile)",
  });
  const [preferredPharmacy, setPreferredPharmacy] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef(null);
  const simulationIntervalRef = useRef(null);
  const [gpsError, setGpsError] = useState(null);
  const [cityInput, setCityInput] = useState("");
  const [citySearching, setCitySearching] = useState(false);
  const [filterPharmacyName, setFilterPharmacyName] = useState(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const userCoordsRef = useRef(userCoords);
  const fileInputRef = useRef(null);

  // AI Prescription Scanner states
  const [prescriptionMedicines, setPrescriptionMedicines] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [pendingSearch, setPendingSearch] = useState(false);

  useEffect(() => {
    if (pendingSearch) {
      handleSearch({ preventDefault: () => {} });
      setPendingSearch(false);
    }
  }, [query, pendingSearch]);

  const handlePrescriptionUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    setPrescriptionMedicines([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:8080/api/medicines/scan-prescription",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setPrescriptionMedicines(res.data);
        setQuery(res.data[0]);
        setPendingSearch(true);
      } else {
        alert(
          "No medicines found in the image. Please try another clearer image.",
        );
      }
    } catch (err) {
      console.error("Prescription scan failed:", err);
      alert("Failed to scan prescription. Please try again.");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    }
  };

  useEffect(() => {
    userCoordsRef.current = userCoords;
  }, [userCoords]);

  // Geocode profile address to exact latitude and longitude
  const resolveProfileLocation = async (user) => {
    if (!user) return null;
    const cityClean = user.city ? user.city.trim() : "";
    const addressClean = user.address ? user.address.trim() : "";

    const queries = [];
    if (addressClean) {
      if (
        cityClean &&
        !addressClean.toLowerCase().includes(cityClean.toLowerCase())
      ) {
        queries.push(`${addressClean}, ${cityClean}`);
      } else {
        queries.push(addressClean);
      }
    }
    if (cityClean) {
      queries.push(cityClean);
    }

    const cacheKey = `profile_${addressClean}_${cityClean}`
      .trim()
      .toLowerCase();
    if (geocodeCache[cacheKey]) {
      return geocodeCache[cacheKey];
    }

    for (const query of queries) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
          { headers: { "User-Agent": "MedFinder-App" } },
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const coords = {
              latitude: parseFloat(data[0].lat),
              longitude: parseFloat(data[0].lon),
              name: data[0].display_name,
            };
            geocodeCache[cacheKey] = coords;
            return coords;
          }
        }
      } catch (err) {
        console.warn(`Profile geocoding failed for "${query}":`, err);
      }
    }

    // Fallback to CITY_FALLBACKS
    if (cityClean) {
      const cityLower = cityClean.toLowerCase();
      if (CITY_FALLBACKS[cityLower]) {
        const fallback = {
          latitude: CITY_FALLBACKS[cityLower].latitude,
          longitude: CITY_FALLBACKS[cityLower].longitude,
          name: addressClean
            ? `${addressClean}, ${CITY_FALLBACKS[cityLower].name}`
            : CITY_FALLBACKS[cityLower].name,
        };
        geocodeCache[cacheKey] = fallback;
        return fallback;
      }
    }

    // Ultimate fallback
    const ultimateFallback = {
      latitude: 21.1458,
      longitude: 79.0882,
      name: addressClean
        ? cityClean
          ? `${addressClean}, ${cityClean}`
          : addressClean
        : cityClean
          ? cityClean
          : "Nagpur Center (Zero Mile)",
    };
    geocodeCache[cacheKey] = ultimateFallback;
    return ultimateFallback;
  };

  // Background geocoder for pharmacy address to get distinct coordinates
  const geocodePharmacyAddress = async (pharmacy) => {
    const address = pharmacy.address;
    const city = pharmacy.city;
    const cacheKey = `pharmacy_${pharmacy.id}_${address || ""}_${city || ""}`
      .trim()
      .toLowerCase();

    if (
      geocodeCache[cacheKey] &&
      geocodeCache[cacheKey].status === "resolved"
    ) {
      return;
    }

    const queries = [];
    if (address) {
      if (city && !address.toLowerCase().includes(city.toLowerCase())) {
        queries.push(`${address}, ${city}`);
      } else {
        queries.push(address);
      }
    }
    if (city) {
      queries.push(city);
    }

    for (const query of queries) {
      try {
        await new Promise((r) => setTimeout(r, 200));
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
          { headers: { "User-Agent": "MedFinder-App" } },
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const coords = {
              latitude: parseFloat(data[0].lat),
              longitude: parseFloat(data[0].lon),
              status: "resolved",
            };
            geocodeCache[cacheKey] = coords;

            // Reactively update coordinates and distances
            setPharmacies((prev) => {
              const updated = prev.map((item) => {
                if (item.id === pharmacy.id) {
                  const distVal = calculateDistance(
                    userCoordsRef.current.latitude,
                    userCoordsRef.current.longitude,
                    coords.latitude,
                    coords.longitude,
                  );
                  return {
                    ...item,
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    distanceVal: distVal,
                    distance: `${distVal.toFixed(1)} km`,
                  };
                }
                return item;
              });
              return [...updated].sort((a, b) => a.distanceVal - b.distanceVal);
            });
            return;
          }
        }
      } catch (err) {
        console.warn(`Pharmacy geocoding failed for "${query}":`, err);
      }
    }

    geocodeCache[cacheKey] = {
      latitude: pharmacy.latitude,
      longitude: pharmacy.longitude,
      status: "failed",
    };
  };

  // Haversine Distance Calculation in KM
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getActiveCityName = (coords, pharmacyList) => {
    if (!coords || !coords.name) return "";
    const nameLower = coords.name.toLowerCase();

    // Extract unique cities present in the pharmacy list to match dynamically
    const cities = [
      ...new Set(pharmacyList.map((p) => p.city).filter(Boolean)),
    ];
    for (const city of cities) {
      if (nameLower.includes(city.toLowerCase().trim())) {
        return city.toLowerCase().trim();
      }
    }
    return "";
  };

  const loadPharmacies = async (currentCoords) => {
    try {
      const res = await axios.get("http://localhost:8080/api/pharmacies");
      const approvedPharmacies = res.data.filter((p) => p.approved);

      const processed = approvedPharmacies.map((p) => {
        let lat = p.latitude;
        let lng = p.longitude;

        const cityLower = p.city ? p.city.toLowerCase().trim() : "";
        const CITY_COORDS = {
          nagpur: { latitude: 21.1458, longitude: 79.0882 },
          mumbai: { latitude: 19.076, longitude: 72.8777 },
          pune: { latitude: 18.5204, longitude: 73.8567 },
          nashik: { latitude: 19.9975, longitude: 73.7898 },
          indore: { latitude: 22.7196, longitude: 75.8577 },
          delhi: { latitude: 28.7041, longitude: 77.1025 },
          bangalore: { latitude: 12.9716, longitude: 77.5946 },
          bengaluru: { latitude: 12.9716, longitude: 77.5946 },
          hyderabad: { latitude: 17.385, longitude: 78.4867 },
          chennai: { latitude: 13.0827, longitude: 80.2707 },
          kolkata: { latitude: 22.5726, longitude: 88.3639 },
        };

        const cacheKey = `pharmacy_${p.id}_${p.address || ""}_${p.city || ""}`
          .trim()
          .toLowerCase();
        if (
          geocodeCache[cacheKey] &&
          geocodeCache[cacheKey].status === "resolved"
        ) {
          lat = geocodeCache[cacheKey].latitude;
          lng = geocodeCache[cacheKey].longitude;
        } else {
          // Correct coordinates on the fly if the database has default Nagpur coordinates for a non-Nagpur city
          if (
            cityLower &&
            cityLower !== "nagpur" &&
            lat === 21.1458 &&
            lng === 79.0882
          ) {
            if (CITY_COORDS[cityLower]) {
              lat = CITY_COORDS[cityLower].latitude;
              lng = CITY_COORDS[cityLower].longitude;
            }
          }
          // Queue background geocoding request to get exact coordinates
          if (!geocodeCache[cacheKey]) {
            geocodeCache[cacheKey] = {
              latitude: lat,
              longitude: lng,
              status: "pending",
            };
            geocodePharmacyAddress(p);
          }
        }

        const distVal = calculateDistance(
          currentCoords.latitude,
          currentCoords.longitude,
          lat,
          lng,
        );
        return {
          ...p,
          latitude: lat,
          longitude: lng,
          distanceVal: distVal,
          distance: `${distVal.toFixed(1)} km`,
          status: "Open Now",
        };
      });

      processed.sort((a, b) => a.distanceVal - b.distanceVal);

      // Filter to only show pharmacies in the active city, if there are matches
      const activeCity = getActiveCityName(currentCoords, processed);
      let filtered = processed;
      if (activeCity) {
        const matches = processed.filter(
          (p) => p.city && p.city.toLowerCase().trim() === activeCity,
        );
        if (matches.length > 0) {
          filtered = matches;
        }
      }

      setPharmacies(filtered);
      return filtered;
    } catch (err) {
      console.error("Error loading pharmacies from API:", err);
      // Fallback pharmacies network (Multi-city based)
      const mockList = [
        {
          id: 1,
          name: "Apollo Pharmacy",
          address: "Nagpur Center, Ward 12",
          city: "Nagpur",
          phone: "+91 94056 46523",
          latitude: 21.1458,
          longitude: 79.0882,
          approved: true,
        },
        {
          id: 2,
          name: "MedPlus Wellness",
          address: "Wardha Road, Near Airport",
          city: "Nagpur",
          phone: "+91 88456 21104",
          latitude: 21.0872,
          longitude: 79.0688,
          approved: true,
        },
        {
          id: 3,
          name: "Care & Cure Medicos",
          address: "Pratap Nagar Square",
          city: "Nagpur",
          phone: "+91 76542 33908",
          latitude: 21.1189,
          longitude: 79.0558,
          approved: true,
        },
        {
          id: 4,
          name: "Sudarshan Medicals",
          address: "Dharampeth Main Road",
          city: "Nagpur",
          phone: "+91 99124 88761",
          latitude: 21.1432,
          longitude: 79.0631,
          approved: true,
        },
        // Pune
        {
          id: 5,
          name: "Pune Care Medicos",
          address: "FC Road, Near Ferguson College",
          city: "Pune",
          phone: "+91 91234 56789",
          latitude: 18.5204,
          longitude: 73.8567,
          approved: true,
        },
        {
          id: 6,
          name: "Noble Pharmacy Deccan",
          address: "Deccan Gymkhana, Opp. Bus Stand",
          city: "Pune",
          phone: "+91 98765 43210",
          latitude: 18.5144,
          longitude: 73.8407,
          approved: true,
        },
        // Mumbai
        {
          id: 7,
          name: "Mumbai Central Pharmacy",
          address: "Colaba Causeway, Near Gateway",
          city: "Mumbai",
          phone: "+91 92233 44556",
          latitude: 19.076,
          longitude: 72.8777,
          approved: true,
        },
        {
          id: 8,
          name: "Lifeline Chemist Bandra",
          address: "Hill Road, Opp. Elco Arcade",
          city: "Mumbai",
          phone: "+91 93344 55667",
          latitude: 19.0596,
          longitude: 72.8295,
          approved: true,
        },
      ];

      const processedMock = mockList.map((p) => {
        const distVal = calculateDistance(
          currentCoords.latitude,
          currentCoords.longitude,
          p.latitude,
          p.longitude,
        );
        return {
          ...p,
          distanceVal: distVal,
          distance: `${distVal.toFixed(1)} km`,
          status: p.name === "Sudarshan Medicals" ? "Closed" : "Open Now",
        };
      });

      processedMock.sort((a, b) => a.distanceVal - b.distanceVal);

      // Filter mock by city, if there are matches
      const activeCity = getActiveCityName(currentCoords, processedMock);
      let filteredMock = processedMock;
      if (activeCity) {
        const matches = processedMock.filter(
          (p) => p.city && p.city.toLowerCase().trim() === activeCity,
        );
        if (matches.length > 0) {
          filteredMock = matches;
        }
      }

      setPharmacies(filteredMock);
      return filteredMock;
    }
  };

  const handleCoordsChange = async (newCoords, email) => {
    setUserCoords(newCoords);
    const updatedList = await loadPharmacies(newCoords);

    const savedId = localStorage.getItem(`preferred_pharmacy_${email}`);
    if (savedId && updatedList.length > 0) {
      const found = updatedList.find((p) => p.id.toString() === savedId);
      if (found) {
        setPreferredPharmacy(found);
        return;
      }
    }

    if (updatedList.length > 0) {
      setPreferredPharmacy(updatedList[0]);
    }
  };

  const handleSelectPreferredPharmacy = (pharmacy, email) => {
    if (!pharmacy || !email) return;
    localStorage.setItem(`preferred_pharmacy_${email}`, pharmacy.id.toString());
    setPreferredPharmacy(pharmacy);
  };

  const handleCitySearch = async () => {
    const query = cityInput.trim();
    if (!query) return;

    setCitySearching(true);
    setGpsError(null);

    // Try API first
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
        { headers: { "User-Agent": "MedFinder-App" } },
      );
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();

      if (data && data.length > 0) {
        const topResult = data[0];
        const newCoords = {
          latitude: parseFloat(topResult.lat),
          longitude: parseFloat(topResult.lon),
          name: topResult.display_name,
        };
        handleCoordsChange(newCoords, currentUser?.email);
        setCityInput("");
        setCitySearching(false);
        return;
      }
    } catch (err) {
      console.warn("Geocoding API failed, trying local fallback:", err);
    }

    // Try fallback dict
    const lowerQuery = query.toLowerCase();
    const fallback = CITY_FALLBACKS[lowerQuery];
    if (fallback) {
      handleCoordsChange(fallback, currentUser?.email);
      setCityInput("");
    } else {
      setGpsError(
        `Could not find coordinates for "${query}". Try another city name.`,
      );
    }
    setCitySearching(false);
  };

  const getPharmacyDistance = (pharmacyId) => {
    if (!pharmacyId) return "";
    const found = pharmacies.find((p) => p.id === pharmacyId);
    return found ? found.distance : "";
  };

  const showPharmacyMedicines = async (pharmacyId, pharmacyName) => {
    setLoading(true);
    setSearchTriggered(true);
    setQuery("");
    setFilterPharmacyName(pharmacyName);
    setActiveTab("search");
    try {
      const res = await axios.get("http://localhost:8080/api/inventory");
      const matchedInventories = res.data.filter(
        (item) => item.pharmacy && item.pharmacy.id === pharmacyId,
      );

      const formattedResults = matchedInventories.map((item) => ({
        inventoryId: item.id,
        name: item.medicine.name,
        price: item.price,
        quantity: item.stock,
        pharmacy: item.pharmacy ? item.pharmacy.name : "Verified Pharmacy",
        pharmacyId: item.pharmacy ? item.pharmacy.id : null,
      }));
      setResults(formattedResults);
    } catch (error) {
      console.error("Error loading pharmacy medicines:", error);
      // Fallback mockup listings to keep UI interactive
      setResults([
        {
          inventoryId: 9991,
          name: "Paracetamol 650mg",
          price: 35,
          quantity: 120,
          pharmacy: pharmacyName,
          pharmacyId: pharmacyId,
        },
        {
          inventoryId: 9992,
          name: "Amoxicillin 500mg",
          price: 85,
          quantity: 45,
          pharmacy: pharmacyName,
          pharmacyId: pharmacyId,
        },
        {
          inventoryId: 9993,
          name: "Cetirizine 10mg",
          price: 20,
          quantity: 80,
          pharmacy: pharmacyName,
          pharmacyId: pharmacyId,
        },
        {
          inventoryId: 9994,
          name: "Ibuprofen 400mg",
          price: 45,
          quantity: 60,
          pharmacy: pharmacyName,
          pharmacyId: pharmacyId,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setGpsError(null);
    let watchId = null;

    const startSimulation = (startCoords) => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }

      let lat = startCoords.latitude;
      let lng = startCoords.longitude;
      let angle = 0;

      simulationIntervalRef.current = setInterval(() => {
        angle += 0.15;
        lat += Math.sin(angle) * 0.0008;
        lng += Math.cos(angle) * 0.001;

        const simulatedCoords = {
          latitude: lat,
          longitude: lng,
          name: "Simulated GPS Path (Moving)",
        };
        handleCoordsChange(simulatedCoords, currentUser?.email);
      }, 2500);
    };

    if (isTracking) {
      if (navigator.geolocation) {
        const handleSuccess = (position) => {
          setGpsError(null);
          const gpsCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            name: "Live GPS Tracked Location",
          };
          handleCoordsChange(gpsCoords, currentUser?.email);
        };

        const handleError = (error) => {
          console.warn("GPS Tracking error, starting simulated trail:", error);
          setGpsError(
            "GPS Signal Offline/Blocked - Running simulated tracker 🛰️",
          );
          startSimulation(userCoordsRef.current);
        };

        watchId = navigator.geolocation.watchPosition(
          handleSuccess,
          handleError,
          { enableHighAccuracy: false, maximumAge: 10000, timeout: 8000 },
        );
        watchIdRef.current = watchId;
      } else {
        console.warn("Geolocation unsupported, starting simulated trail");
        setGpsError("Geolocation unsupported - Running simulated tracker 🛰️");
        startSimulation(userCoordsRef.current);
      }
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (simulationIntervalRef.current !== null) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (simulationIntervalRef.current !== null) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [isTracking, currentUser]);

  useEffect(() => {
    // Only initialize map when the pharmacies tab is active
    if (activeTab !== "pharmacies" || !mapContainerRef.current) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
      }
      return;
    }

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(
        [userCoords.latitude, userCoords.longitude],
        13,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
    }

    const mapInstance = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    if (markersGroup) {
      markersGroup.clearLayers();
    }

    mapInstance.panTo([userCoords.latitude, userCoords.longitude]);

    const userIcon = L.divIcon({
      html: `<div class="user-map-marker"><div class="marker-core"></div><div class="marker-pulse"></div></div>`,
      className: "custom-user-marker",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([userCoords.latitude, userCoords.longitude], { icon: userIcon })
      .addTo(markersGroup)
      .bindPopup("<strong>You are here</strong><br/>Tracked Location");

    pharmacies.forEach((ph) => {
      if (!ph.latitude || !ph.longitude) return;

      const isPreferred = preferredPharmacy && preferredPharmacy.id === ph.id;

      const phIcon = L.divIcon({
        html: `
          <div class="pharmacy-map-marker ${isPreferred ? "preferred" : ""}">
            <div class="marker-pin"></div>
            <div class="marker-icon-inner">${isPreferred ? "★" : "✙"}</div>
          </div>
        `,
        className: "custom-ph-marker",
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -40],
      });

      const popupContent = document.createElement("div");
      popupContent.className = "map-popup-card";
      popupContent.innerHTML = `
        <h5>${ph.name}</h5>
        <p class="popup-address">${ph.address || "Nagpur Branch"}</p>
        <p class="popup-phone">📞 ${ph.phone || "No phone"}</p>
        <p class="popup-distance">📍 Distance: ${ph.distance}</p>
        <div class="popup-actions">
          ${
            isPreferred
              ? `<span class="preferred-badge-star" style="margin-left: 0;">⭐ Current Store</span>`
              : `<button class="btn-primary set-pref-popup-btn" style="padding: 6px 12px; font-size: 11px;">Set as Current Store</button>`
          }
        </div>
      `;

      const marker = L.marker([ph.latitude, ph.longitude], { icon: phIcon })
        .addTo(markersGroup)
        .bindPopup(popupContent);

      marker.on("popupopen", () => {
        const btn = popupContent.querySelector(".set-pref-popup-btn");
        if (btn) {
          btn.onclick = () => {
            handleSelectPreferredPharmacy(ph, currentUser?.email);
            marker.closePopup();
          };
        }
      });
    });
  }, [activeTab, userCoords, pharmacies, preferredPharmacy, currentUser]);

  const loadUserReservations = async (user) => {
    try {
      const [ordersRes, paymentsRes] = await Promise.all([
        axios.get(`http://localhost:8080/api/orders/user/${user.id}`),
        axios.get(`http://localhost:8080/api/payments/user/${user.id}`),
      ]);

      const paymentsMap = {};
      paymentsRes.data.forEach((p) => {
        if (p.order && p.order.id) {
          const existing = paymentsMap[p.order.id];
          if (!existing || p.status === "SUCCESS") {
            paymentsMap[p.order.id] = p;
          }
        }
      });

      const formattedRes = ordersRes.data.map((order) => {
        const payment = paymentsMap[order.orderId];
        return {
          id: `RES-${order.orderId}`,
          dbOrderId: order.orderId,
          name: order.medicineName || "Unknown Medicine",
          quantity: order.quantity,
          price: order.price || 0,
          pharmacy: order.pharmacyName || "Verified Pharmacy",
          date: order.orderDate
            ? new Date(order.orderDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Recent",
          status:
            order.status === "DELIVERED"
              ? "Picked Up"
              : order.status === "CANCELLED"
                ? "Cancelled"
                : order.status === "READY"
                  ? "Ready"
                  : "Confirmed",
          paymentMethod: payment ? payment.method : "COD",
          paymentStatus: payment ? payment.status : "PENDING",
          invoicePath: payment ? payment.invoicePath : null,
        };
      });
      setReservations(formattedRes);
    } catch (err) {
      console.error("Error loading user reservations from API:", err);
      const storedRes = localStorage.getItem(`reservations_${user.email}`);
      if (storedRes) {
        setReservations(JSON.parse(storedRes));
      }
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    try {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);
      loadUserReservations(parsedUser);

      // Determine initial coordinates based on user's registered city and address asynchronously
      const initLocation = async () => {
        let profileCoords = {
          latitude: 21.1458,
          longitude: 79.0882,
          name: "Nagpur Center (Zero Mile)",
        };

        if (parsedUser.city || parsedUser.address) {
          try {
            const resolved = await resolveProfileLocation(parsedUser);
            if (resolved) {
              profileCoords = resolved;
            }
          } catch (err) {
            console.warn("Failed to geocode profile location on startup:", err);
          }
        }

        // Try browser geolocation first (which can be overridden or ignored if denied)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const gpsCoords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                name: "Current Device Location",
              };
              handleCoordsChange(gpsCoords, parsedUser.email);
            },
            () => {
              console.log(
                "Geolocation error or permission denied, using registered profile location",
              );
              handleCoordsChange(profileCoords, parsedUser.email);
            },
          );
        } else {
          handleCoordsChange(profileCoords, parsedUser.email);
        }
      };

      initLocation();
    } catch {
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const handleLangSync = () => {
      setLanguage(localStorage.getItem("medfinder_lang") || "en");
    };
    window.addEventListener("languageChange", handleLangSync);
    return () => window.removeEventListener("languageChange", handleLangSync);
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.body.classList.toggle("dark", newMode);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setFilterPharmacyName(null);
    setLoading(true);
    setSearchTriggered(true);
    setAlternatives([]);
    setDiseaseSearchCategory("");
    try {
      const res = await axios.get("http://localhost:8080/api/inventory");
      const queryLower = query.toLowerCase();

      const matchedInventories = res.data.filter(
        (item) =>
          item.medicine &&
          item.medicine.name.toLowerCase().includes(queryLower),
      );

      const formatItem = (item) => ({
        inventoryId: item.id,
        name: item.medicine.name,
        price: item.price,
        quantity: item.stock,
        pharmacy: item.pharmacy ? item.pharmacy.name : "Verified Pharmacy",
        pharmacyId: item.pharmacy ? item.pharmacy.id : null,
        description: item.medicine.description || "",
        genericName: item.medicine.genericName || "",
        category: item.medicine.category || "",
      });

      const formattedResults = matchedInventories.map(formatItem);

      const nearbyMatches = formattedResults.filter((item) =>
        pharmacies.some((p) => p.id === item.pharmacyId),
      );
      const farMatches = formattedResults.filter(
        (item) => !pharmacies.some((p) => p.id === item.pharmacyId),
      );

      let displayResults = [];
      let displayAlts = [];

      if (nearbyMatches.length > 0) {
        displayResults = nearbyMatches;
        // Optionally add far matches at the end
        displayResults = [...displayResults, ...farMatches];
      } else if (farMatches.length > 0) {
        // Show far matches but heavily emphasize alternatives
        displayResults = farMatches;

        // Find generic alternatives available nearby
        const genericNames = [
          ...new Set(
            farMatches.map((m) => m.genericName.toLowerCase()).filter(Boolean),
          ),
        ];
        if (genericNames.length > 0) {
          const localAlts = res.data
            .filter(
              (item) =>
                item.medicine &&
                item.medicine.genericName &&
                genericNames.some((gen) =>
                  item.medicine.genericName.toLowerCase().includes(gen),
                ) &&
                pharmacies.some((p) => p.id === item.pharmacy?.id),
            )
            .map(formatItem);
          displayAlts = localAlts;
        }
      } else {
        // No exact brand match anywhere. Check aliases for truly unknown names like "xyz"
        // No exact brand match anywhere. Check aliases for truly unknown names
        const COMMON_ALIASES = {
          crocin: "paracetamol",
          dolo: "paracetamol",
          calpol: "paracetamol",
          allegra: "fexofenadine",
          avil: "chlorpheniramine maleate",
          augmentin: "amoxicillin",
          betadine: "povidone",
          combiflam: "ibuprofen",
          vicks: "menthol",
          volini: "diclofenac",
          cetaphil: "cleanser",
          okacet: "cetirizine",
          omeprazole: "pantoprazole",
          pantocid: "pantoprazole",
          digene: "antacid",
          xyz: "paracetamol", // specific fallback to handle "unknown medicine name" gracefully
        };

        let searchGeneric = COMMON_ALIASES[queryLower];

        if (searchGeneric) {
          // Found alias, show nearby alternatives by fetching from alternatives-inventory
          setAlternativesLoading(true);
          const altRes = await axios.get(
            `http://localhost:8080/api/medicines/alternatives-inventory?name=${encodeURIComponent(searchGeneric)}`,
          );
          displayAlts = altRes.data
            .filter((item) =>
              pharmacies.some((p) => p.id === item.pharmacy?.id),
            )
            .map(formatItem);
          if (displayAlts.length === 0) {
            displayAlts = altRes.data.map(formatItem);
          }
          setAlternativesLoading(false);
        } else {
          // Fallback to disease search
          try {
            const diseaseRes = await axios.get(
              `http://localhost:8080/api/medicines/disease-search?query=${encodeURIComponent(query)}`,
            );
            if (diseaseRes.data && diseaseRes.data.length > 0) {
              const formattedDiseaseResults = diseaseRes.data.map(formatItem);

              // Only keep nearby disease matches to be safe
              displayResults = formattedDiseaseResults.filter((item) =>
                pharmacies.some((p) => p.id === item.pharmacyId),
              );

              if (displayResults.length === 0) {
                // If disease search has no nearby results, show far results and alternatives
                displayResults = formattedDiseaseResults;
              }

              let categoryName = "Treatment Options";
              if (queryLower.includes("fever") || queryLower.includes("pain"))
                categoryName = "Fever & Pain Relief";
              else if (
                queryLower.includes("allergy") ||
                queryLower.includes("cold")
              )
                categoryName = "Allergy & Cold Symptoms";
              else if (
                queryLower.includes("fungal") ||
                queryLower.includes("itch")
              )
                categoryName = "Fungal Infections";
              else if (
                queryLower.includes("depression") ||
                queryLower.includes("anxiety")
              )
                categoryName = "Anxiety & Depression";
              else if (
                queryLower.includes("hypertension") ||
                queryLower.includes("bp") ||
                queryLower.includes("heart")
              )
                categoryName = "Cardiovascular & Hypertension";
              else if (queryLower.includes("asthma"))
                categoryName = "Asthma Care";
              else if (diseaseRes.data[0] && diseaseRes.data[0].medicine) {
                categoryName =
                  diseaseRes.data[0].medicine.category || "General Treatment";
              }
              setDiseaseSearchCategory(categoryName);
              // Complete fallback (last resort) for alternatives
              setAlternativesLoading(true);
              const altRes = await axios.get(
                `http://localhost:8080/api/medicines/alternatives-inventory?name=general`,
              );
              displayAlts = altRes.data
                .filter((item) =>
                  pharmacies.some((p) => p.id === item.pharmacy?.id),
                )
                .map(formatItem);
              if (displayAlts.length === 0) {
                displayAlts = altRes.data.map(formatItem); // show any if no nearby
              }
              // Mark these as random/general so UI knows they aren't true substitutes
              displayAlts = displayAlts.map((item) => ({
                ...item,
                isRandomFallback: true,
              }));
              setAlternativesLoading(false);
            }
          } catch (diseaseErr) {
            console.error("Error searching by disease:", diseaseErr);
          }
        }
      }

      // Universal AI Fallback for Alternatives
      if (displayAlts.length === 0 && query.trim() !== "") {
        setAlternativesLoading(true);
        try {
          const aiRes = await axios.get(
            `http://localhost:8080/api/medicines/ai-suggest?query=${encodeURIComponent(query)}&lang=${language}`,
          );
          if (aiRes.data) {
            let aiDataArray = [];
            let rawData = aiRes.data;
            if (typeof rawData === "string") {
              try {
                // Try to extract JSON array
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

            if (!Array.isArray(aiDataArray) || aiDataArray.length === 0) {
              // Fallback if parsing failed completely
              aiDataArray = [
                { name: "general", description: "AI suggested alternative." },
              ];
            }

            // Iterate over each suggestion and fetch inventory
            let aggregatedAlts = [];

            for (const aiObj of aiDataArray) {
              const aiStr = (aiObj.name || "").trim().toLowerCase();
              if (
                !aiStr ||
                aiStr === query.toLowerCase() ||
                aiStr === "general"
              )
                continue;

              const aiDescription =
                aiObj.description || "AI suggested therapeutic alternative.";

              try {
                const altRes = await axios.get(
                  `http://localhost:8080/api/medicines/alternatives-inventory?name=${encodeURIComponent(aiStr)}`,
                );

                let localAlts = altRes.data
                  .filter((item) =>
                    pharmacies.some((p) => p.id === item.pharmacy?.id),
                  )
                  .map(formatItem);

                if (localAlts.length === 0) {
                  localAlts = altRes.data.map(formatItem);
                }

                if (localAlts.length === 0) {
                  // Out of stock dummy card
                  aggregatedAlts.push({
                    inventoryId: `out-of-stock-${aiStr}`,
                    name: aiStr.charAt(0).toUpperCase() + aiStr.slice(1),
                    price: 0,
                    quantity: 0,
                    pharmacy: "Out of Stock",
                    pharmacyId: null,
                    description: aiDescription,
                    genericName: aiStr,
                    category: "Alternative",
                    isAiSuggested: true,
                    aiKeyword: aiStr,
                  });
                } else {
                  const enhancedAlts = localAlts.map((item) => ({
                    ...item,
                    isAiSuggested: true,
                    aiKeyword: aiStr,
                    description: aiDescription,
                  }));
                  aggregatedAlts = [...aggregatedAlts, ...enhancedAlts];
                }
              } catch (err) {
                console.error(
                  "Error fetching inventory for AI alternative:",
                  aiStr,
                  err,
                );
              }
            }

            if (aggregatedAlts.length > 0) {
              displayAlts = aggregatedAlts;
            } else {
              // Ultimate fallback if API fails or array is empty
              displayAlts = [
                {
                  inventoryId: "general-fallback",
                  name: "General Substitute",
                  price: 0,
                  quantity: 0,
                  pharmacy: "Out of Stock",
                  pharmacyId: null,
                  description: "No specific alternatives found.",
                  genericName: "General",
                  category: "Alternative",
                  isRandomFallback: true,
                },
              ];
            }
          }
        } catch (aiErr) {
          console.error("AI suggestion failed:", aiErr);
        }
        setAlternativesLoading(false);
      }

      setResults(displayResults);
      setAlternatives(displayAlts);
    } catch (error) {
      console.error("Error searching medicines:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const openReserveModal = (med) => {
    setSelectedMed(med);
    setReserveQty(1);
    setModalSuccess(false);
    setSelectedPaymentMethod("UPI");
    setPaymentStep(false);
    setActivePaymentData(null);
    setPayingReservationOrder(null);
    setShowModal(true);
  };

  const handlePayNowReservation = (res) => {
    setPayingReservationOrder(res);
    setSelectedMed({
      name: res.name,
      price: res.price,
      quantity: res.quantity,
      pharmacy: res.pharmacy,
    });
    setReserveQty(res.quantity);
    setSelectedPaymentMethod("UPI");
    setPaymentStep(false);
    setActivePaymentData(null);
    setShowModal(true);
  };

  const handleConfirmReservation = async () => {
    if (!selectedMed || !currentUser) return;

    try {
      let paymentRes;
      if (payingReservationOrder) {
        // Order already placed, directly create a new payment
        paymentRes = await axios.post(
          `http://localhost:8080/api/payments/create/${payingReservationOrder.dbOrderId}?method=${selectedPaymentMethod}`,
        );
      } else {
        const orderRequest = {
          inventoryId: selectedMed.inventoryId,
          userId: currentUser.id,
          quantity: reserveQty,
          address: currentUser.address || "Store Pickup",
          orderType: "STORE_PICKUP",
        };

        // 1. Place the order
        const orderRes = await axios.post(
          "http://localhost:8080/api/orders/place",
          orderRequest,
        );
        const placedOrder = orderRes.data;

        // 2. Create the payment
        paymentRes = await axios.post(
          `http://localhost:8080/api/payments/create/${placedOrder.orderId}?method=${selectedPaymentMethod}`,
        );
      }

      // 3. Set the active payment details and transition to the payment step
      setActivePaymentData(paymentRes.data);
      setPaymentStep(true);
    } catch (err) {
      console.error("Error placing order/reservation:", err);
      alert(
        "Failed to initiate reservation. Please check inventory stock and try again.",
      );
    }
  };

  const handlePaymentSuccess = async () => {
    // Reload reservations from backend
    if (currentUser) {
      await loadUserReservations(currentUser);
    }
    // Close modal
    setShowModal(false);
    setPaymentStep(false);
    setSelectedMed(null);
    setActivePaymentData(null);
    setPayingReservationOrder(null);
    // Switch tab to reservations
    setActiveTab("reservations");
  };

  const handleCancelUserReservation = async (res) => {
    if (
      window.confirm(
        "Cancel this reservation? Stock will be returned to live inventory.",
      )
    ) {
      if (res.dbOrderId) {
        try {
          await axios.put(
            `http://localhost:8080/api/orders/status/${res.dbOrderId}?status=CANCELLED`,
          );
          await loadUserReservations(currentUser);
          alert("Reservation cancelled successfully! ✅");
        } catch (err) {
          console.error("Error cancelling reservation:", err);
          alert("Failed to cancel reservation. Please try again.");
        }
      } else {
        // Fallback for mock reservation
        const filtered = reservations.filter((r) => r.id !== res.id);
        setReservations(filtered);
        if (currentUser) {
          localStorage.setItem(
            `reservations_${currentUser.email}`,
            JSON.stringify(filtered),
          );
        }
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!currentUser) return null;

  return (
    <div className="dashboard-wrapper">
      {/* Visual Ambient Blur Blobs */}
      <div className="ambient-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* Main Sidebar */}
      <aside className="dashboard-sidebar glass-panel">
        <div className="sidebar-logo" onClick={() => navigate("/")}>
          <FaCapsules className="logo-icon" />
          <span>
            Med<span className="logo-highlight">Finder</span>
          </span>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`menu-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <FaThLarge className="menu-icon" />
            <span>{t.dashboard}</span>
          </button>

          <button
            className={`menu-item ${activeTab === "search" ? "active" : ""}`}
            onClick={() => setActiveTab("search")}
          >
            <FaSearch className="menu-icon" />
            <span>{t.findMedicines}</span>
          </button>

          <button
            className={`menu-item ${activeTab === "pharmacies" ? "active" : ""}`}
            onClick={() => setActiveTab("pharmacies")}
          >
            <FaHospital className="menu-icon" />
            <span>{t.pharmaciesNetwork}</span>
          </button>

          <button
            className={`menu-item ${activeTab === "reservations" ? "active" : ""}`}
            onClick={() => setActiveTab("reservations")}
          >
            <FaClipboardList className="menu-icon" />
            <span>{t.myReservations}</span>
            {reservations.filter(
              (r) => r.status === "Ready" || r.status === "Confirmed",
            ).length > 0 && (
              <span className="reservations-badge">
                {
                  reservations.filter(
                    (r) => r.status === "Ready" || r.status === "Confirmed",
                  ).length
                }
              </span>
            )}
          </button>

          <button
            className={`menu-item ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <FaHistory className="menu-icon" />
            <span>Order History</span>
          </button>

          <button
            className={`menu-item ${activeTab === "prescriptions" ? "active" : ""}`}
            onClick={() => setActiveTab("prescriptions")}
          >
            <FaHeart className="menu-icon" />
            <span>My Prescriptions</span>
          </button>

          <button
            className={`menu-item ${activeTab === "alternatives" ? "active" : ""}`}
            onClick={() => setActiveTab("alternatives")}
          >
            <FaSyncAlt className="menu-icon" />
            <span>Alternative Medicines</span>
          </button>

          <button
            className={`menu-item ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <FaBell className="menu-icon" />
            <span>Notifications</span>
          </button>

          <button
            className={`menu-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <FaUser className="menu-icon" />
            <span>My Profile</span>
          </button>

          <button
            className={`menu-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <FaCog className="menu-icon" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar Footer Operations */}
        <div className="sidebar-footer">
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn glass-panel"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <FaSun className="sun-icon" />
            ) : (
              <FaMoon className="moon-icon" />
            )}
            <span>{darkMode ? t.lightMode : t.darkMode}</span>
          </button>

          <button onClick={handleLogout} className="sidebar-logout-btn">
            <FaSignOutAlt className="logout-icon" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Dashboard Panel Area */}
      <div className="dashboard-main">
        {/* Top Header Row */}
        <header className="main-header glass-panel">
          <div className="header-info">
            <h1>
              {t.welcome}, {currentUser.name || "Guest"}
            </h1>
            <p className="header-date">
              Thursday, 28 May 2026 | {t.healthPortal}
            </p>
          </div>

          <div
            className="header-actions"
            style={{ display: "flex", alignItems: "center", gap: "16px" }}
          >
            {/* Language Switcher */}
            <div className="language-dropdown-wrapper glass-panel">
              <select
                value={language}
                onChange={handleLanguageChange}
                className="language-dropdown-select"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>

            <div className="user-profile-header">
              <div className="avatar-header">
                {currentUser.name
                  ? currentUser.name.charAt(0).toUpperCase()
                  : "U"}
              </div>
              <div className="user-info-text">
                <span className="profile-name">{currentUser.name}</span>
                <span className="profile-role-tag">
                  {currentUser.role || "USER"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Tab Body Routing */}
        <div className="dashboard-body">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="tab-layout overview-layout">
              {/* Quick Health Stats Banner */}
              <div className="quick-banner">
                <div className="banner-context">
                  <h2>Verify & Reserve Instantly</h2>
                  <p>
                    Search live inventories from 140+ verified local pharmacies.
                    Reserve medications for 24-hour collection guarantees.
                  </p>
                  <button
                    className="banner-btn"
                    onClick={() => setActiveTab("search")}
                  >
                    <span>Find Medicine Now</span>
                    <FaArrowRight />
                  </button>
                </div>
                <div className="banner-stats">
                  <div className="stat-card glass-panel">
                    <span className="stat-value">142</span>
                    <span className="stat-label">Active Pharmacies</span>
                  </div>
                  <div className="stat-card glass-panel">
                    <span className="stat-value">98.6%</span>
                    <span className="stat-label">Stock Accuracy</span>
                  </div>
                </div>
              </div>

              {/* User Location Control Widget */}
              <div className="location-controller-panel glass-panel">
                <div className="location-meta">
                  <FaMapMarkerAlt className="location-pulse-icon" />
                  <div>
                    <span className="location-lbl">
                      Simulated User Location
                    </span>
                    <strong className="location-name">{userCoords.name}</strong>
                    {gpsError && (
                      <span
                        className="gps-error-subtext"
                        style={{
                          display: "block",
                          color: "var(--color-danger)",
                          fontSize: "10px",
                          marginTop: "4px",
                          fontWeight: "600",
                        }}
                      >
                        ⚠️ {gpsError}
                      </span>
                    )}
                  </div>
                </div>
                <div className="location-actions">
                  <span className="coords-display">
                    {userCoords.latitude.toFixed(4)}° N,{" "}
                    {userCoords.longitude.toFixed(4)}° E
                  </span>

                  <div className="live-gps-tracker-toggle">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={isTracking}
                        onChange={(e) => {
                          setIsTracking(e.target.checked);
                        }}
                      />
                      <span className="slider round"></span>
                    </label>
                    <span className="toggle-lbl">
                      {isTracking ? "Live GPS On" : "Live GPS Off"}
                    </span>
                  </div>

                  <div className="preset-selector">
                    <button
                      className="btn-secondary device-location-btn"
                      onClick={async () => {
                        if (currentUser) {
                          setGpsError(null);
                          try {
                            const resolved =
                              await resolveProfileLocation(currentUser);
                            if (resolved) {
                              handleCoordsChange(resolved, currentUser.email);
                            }
                          } catch (err) {
                            console.error("Error using profile location:", err);
                          }
                        }
                      }}
                    >
                      Use Profile Location
                    </button>
                    <button
                      className="btn-secondary device-location-btn"
                      onClick={() => {
                        if (navigator.geolocation) {
                          setGpsError(null);
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              const gpsCoords = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                name: "Current Device Location",
                              };
                              handleCoordsChange(gpsCoords, currentUser.email);
                            },
                            (err) => {
                              console.warn(
                                "GPS request failed, showing UI error:",
                                err,
                              );
                              setGpsError(
                                "Could not access device location. Check browser permissions.",
                              );
                            },
                            { enableHighAccuracy: false, timeout: 8000 },
                          );
                        } else {
                          setGpsError("Geolocation not supported by browser.");
                        }
                      }}
                    >
                      Use GPS
                    </button>
                    <select
                      className="preset-select-dropdown"
                      value={LOCATION_PRESETS.findIndex(
                        (p) =>
                          p.latitude === userCoords.latitude &&
                          p.longitude === userCoords.longitude,
                      )}
                      onChange={(e) => {
                        const index = parseInt(e.target.value);
                        if (index >= 0) {
                          const preset = LOCATION_PRESETS[index];
                          handleCoordsChange(preset, currentUser.email);
                        }
                      }}
                    >
                      <option value="-1">Custom / Select Preset...</option>
                      {LOCATION_PRESETS.map((p, idx) => (
                        <option key={idx} value={idx}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="city-search-box">
                    <input
                      type="text"
                      className="city-search-input"
                      placeholder="Enter City Name (e.g. Mumbai)"
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCitySearch();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-primary city-search-btn"
                      onClick={handleCitySearch}
                      disabled={citySearching}
                    >
                      {citySearching ? "Locating..." : "Locate"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Layout Row */}
              <div className="overview-grid">
                {/* Profile Card */}
                <div className="dashboard-card glass-panel profile-card">
                  <div className="card-header">
                    <FaUserCircle className="card-icon" />
                    <h3>My Profile</h3>
                  </div>
                  <div className="profile-main-info">
                    <div className="large-avatar">
                      {currentUser.name
                        ? currentUser.name.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                    <div className="profile-core-text">
                      <h4>{currentUser.name}</h4>
                      <p>{currentUser.email}</p>
                      <span className="account-type-pill">
                        {currentUser.role || "USER"}
                      </span>
                    </div>
                  </div>
                  <div className="profile-details-list">
                    <div className="detail-item">
                      <span className="detail-label">Phone</span>
                      <span className="detail-value">
                        {currentUser.phone || "Not provided"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">City</span>
                      <span className="detail-value">
                        {currentUser.city || "Not provided"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Address</span>
                      <span className="detail-value address-value">
                        {currentUser.address || "Not provided"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current / Preferred Pharmacy Card */}
                <div className="dashboard-card glass-panel preferred-pharmacy-card">
                  <div className="card-header">
                    <FaStore
                      className="card-icon"
                      style={{ color: "var(--accent-secondary)" }}
                    />
                    <h3>Current Pharmacy</h3>
                    {preferredPharmacy && (
                      <span className="preferred-badge-star">⭐ Selected</span>
                    )}
                  </div>
                  {preferredPharmacy ? (
                    <div className="preferred-pharmacy-main">
                      <div className="pharmacy-header-row">
                        <h4>{preferredPharmacy.name}</h4>
                        <span className="dist-badge">
                          {preferredPharmacy.distance}
                        </span>
                      </div>
                      <p className="ph-address-text">
                        <FaMapMarkerAlt className="card-icon" />{" "}
                        {preferredPharmacy.address || "No address provided"},{" "}
                        {preferredPharmacy.city || ""}
                      </p>
                      <p className="ph-phone-text">
                        <FaPhoneAlt className="card-icon" />{" "}
                        {preferredPharmacy.phone || "No phone provided"}
                      </p>
                      <div className="preferred-actions">
                        <button
                          className="btn-primary search-store-btn"
                          onClick={() => {
                            showPharmacyMedicines(
                              preferredPharmacy.id,
                              preferredPharmacy.name,
                            );
                          }}
                        >
                          <span>Search Inventory</span>
                          <FaArrowRight />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-preferred-state">
                      <p>No preferred pharmacy set.</p>
                      <button
                        className="btn-secondary"
                        onClick={() => setActiveTab("pharmacies")}
                      >
                        Choose from Network
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Reservations Summary */}
                <div className="dashboard-card glass-panel reservations-summary-card">
                  <div className="card-header">
                    <FaClipboardList className="card-icon" />
                    <h3>Recent Reservations</h3>
                    <button
                      className="view-all-link"
                      onClick={() => setActiveTab("reservations")}
                    >
                      View All
                    </button>
                  </div>

                  <div className="reservations-mini-list">
                    {reservations.length === 0 ? (
                      <div className="empty-mini-state">
                        <p>No active reservations.</p>
                      </div>
                    ) : (
                      reservations.slice(0, 2).map((res, i) => (
                        <div key={i} className="mini-res-item glass-panel">
                          <div className="mini-res-info">
                            <strong>{res.name}</strong>
                            <span>
                              {res.pharmacy} • Qty: {res.quantity}
                            </span>
                          </div>
                          <span
                            className={`status-tag status-${res.status.toLowerCase()}`}
                          >
                            {res.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Nearest Pharmacies Quick Summary */}
                <div className="dashboard-card glass-panel locations-summary-card">
                  <div className="card-header">
                    <FaHospital className="card-icon" />
                    <h3>Nearby Branches Network</h3>
                    <button
                      className="view-all-link"
                      onClick={() => setActiveTab("pharmacies")}
                    >
                      View Map
                    </button>
                  </div>
                  <div className="scrollable-pharmacies-list">
                    {pharmacies.map((ph, i) => {
                      const isCurrent =
                        preferredPharmacy && preferredPharmacy.id === ph.id;
                      return (
                        <div
                          key={i}
                          className={`mini-pharmacy-item-expanded glass-panel ${isCurrent ? "active-pharmacy-border" : ""}`}
                        >
                          <div className="pharmacy-row-top">
                            <strong>{ph.name}</strong>
                            <span className="dist-badge">
                              {ph.distance || "0.0 km"}
                            </span>
                          </div>
                          <p className="ph-detail-line">
                            <FaMapMarkerAlt className="mini-icon" />{" "}
                            {ph.address || "Nagpur"}, {ph.city || ""}
                          </p>
                          <p className="ph-detail-line">
                            <FaPhoneAlt className="mini-icon" />{" "}
                            {ph.phone || "No phone provided"}
                          </p>
                          <div className="pharmacy-action-row">
                            <button
                              className="btn-primary search-store-btn-mini"
                              onClick={() =>
                                showPharmacyMedicines(ph.id, ph.name)
                              }
                            >
                              <FaSearch /> <span>Search Stock</span>
                            </button>
                            {isCurrent ? (
                              <span className="current-store-tag">
                                ⭐ Current Store
                              </span>
                            ) : (
                              <button
                                className="btn-secondary set-pref-btn-mini"
                                onClick={() =>
                                  handleSelectPreferredPharmacy(
                                    ph,
                                    currentUser.email,
                                  )
                                }
                              >
                                Set as Current
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FIND MEDICINE */}
          {activeTab === "search" && (
            <div className="tab-layout search-layout">
              <div className="dashboard-card glass-panel full-card">
                <div className="card-header">
                  <FaSearch className="card-icon" />
                  <div>
                    <h3>{t.medicineSearch}</h3>
                    <p className="card-subtext">{t.scanLiveDb}</p>
                  </div>
                </div>

                <form onSubmit={handleSearch} className="full-search-form">
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="full-search-input"
                  />
                  <button type="submit" className="full-search-btn btn-primary">
                    <FaSearch />
                    <span>{t.searchStocks}</span>
                  </button>
                </form>

                {/* AI Prescription Upload Section */}
                <div className="prescription-upload-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    id="prescription-upload"
                    style={{ display: "none" }}
                    onChange={handlePrescriptionUpload}
                    ref={fileInputRef}
                  />
                  <label
                    htmlFor="prescription-upload"
                    className="btn-secondary prescription-upload-btn"
                  >
                    <FaCamera />
                    <span>
                      {isScanning
                        ? "Scanning Prescription..."
                        : "Scan Prescription Image"}
                    </span>
                  </label>
                </div>

                {prescriptionMedicines.length > 0 && (
                  <div className="prescription-chips-container">
                    <p className="chips-label">
                      AI Extracted Medicines (Click to search):
                    </p>
                    <div className="chips-list">
                      {prescriptionMedicines.map((med, idx) => (
                        <button
                          key={idx}
                          className={`chip-btn ${query === med ? "active" : ""}`}
                          onClick={() => {
                            setQuery(med);
                            setPendingSearch(true);
                          }}
                        >
                          {med}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="search-results-section">
                  {filterPharmacyName && (
                    <div className="filter-badge-banner glass-panel">
                      <span>
                        Showing medicines available at{" "}
                        <strong>{filterPharmacyName}</strong>
                      </span>
                      <button
                        className="btn-secondary clear-filter-btn"
                        onClick={() => {
                          setFilterPharmacyName(null);
                          setResults([]);
                          setSearchTriggered(false);
                        }}
                      >
                        Show All Pharmacies
                      </button>
                    </div>
                  )}

                  {diseaseSearchCategory && (
                    <div className="disease-badge-banner glass-panel">
                      <span className="disease-indicator-dot"></span>
                      <span>
                        Showing medications that treat:{" "}
                        <strong>{diseaseSearchCategory}</strong>
                      </span>
                      <button
                        className="btn-secondary clear-filter-btn"
                        onClick={() => {
                          setDiseaseSearchCategory("");
                          setResults([]);
                          setSearchTriggered(false);
                          setQuery("");
                        }}
                      >
                        Reset Search
                      </button>
                    </div>
                  )}

                  {loading ? (
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p>Connecting to pharmacy servers...</p>
                    </div>
                  ) : searchTriggered ? (
                    <>
                      {results.length > 0 ? (
                        <>
                          {results.some(
                            (r) =>
                              !pharmacies.some((p) => p.id === r.pharmacyId),
                          ) &&
                            !results.some((r) =>
                              pharmacies.some((p) => p.id === r.pharmacyId),
                            ) && (
                              <div
                                className="far-alert-banner glass-panel"
                                style={{
                                  marginBottom: "24px",
                                  background: "rgba(255, 165, 0, 0.1)",
                                  border: "1px solid rgba(255, 165, 0, 0.4)",
                                  borderRadius: "12px",
                                  padding: "16px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                }}
                              >
                                <FaMapMarkerAlt
                                  style={{ color: "orange", fontSize: "24px" }}
                                />
                                <div>
                                  <h4
                                    style={{
                                      margin: "0 0 4px 0",
                                      color: "orange",
                                    }}
                                  >
                                    Not Available Nearby
                                  </h4>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: "14px",
                                      color: "var(--text-secondary)",
                                    }}
                                  >
                                    The exact medicine is not available in your
                                    nearby network, but it is available at the
                                    far locations below. Check alternatives for
                                    nearby options.
                                  </p>
                                </div>
                              </div>
                            )}
                          <div className="results-grid">
                            {results.map((med, index) => {
                              const isFar = !pharmacies.some(
                                (p) => p.id === med.pharmacyId,
                              );
                              return (
                                <div
                                  key={index}
                                  className={`med-result-card glass-panel ${isFar ? "far-result-card" : ""}`}
                                  style={
                                    isFar
                                      ? {
                                          opacity: 0.85,
                                          border:
                                            "1px dashed var(--border-color)",
                                        }
                                      : {}
                                  }
                                >
                                  <div className="med-card-top">
                                    <span
                                      className="capsule-icon-wrap"
                                      style={
                                        isFar
                                          ? { color: "var(--text-secondary)" }
                                          : {}
                                      }
                                    >
                                      <FaCapsules />
                                    </span>
                                    <span
                                      className={`stock-status ${med.quantity > 5 ? "instock" : "lowstock"}`}
                                    >
                                      {isFar
                                        ? "Far Location"
                                        : med.quantity > 5
                                          ? t.inStock
                                          : t.limitedQty}
                                    </span>
                                  </div>

                                  <h4 className="med-name-title">{med.name}</h4>

                                  <div className="med-pharmacy-details">
                                    <span
                                      className="med-pharmacy-name"
                                      style={isFar ? { color: "orange" } : {}}
                                    >
                                      <FaStore /> {med.pharmacy}{" "}
                                      {getPharmacyDistance(med.pharmacyId) &&
                                        `(${getPharmacyDistance(med.pharmacyId)})`}
                                    </span>
                                    <span className="med-stock-details">
                                      {t.availableUnits}:{" "}
                                      <strong>{med.quantity}</strong>
                                    </span>
                                  </div>

                                  <div className="med-card-footer">
                                    <span className="med-price-display">
                                      ₹{med.price}
                                    </span>
                                    <button
                                      className="btn-primary reserve-action-btn"
                                      onClick={() => openReserveModal(med)}
                                    >
                                      {t.reserveStock}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="alternatives-container">
                          <div className="no-exact-match-alert glass-panel">
                            <FaCapsules className="error-icon" />
                            <div>
                              <h4>No Exact Stocks Found for "{query}"</h4>
                              <p>
                                We couldn't find any pharmacy with live stocks
                                of the exact brand name.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {alternativesLoading ? (
                        <div className="loading-state">
                          <div className="loading-spinner"></div>
                          <p>
                            Searching for generic alternatives and substitute
                            brands...
                          </p>
                        </div>
                      ) : alternatives.length > 0 ? (
                        <div
                          className="alternatives-suggestions-block"
                          style={{
                            marginTop: "32px",
                            paddingTop: "24px",
                            borderTop: "1px solid var(--border-color)",
                          }}
                        >
                          <div className="alternatives-header-banner glass-panel">
                            {alternatives[0]?.isRandomFallback ? (
                              <>
                                <span
                                  className="ai-badge"
                                  style={{
                                    background: "rgba(100, 116, 139, 0.1)",
                                    color: "#64748b",
                                  }}
                                >
                                  General Inventory
                                </span>
                                <h3>Other Medicines Available Nearby</h3>
                                <p>
                                  We couldn't find a direct substitute for "
                                  {query}". Here are some other general
                                  medicines currently available in your network:
                                </p>
                              </>
                            ) : alternatives[0]?.isAiSuggested ? (
                              <>
                                <span
                                  className="ai-badge"
                                  style={{
                                    background:
                                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                    color: "white",
                                  }}
                                >
                                  ✨ AI Suggested
                                </span>
                                <h3>AI Recommended Substitute for "{query}"</h3>
                                <p>
                                  Our AI assistant analyzed your search and
                                  identified{" "}
                                  <strong>{alternatives[0].aiKeyword}</strong>{" "}
                                  as the therapeutic equivalent. Here is what's
                                  available:
                                </p>
                              </>
                            ) : (
                              <>
                                <span className="ai-badge">
                                  Generic Alternative
                                </span>
                                <h3>Suggested Substitutes for "{query}"</h3>
                                <p>
                                  The following alternative brand names share
                                  similar active ingredients or therapeutic
                                  categories and are currently in stock:
                                </p>
                              </>
                            )}
                          </div>

                          <div className="results-grid">
                            {alternatives.map((med, index) => (
                              <div
                                key={index}
                                className="med-result-card alternative-card glass-panel"
                              >
                                <div className="med-card-top">
                                  <span className="capsule-icon-wrap alternative-icon">
                                    <FaCapsules />
                                  </span>
                                  <span className="stock-status instock">
                                    In Stock ({med.quantity} units)
                                  </span>
                                </div>

                                <h4 className="med-name-title">{med.name}</h4>

                                {med.genericName && (
                                  <div className="generic-tag">
                                    Generic: {med.genericName}
                                  </div>
                                )}

                                {med.description && (
                                  <p
                                    className="med-description-text"
                                    title={med.description}
                                  >
                                    {cleanDescription(med.description)}
                                  </p>
                                )}

                                <div className="med-pharmacy-details">
                                  <span className="med-pharmacy-name">
                                    <FaStore /> {med.pharmacy}{" "}
                                    {getPharmacyDistance(med.pharmacyId) &&
                                      `(${getPharmacyDistance(med.pharmacyId)})`}
                                  </span>
                                  <span className="med-stock-details">
                                    Category:{" "}
                                    <strong>{med.category || "General"}</strong>
                                  </span>
                                </div>

                                <div className="med-card-footer">
                                  <span className="med-price-display">
                                    ₹{med.price}
                                  </span>
                                  <button
                                    className={`btn-primary reserve-action-btn alt-reserve-btn ${med.inventoryId === "out-of-stock" ? "disabled" : ""}`}
                                    onClick={() => openReserveModal(med)}
                                    disabled={
                                      med.inventoryId === "out-of-stock"
                                    }
                                    style={
                                      med.inventoryId === "out-of-stock"
                                        ? {
                                            background: "#9ca3af",
                                            cursor: "not-allowed",
                                          }
                                        : {}
                                    }
                                  >
                                    {med.inventoryId === "out-of-stock"
                                      ? "Unavailable"
                                      : t.reserveSubstitute}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        results.length === 0 &&
                        !alternativesLoading && (
                          <div className="no-alternatives-found glass-panel">
                            <p>{t.noAlternativesFound}</p>
                          </div>
                        )
                      )}
                    </>
                  ) : (
                    <div className="search-placeholder-state">
                      <FaSearch className="placeholder-icon" />
                      <h4>Start Your Search</h4>
                      <p>
                        MedFinder updates medicine prices and available
                        quantities every 60 seconds.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHARMACIES NETWORK */}
          {activeTab === "pharmacies" && (
            <div className="tab-layout pharmacies-layout">
              <div className="dashboard-card glass-panel full-card">
                <div className="card-header">
                  <FaHospital className="card-icon" />
                  <div>
                    <h3>Registered Pharmacy Networks</h3>
                    <p className="card-subtext">
                      Click any partner branch to view contact info, physical
                      locations, and distance estimates.
                    </p>
                  </div>
                </div>

                {/* Visual Map Wrapper */}
                <div
                  ref={mapContainerRef}
                  className="pharmacy-map-container glass-panel"
                  style={{
                    height: "350px",
                    marginBottom: "24px",
                    borderRadius: "12px",
                    zIndex: 1,
                  }}
                ></div>

                <div className="pharmacies-full-list">
                  {pharmacies.map((ph, i) => (
                    <div key={i} className="pharmacy-card-full glass-panel">
                      <div className="ph-left">
                        <div className="ph-avatar-box">
                          <FaHospital />
                        </div>
                        <div className="ph-details">
                          <h4>{ph.name}</h4>
                          <span className="ph-location">
                            <FaMapMarkerAlt />{" "}
                            {ph.address || ph.location || "Nagpur"},{" "}
                            {ph.city || ""}
                          </span>
                          <span className="ph-phone">
                            <FaPhoneAlt /> {ph.phone}
                          </span>
                        </div>
                      </div>
                      <div className="ph-right">
                        <span className="ph-distance-tag">{ph.distance}</span>
                        <span
                          className={`ph-status-tag status-${ph.status.toLowerCase().replace(" ", "")}`}
                        >
                          {ph.status}
                        </span>

                        {preferredPharmacy && preferredPharmacy.id === ph.id ? (
                          <span className="preferred-badge-tag">
                            ⭐ Current Store
                          </span>
                        ) : (
                          <button
                            className="ph-pref-btn btn-secondary"
                            onClick={() =>
                              handleSelectPreferredPharmacy(
                                ph,
                                currentUser.email,
                              )
                            }
                          >
                            Set as Current
                          </button>
                        )}

                        <button
                          className="ph-call-btn btn-secondary"
                          onClick={() =>
                            alert(`Calling ${ph.name}: ${ph.phone}`)
                          }
                        >
                          Contact Branch
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RESERVATIONS LIST */}
          {activeTab === "reservations" && (
            <div className="tab-layout reservations-layout">
              <Reservations
                reservations={reservations}
                onCancelReservation={handleCancelUserReservation}
                onPayReservation={handlePayNowReservation}
              />
            </div>
          )}

          {/* TAB 5: ORDER HISTORY LIST */}
          {activeTab === "history" && (
            <div className="tab-layout history-layout">
              <OrderHistory
                orders={reservations}
                onDownloadInvoice={(res) => {
                  if (!res.invoicePath) return;
                  const url = `http://localhost:8080/${res.invoicePath.replace(/\\/g, "/")}`;
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `invoice_${res.dbOrderId}.pdf`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              />
            </div>
          )}

          {/* TAB 6: MY PRESCRIPTIONS */}
          {activeTab === "prescriptions" && (
            <div className="tab-layout">
              <MyPrescriptions 
                user={currentUser} 
                onSearchMedicine={(medName) => {
                  setQuery(medName);
                  setActiveTab("search");
                  setPendingSearch(true);
                }}
              />
            </div>
          )}

          {/* TAB 7: ALTERNATIVE MEDICINES */}
          {activeTab === "alternatives" && (
            <div className="tab-layout">
              <AlternativeMedicines />
            </div>
          )}

          {/* TAB 8: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="tab-layout">
              <Notifications user={currentUser} />
            </div>
          )}

          {/* TAB 9: MY PROFILE */}
          {activeTab === "profile" && (
            <div className="tab-layout">
              <MyProfile
                user={currentUser}
                onUpdateUser={(updatedUser) => {
                  setCurrentUser(updatedUser);
                  localStorage.setItem("user", JSON.stringify(updatedUser));
                }}
              />
            </div>
          )}

          {/* TAB 10: SETTINGS */}
          {activeTab === "settings" && (
            <div className="tab-layout">
              <Settings user={currentUser} />
            </div>
          )}
        </div>
      </div>

      {/* --- Medicine Reservation Slider/Modal Popup --- */}
      {showModal && selectedMed && (
        <div className="modal-overlay">
          <div
            className={`modal-container glass-panel ${paymentStep ? "payment-modal-wide" : ""}`}
          >
            <button
              className="modal-close-btn"
              onClick={() => setShowModal(false)}
            >
              <FaTimes />
            </button>

            {paymentStep && activePaymentData ? (
              <Payment
                paymentData={activePaymentData}
                orderData={{
                  name: selectedMed.name,
                  quantity: reserveQty,
                  pharmacy: selectedMed.pharmacy,
                  address: currentUser.address || "Store Pickup",
                }}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={() => setPaymentStep(false)}
              />
            ) : !modalSuccess ? (
              <>
                <div className="modal-header">
                  <FaCapsules className="modal-title-icon" />
                  <h2>
                    {payingReservationOrder
                      ? "Change Payment Method"
                      : "Confirm Reservation"}
                  </h2>
                  <p>
                    {payingReservationOrder ? (
                      <>
                        Complete payment for reservation at{" "}
                        <strong>{selectedMed.pharmacy}</strong>
                      </>
                    ) : (
                      <>
                        You are reserving stock at{" "}
                        <strong>{selectedMed.pharmacy}</strong>
                      </>
                    )}
                  </p>
                </div>

                <div className="modal-body-content">
                  <div className="med-overview-box glass-panel">
                    <h3>{selectedMed.name}</h3>
                    <p className="modal-med-price">
                      Unit Price: <strong>₹{selectedMed.price}</strong>
                    </p>
                    <p className="modal-med-stock">
                      {payingReservationOrder
                        ? `Reserved Quantity: ${reserveQty} units`
                        : `Available Quantity: ${selectedMed.quantity} units`}
                    </p>
                  </div>

                  {/* Quantity Selector Slider/Control */}
                  {!payingReservationOrder && (
                    <div className="quantity-select-control">
                      <label>Select Quantity</label>
                      <div className="qty-picker-row">
                        <button
                          className="qty-btn"
                          onClick={() =>
                            reserveQty > 1 && setReserveQty(reserveQty - 1)
                          }
                          disabled={reserveQty <= 1}
                        >
                          -
                        </button>
                        <span className="qty-value-display">{reserveQty}</span>
                        <button
                          className="qty-btn"
                          onClick={() =>
                            reserveQty < selectedMed.quantity &&
                            setReserveQty(reserveQty + 1)
                          }
                          disabled={reserveQty >= selectedMed.quantity}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Payment Method Selector Grid */}
                  <div className="payment-method-selector-section">
                    <label className="section-label">
                      Select Payment Method
                    </label>
                    <div className="payment-method-options-grid">
                      <button
                        className={`payment-option-card glass-panel ${selectedPaymentMethod === "UPI" ? "active" : ""}`}
                        onClick={() => setSelectedPaymentMethod("UPI")}
                      >
                        <FaQrcode className="option-icon" />
                        <div className="option-info">
                          <span className="option-title">UPI Transfer</span>
                          <span className="option-desc">Scan QR / UPI ID</span>
                        </div>
                      </button>

                      <button
                        className={`payment-option-card glass-panel ${selectedPaymentMethod === "CARD" ? "active" : ""}`}
                        onClick={() => setSelectedPaymentMethod("CARD")}
                      >
                        <FaCreditCard className="option-icon" />
                        <div className="option-info">
                          <span className="option-title">
                            Debit/Credit Card
                          </span>
                          <span className="option-desc">Visa, MasterCard</span>
                        </div>
                      </button>

                      <button
                        className={`payment-option-card glass-panel ${selectedPaymentMethod === "COD" ? "active" : ""}`}
                        onClick={() => setSelectedPaymentMethod("COD")}
                      >
                        <FaMoneyBillWave className="option-icon" />
                        <div className="option-info">
                          <span className="option-title">Pay at Counter</span>
                          <span className="option-desc">Cash/UPI at Store</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div
                    className="modal-pricing-summary"
                    style={{ marginTop: "20px" }}
                  >
                    <div className="pricing-row">
                      <span>Subtotal</span>
                      <span>₹{selectedMed.price * reserveQty}</span>
                    </div>
                    <div className="pricing-row">
                      <span>Reservation Fee</span>
                      <span className="free-tag">FREE</span>
                    </div>
                    <div className="pricing-row total-row">
                      <span>Total Amount</span>
                      <span>₹{selectedMed.price * reserveQty}</span>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className="btn-secondary modal-cancel-btn"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary modal-confirm-btn"
                    onClick={handleConfirmReservation}
                  >
                    Proceed to Payment
                  </button>
                </div>
              </>
            ) : (
              <div className="modal-success-screen">
                <FaCheckCircle className="success-check-icon animate-bounce" />
                <h2>Reservation Locked!</h2>
                <p>
                  Your stock reservation has been confirmed at{" "}
                  <strong>{selectedMed.pharmacy}</strong>.
                </p>
                <div className="success-redirect-note">
                  Redirecting to your Reservations list...
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
