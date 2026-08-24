import { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CitizenNavbar from "./components/layout/CitizenNavbar";
import HomePage from "./pages/citizen/HomePage";
import HelpPortalPage from "./pages/citizen/HelpPortalPage";
import Footer from "./components/layout/Footer";
import SplashScreen from "./components/ui/SplashScreen";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  return (
    <BrowserRouter>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <CitizenNavbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/portal-ayuda" element={<HelpPortalPage />} />
      </Routes>
      <Footer areaName ="Atención Ciudadana" areaEmail="atencion@ciudaduade.com.ar"/>
    </BrowserRouter>
  );
}
