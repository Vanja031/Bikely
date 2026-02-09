import { useEffect, useState } from "react";
import "../App.css";
import { fetchBikes, createBike, updateBike, softDeleteBike } from "../api";
import { LocationPicker } from "../components/LocationPicker.jsx";
import { StatusSelect } from "../components/StatusSelect.jsx";
import { BikeTypeSelect } from "../components/BikeTypeSelect.jsx";
import { useModal } from "../contexts/ModalContext.jsx";
import { useToast } from "../contexts/ToastContext.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTag,
  faBicycle,
  faDollarSign,
  faInfoCircle,
  faMapMarkerAlt,
  faInbox,
  faEdit,
  faBan,
  faSearch,
  faCheckCircle,
  faXmark,
  faFilterCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FilterSelect } from "../components/FilterSelect";
import {
  getBikeType,
  DEFAULT_BIKE_TYPE,
  getBikeTypeOptions,
} from "../../../shared/constants/bikeTypes.js";
import {
  getBikeStatus,
  getBikeStatusOptions,
} from "../../../shared/constants/bikeStatus.js";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { getBikeMarkerIcon } from "../utils/mapMarkerIcons.js";

const bikesMapContainerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "480px",
  borderRadius: "12px",
  overflow: "hidden",
};
const bikesMapDefaultCenter = { lat: 44.7866, lng: 20.4489 };

