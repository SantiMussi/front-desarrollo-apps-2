import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Search, Loader2 } from "lucide-react";

// Fix default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom red marker icon to match the app theme
const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// CABA bounds to restrict the map view
const CABA_CENTER = [-34.6118, -58.4173];
const CABA_ZOOM = 12;

// Debounce helper — returns a function with a .cancel() method
function debounce(fn, ms) {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

// Reverse geocode using Nominatim
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`,
      { 
        headers: { "User-Agent": "AtencionCiudadanaApp/1.0" },
        signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined
      }
    );
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    if (data && data.display_name) {
      // Build a clean address from parts
      const addr = data.address || {};
      const parts = [];
      if (addr.road) parts.push(addr.road);
      if (addr.house_number) parts.push(addr.house_number);
      
      const neighborhoods = [
        addr.neighbourhood,
        addr.suburb,
        addr.city_district,
        addr.quarter,
        addr.borough
      ].filter(Boolean);
      
      let addressString = "";
      if (parts.length === 0) {
        addressString = data.display_name.split(",").slice(0, 2).join(",").trim();
      } else {
        addressString = parts.join(" ");
      }
      return { address: addressString, neighborhoods };
    }
    return { address: "", neighborhoods: [] };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return { address: "", neighborhoods: [] };
  }
}

// Forward geocode using Nominatim (search address → coordinates)
async function forwardGeocode(address, signal) {
  try {
    const query = encodeURIComponent(`${address}, Buenos Aires, Argentina`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&addressdetails=1&accept-language=es`,
      { 
        headers: { "User-Agent": "AtencionCiudadanaApp/1.0" },
        signal: signal || (AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined)
      }
    );
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    if (data && data.length > 0) {
      const addr = data[0].address || {};
      const neighborhoods = [
        addr.neighbourhood,
        addr.suburb,
        addr.city_district,
        addr.quarter,
        addr.borough
      ].filter(Boolean);
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
        neighborhoods
      };
    }
    return null;
  } catch (error) {
    if (error.name === "AbortError") return null;
    console.error("Forward geocoding error:", error);
    return null;
  }
}

// Inner component to handle map click events
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Inner component to recenter the map when position changes externally
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 0.8 });
    }
  }, [position, map]);
  return null;
}

export default function LocationMap({ address, addressSource, latitude, longitude, onLocationSelect, disabled }) {
  const [geocoding, setGeocoding] = useState(false);
  const markerRef = useRef(null);
  const abortRef = useRef(null);
  
  // Use exact coordinates provided by parent as the truth
  const markerPos = latitude && longitude ? [latitude, longitude] : null;

  // Handle click on map
  const handleMapClick = useCallback(
    async (latlng) => {
      if (disabled) return;
      // Cancel any in-flight forward geocode — map click takes priority
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      const { lat, lng } = latlng;
      setGeocoding(true);

      try {
        // Reverse geocode to get address
        const { address: addr, neighborhoods } = await reverseGeocode(lat, lng);
        onLocationSelect({ lat, lng, address: addr, neighborhoods, source: "map" });
      } finally {
        setGeocoding(false);
      }
    },
    [disabled, onLocationSelect]
  );

  // Handle marker drag
  const handleMarkerDragEnd = useCallback(async () => {
    const marker = markerRef.current;
    if (!marker) return;
    // Cancel any in-flight forward geocode — drag takes priority
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    const { lat, lng } = marker.getLatLng();
    setGeocoding(true);
    try {
      const { address: addr, neighborhoods } = await reverseGeocode(lat, lng);
      onLocationSelect({ lat, lng, address: addr, neighborhoods, source: "map" });
    } finally {
      setGeocoding(false);
    }
  }, [onLocationSelect]);

  // Forward geocode when user types an address and triggers search
  const handleSearchAddress = useCallback(
    async (searchAddress) => {
      if (!searchAddress || searchAddress.trim().length < 5) return;

      // Abort any previous in-flight forward geocode
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setGeocoding(true);
      try {
        const result = await forwardGeocode(searchAddress, controller.signal);
        // If this request was aborted, result is null — don't update state
        if (controller.signal.aborted) return;
        if (result) {
          // source: "geocode" — only update coords + neighborhood, NOT address
          // (the address is already in the input from user typing)
          onLocationSelect({ 
            lat: result.lat, 
            lng: result.lng, 
            neighborhoods: result.neighborhoods,
            source: "geocode"
          });
        }
      } finally {
        if (!controller.signal.aborted) {
          setGeocoding(false);
        }
      }
    },
    [onLocationSelect]
  );

  // Debounced search when address prop changes
  const debouncedSearch = useMemo(
    () =>
      debounce((addr) => {
        handleSearchAddress(addr);
      }, 1200),
    [handleSearchAddress]
  );

  // Cleanup debounced timer on unmount
  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  useEffect(() => {
    // Only forward-geocode when the address was typed by the user (source === "input"),
    // NOT when it was set programmatically from a map click/drag (source === "map")
    // or after a geocode already completed (source === "geocode").
    if (addressSource === "input" && address && address.trim().length >= 5) {
      // Abort any in-flight geocode from a previous search immediately
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      debouncedSearch(address);
    } else if (addressSource === "map") {
      // Only cancel debounce when the update came from an explicit map interaction
      debouncedSearch.cancel();
    }
    // When addressSource === "geocode", do nothing — don't cancel any pending debounce
  }, [address, addressSource, debouncedSearch]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-medium text-neutral-700 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-[#D63031]" strokeWidth={2} />
          Ubicación en el mapa
        </label>
        {geocoding && (
          <span className="flex items-center gap-1 text-[11px] text-neutral-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Buscando...
          </span>
        )}
      </div>

      <div
        className={`relative rounded-lg border border-neutral-200 overflow-hidden shadow-sm transition-shadow hover:shadow-md ${
          disabled ? "opacity-50 pointer-events-none" : ""
        }`}
        style={{ height: "280px" }}
      >
        <MapContainer
          center={CABA_CENTER}
          zoom={CABA_ZOOM}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          className="z-0"
        >
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            maxZoom={16}
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {markerPos && <RecenterMap position={markerPos} />}
          {markerPos && (
            <Marker
              position={markerPos}
              icon={redIcon}
              draggable={!disabled}
              ref={markerRef}
              eventHandlers={{ dragend: handleMarkerDragEnd }}
            />
          )}
        </MapContainer>

        {/* Overlay hint when no marker */}
        {!markerPos && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-neutral-100">
              <Search className="h-4 w-4 text-[#D63031]" />
              <span className="text-[12px] font-medium text-neutral-600">
                Hacé click en el mapa o escribí la dirección arriba
              </span>
            </div>
          </div>
        )}
      </div>

      {markerPos && (
        <p className="text-[11px] text-neutral-400 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Coordenadas: {markerPos[0].toFixed(6)}, {markerPos[1].toFixed(6)}
          <span className="text-neutral-300 mx-1">•</span>
          Podés arrastrar el marcador para ajustar
        </p>
      )}
    </div>
  );
}

