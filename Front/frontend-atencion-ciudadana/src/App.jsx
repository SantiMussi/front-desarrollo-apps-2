import { BrowserRouter, Routes, Route } from "react-router-dom";
import CitizenNavbar from "./components/layout/CitizenNavbar";
import HomePage from "./pages/citizen/HomePage";

/**
 * App — Root component. Sets up routing and the citizen layout shell.
 */
export default function App() {
  return (
    <BrowserRouter>
      {/* Citizen layout: Navbar is persistent across all citizen routes */}
      <CitizenNavbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Future routes: /category/:id, /ticket/:id, etc. */}
      </Routes>
    </BrowserRouter>
  );
}
