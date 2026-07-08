import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import Features from "./components/Features/Features";
import DemoDashboard from "./components/DemoDashboard/DemoDashboard";
import About from "./components/About/About";
import Contact from "./components/Contact/Contact";
import Footer from "./components/Footer/Footer";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import UserDashboard from "./components/user/userdashboard/UserDashboard";
import AdminDashboard from "./components/admin/admindashboard/AdminDashboard";

import "./App.css";

// Switcher to load Dashboard based on Role
function DashboardSwitcher() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/login");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      setRole(user.role);
    } catch (e) {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
        }}
      >
        Loading Dashboard...
      </div>
    );
  }

  if (role === "ADMIN") {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
}

// 🔥 New Layout Component
function Layout({ toggleTheme, darkMode }) {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // ❌ Hide navbar on these routes
  const hideNavbarRoutes = ["/login", "/register", "/dashboard"];

  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {/* ✅ Show only when NOT hidden */}
      {!shouldHideNavbar && (
        <Navbar toggleTheme={toggleTheme} darkMode={darkMode} />
      )}

      <Routes>
        {/* 🏠 Home */}
        <Route
          path="/"
          element={
            <>
              <Hero setSearchQuery={setSearchQuery} />
              <Features />
              <DemoDashboard
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              <About />
              <Contact />
              <Footer />
            </>
          }
        />

        {/* 🔐 Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 🧑‍⚕️ Dashboard */}
        <Route path="/dashboard" element={<DashboardSwitcher />} />
      </Routes>
    </>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
    document.body.classList.toggle("dark");
  };

  return (
    <BrowserRouter>
      <Layout toggleTheme={toggleTheme} darkMode={darkMode} />
    </BrowserRouter>
  );
}

export default App;
