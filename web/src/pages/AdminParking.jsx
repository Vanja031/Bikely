import { useEffect, useState, useCallback, Fragment } from "react";
import "../App.css";
import { fetchParkingSpots, createParkingSpot, deleteParkingSpot } from "../api";
import { LocationPicker } from "../components/LocationPicker.jsx";
import { useModal } from "../contexts/ModalContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faTag,
  faPlus,
  faTrash,
  faList,
} from "@fortawesome/free-solid-svg-icons";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { getParkingMarkerIcon } from "../utils/mapMarkerIcons.js";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "480px",
  borderRadius: "12px",
  overflow: "hidden",
};

const defaultCenter = { lat: 44.7866, lng: 20.4489 };

export function AdminParking() {
  const { confirm } = useModal();
  const toast = useToast();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSpotId, setSelectedSpotId] = useState(null);
  const [viewMode, setViewMode] = useState("map"); // 'table' | 'map'
  const [addresses, setAddresses] = useState({});
  const [form, setForm] = useState({
    name: "",
    lat: "",
    lng: "",
  });

  const transliterateToLatin = (text) => {
    if (!text) return text;
    const cyrillicToLatin = {
      А: "A", а: "a", Б: "B", б: "b", В: "V", в: "v", Г: "G", г: "g",
      Д: "D", д: "d", Ђ: "Đ", ђ: "đ", Е: "E", е: "e", Ж: "Ž", ж: "ž",
      З: "Z", з: "z", И: "I", и: "i", Ј: "J", ј: "j", К: "K", к: "k",
      Л: "L", л: "l", Љ: "Lj", љ: "lj", М: "M", м: "m", Н: "N", н: "n",
      Њ: "Nj", њ: "nj", О: "O", о: "o", П: "P", п: "p", Р: "R", р: "r",
      С: "S", с: "s", Т: "T", т: "t", Ћ: "Ć", ћ: "ć", У: "U", у: "u",
      Ф: "F", ф: "f", Х: "H", х: "h", Ц: "C", ц: "c", Ч: "Č", ч: "č",
      Џ: "Dž", џ: "dž", Ш: "Š", ш: "š"
    };
    return text.split("").map((char) => cyrillicToLatin[char] || char).join("");
  };

  const getAddressFromCoordinates = async (lat, lng) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=sr`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return transliterateToLatin(data.results[0].formatted_address);
      }
      return null;
    } catch (err) {
      console.error("Geocoding error:", err);
      return null;
    }
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: ["places"],
  });

  const loadSpots = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchParkingSpots();
      setSpots(data);
      const addressMap = {};
      for (const spot of data) {
        if (spot.location?.lat != null && spot.location?.lng != null) {
          const address = await getAddressFromCoordinates(
            spot.location.lat,
            spot.location.lng
          );
          if (address) addressMap[spot._id] = address;
        }
      }
      setAddresses(addressMap);
    } catch (err) {
      const errorMsg = err.message || "Greška pri učitavanju parking mesta";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSpots();
  }, [loadSpots]);

  const openCreateModal = () => {
    setForm({
      name: "",
      lat: "",
      lng: "",
    });
    setModalOpen(true);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.lat || !form.lng) {
      setError("Izaberite lokaciju na mapi.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createParkingSpot({
        name: form.name,
        location: { lat: Number(form.lat), lng: Number(form.lng) },
      });
      toast.success("Parking mesto je uspešno dodato");
      setModalOpen(false);
      await loadSpots();
    } catch (err) {
      const errorMsg = err.message || "Greška pri čuvanju parking mesta";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (spot) => {
    const confirmed = await confirm(
      `Da li ste sigurni da želite da obrišete parking mesto "${spot.name}"?`,
      {
        title: "Brisanje parking mesta",
        confirmText: "Obriši",
        cancelText: "Otkaži",
        confirmColor: "warning",
      }
    );
    if (!confirmed) return;
    setSelectedSpotId(null);
    try {
      await deleteParkingSpot(spot._id);
      toast.success(`Parking mesto "${spot.name}" je obrisano`);
      await loadSpots();
    } catch (err) {
      const errorMsg = err.message || "Greška pri brisanju";
      toast.error(errorMsg);
    }
  };

  const mapCenter =
    spots.length > 0 && spots[0].location
      ? { lat: spots[0].location.lat, lng: spots[0].location.lng }
      : defaultCenter;

  return (
    <div className="admin-parking-page">
      <div className="bikes-header">
        <div>
          <div className="bikes-title">Parking mesta</div>
          <div style={{ fontSize: 14, color: "var(--text-light)" }}>
            Pregled i dodavanje parking mesta na mapi.
          </div>
        </div>
        <button className="btn-primary btn-primary-small" onClick={openCreateModal}>
          <FontAwesomeIcon icon={faPlus} style={{ marginRight: 6 }} />
          Dodaj mesto
        </button>
      </div>

      {error && !modalOpen && (
        <div className="error-text" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div className="view-toggle-bar">
        <button
          type="button"
          className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
          onClick={() => setViewMode("table")}
        >
          <FontAwesomeIcon icon={faList} />
          <span>Tabela</span>
        </button>
        <button
          type="button"
          className={`view-toggle-btn ${viewMode === "map" ? "active" : ""}`}
          onClick={() => setViewMode("map")}
        >
          <FontAwesomeIcon icon={faMapMarkerAlt} />
          <span>Mapa</span>
        </button>
      </div>

      {viewMode === "table" ? (
        <div className="table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Naziv</th>
                  <th>Lokacija</th>
                  <th style={{ textAlign: "right" }}>Akcije</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="table-empty-state">
                        <div className="table-empty-spinner"></div>
                        <p>Učitavanje...</p>
                      </div>
                    </td>
                  </tr>
                ) : spots.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="table-empty-state">
                        <div className="table-empty-icon">
                          <FontAwesomeIcon icon={faMapMarkerAlt} />
                        </div>
                        <h3>Još nema parking mesta</h3>
                        <p>Dodajte prvo parking mesto da biste ga videli u listi.</p>
                        <button
                          className="btn-primary btn-primary-small"
                          onClick={openCreateModal}
                          style={{ marginTop: 16 }}
                        >
                          <FontAwesomeIcon icon={faPlus} style={{ marginRight: 6 }} />
                          Dodaj mesto
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  spots.map((spot) => (
                    <tr key={spot._id}>
                      <td>{spot.name}</td>
                      <td>
                        {addresses[spot._id] ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <FontAwesomeIcon
                              icon={faMapMarkerAlt}
                              style={{ color: "var(--primary-color)", fontSize: 14 }}
                            />
                            <span>{addresses[spot._id]}</span>
                          </div>
                        ) : spot.location?.lat != null && spot.location?.lng != null ? (
                          <span style={{ color: "var(--text-light)", fontStyle: "italic" }}>
                            Učitavanje adrese...
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn-action btn-action-deactivate"
                          onClick={() => handleDelete(spot)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                          <span>Obriši</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
      <div className="parking-map-card">
        {!apiKey ? (
          <div className="location-picker-fallback">
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            <p>Google Maps API key nije konfigurisan. Dodaj VITE_GOOGLE_MAPS_API_KEY u .env.</p>
          </div>
        ) : loadError ? (
          <div className="location-picker-fallback">
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            <p style={{ color: "var(--error-color)", fontWeight: 600 }}>
              Greška pri učitavanju Google Maps
            </p>
          </div>
        ) : !isLoaded ? (
          <div className="location-picker-loading">
            <p>Učitavanje mape...</p>
          </div>
        ) : loading && spots.length === 0 ? (
          <div className="location-picker-loading">
            <p>Učitavanje parking mesta...</p>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={spots.length > 0 ? 13 : 12}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
            }}
          >
            {spots.map((spot) =>
              spot.location?.lat != null && spot.location?.lng != null ? (
                <Fragment key={spot._id}>
                  <Marker
                    position={{ lat: spot.location.lat, lng: spot.location.lng }}
                    icon={getParkingMarkerIcon()}
                    onClick={() => setSelectedSpotId(spot._id)}
                    title={spot.name}
                  />
                  {selectedSpotId === spot._id && (
                    <InfoWindow
                      position={{ lat: spot.location.lat, lng: spot.location.lng }}
                      onCloseClick={() => setSelectedSpotId(null)}
                    >
                      <div className="parking-info-window">
                        <div className="parking-info-name">{spot.name}</div>
                        <button
                          type="button"
                          className="btn-action btn-action-deactivate"
                          style={{ marginTop: 8 }}
                          onClick={() => handleDelete(spot)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                          <span>Obriši</span>
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </Fragment>
              ) : null
            )}
          </GoogleMap>
        )}
      </div>
      )}

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Novo parking mesto</div>
              <button
                className="modal-close"
                type="button"
                onClick={() => !saving && setModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="modal-grid">
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">
                      <FontAwesomeIcon icon={faTag} style={{ marginRight: 6 }} />
                      Naziv
                    </label>
                    <input
                      className="form-input form-input-no-icon"
                      value={form.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                      placeholder="npr. Parking Trg republike"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">
                      <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: 6 }} />
                      Lokacija
                    </label>
                    <LocationPicker
                      lat={form.lat}
                      lng={form.lng}
                      onLocationChange={(lat, lng) => {
                        handleFormChange("lat", lat.toString());
                        handleFormChange("lng", lng.toString());
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <div className="error-text" style={{ marginTop: 10 }}>
                    {error}
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => !saving && setModalOpen(false)}
                  >
                    Otkaži
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? "Čuvanje..." : "Dodaj mesto"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
