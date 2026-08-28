import { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import CitizenNavbar from "./components/layout/CitizenNavbar";
import HomePage from "./pages/citizen/HomePage";
import HelpPortalPage from "./pages/citizen/HelpPortalPage";
import Footer from "./components/layout/Footer";
import SplashScreen from "./components/ui/SplashScreen";
import AgentLayout from "./components/layout/AgentLayout";
import TicketsInboxPage from "./pages/agent/TicketsInboxPage";
import TicketDetailPage from "./pages/agent/TicketDetailPage";

function CitizenLayout() {
  return (
    <>
      <CitizenNavbar />
      <Outlet />
      <Footer areaName="Atención Ciudadana" areaEmail="atencion@ciudaduade.com.ar" />
    </>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  return (
    <BrowserRouter>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <Routes>
        <Route element={<CitizenLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/portal-ayuda" element={<HelpPortalPage />} />
        </Route>

        <Route path="/agente" element={<AgentLayout />}>
          <Route path="tickets" element={<TicketsInboxPage />} />
           <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
          <Route path="dashboard" element={<div className="p-8">Dashboard Módulo</div>} />
          <Route path="agentes" element={<div className="p-8">Agentes Módulo</div>} />
          <Route path="metricas" element={<div className="p-8">Métricas Módulo</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
