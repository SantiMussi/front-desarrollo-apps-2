import { BrowserRouter, Routes, Route } from "react-router-dom";
import CitizenNavbar from "./components/layout/CitizenNavbar";
import HomePage from "./pages/citizen/HomePage";

export default function App() {
  return (
    <BrowserRouter>
      {/* Citizen layout */}
      <CitizenNavbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