export function AdminBikes() {
  const { confirm } = useModal();
  const toast = useToast();
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBike, setEditingBike] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'map'

  const bikesMapApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: bikesMapApiKey,
    libraries: ["places"],
  });

  const [form, setForm] = useState({
    name: "",
    type: "",
    hourlyRate: "",
    lat: "",
    lng: "",
    status: "available",
  });

  // Transliterate Serbian Cyrillic to Latin
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

    return text.split("").map(char => cyrillicToLatin[char] || char).join("");
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
        const address = data.results[0].formatted_address;
        // Convert to Latin script
        return transliterateToLatin(address);
      }
      return null;
    } catch (err) {
      console.error("Geocoding error:", err);
      return null;
    }
  };

  const loadBikes = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchBikes();
      setBikes(data);

      // Load addresses for all bikes
      const addressMap = {};
      for (const bike of data) {
        if (bike.location?.lat && bike.location?.lng) {
          const address = await getAddressFromCoordinates(
            bike.location.lat,
            bike.location.lng
          );
          if (address) {
            addressMap[bike._id] = address;
          }
        }
      }
      setAddresses(addressMap);
    } catch (err) {
      const errorMsg = err.message || "Greška pri učitavanju bicikala";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBikes();
  }, []);

  const openCreateModal = () => {
    setEditingBike(null);
    setForm({
      name: "",
      type: DEFAULT_BIKE_TYPE,
      hourlyRate: "",
      lat: "",
      lng: "",
      status: "available",
    });
    setModalOpen(true);
  };

  const openEditModal = (bike) => {
    setEditingBike(bike);
    setForm({
      name: bike.name || "",
      type: bike.type || "",
      hourlyRate: bike.hourlyRate?.toString() || "",
      lat: bike.location?.lat?.toString() || "",
      lng: bike.location?.lng?.toString() || "",
      status: bike.status || "available",
    });
    setModalOpen(true);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        type: form.type,
        hourlyRate: Number(form.hourlyRate),
        status: form.status,
        location: {
          lat: Number(form.lat),
          lng: Number(form.lng),
        },
      };

      if (editingBike) {
        await updateBike(editingBike._id, payload);
        toast.success("Bicikl je uspešno ažuriran");
      } else {
        await createBike(payload);
        toast.success("Bicikl je uspešno dodat");
      }

      setModalOpen(false);
      await loadBikes();
    } catch (err) {
      const errorMsg = err.message || "Greška pri čuvanju bicikla";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bike) => {
    const confirmed = await confirm(
      `Da li ste sigurni da želite da deaktivirate bicikl "${bike.name}"?`,
      {
        title: "Deaktivacija bicikla",
        confirmText: "Deaktiviraj",
        cancelText: "Otkaži",
        confirmColor: "warning",
      }
    );

    if (!confirmed) {
      return;
    }

    try {
      await softDeleteBike(bike._id);
      toast.success(`Bicikl "${bike.name}" je uspešno deaktiviran`);
      await loadBikes();
    } catch (err) {
      const errorMsg = err.message || "Greška pri deaktiviranju bicikla";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleActivate = async (bike) => {
    const confirmed = await confirm(
      `Da li ste sigurni da želite da aktivirate bicikl "${bike.name}"?`,
      {
        title: "Aktivacija bicikla",
        confirmText: "Aktiviraj",
        cancelText: "Otkaži",
        confirmColor: "primary",
      }
    );

    if (!confirmed) {
      return;
    }

    try {
      await updateBike(bike._id, { status: "available" });
      toast.success(`Bicikl "${bike.name}" je uspešno aktiviran`);
      await loadBikes();
    } catch (err) {
      const errorMsg = err.message || "Greška pri aktiviranju bicikla";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Filter bikes based on search and filters
  const filteredBikes = bikes.filter((bike) => {
    const matchesSearch =
      searchQuery === "" ||
      bike.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (addresses[bike._id] &&
        addresses[bike._id].toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === "all" || bike.status === filterStatus;
    const matchesType = filterType === "all" || bike.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const hasActiveFilters = searchQuery !== "" || filterStatus !== "all" || filterType !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterType("all");
  };

  return (
    <div>
      <div className="bikes-header">
        <div>
          <div className="bikes-title">Bicikli</div>
          <div style={{ fontSize: 14, color: "var(--text-light)" }}>
            Pregled dostupnih bicikala, statusa i lokacija.
          </div>
        </div>
        <button className="btn-primary btn-primary-small" onClick={openCreateModal}>
          + Dodaj bicikl
        </button>
      </div>

      {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="filter-bar">
        <div className="filter-search">
          <FontAwesomeIcon icon={faSearch} className="filter-search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Pretraži po nazivu ili lokaciji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: "all", label: "Svi statusi", color: "#757575", bgColor: "#f5f5f5" },
            ...getBikeStatusOptions(),
          ]}
          getOptionStyle={(option) => {
            if (option.value === "all") {
              return { backgroundColor: "#f5f5f5", color: "#757575" };
            }
            const status = getBikeStatus(option.value);
            return { backgroundColor: status.bgColor, color: status.color };
          }}
        />
        <FilterSelect
          label="Tip"
          value={filterType}
          onChange={setFilterType}
          options={[
            { value: "all", label: "Svi tipovi", color: "#757575", bgColor: "#f5f5f5" },
            ...getBikeTypeOptions(),
          ]}
          getOptionStyle={(option) => {
            if (option.value === "all") {
              return { backgroundColor: "#f5f5f5", color: "#757575" };
            }
            const type = getBikeType(option.value);
            return { backgroundColor: type.bgColor, color: type.color };
          }}
        />
        <button
          className="filter-clear-btn"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
          title="Očisti filtere"
        >
          <FontAwesomeIcon icon={faFilterCircleXmark} />
          <span>Očisti</span>
        </button>
      </div>

      <div className="view-toggle-bar">
        <button
          type="button"
          className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
          onClick={() => setViewMode("table")}
        >
          <FontAwesomeIcon icon={faInbox} />
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

      {viewMode === "map" ? (
        <div className="parking-map-card">
          {!bikesMapApiKey ? (
            <div className="location-picker-fallback">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <p>Google Maps API key nije konfigurisan. Dodaj VITE_GOOGLE_MAPS_API_KEY u .env.</p>
            </div>
          ) : mapLoadError ? (
            <div className="location-picker-fallback">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <p style={{ color: "var(--error-color)", fontWeight: 600 }}>
                Greška pri učitavanju Google Maps
              </p>
            </div>
          ) : !isMapLoaded ? (
            <div className="location-picker-loading">
              <p>Učitavanje mape...</p>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={bikesMapContainerStyle}
              center={
                filteredBikes.length > 0 && filteredBikes[0].location
                  ? {
                      lat: filteredBikes[0].location.lat,
                      lng: filteredBikes[0].location.lng,
                    }
                  : bikesMapDefaultCenter
              }
              zoom={filteredBikes.length > 0 ? 13 : 12}
              options={{
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: true,
              }}
            >
              {filteredBikes.map(
                (bike) =>
                  bike.location?.lat != null &&
                  bike.location?.lng != null && (
                    <Marker
                      key={bike._id}
                      position={{
                        lat: bike.location.lat,
                        lng: bike.location.lng,
                      }}
                      icon={getBikeMarkerIcon()}
                      title={bike.name}
                    />
                  )
              )}
            </GoogleMap>
          )}
        </div>
      ) : (
      <div className="table-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Naziv</th>
                <th>Tip</th>
                <th style={{ textAlign: "right" }}>Cena / sat</th>
                <th>Status</th>
                <th>Lokacija</th>
                <th style={{ textAlign: "right" }}>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty-state">
                      <div className="table-empty-spinner"></div>
                      <p>Učitavanje...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredBikes.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="table-empty-state">
                      <div className="table-empty-icon">
                        <FontAwesomeIcon icon={faBicycle} />
                      </div>
                      <h3>
                        {bikes.length === 0
                          ? "Još uvek nema bicikala"
                          : "Nema rezultata pretrage"}
                      </h3>
                      <p>
                        {bikes.length === 0
                          ? "Dodajte prvi bicikl da biste počeli sa upravljanjem flotom."
                          : "Pokušajte sa drugim filterima ili pretragom."}
                      </p>
                      {bikes.length === 0 && (
                        <button
                          className="btn-primary btn-primary-small"
                          onClick={openCreateModal}
                          style={{ marginTop: 16 }}
                        >
                          + Dodaj prvi bicikl
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBikes.map((bike) => {
                  const bikeType = getBikeType(bike.type);
                  return (
                    <tr key={bike._id}>
                      <td>{bike.name}</td>
                      <td>
                        <span
                          className="custom-select-badge"
                          style={{
                            backgroundColor: bikeType.bgColor,
                            color: bikeType.color,
                          }}
                        >
                          {bikeType.label}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        {bike.hourlyRate.toFixed(2)} RSD
                      </td>
                    <td>
                      {(() => {
                        const bikeStatus = getBikeStatus(bike.status);
                        return (
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: bikeStatus.bgColor,
                              color: bikeStatus.color,
                            }}
                          >
                            {bikeStatus.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      {addresses[bike._id] ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <FontAwesomeIcon
                            icon={faMapMarkerAlt}
                            style={{ color: "var(--primary-color)", fontSize: 14 }}
                          />
                          <span>{addresses[bike._id]}</span>
                        </div>
                      ) : bike.location ? (
                        <span style={{ color: "var(--text-light)", fontStyle: "italic" }}>
                          Učitavanje adrese...
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        className="btn-action btn-action-edit"
                        onClick={() => openEditModal(bike)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                        <span>Izmeni</span>
                      </button>
                      {bike.status === "inactive" ? (
                        <button
                          className="btn-action btn-action-activate"
                          onClick={() => handleActivate(bike)}
                        >
                          <FontAwesomeIcon icon={faCheckCircle} />
                          <span>Aktiviraj</span>
                        </button>
                      ) : (
                        <button
                          className="btn-action btn-action-deactivate"
                          onClick={() => handleDelete(bike)}
                        >
                          <FontAwesomeIcon icon={faBan} />
                          <span>Deaktiviraj</span>
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {editingBike ? "Izmena bicikla" : "Novi bicikl"}
              </div>
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
                  <div className="form-group">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faTag} style={{ marginRight: 6 }} />
                      Naziv
                    </label>
                    <input
                      className="form-input form-input-no-icon"
                      value={form.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                      placeholder="Unesite naziv bicikla"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faBicycle} style={{ marginRight: 6 }} />
                      Tip
                    </label>
                    <BikeTypeSelect
                      value={form.type}
                      onChange={(e) => handleFormChange("type", e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faDollarSign} style={{ marginRight: 6 }} />
                      Cena po satu (RSD)
                    </label>
                    <input
                      className="form-input form-input-no-icon"
                      type="number"
                      min="0"
                      step="10"
                      value={form.hourlyRate}
                      onChange={(e) => handleFormChange("hourlyRate", e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: 6 }} />
                      Status
                    </label>
                    <StatusSelect
                      value={form.status}
                      onChange={(e) => handleFormChange("status", e.target.value)}
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
                    {saving
                      ? "Čuvanje..."
                      : editingBike
                      ? "Sačuvaj izmene"
                      : "Kreiraj bicikl"}
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

