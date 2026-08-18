import { BrowserRouter, Routes, Route } from "react-router-dom";
import CitizenNavbar from "./components/layout/CitizenNavbar";
import HomePage from "./pages/citizen/HomePage";
import HelpPortalPage from "./pages/citizen/HelpPortalPage";
import Footer from "./components/layout/footer";

export default function App() {
  return (
    <BrowserRouter>
      <CitizenNavbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/portal-ayuda" element={<HelpPortalPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
