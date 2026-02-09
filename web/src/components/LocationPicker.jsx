import { useState, useCallback, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import "../App.css";

const containerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "12px",
  overflow: "hidden",
};

const defaultCenter = {
  lat: 44.7866,
  lng: 20.4489,
};

export function LocationPicker({ lat, lng, onLocationChange }) {
  const [map, setMap] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(
    lat && lng ? { lat: Number(lat), lng: Number(lng) } : defaultCenter
  );
  const [address, setAddress] = useState("");
  const [loadingAddress, setLoadingAddress] = useState(false);

  const getAddressFromCoordinates = async (lat, lng) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    setLoadingAddress(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=sr`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return null;
    } catch (err) {
      console.error("Geocoding error:", err);
      return null;
    } finally {
      setLoadingAddress(false);
    }
  };

  useEffect(() => {
    if (markerPosition.lat && markerPosition.lng) {
      getAddressFromCoordinates(markerPosition.lat, markerPosition.lng).then((addr) => {
        if (addr) {
          setAddress(addr);
        } else {
          setAddress("");
        }
      });
    }
  }, [markerPosition]);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: ["places"],
  });

  const onMapClick = useCallback(
    async (e) => {
      const newPosition = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setMarkerPosition(newPosition);
      if (onLocationChange) {
        onLocationChange(newPosition.lat, newPosition.lng);
      }
      // Fetch address for new position
      const addr = await getAddressFromCoordinates(newPosition.lat, newPosition.lng);
      if (addr) {
        setAddress(addr);
      }
    },
    [onLocationChange]
  );

  const onMarkerDragEnd = useCallback(
    async (e) => {
      const newPosition = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setMarkerPosition(newPosition);
      if (onLocationChange) {
        onLocationChange(newPosition.lat, newPosition.lng);
      }
      // Fetch address for new position
      const addr = await getAddressFromCoordinates(newPosition.lat, newPosition.lng);
      if (addr) {
        setAddress(addr);
      }
    },
    [onLocationChange]
  );

  if (!apiKey) {
    return (
      <div className="location-picker-fallback">
        <FontAwesomeIcon icon={faMapMarkerAlt} />
        <p>Google Maps API key nije konfigurisan. Dodaj VITE_GOOGLE_MAPS_API_KEY u .env fajl.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="location-picker-fallback">
        <FontAwesomeIcon icon={faMapMarkerAlt} />
        <p style={{ color: "var(--error-color)", fontWeight: 600 }}>
          Greška pri učitavanju Google Maps
        </p>
        <p style={{ fontSize: 12, marginTop: 8 }}>
          Proverite da li je API key ispravan i da li su dozvoljeni domeni konfigurisani u Google Cloud Console.
          Za development, dodajte "localhost" i "127.0.0.1" u HTTP referrers.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="location-picker-loading">
        <p>Učitavanje mape...</p>
      </div>
    );
  }

  return (
    <div className="location-picker">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPosition}
        zoom={13}
        onClick={onMapClick}
        onLoad={setMap}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        <Marker
          position={markerPosition}
          draggable={true}
          onDragEnd={onMarkerDragEnd}
        />
      </GoogleMap>
      <div className="location-picker-info">
        <FontAwesomeIcon icon={faMapMarkerAlt} />
        {loadingAddress ? (
          <span style={{ color: "var(--text-light)", fontStyle: "italic" }}>
            Učitavanje adrese...
          </span>
        ) : address ? (
          <span style={{ fontWeight: 500 }}>{address}</span>
        ) : (
          <span>
            Lat: {markerPosition.lat.toFixed(6)}, Lng: {markerPosition.lng.toFixed(6)}
          </span>
        )}
        <span className="location-picker-hint">Kliknite na mapu ili prevucite marker</span>
      </div>
    </div>
  );
}
